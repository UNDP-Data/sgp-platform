import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { ADMIN_CONFIGS } from "../src/admin/adminConfig";
import { ROLE_ACCESS_LEVELS, ROLE_LABELS, type Role } from "../src/auth/roles";
import type { WorkflowAttachment } from "../src/workspace/workflowStore";
import type { BackendConfig } from "./config";
import { ContentRepository } from "./content";
import { BackendDatabase } from "./database";
import { BackendDomain, HttpError, requireAccessLevel, requireRole } from "./domain";

type Session = { token: string; role: Role; displayName: string; createdAt: string; expiresAt: string };
type ApiContext = { role: Role; tier: "public" | "authenticated" | "controlled"; session?: Session };

const JSON_LIMIT = 2 * 1024 * 1024;

function json(response: ServerResponse, status: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  const payload = JSON.stringify(body);
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload), ...extraHeaders });
  response.end(payload);
}

function noContent(response: ServerResponse) {
  response.writeHead(204);
  response.end();
}

async function readBody(request: IncomingMessage, limit = JSON_LIMIT) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw new HttpError(413, "Request body is too large.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

async function readJson(request: IncomingMessage, limit = JSON_LIMIT) {
  const body = await readBody(request, limit);
  if (!body.length) return {};
  try {
    return JSON.parse(body.toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

function bearer(request: IncomingMessage) {
  const value = request.headers.authorization || "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

function sessionFor(request: IncomingMessage, database: BackendDatabase): Session {
  const session = database.session(bearer(request));
  if (!session) throw new HttpError(401, "A current temporary backend session is required.");
  return session;
}

function partnerContext(request: IncomingMessage, database: BackendDatabase): ApiContext {
  const session = database.session(bearer(request));
  if (session) return { role: session.role, tier: ROLE_ACCESS_LEVELS[session.role] >= 9 ? "controlled" : "authenticated", session };
  const key = String(request.headers["x-api-key"] || "");
  const configured = [
    { key: process.env.SGP_PUBLIC_API_KEY || "sgp-public-dev", tier: "public" as const, role: "public" as const },
    { key: process.env.SGP_AGENCY_API_KEY || "sgp-agency-dev", tier: "authenticated" as const, role: "agency-admin" as const },
    { key: process.env.SGP_CONTROLLED_API_KEY || "sgp-controlled-dev", tier: "controlled" as const, role: "it-admin" as const }
  ];
  const match = configured.find((item) => item.key && item.key === key);
  if (!match) throw new HttpError(401, "A valid temporary API key or session is required.");
  return { role: match.role, tier: match.tier };
}

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}

function workflowResponse(domain: BackendDomain, role: Role, mutation: { result: unknown; revision: number; updatedAt: string }, extra: Record<string, unknown> = {}) {
  return { ok: true, ...extra, result: mutation.result, revision: mutation.revision, updatedAt: mutation.updatedAt, snapshot: domain.snapshot(role) };
}

function sourceFromQuery(url: URL) {
  const requested = url.searchParams.get("data_source") || url.searchParams.get("source") || "all";
  return ["innovation_library", "projects", "all"].includes(requested) ? requested : "all";
}

function queryFromAssistantBody(value: unknown) {
  if (Array.isArray(value)) {
    const last = [...value].reverse().find((item) => item && typeof item === "object" && "content" in item) as { content?: unknown } | undefined;
    return typeof last?.content === "string" ? last.content.trim() : "";
  }
  if (value && typeof value === "object") {
    const body = value as { query?: unknown; messages?: unknown };
    if (typeof body.query === "string") return body.query.trim();
    if (Array.isArray(body.messages)) return queryFromAssistantBody(body.messages);
  }
  return "";
}

function openApiDocument() {
  return {
    openapi: "3.1.0",
    info: { title: "SGP KLP Temporary Backend", version: "0.1.0", description: "Local integration backend for product validation. Not a production security boundary." },
    servers: [{ url: "http://127.0.0.1:8787" }],
    paths: {
      "/api/health": { get: { summary: "Backend and prepared-data health" } },
      "/api/auth/session": { post: { summary: "Create a temporary role session" } },
      "/api/workspace/snapshot": { get: { summary: "Read the active operational assignment" } },
      "/api/workflows": { post: { summary: "Create an authorized workflow record" } },
      "/api/workflows/{id}": { patch: { summary: "Save an owned lifecycle stage" } },
      "/api/workflows/{id}/advance": { post: { summary: "Advance a validated record" } },
      "/api/workflows/{id}/return": { post: { summary: "Return a record with a reason" } },
      "/api/v1/documents/search": { post: { summary: "Search sanitized prepared resources" } },
      "/api/v1/projects": { get: { summary: "Query prepared project records" } },
      "/api/v1/assistant/query": { post: { summary: "Retrieve a grounded temporary answer" } }
    }
  };
}

export function createBackendApp(config: BackendConfig) {
  const database = new BackendDatabase(config);
  const domain = new BackendDomain(database);
  const content = new ContentRepository(config);
  const startedAt = Date.now();

  const server = createServer(async (request, response) => {
    const method = request.method || "GET";
    const url = new URL(request.url || "/", `http://${request.headers.host || `${config.host}:${config.port}`}`);
    const requestId = randomUUID();
    response.setHeader("Access-Control-Allow-Origin", request.headers.origin || "*");
    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-API-Key, X-File-Name, X-File-Id");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Request-Id", requestId);
    if (method === "OPTIONS") return noContent(response);

    try {
      if (method === "GET" && url.pathname === "/api/health") {
        const revision = database.revision();
        return json(response, 200, {
          status: "ok", mode: "temporary-local-backend", uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
          database: { journalMode: "wal", ...revision }, files: database.fileStats(), sessions: database.sessionCount(), content: content.stats()
        });
      }
      if (method === "GET" && ["/api/openapi.json", "/api/v1/openapi.json"].includes(url.pathname)) return json(response, 200, openApiDocument());

      if (method === "POST" && url.pathname === "/api/auth/session") {
        const body = await readJson(request) as { role?: unknown; displayName?: unknown };
        const role = requireRole(body.role);
        const createdAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + config.sessionHours * 60 * 60 * 1000).toISOString();
        const item: Session = {
          token: randomBytes(32).toString("base64url"), role,
          displayName: typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim() : ROLE_LABELS[role],
          createdAt, expiresAt
        };
        database.createSession(item);
        database.audit(role, "session.create", role, "Temporary development session created");
        return json(response, 201, { session: item, warning: "Development-only role selector. Replace with enterprise identity before production." });
      }
      if (method === "GET" && url.pathname === "/api/auth/session") return json(response, 200, { session: sessionFor(request, database) });
      if (method === "DELETE" && url.pathname === "/api/auth/session") {
        const session = sessionFor(request, database);
        database.deleteSession(session.token);
        database.audit(session.role, "session.delete", session.role, "Temporary development session ended");
        return noContent(response);
      }

      if (method === "GET" && url.pathname === "/api/workspace/snapshot") {
        const session = sessionFor(request, database);
        return json(response, 200, { snapshot: domain.snapshot(session.role), ...database.revision() });
      }
      if (method === "POST" && url.pathname === "/api/workspace/import") {
        const session = sessionFor(request, database);
        const mutation = domain.importSnapshot(session.role, await readJson(request, 12 * 1024 * 1024));
        return json(response, 200, workflowResponse(domain, session.role, mutation));
      }
      if (method === "POST" && url.pathname === "/api/workflows") {
        const session = sessionFor(request, database);
        const body = await readJson(request) as { section?: unknown };
        const mutation = domain.createRecord(session.role, body.section);
        return json(response, 201, workflowResponse(domain, session.role, mutation, { id: (mutation.result as { id: string }).id }));
      }
      const workflowMatch = /^\/api\/workflows\/([^/]+)$/.exec(url.pathname);
      if (workflowMatch && method === "PATCH") {
        const session = sessionFor(request, database);
        const mutation = domain.updateRecord(session.role, decodeURIComponent(workflowMatch[1]), await readJson(request));
        return json(response, 200, workflowResponse(domain, session.role, mutation));
      }
      const workflowAction = /^\/api\/workflows\/([^/]+)\/(advance|return|notes)$/.exec(url.pathname);
      if (workflowAction && method === "POST") {
        const session = sessionFor(request, database);
        const id = decodeURIComponent(workflowAction[1]);
        const body = await readJson(request) as { reason?: unknown; body?: unknown };
        const mutation = workflowAction[2] === "advance" ? domain.advanceRecord(session.role, id)
          : workflowAction[2] === "return" ? domain.returnRecord(session.role, id, body.reason)
            : domain.addNote(session.role, id, body.body);
        return json(response, 200, workflowResponse(domain, session.role, mutation));
      }

      const fileMatch = /^\/api\/workflows\/([^/]+)\/files(?:\/([^/]+))?$/.exec(url.pathname);
      if (fileMatch && method === "POST" && !fileMatch[2]) {
        const session = sessionFor(request, database);
        const recordId = decodeURIComponent(fileMatch[1]);
        const filename = decodeURIComponent(String(request.headers["x-file-name"] || "evidence-file"));
        const fileId = String(request.headers["x-file-id"] || `${recordId}-${Date.now()}`);
        const type = String(request.headers["content-type"] || "application/octet-stream");
        const body = await readBody(request, config.maxFileBytes);
        if (!body.length) throw new HttpError(422, "The evidence file is empty.");
        domain.assertFileWrite(session.role, recordId);
        const existing = database.file(fileId);
        if (existing && existing.recordId !== recordId) throw new HttpError(409, "This evidence file identifier belongs to another record.");
        const safeId = createHash("sha256").update(fileId).digest("hex");
        const filePath = path.join(config.filesDir, safeId);
        const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
        mkdirSync(config.filesDir, { recursive: true });
        writeFileSync(temporaryPath, body, { flag: "wx" });
        const storedAt = new Date().toISOString();
        const attachment: WorkflowAttachment = { id: fileId, name: filename, size: body.length, type, storedAt, storedBy: session.role as WorkflowAttachment["storedBy"] };
        try {
          const mutation = domain.addAttachment(session.role, recordId, attachment);
          renameSync(temporaryPath, filePath);
          database.putFile({ ...attachment, recordId, path: filePath });
          return json(response, 201, workflowResponse(domain, session.role, mutation, { attachment }));
        } catch (error) {
          rmSync(temporaryPath, { force: true });
          throw error;
        }
      }
      if (fileMatch && fileMatch[2] && method === "GET") {
        const session = sessionFor(request, database);
        const recordId = decodeURIComponent(fileMatch[1]);
        const fileId = decodeURIComponent(fileMatch[2]);
        domain.assertFileRead(session.role, recordId);
        const file = database.file(fileId);
        if (!file || file.recordId !== recordId || !existsSync(file.path)) throw new HttpError(404, "Evidence file content is unavailable.");
        response.writeHead(200, {
          "Content-Type": file.type, "Content-Length": file.size,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`
        });
        return pipeline(createReadStream(file.path), response);
      }
      if (fileMatch && fileMatch[2] && method === "DELETE") {
        const session = sessionFor(request, database);
        const recordId = decodeURIComponent(fileMatch[1]);
        const fileId = decodeURIComponent(fileMatch[2]);
        const file = database.file(fileId);
        const mutation = domain.removeAttachment(session.role, recordId, fileId);
        if (file) rmSync(file.path, { force: true });
        database.deleteFile(fileId);
        return json(response, 200, workflowResponse(domain, session.role, mutation));
      }

      if (method === "POST" && url.pathname === "/api/support/cases") {
        const session = sessionFor(request, database);
        const mutation = domain.createSupport(session.role, await readJson(request));
        return json(response, 201, workflowResponse(domain, session.role, mutation, { id: (mutation.result as { id: string }).id }));
      }
      const supportMatch = /^\/api\/support\/cases\/([^/]+)$/.exec(url.pathname);
      if (supportMatch && method === "PATCH") {
        const session = sessionFor(request, database);
        const mutation = domain.updateSupport(session.role, decodeURIComponent(supportMatch[1]), await readJson(request));
        return json(response, 200, workflowResponse(domain, session.role, mutation));
      }
      if (method === "PUT" && url.pathname === "/api/preferences") {
        const session = sessionFor(request, database);
        const mutation = domain.savePreferences(session.role, await readJson(request));
        return json(response, 200, workflowResponse(domain, session.role, mutation));
      }
      if (method === "GET" && url.pathname === "/api/saved") {
        const session = sessionFor(request, database);
        return json(response, 200, { items: domain.savedItems(session.role) });
      }
      if (method === "POST" && url.pathname === "/api/saved/toggle") {
        const session = sessionFor(request, database);
        const body = await readJson(request) as { id?: unknown };
        const mutation = domain.toggleSaved(session.role, body.id);
        return json(response, 200, { items: mutation.result, revision: mutation.revision, updatedAt: mutation.updatedAt });
      }
      if (method === "GET" && url.pathname === "/api/assistant/history") {
        const session = sessionFor(request, database);
        const scope = url.searchParams.get("scope") || `workspace:${session.role}`;
        return json(response, 200, { snapshot: domain.assistantSnapshot(session.role, scope) });
      }
      if (method === "PUT" && url.pathname === "/api/assistant/history") {
        const session = sessionFor(request, database);
        const scope = url.searchParams.get("scope") || `workspace:${session.role}`;
        const mutation = domain.saveAssistantSnapshot(session.role, scope, await readJson(request));
        return json(response, 200, { snapshot: mutation.result, revision: mutation.revision, updatedAt: mutation.updatedAt });
      }

      if (method === "POST" && url.pathname === "/api/public/support") {
        const body = await readJson(request) as Record<string, unknown>;
        const item = {
          id: `SGP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`,
          name: String(body.name || "").trim(), email: String(body.email || "").trim(),
          requestType: String(body.requestType || body.category || "General support").trim(),
          description: String(body.description || "").trim(), status: "Open", createdAt: new Date().toISOString()
        };
        if (!item.name || !/^\S+@\S+\.\S+$/.test(item.email) || !item.description) throw new HttpError(422, "Name, a valid email address and description are required.");
        database.addPublicSupport(item);
        database.audit("public", "support.public.create", item.id, `Public ${item.requestType} request opened`);
        return json(response, 201, { request: item });
      }
      if (method === "GET" && url.pathname === "/api/public/support") {
        const email = url.searchParams.get("email") || "";
        if (!email) throw new HttpError(422, "Email is required to retrieve requests from this browser.");
        return json(response, 200, { requests: database.publicSupport(email) });
      }

      if (method === "GET" && url.pathname === "/api/content/archive") return json(response, 200, content.archivePayload());
      if (method === "GET" && url.pathname === "/api/content/editorial") return json(response, 200, content.editorialPayload());
      if (method === "GET" && url.pathname === "/api/content/projects") return json(response, 200, content.projectsPayload());
      if (method === "GET" && url.pathname === "/api/content/provenance") return json(response, 200, content.provenancePayload());
      if (method === "GET" && url.pathname === "/api/content/open-grants") return json(response, 200, content.grantsPayload());

      if (method === "GET" && url.pathname === "/api/sgp-ai/status") {
        const stats = content.stats();
        return json(response, 200, { corpus_ready: true, document_count: stats.archiveRecords + stats.projects, mode: "local-retrieval" });
      }
      if (method === "GET" && url.pathname === "/api/sgp-ai/relevance-map") {
        const query = url.searchParams.get("query") || "";
        return json(response, 200, { documents: content.assistantSearch(query, sourceFromQuery(url), 20) });
      }
      if (method === "POST" && url.pathname === "/api/sgp-ai/model") {
        const query = queryFromAssistantBody(await readJson(request));
        if (query.length < 2) throw new HttpError(422, "Enter a question with at least two characters.");
        const result = content.answer(query, sourceFromQuery(url));
        response.writeHead(200, { "Content-Type": "application/x-ndjson; charset=utf-8", "Transfer-Encoding": "chunked" });
        const chunks = result.text.match(/.{1,180}(?:\s|$)/g) || [result.text];
        for (const chunk of chunks) response.write(`${JSON.stringify({ content: chunk })}\n`);
        response.write(`${JSON.stringify({ documents: result.documents, ideas: result.ideas })}\n`);
        return response.end();
      }

      if (url.pathname.startsWith("/api/v1/")) {
        const context = partnerContext(request, database);
        if (method === "GET" && url.pathname === "/api/v1/resources/search") {
          const items = content.searchResources(url.searchParams.get("q") || "", positiveInteger(url.searchParams.get("limit"), 20, 100));
          return json(response, 200, { tier: context.tier, total: items.length, items });
        }
        if (method === "POST" && url.pathname === "/api/v1/documents/search") {
          const body = await readJson(request) as { query?: unknown; limit?: unknown };
          const items = content.searchResources(String(body.query || ""), positiveInteger(String(body.limit || 20), 20, 100));
          return json(response, 200, { tier: context.tier, sanitized: true, total: items.length, items });
        }
        if (method === "GET" && url.pathname === "/api/v1/projects") {
          const result = content.searchProjects(url.searchParams.get("q") || "", positiveInteger(url.searchParams.get("limit"), 20, 100), positiveInteger(url.searchParams.get("offset"), 0, 100000));
          return json(response, 200, { tier: context.tier, ...result });
        }
        if (method === "POST" && url.pathname === "/api/v1/assistant/query") {
          const body = await readJson(request) as { query?: unknown; source?: unknown };
          const query = String(body.query || "").trim();
          if (query.length < 2) throw new HttpError(422, "Query is required.");
          return json(response, 200, { tier: context.tier, ...content.answer(query, String(body.source || "all")) });
        }
        if (method === "POST" && url.pathname === "/api/v1/embed/sessions") {
          return json(response, 201, { sessionId: randomUUID(), tier: context.tier, expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), allowedOrigins: [String(request.headers.origin || "local")] });
        }
        if (method === "GET" && url.pathname === "/api/v1/datasets") return json(response, 200, { tier: context.tier, datasets: [content.stats(), database.revision()] });
      }

      if (url.pathname.startsWith("/api/admin")) {
        const session = sessionFor(request, database);
        requireAccessLevel(session.role, 6);
        if (method === "GET" && url.pathname === "/api/admin/overview") {
          const state = database.state();
          return json(response, 200, {
            role: session.role, accessLevel: ROLE_ACCESS_LEVELS[session.role], revision: database.revision(),
            records: state.records.length, supportCases: state.supportCases.length, publicSupport: database.publicSupport().length,
            files: database.fileStats(), sessions: database.sessionCount(), content: content.stats(), recentActivity: database.recentAudit(12)
          });
        }
        if (method === "GET" && url.pathname === "/api/admin/audit") return json(response, 200, { events: database.recentAudit(positiveInteger(url.searchParams.get("limit"), 50, 500)) });
        if (method === "POST" && url.pathname === "/api/admin/actions") {
          const body = await readJson(request) as { action?: unknown; target?: unknown; summary?: unknown };
          const action = String(body.action || "").trim();
          const target = String(body.target || "").trim();
          const summary = String(body.summary || "").trim();
          if (!action || !target || !summary) throw new HttpError(422, "Action, target and summary are required.");
          database.audit(session.role, `admin.${action}`, target, summary);
          return json(response, 201, { recorded: true, events: database.recentAudit(20) });
        }
        if (method === "GET" && url.pathname === "/api/admin/integrations") return json(response, 200, {
          services: [
            { id: "sqlite", status: "healthy", detail: database.revision() },
            { id: "prepared-data", status: "healthy", detail: content.stats() },
            { id: "assistant-retrieval", status: "healthy", detail: { mode: "local-retrieval" } },
            { id: "enterprise-identity", status: "not-configured", detail: { replacementRequired: true } }
          ]
        });
        const sectionMatch = /^\/api\/admin\/sections\/([^/]+)$/.exec(url.pathname);
        if (sectionMatch && method === "GET") {
          const section = decodeURIComponent(sectionMatch[1]);
          const state = database.state();
          const stats = content.stats();
          const files = database.fileStats();
          const revision = database.revision();
          const common = [
            { name: "Backend state revision", status: `Revision ${revision.revision}`, action: "Inspect" },
            { name: "Recent administrative events", status: `${database.recentAudit(100).length} retained`, action: "Review" }
          ];
          const sections: Record<string, Array<{ name: string; status: string; action: string }>> = {
            documents: [
              { name: "Prepared knowledge records", status: stats.archiveRecords.toLocaleString(), action: "Inspect" },
              { name: "Operational evidence files", status: `${files.count} files · ${files.bytes.toLocaleString()} bytes`, action: "Review" },
              { name: "Governed content overrides", status: `${database.overrides().length} active`, action: "Manage" }, ...common.slice(0, 1)
            ],
            data: [
              { name: "Prepared project records", status: stats.projects.toLocaleString(), action: "Inspect" },
              { name: "Generated data footprint", status: `${stats.bytes.toLocaleString()} bytes`, action: "Review" },
              { name: "Workflow records", status: `${state.records.length} records`, action: "Validate" }, ...common.slice(0, 1)
            ],
            "site-content": [
              { name: "Content overrides", status: `${database.overrides().length} active`, action: "Manage" },
              { name: "Editorial stories", status: `${Number(stats.editorial.stories || 0).toLocaleString()} indexed`, action: "Inspect" },
              { name: "Public support requests", status: `${database.publicSupport().length} received`, action: "Review" }, ...common.slice(0, 1)
            ],
            ai: [
              { name: "Retrieval corpus", status: `${(stats.archiveRecords + stats.projects).toLocaleString()} searchable records`, action: "Test" },
              { name: "Assistant mode", status: "Local grounded retrieval", action: "Inspect" },
              { name: "Saved assistant scopes", status: `${Object.keys(state.assistantSnapshots).length} scopes`, action: "Review" }, ...common.slice(0, 1)
            ],
            users: [
              { name: "Active temporary sessions", status: `${database.sessionCount()} sessions`, action: "Review" },
              { name: "Configured role types", status: "13 signed-in roles", action: "Inspect" },
              { name: "Enterprise directory", status: "Integration required", action: "Configure" }, ...common.slice(0, 1)
            ],
            integrations: [
              { name: "SQLite state service", status: "Healthy · WAL", action: "Inspect" },
              { name: "Prepared data service", status: `${stats.projects.toLocaleString()} projects`, action: "Inspect" },
              { name: "Assistant retrieval", status: "Healthy", action: "Test" },
              { name: "Enterprise identity", status: "Not configured", action: "Configure" }
            ]
          };
          const aliases: Record<string, string> = {
            portfolio: "data", knowledge: "documents", "ai-audit": "ai", pipelines: "integrations", jobs: "integrations", health: "integrations"
          };
          const configured = ADMIN_CONFIGS.find((item) => item.role === session.role)?.sections.find((item) => item.id === section)?.rows || [];
          return json(response, 200, { section, items: sections[section] || sections[aliases[section]] || configured || common });
        }
        if (method === "GET" && url.pathname === "/api/admin/users") {
          requireAccessLevel(session.role, 7);
          return json(response, 200, { activeSessions: database.sessionCount(), note: "Temporary sessions contain account type and display name only; no directory profiles are stored." });
        }
        if (method === "GET" && url.pathname === "/api/admin/content") return json(response, 200, { items: database.overrides(url.searchParams.get("kind") || undefined) });
        if (method === "PUT" && url.pathname === "/api/admin/content") {
          const body = await readJson(request) as { id?: unknown; kind?: unknown; value?: unknown };
          const id = String(body.id || "").trim();
          const kind = String(body.kind || "").trim();
          if (!id || !kind || body.value === undefined) throw new HttpError(422, "Content override id, kind and value are required.");
          database.upsertOverride(id, kind, body.value, session.role);
          return json(response, 200, { items: database.overrides(kind) });
        }
        const contentMatch = /^\/api\/admin\/content\/([^/]+)$/.exec(url.pathname);
        if (contentMatch && method === "DELETE") {
          database.deleteOverride(decodeURIComponent(contentMatch[1]), session.role);
          return noContent(response);
        }
        const settingMatch = /^\/api\/admin\/settings\/([^/]+)$/.exec(url.pathname);
        if (settingMatch && method === "GET") return json(response, 200, { setting: database.setting(decodeURIComponent(settingMatch[1])) });
        if (settingMatch && method === "PUT") {
          database.putSetting(decodeURIComponent(settingMatch[1]), await readJson(request), session.role);
          return json(response, 200, { setting: database.setting(decodeURIComponent(settingMatch[1])) });
        }
      }

      throw new HttpError(404, "API route not found.");
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (status >= 500) console.error(error);
      return json(response, status, {
        error: error instanceof Error ? error.message : "Unexpected backend error.",
        details: error instanceof HttpError ? error.details : undefined,
        requestId
      });
    }
  });

  return { server, database, domain, content };
}
