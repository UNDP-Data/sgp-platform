import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { createBackendApp } from "./app";
import { backendConfig } from "./config";

const temp = mkdtempSync(path.join(tmpdir(), "sgp-platform-backend-"));
const app = createBackendApp(backendConfig({ dataDir: temp, databasePath: path.join(temp, "test.sqlite3"), filesDir: path.join(temp, "evidence") }));
await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;

async function session(role: string) {
  const response = await fetch(`${base}/api/auth/session`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role })
  });
  assert.equal(response.status, 201);
  return (await response.json() as { session: { token: string } }).session.token;
}

const auth = (token: string, extra: Record<string, string> = {}) => ({ Authorization: `Bearer ${token}`, ...extra });

try {
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.ok(health.headers.get("x-request-id"));
  const healthPayload = await health.json() as Record<string, any>;
  assert.equal(healthPayload.database.journalMode, "wal");
  assert.equal(healthPayload.content.archiveRecords, 29384);
  assert.equal(healthPayload.content.projects, 30753);

  const committee = await session("nsc");
  const denied = await fetch(`${base}/api/workflows`, {
    method: "POST", headers: auth(committee, { "Content-Type": "application/json" }), body: JSON.stringify({ section: "proposals" })
  });
  assert.equal(denied.status, 403);

  const coordinator = await session("national-coordinator");
  const tagReviewer = await session("reviewer");
  const createdResponse = await fetch(`${base}/api/workflows`, {
    method: "POST", headers: auth(coordinator, { "Content-Type": "application/json" }), body: JSON.stringify({ section: "proposals" })
  });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json() as Record<string, any>;
  const id = String(created.id);
  const blocked = await fetch(`${base}/api/workflows/${id}/advance`, { method: "POST", headers: auth(coordinator) });
  assert.equal(blocked.status, 422);
  assert.ok((await blocked.json() as Record<string, any>).details.length > 0);
  const saved = await fetch(`${base}/api/workflows/${id}`, {
    method: "PATCH", headers: auth(coordinator, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      title: "Backend integration proposal", summary: "Complete and ready for review.",
      values: {
        proposalCode: "SGP-KEN-TEMP-001", organization: "Test organization",
        organizationEligibility: "Registered and eligible community organization.", primaryContact: "Test focal point",
        requestedAmount: 50000, summary: "Temporary backend acceptance record.",
        expectedOutcomes: "Measurable community and environmental outcomes.", workplan: "Mobilize, deliver, monitor and close.",
        budgetNarrative: "Requested funds and cofinancing are justified.", safeguards: "Screening and consent are complete.",
        supportingDocuments: "Registration, budget, workplan and safeguards screen.", budgetEvidence: true, submissionAttested: true
      }
    })
  });
  assert.equal(saved.status, 200);
  const advanced = await fetch(`${base}/api/workflows/${id}/advance`, { method: "POST", headers: auth(coordinator) });
  assert.equal(advanced.status, 200);
  assert.equal((await advanced.json() as Record<string, any>).result.stageIndex, 1);

  const evidence = Buffer.from("temporary evidence content", "utf8");
  const upload = await fetch(`${base}/api/workflows/KEN-REV-014/files`, {
    method: "POST", headers: auth(tagReviewer, {
      "Content-Type": "text/plain", "X-File-Name": encodeURIComponent("review evidence.txt"), "X-File-Id": "TEST-EVIDENCE-001"
    }), body: evidence
  });
  assert.equal(upload.status, 201);
  const download = await fetch(`${base}/api/workflows/KEN-REV-014/files/TEST-EVIDENCE-001`, { headers: auth(tagReviewer) });
  assert.equal(await download.text(), evidence.toString("utf8"));
  const replacementEvidence = Buffer.from("restored replacement evidence", "utf8");
  const replaced = await fetch(`${base}/api/workflows/KEN-REV-014/files`, {
    method: "POST", headers: auth(tagReviewer, {
      "Content-Type": "text/plain", "X-File-Name": encodeURIComponent("review evidence.txt"), "X-File-Id": "TEST-EVIDENCE-001"
    }), body: replacementEvidence
  });
  assert.equal(replaced.status, 201);
  assert.deepEqual(app.database.fileStats(), { count: 1, bytes: replacementEvidence.length });
  const replacementDownload = await fetch(`${base}/api/workflows/KEN-REV-014/files/TEST-EVIDENCE-001`, { headers: auth(tagReviewer) });
  assert.equal(await replacementDownload.text(), replacementEvidence.toString("utf8"));
  const removed = await fetch(`${base}/api/workflows/KEN-REV-014/files/TEST-EVIDENCE-001`, { method: "DELETE", headers: auth(tagReviewer) });
  assert.equal(removed.status, 200);
  assert.deepEqual(app.database.fileStats(), { count: 0, bytes: 0 });

  const savedItem = await fetch(`${base}/api/saved/toggle`, {
    method: "POST", headers: auth(coordinator, { "Content-Type": "application/json" }), body: JSON.stringify({ id: "node-test" })
  });
  assert.deepEqual((await savedItem.json() as Record<string, any>).items, ["node-test"]);
  const history = { messages: [{ id: "1", role: "human", content: "Kenya", createdAt: new Date().toISOString() }], sources: [], ideas: [] };
  assert.equal((await fetch(`${base}/api/assistant/history?scope=workspace%3Anational-coordinator`, {
    method: "PUT", headers: auth(coordinator, { "Content-Type": "application/json" }), body: JSON.stringify(history)
  })).status, 200);
  const restored = await fetch(`${base}/api/assistant/history?scope=workspace%3Anational-coordinator`, { headers: auth(coordinator) });
  assert.equal((await restored.json() as Record<string, any>).snapshot.messages[0].content, "Kenya");
  const isolatedHistory = await fetch(`${base}/api/assistant/history?scope=workspace%3Anational-coordinator`, { headers: auth(tagReviewer) });
  assert.deepEqual((await isolatedHistory.json() as Record<string, any>).snapshot.messages, []);

  const support = await fetch(`${base}/api/public/support`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "James K.", email: "james@example.org", requestType: "Accessibility", description: "Keyboard review" })
  });
  assert.equal(support.status, 201);
  const supportList = await fetch(`${base}/api/public/support?email=james%40example.org`);
  assert.equal((await supportList.json() as Record<string, any>).requests[0].requestType, "Accessibility");

  const search = await fetch(`${base}/api/v1/resources/search?q=mangrove&limit=3`, { headers: { "X-API-Key": "sgp-public-dev" } });
  assert.equal(search.status, 200);
  const searchPayload = await search.json() as Record<string, any>;
  assert.equal(searchPayload.tier, "public");
  assert.ok(searchPayload.items.length > 0);
  assert.equal((await fetch(`${base}/api/v1/resources/search?q=mangrove`, { headers: { "X-API-Key": "invalid" } })).status, 401);
  const assistantStatus = await fetch(`${base}/api/sgp-ai/status?data_source=all`);
  assert.equal((await assistantStatus.json() as Record<string, any>).corpus_ready, true);
  const answer = await fetch(`${base}/api/sgp-ai/model?data_source=projects`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "Turkey biodiversity projects" })
  });
  assert.equal(answer.status, 200);
  const answerText = await answer.text();
  assert.match(answerText, /Prepared SGP project database/);
  assert.match(answerText, /TÜRKIYE|TURKIYE/i);

  const agency = await session("agency-admin");
  const agencyWorkspace = await fetch(`${base}/api/workspace/snapshot`, { headers: auth(agency) });
  assert.equal(agencyWorkspace.status, 200);
  assert.ok((await agencyWorkspace.json() as Record<string, any>).snapshot.records.some((record: Record<string, any>) => record.section === "agreements"));
  assert.equal((await fetch(`${base}/api/admin/overview`, { headers: auth(agency) })).status, 200);
  assert.equal((await fetch(`${base}/api/admin/users`, { headers: auth(agency) })).status, 403);
  const platform = await session("platform-admin");
  const contentUpdate = await fetch(`${base}/api/admin/content`, {
    method: "PUT", headers: auth(platform, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: "home-alert", kind: "banner", value: { title: "Scheduled maintenance" } })
  });
  assert.equal(contentUpdate.status, 200);
  const content = await fetch(`${base}/api/admin/content?kind=banner`, { headers: auth(platform) });
  assert.equal((await content.json() as Record<string, any>).items[0].value.title, "Scheduled maintenance");
  const adminSection = await fetch(`${base}/api/admin/sections/documents`, { headers: auth(platform) });
  assert.ok((await adminSection.json() as Record<string, any>).items.length >= 3);
  const setting = await fetch(`${base}/api/admin/settings/platform-admin%3Adocuments`, {
    method: "PUT", headers: auth(platform, { "Content-Type": "application/json" }), body: JSON.stringify({ note: "Temporary policy decision" })
  });
  assert.equal((await setting.json() as Record<string, any>).setting.value.note, "Temporary policy decision");
  const action = await fetch(`${base}/api/admin/actions`, {
    method: "POST", headers: auth(platform, { "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "review", target: "document-index", summary: "Document index review requested" })
  });
  assert.equal(action.status, 201);
  const audit = await fetch(`${base}/api/admin/audit?limit=20`, { headers: auth(platform) });
  assert.ok((await audit.json() as Record<string, any>).events.some((event: Record<string, any>) => event.target === "document-index"));

  console.log("Temporary backend smoke test passed: health, auth, workflow permissions, validation, evidence restore, role-isolated state, support, AI, partner search and admin operations.");
} finally {
  await new Promise<void>((resolve) => app.server.close(() => resolve()));
  app.database.close();
  rmSync(temp, { recursive: true, force: true });
}
