import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { OPEN_GRANTS } from "../src/data/open-grants";
import type { BackendConfig } from "./config";

type ArchiveItem = {
  id: string; title: string; kind: string; summary?: string; contextTitle?: string | null;
  source?: string; sourceUrl?: string | null; section?: string | null; status?: string | null;
};

type CompactTable = { fields: string[]; rows: unknown[][] };
type SearchItem = {
  id: string; title: string; summary: string; kind: string; source: string; url?: string;
  relevance: number; dataset: string; document_id?: string; country_codes?: string[];
};

function normalized(value: unknown) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function terms(query: string) {
  const ignored = new Set(["project", "projects", "sgp", "gef", "small", "grants", "grant"]);
  return [...new Set(normalized(query).split(/[^a-z0-9\p{L}]+/u)
    .filter((term) => term.length > 1 && !ignored.has(term))
    .map((term) => term === "turkey" ? "turkiye" : term))];
}

function scoreText(text: string, queryTerms: string[]) {
  const haystack = normalized(text);
  if (!queryTerms.length) return 0;
  const matches = queryTerms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
  return matches / queryTerms.length;
}

export class ContentRepository {
  private cache = new Map<string, unknown>();
  readonly config: BackendConfig;

  constructor(config: BackendConfig) {
    this.config = config;
  }

  private generated(relative: string) {
    return path.join(this.config.rootDir, "public", "generated", relative);
  }

  private json<T>(relative: string): T {
    if (!this.cache.has(relative)) this.cache.set(relative, JSON.parse(readFileSync(this.generated(relative), "utf8")));
    return this.cache.get(relative) as T;
  }

  archivePayload() {
    return this.json<{ schemaVersion: string; generatedAt: string; items: ArchiveItem[] }>("knowledge/archive-index.json");
  }

  editorialPayload() {
    return this.json<Record<string, unknown>>("knowledge/editorial-index.json");
  }

  projectsPayload() {
    return this.json<CompactTable>("portfolio/data/projects.runtime.json");
  }

  provenancePayload() {
    return this.json<Record<string, unknown>>("provenance.json");
  }

  grantsPayload() {
    return { generatedAt: "2026-08-03T00:00:00.000Z", items: OPEN_GRANTS };
  }

  stats() {
    const archive = this.archivePayload();
    const editorial = this.editorialPayload() as { counts?: Record<string, number> };
    const projects = this.projectsPayload();
    return {
      archiveRecords: archive.items.length,
      projects: projects.rows.length,
      openGrants: OPEN_GRANTS.length,
      editorial: editorial.counts || {},
      bytes: [
        "knowledge/archive-index.json", "knowledge/editorial-index.json",
        "portfolio/data/projects.runtime.json", "provenance.json"
      ].reduce((sum, file) => sum + statSync(this.generated(file)).size, 0)
    };
  }

  searchResources(query: string, limit = 20): SearchItem[] {
    const queryTerms = terms(query);
    return this.archivePayload().items
      .map((item) => {
        const titleScore = scoreText(item.title, queryTerms);
        const bodyScore = scoreText(`${item.summary || ""} ${item.contextTitle || ""} ${item.section || ""}`, queryTerms);
        return {
          id: item.id, title: item.title || item.contextTitle || "Untitled SGP resource",
          summary: item.summary || item.contextTitle || "SGP archive metadata record.", kind: item.kind || "resource",
          source: item.source || "SGP website archive", url: item.sourceUrl || undefined,
          relevance: Math.min(1, titleScore * 0.65 + bodyScore * 0.35), dataset: "innovation_library", document_id: item.id
        };
      })
      .filter((item) => queryTerms.length === 0 || item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance || a.title.localeCompare(b.title))
      .slice(0, Math.max(1, Math.min(limit, 100)));
  }

  searchProjects(query: string, limit = 20, offset = 0) {
    const table = this.projectsPayload();
    const queryTerms = terms(query);
    const preferredFields = [
      "projectNumber", "projectNumberNormalized", "projectTitle", "countryName", "countryIso3", "focalArea", "granteeName", "status",
      "project_id", "project_code", "title", "country_name", "country_iso3", "focal_area", "organization_name"
    ];
    const indices = preferredFields.map((field) => table.fields.indexOf(field)).filter((index) => index >= 0);
    const matches = table.rows.flatMap((row) => {
      const relevance = scoreText(indices.map((index) => row[index]).join(" "), queryTerms);
      if (queryTerms.length && relevance === 0) return [];
      return [{ record: Object.fromEntries(table.fields.map((field, index) => [field, row[index] ?? null])), relevance }];
    });
    matches.sort((a, b) => b.relevance - a.relevance);
    return { total: matches.length, items: matches.slice(offset, offset + Math.max(1, Math.min(limit, 100))).map((item) => item.record) };
  }

  assistantSearch(query: string, source = "all", limit = 8): SearchItem[] {
    const resources = source === "projects" ? [] : this.searchResources(query, limit);
    const projectResults = source === "innovation_library" ? [] : this.searchProjects(query, limit).items.map((record) => {
      const title = String(record.projectTitle || record.title || record.project_title || record.projectNumber || record.project_code || "SGP project");
      const projectId = String(record.rowId || record.project_id || record.projectNumberNormalized || record.projectNumber || record.project_code || title);
      const countryName = record.countryName || record.country_name;
      const countryCode = record.countryIso3 || record.country_iso3;
      const focalArea = record.focalArea || record.focal_area;
      const organization = record.granteeName || record.organization_name;
      return {
        id: projectId, title,
        summary: [countryName, focalArea, organization, record.status].filter(Boolean).join(" · "),
        kind: "project", source: "Prepared SGP project database", relevance: scoreText(JSON.stringify(record), terms(query)),
        dataset: "projects", document_id: projectId,
        country_codes: countryCode ? [String(countryCode)] : undefined
      } satisfies SearchItem;
    });
    return [...resources, ...projectResults].sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  }

  answer(query: string, source = "all") {
    const documents = this.assistantSearch(query, source, 6);
    if (!documents.length) return {
      text: "I could not find a prepared SGP record that clearly matches this question. Try a country, focal area, project title, or programme topic.",
      documents,
      ideas: ["Search by country", "Search by focal area", "Browse recent SGP resources"]
    };
    const lines = documents.slice(0, 4).map((item) => `- ${item.title}: ${item.summary}`);
    return {
      text: `The temporary local retrieval service found ${documents.length} relevant prepared SGP sources for “${query}”.\n\n${lines.join("\n")}\n\nOpen the cited sources to verify details before using them in a decision or publication.`,
      documents,
      ideas: ["Compare these examples", "Summarize the strongest evidence", "Narrow this to one country"]
    };
  }
}
