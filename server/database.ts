import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { isRole, type Role } from "../src/auth/roles";
import type { BackendConfig } from "./config";
import { initialBackendState, migrateBackendState, type BackendState } from "./state";

export type SessionRow = {
  token: string;
  role: Role;
  displayName: string;
  createdAt: string;
  expiresAt: string;
};

export type FileRow = {
  id: string;
  recordId: string;
  name: string;
  type: string;
  size: number;
  path: string;
  storedBy: string;
  storedAt: string;
};

export class BackendDatabase {
  readonly db: DatabaseSync;
  readonly config: BackendConfig;

  constructor(config: BackendConfig) {
    this.config = config;
    mkdirSync(path.dirname(config.databasePath), { recursive: true });
    mkdirSync(config.filesDir, { recursive: true });
    this.db = new DatabaseSync(config.databasePath);
    this.migrate();
    this.seed();
    this.upgradeState();
  }

  private migrate() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS platform_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        value_json TEXT NOT NULL,
        revision INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
      CREATE TABLE IF NOT EXISTS evidence_files (
        id TEXT PRIMARY KEY,
        record_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        stored_by TEXT NOT NULL,
        stored_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS evidence_record ON evidence_files(record_id);
      CREATE TABLE IF NOT EXISTS public_support (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        request_type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT NOT NULL,
        summary TEXT NOT NULL,
        at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS audit_time ON audit_log(at DESC);
      CREATE TABLE IF NOT EXISTS content_overrides (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        value_json TEXT NOT NULL,
        updated_by TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        namespace TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_by TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  seed(force = false) {
    const exists = this.db.prepare("SELECT id FROM platform_state WHERE id = 1").get();
    if (exists && !force) return;
    const timestamp = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO platform_state (id, value_json, revision, updated_at)
      VALUES (1, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET value_json = excluded.value_json, revision = platform_state.revision + 1, updated_at = excluded.updated_at
    `).run(JSON.stringify(initialBackendState()), timestamp);
    this.audit("platform-admin", "database.seed", "platform_state", force ? "Temporary backend state reset" : "Temporary backend state initialized");
  }

  private upgradeState() {
    const row = this.db.prepare("SELECT value_json FROM platform_state WHERE id = 1").get() as { value_json: string } | undefined;
    if (!row) return;
    const current = JSON.parse(row.value_json) as { schemaVersion?: number };
    if (current.schemaVersion !== 5) {
      const timestamp = new Date().toISOString();
      this.db.prepare("UPDATE platform_state SET value_json = ?, revision = revision + 1, updated_at = ? WHERE id = 1")
        .run(JSON.stringify(migrateBackendState(current)), timestamp);
      this.audit("platform-admin", "database.migrate", "platform_state", "Agency programme and administration access consolidated to schema version 5");
    }
    this.db.prepare("UPDATE sessions SET role = 'agency-admin' WHERE role = 'agency-programme'").run();
    this.db.prepare("UPDATE sessions SET role = 'it-admin' WHERE role IN ('it-frontend', 'it-backend')").run();
    this.db.prepare("DELETE FROM sessions WHERE role IN ('fao-admin', 'ci-admin', 'undp-admin', 'super-admin')").run();
  }

  reset() {
    for (const row of this.listFiles()) rmSync(row.path, { force: true });
    this.db.exec("DELETE FROM evidence_files; DELETE FROM sessions; DELETE FROM public_support; DELETE FROM content_overrides; DELETE FROM settings;");
    this.seed(true);
  }

  state(): BackendState {
    const row = this.db.prepare("SELECT value_json FROM platform_state WHERE id = 1").get() as { value_json: string } | undefined;
    if (!row) throw new Error("Temporary backend state is unavailable.");
    return JSON.parse(row.value_json) as BackendState;
  }

  revision() {
    const row = this.db.prepare("SELECT revision, updated_at FROM platform_state WHERE id = 1").get() as { revision: number; updated_at: string };
    return { revision: Number(row.revision), updatedAt: row.updated_at };
  }

  writeState(state: BackendState) {
    const timestamp = new Date().toISOString();
    this.db.prepare("UPDATE platform_state SET value_json = ?, revision = revision + 1, updated_at = ? WHERE id = 1")
      .run(JSON.stringify(state), timestamp);
    return this.revision();
  }

  createSession(session: SessionRow) {
    this.db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
    this.db.prepare("INSERT INTO sessions (token, role, display_name, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
      .run(session.token, session.role, session.displayName, session.createdAt, session.expiresAt);
  }

  session(token: string): SessionRow | null {
    const row = this.db.prepare("SELECT token, role, display_name, created_at, expires_at FROM sessions WHERE token = ? AND expires_at > ?")
      .get(token, new Date().toISOString()) as { token: string; role: Role; display_name: string; created_at: string; expires_at: string } | undefined;
    if (!row || !isRole(row.role) || row.role === "public") return null;
    return { token: row.token, role: row.role, displayName: row.display_name, createdAt: row.created_at, expiresAt: row.expires_at };
  }

  deleteSession(token: string) {
    this.db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  sessionCount() {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM sessions WHERE expires_at > ?").get(new Date().toISOString()) as { count: number };
    return Number(row.count);
  }

  putFile(file: FileRow) {
    this.db.prepare(`
      INSERT INTO evidence_files (id, record_id, name, type, size, path, stored_by, stored_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET record_id = excluded.record_id, name = excluded.name, type = excluded.type,
        size = excluded.size, path = excluded.path, stored_by = excluded.stored_by, stored_at = excluded.stored_at
    `).run(file.id, file.recordId, file.name, file.type, file.size, file.path, file.storedBy, file.storedAt);
  }

  file(id: string): FileRow | null {
    const row = this.db.prepare("SELECT id, record_id, name, type, size, path, stored_by, stored_at FROM evidence_files WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? this.mapFile(row) : null;
  }

  listFiles() {
    return (this.db.prepare("SELECT id, record_id, name, type, size, path, stored_by, stored_at FROM evidence_files").all() as Record<string, unknown>[]).map((row) => this.mapFile(row));
  }

  deleteFile(id: string) {
    this.db.prepare("DELETE FROM evidence_files WHERE id = ?").run(id);
  }

  fileStats() {
    const row = this.db.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS bytes FROM evidence_files").get() as { count: number; bytes: number };
    return { count: Number(row.count), bytes: Number(row.bytes) };
  }

  private mapFile(row: Record<string, unknown>): FileRow {
    return {
      id: String(row.id), recordId: String(row.record_id), name: String(row.name), type: String(row.type),
      size: Number(row.size), path: String(row.path), storedBy: String(row.stored_by), storedAt: String(row.stored_at)
    };
  }

  addPublicSupport(item: { id: string; name: string; email: string; requestType: string; description: string; status: string; createdAt: string }) {
    this.db.prepare("INSERT INTO public_support (id, name, email, request_type, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(item.id, item.name, item.email, item.requestType, item.description, item.status, item.createdAt);
  }

  publicSupport(email?: string) {
    const sql = email
      ? "SELECT id, name, email, request_type, description, status, created_at FROM public_support WHERE lower(email) = lower(?) ORDER BY created_at DESC"
      : "SELECT id, name, email, request_type, description, status, created_at FROM public_support ORDER BY created_at DESC";
    const rows = (email ? this.db.prepare(sql).all(email) : this.db.prepare(sql).all()) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id), name: String(row.name), email: String(row.email), requestType: String(row.request_type),
      description: String(row.description), status: String(row.status), createdAt: String(row.created_at)
    }));
  }

  audit(actorRole: string, action: string, target: string, summary: string) {
    this.db.prepare("INSERT INTO audit_log (actor_role, action, target, summary, at) VALUES (?, ?, ?, ?, ?)")
      .run(actorRole, action, target, summary, new Date().toISOString());
  }

  recentAudit(limit = 50) {
    return this.db.prepare("SELECT actor_role AS actorRole, action, target, summary, at FROM audit_log ORDER BY id DESC LIMIT ?").all(limit);
  }

  upsertOverride(id: string, kind: string, value: unknown, role: string) {
    const timestamp = new Date().toISOString();
    this.db.prepare(`INSERT INTO content_overrides (id, kind, value_json, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
      .run(id, kind, JSON.stringify(value), role, timestamp);
    this.audit(role, "content.override", id, `${kind} override saved`);
  }

  overrides(kind?: string) {
    const rows = (kind
      ? this.db.prepare("SELECT id, kind, value_json, updated_by, updated_at FROM content_overrides WHERE kind = ? ORDER BY updated_at DESC").all(kind)
      : this.db.prepare("SELECT id, kind, value_json, updated_by, updated_at FROM content_overrides ORDER BY updated_at DESC").all()) as Record<string, unknown>[];
    return rows.map((row) => ({ id: row.id, kind: row.kind, value: JSON.parse(String(row.value_json)), updatedBy: row.updated_by, updatedAt: row.updated_at }));
  }

  deleteOverride(id: string, role: string) {
    this.db.prepare("DELETE FROM content_overrides WHERE id = ?").run(id);
    this.audit(role, "content.override.delete", id, "Content override removed");
  }

  setting(namespace: string) {
    const row = this.db.prepare("SELECT value_json, updated_by, updated_at FROM settings WHERE namespace = ?").get(namespace) as Record<string, unknown> | undefined;
    return row ? { namespace, value: JSON.parse(String(row.value_json)), updatedBy: row.updated_by, updatedAt: row.updated_at } : null;
  }

  putSetting(namespace: string, value: unknown, role: string) {
    const timestamp = new Date().toISOString();
    this.db.prepare(`INSERT INTO settings (namespace, value_json, updated_by, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(namespace) DO UPDATE SET value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
      .run(namespace, JSON.stringify(value), role, timestamp);
    this.audit(role, "settings.update", namespace, "Temporary backend setting updated");
  }

  close() {
    this.db.close();
  }
}
