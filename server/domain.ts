import { randomUUID } from "node:crypto";
import {
  ROLE_ACCESS_LEVELS, isRole, type Role
} from "../src/auth/roles";
import { parseAssistantSnapshot, type AssistantSnapshot } from "../src/lib/ai/assistantPersistence";
import {
  canCreateWorkflowRecord, canEditWorkflowRecord, emptyWorkflowValues, validateWorkflowValues,
  WORKFLOW_DEFINITIONS, WORKFLOW_SECTIONS, type OperationalRole, type WorkflowSection, type WorkflowValue
} from "../src/workspace/workflowDefinitions";
import type {
  SupportCase, WorkflowAttachment, WorkflowAuditEvent, WorkflowRecord, WorkspacePreferences
} from "../src/workspace/workflowStore";
import type { BackendDatabase } from "./database";
import { emptyAssistantSnapshot, type BackendState } from "./state";

export class HttpError extends Error {
  readonly status: number;
  readonly details?: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const OPERATIONAL_ROLES = new Set<OperationalRole>([
  "programme-assistant", "reviewer", "nsc", "national-coordinator", "cpmt", "agency-programme"
]);

export function operationalRole(value: Role): OperationalRole {
  if (value === "agency-admin") return "agency-programme";
  if (!OPERATIONAL_ROLES.has(value as OperationalRole)) throw new HttpError(403, "This account does not have an operational workspace.");
  return value as OperationalRole;
}

type MutableActorRole = Exclude<Role, "public"> | OperationalRole;

function accountRoleForOperationalRole(role: MutableActorRole): Exclude<Role, "public"> {
  return role === "agency-programme" ? "agency-admin" : role;
}

export function requireAccessLevel(role: Role, level: number) {
  if (ROLE_ACCESS_LEVELS[role] < level) throw new HttpError(403, `Access level L${level} or higher is required.`);
}

export function requireRole(value: unknown): Role {
  if (!isRole(value) || value === "public") throw new HttpError(400, "Select a valid signed-in account type.");
  return value;
}

function uid(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`.toUpperCase();
}

function now() {
  return new Date().toISOString();
}

function assistantKey(role: Role, scope: string) {
  const normalized = String(scope || "workspace").trim().slice(0, 160) || "workspace";
  return `${role}::${normalized}`;
}

function event(actor: OperationalRole, action: WorkflowAuditEvent["action"], summary: string, extras: Partial<WorkflowAuditEvent> = {}): WorkflowAuditEvent {
  return { id: uid("EVT"), actor, action, summary, at: now(), ...extras };
}

function recordForRole(state: BackendState, id: string, role: OperationalRole) {
  const record = state.records.find((item) => item.id === id);
  if (!record || !record.assignedRoles.includes(role)) throw new HttpError(404, "Record not found in this assignment.");
  return record;
}

function editableRecord(state: BackendState, id: string, role: OperationalRole) {
  const record = recordForRole(state, id, role);
  if (!canEditWorkflowRecord(record.section, record.stageIndex, role)) throw new HttpError(403, "This lifecycle stage is assigned to another account type.");
  return record;
}

function replaceRecord(state: BackendState, record: WorkflowRecord) {
  state.records = state.records.map((item) => item.id === record.id ? record : item);
}

function validValues(values: unknown): values is Record<string, WorkflowValue> {
  return Boolean(values) && typeof values === "object" && !Array.isArray(values)
    && Object.values(values as Record<string, unknown>).every((value) => ["string", "number", "boolean"].includes(typeof value));
}

export type RoleSnapshot = {
  records: WorkflowRecord[];
  supportCases: SupportCase[];
  preferences: Partial<Record<OperationalRole, WorkspacePreferences>>;
};

export class BackendDomain {
  constructor(readonly database: BackendDatabase) {}

  private mutate<T>(role: MutableActorRole, action: string, target: string, summary: string, fn: (state: BackendState) => T): { result: T; revision: number; updatedAt: string } {
    this.database.db.exec("BEGIN IMMEDIATE");
    try {
      const state = this.database.state();
      const result = fn(state);
      const revision = this.database.writeState(state);
      this.database.audit(accountRoleForOperationalRole(role), action, target, summary);
      this.database.db.exec("COMMIT");
      return { result, ...revision };
    } catch (error) {
      this.database.db.exec("ROLLBACK");
      throw error;
    }
  }

  snapshot(roleValue: Role): RoleSnapshot {
    const role = operationalRole(roleValue);
    const state = this.database.state();
    return {
      records: state.records.filter((record) => record.assignedRoles.includes(role)),
      supportCases: state.supportCases.filter((item) => item.requesterRole === role),
      preferences: state.preferences[role] ? { [role]: state.preferences[role] } : {}
    };
  }

  createRecord(roleValue: Role, sectionValue: unknown) {
    const role = operationalRole(roleValue);
    const section = String(sectionValue) as WorkflowSection;
    if (!WORKFLOW_SECTIONS.includes(section)) throw new HttpError(400, "Unknown workflow section.");
    if (!WORKFLOW_DEFINITIONS[section].roles.includes(role) || !canCreateWorkflowRecord(section, role)) {
      throw new HttpError(403, "This account cannot create records in that workflow.");
    }
    return this.mutate(role, "workflow.create", section, `${section} record created`, (state) => {
      const definition = WORKFLOW_DEFINITIONS[section];
      const timestamp = now();
      const record: WorkflowRecord = {
        id: uid(section.slice(0, 3)), section, title: `New ${definition.singular}`,
        summary: "Complete the required fields and save this record.", stageIndex: 0,
        assignedRoles: [...definition.roles], values: emptyWorkflowValues(definition), notes: [], attachments: [],
        history: [event(role, "created", `${definition.singular} created`)], createdAt: timestamp, updatedAt: timestamp
      };
      state.records = [record, ...state.records];
      return record;
    });
  }

  updateRecord(roleValue: Role, id: string, payload: unknown) {
    const role = operationalRole(roleValue);
    const body = payload as { title?: unknown; summary?: unknown; values?: unknown };
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const summary = typeof body?.summary === "string" ? body.summary.trim() : "";
    const values = body?.values;
    if (!title || !summary || !validValues(values)) throw new HttpError(422, "Record title, summary and typed values are required.");
    return this.mutate(role, "workflow.update", id, "Record fields saved", (state) => {
      const current = editableRecord(state, id, role);
      const record = { ...current, title, summary, values, updatedAt: now(), history: [...current.history, event(role, "updated", "Record fields saved")] };
      replaceRecord(state, record);
      return record;
    });
  }

  advanceRecord(roleValue: Role, id: string) {
    const role = operationalRole(roleValue);
    return this.mutate(role, "workflow.advance", id, "Record advanced", (state) => {
      const current = editableRecord(state, id, role);
      const definition = WORKFLOW_DEFINITIONS[current.section];
      const errors = validateWorkflowValues(definition, current.values);
      if (errors.length) throw new HttpError(422, "Complete required fields before advancing.", errors);
      if (current.stageIndex >= definition.stages.length - 1) throw new HttpError(409, "This workflow is already complete.");
      const next = current.stageIndex + 1;
      const record = {
        ...current, stageIndex: next, updatedAt: now(),
        history: [...current.history, event(role, "advanced", `Advanced to ${definition.stages[next]}`, { fromStage: current.stageIndex, toStage: next })]
      };
      replaceRecord(state, record);
      return record;
    });
  }

  returnRecord(roleValue: Role, id: string, reasonValue: unknown) {
    const role = operationalRole(roleValue);
    const reason = typeof reasonValue === "string" ? reasonValue.trim() : "";
    if (!reason) throw new HttpError(422, "A return reason is required.");
    return this.mutate(role, "workflow.return", id, "Record returned", (state) => {
      const current = editableRecord(state, id, role);
      if (current.stageIndex === 0) throw new HttpError(409, "This record is already at its first stage.");
      const previous = current.stageIndex - 1;
      const timestamp = now();
      const record = {
        ...current, stageIndex: previous, updatedAt: timestamp,
        notes: [...current.notes, { id: uid("NOTE"), body: reason, createdAt: timestamp, createdBy: role }],
        history: [...current.history, event(role, "returned", `Returned to ${WORKFLOW_DEFINITIONS[current.section].stages[previous]}: ${reason}`, { fromStage: current.stageIndex, toStage: previous })]
      };
      replaceRecord(state, record);
      return record;
    });
  }

  addNote(roleValue: Role, id: string, bodyValue: unknown) {
    const role = operationalRole(roleValue);
    const body = typeof bodyValue === "string" ? bodyValue.trim() : "";
    if (!body) throw new HttpError(422, "Enter a note before adding it.");
    return this.mutate(role, "workflow.note", id, "Record note added", (state) => {
      const current = editableRecord(state, id, role);
      const timestamp = now();
      const record = {
        ...current, updatedAt: timestamp,
        notes: [...current.notes, { id: uid("NOTE"), body, createdAt: timestamp, createdBy: role }],
        history: [...current.history, event(role, "noted", "Record note added")]
      };
      replaceRecord(state, record);
      return record;
    });
  }

  addAttachment(roleValue: Role, recordId: string, attachment: WorkflowAttachment) {
    const role = operationalRole(roleValue);
    return this.mutate(role, "workflow.file.add", recordId, `Evidence file added: ${attachment.name}`, (state) => {
      const current = editableRecord(state, recordId, role);
      if (current.attachments.some((item) => item.id === attachment.id)) return current;
      const record = {
        ...current, updatedAt: now(), attachments: [...current.attachments, attachment],
        history: [...current.history, event(role, "file-added", `Evidence file added: ${attachment.name}`)]
      };
      replaceRecord(state, record);
      return record;
    });
  }

  removeAttachment(roleValue: Role, recordId: string, attachmentId: string) {
    const role = operationalRole(roleValue);
    return this.mutate(role, "workflow.file.remove", recordId, "Evidence file removed", (state) => {
      const current = editableRecord(state, recordId, role);
      const attachment = current.attachments.find((item) => item.id === attachmentId);
      if (!attachment) throw new HttpError(404, "Evidence file not found.");
      const record = {
        ...current, updatedAt: now(), attachments: current.attachments.filter((item) => item.id !== attachmentId),
        history: [...current.history, event(role, "file-removed", `Evidence file removed: ${attachment.name}`)]
      };
      replaceRecord(state, record);
      return attachment;
    });
  }

  assertFileRead(roleValue: Role, recordId: string) {
    recordForRole(this.database.state(), recordId, operationalRole(roleValue));
  }

  assertFileWrite(roleValue: Role, recordId: string) {
    editableRecord(this.database.state(), recordId, operationalRole(roleValue));
  }

  createSupport(roleValue: Role, payload: unknown) {
    const role = operationalRole(roleValue);
    const body = payload as { category?: unknown; subject?: unknown; description?: unknown };
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (!category || !subject || !description) throw new HttpError(422, "Category, subject and description are required.");
    return this.mutate(role, "support.create", role, "Support case opened", (state) => {
      const timestamp = now();
      const item: SupportCase = {
        id: uid("SUP"), requesterRole: role, category, subject, description, status: "Open", createdAt: timestamp, updatedAt: timestamp,
        history: [{ id: uid("EVT"), actor: role, summary: "Support case opened", at: timestamp }]
      };
      state.supportCases = [item, ...state.supportCases];
      return item;
    });
  }

  updateSupport(roleValue: Role, id: string, payload: unknown) {
    const role = operationalRole(roleValue);
    const body = payload as { status?: unknown; note?: unknown };
    const status = String(body?.status || "") as SupportCase["status"];
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!["Open", "In progress", "Resolved"].includes(status) || !note) throw new HttpError(422, "A valid status and update note are required.");
    return this.mutate(role, "support.update", id, `Support case changed to ${status}`, (state) => {
      const current = state.supportCases.find((item) => item.id === id && item.requesterRole === role);
      if (!current) throw new HttpError(404, "Support case not found in this account.");
      const timestamp = now();
      const item = { ...current, status, updatedAt: timestamp, history: [...current.history, { id: uid("EVT"), actor: role, summary: `${status}: ${note}`, at: timestamp }] };
      state.supportCases = state.supportCases.map((candidate) => candidate.id === id ? item : candidate);
      return item;
    });
  }

  savePreferences(roleValue: Role, payload: unknown) {
    const role = operationalRole(roleValue);
    const value = payload as Partial<WorkspacePreferences>;
    if (typeof value?.language !== "string" || typeof value.deadlineEmails !== "boolean" || typeof value.serviceUpdates !== "boolean") {
      throw new HttpError(422, "Language and notification preferences are required.");
    }
    return this.mutate(role, "preferences.update", role, "Workspace preferences saved", (state) => {
      state.preferences[role] = value as WorkspacePreferences;
      return state.preferences[role];
    });
  }

  importSnapshot(roleValue: Role, payload: unknown) {
    const role = operationalRole(roleValue);
    const body = payload as Partial<RoleSnapshot>;
    if (!Array.isArray(body?.records) || !Array.isArray(body.supportCases) || !body.preferences || typeof body.preferences !== "object") {
      throw new HttpError(422, "A complete operational workspace snapshot is required.");
    }
    const records = body.records;
    const supportCases = body.supportCases;
    for (const record of records) {
      const definition = record && WORKFLOW_DEFINITIONS[record.section];
      if (!record || !definition || typeof record.id !== "string" || !record.assignedRoles?.includes(role)
        || !Number.isInteger(record.stageIndex) || record.stageIndex < 0 || record.stageIndex >= definition.stages.length
        || typeof record.title !== "string" || typeof record.summary !== "string" || !validValues(record.values)
        || !Array.isArray(record.notes) || !Array.isArray(record.attachments) || !Array.isArray(record.history)) {
        throw new HttpError(422, "The snapshot contains a record outside this assignment or with an invalid schema.");
      }
    }
    if (supportCases.some((item) => !item || item.requesterRole !== role || typeof item.id !== "string" || !Array.isArray(item.history))) {
      throw new HttpError(422, "The snapshot contains a support case outside this account.");
    }
    const preference = body.preferences[role];
    if (preference && (typeof preference.language !== "string" || typeof preference.deadlineEmails !== "boolean" || typeof preference.serviceUpdates !== "boolean")) {
      throw new HttpError(422, "The snapshot contains invalid account preferences.");
    }
    return this.mutate(role, "workspace.import", role, "Operational workspace restored from backup", (state) => {
      state.records = [...records, ...state.records.filter((record) => !record.assignedRoles.includes(role))];
      state.supportCases = [...supportCases, ...state.supportCases.filter((item) => item.requesterRole !== role)];
      if (preference) state.preferences[role] = preference;
      return { records: records.length, supportCases: supportCases.length };
    });
  }

  savedItems(roleValue: Role) {
    if (roleValue === "public") throw new HttpError(401, "Sign in to use saved items.");
    const role = roleValue;
    return this.database.state().savedItems[role] || [];
  }

  toggleSaved(roleValue: Role, itemIdValue: unknown) {
    if (roleValue === "public") throw new HttpError(401, "Sign in to use saved items.");
    const role = roleValue;
    const itemId = typeof itemIdValue === "string" ? itemIdValue.trim() : "";
    if (!itemId) throw new HttpError(422, "A saved item identifier is required.");
    return this.mutate(role, "saved.toggle", itemId, "Saved collection updated", (state) => {
      const current = state.savedItems[role] || [];
      state.savedItems[role] = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId];
      return state.savedItems[role] || [];
    });
  }

  assistantSnapshot(roleValue: Role, scope: string): AssistantSnapshot {
    if (roleValue === "public") throw new HttpError(401, "Sign in to save assistant history.");
    return parseAssistantSnapshot(this.database.state().assistantSnapshots[assistantKey(roleValue, scope)] || emptyAssistantSnapshot());
  }

  saveAssistantSnapshot(roleValue: Role, scope: string, value: unknown) {
    if (roleValue === "public") throw new HttpError(401, "Sign in to save assistant history.");
    const role = roleValue;
    const snapshot = parseAssistantSnapshot(value);
    const key = assistantKey(role, scope);
    return this.mutate(role, "assistant.history", key, "Assistant history saved", (state) => {
      state.assistantSnapshots[key] = snapshot;
      return snapshot;
    });
  }
}
