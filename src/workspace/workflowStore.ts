import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { Role } from "../auth/roles";
import {
  canCreateWorkflowRecord, canEditWorkflowRecord, emptyWorkflowValues, validateWorkflowValues, WORKFLOW_DEFINITIONS, WORKFLOW_SEEDS,
  type OperationalRole, type WorkflowSection, type WorkflowValue
} from "./workflowDefinitions";

export type WorkflowAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  storedAt: string;
  storedBy: OperationalRole;
};

export type WorkflowNote = {
  id: string;
  body: string;
  createdAt: string;
  createdBy: OperationalRole;
};

export type WorkflowAuditEvent = {
  id: string;
  action: "created" | "updated" | "advanced" | "returned" | "noted" | "file-added" | "file-removed";
  summary: string;
  at: string;
  actor: OperationalRole;
  fromStage?: number;
  toStage?: number;
};

export type WorkflowRecord = {
  id: string;
  section: WorkflowSection;
  title: string;
  summary: string;
  stageIndex: number;
  assignedRoles: OperationalRole[];
  values: Record<string, WorkflowValue>;
  notes: WorkflowNote[];
  attachments: WorkflowAttachment[];
  history: WorkflowAuditEvent[];
  createdAt: string;
  updatedAt: string;
};

export type SupportCase = {
  id: string;
  requesterRole: OperationalRole;
  category: string;
  subject: string;
  description: string;
  status: "Open" | "In progress" | "Resolved";
  createdAt: string;
  updatedAt: string;
  history: Array<{ id: string; summary: string; at: string; actor: OperationalRole }>;
};

export type WorkspacePreferences = {
  language: string;
  deadlineEmails: boolean;
  serviceUpdates: boolean;
};

type WorkflowSnapshot = {
  records: WorkflowRecord[];
  supportCases: SupportCase[];
  preferences: Partial<Record<OperationalRole, WorkspacePreferences>>;
};

export type WorkflowBackup = WorkflowSnapshot & {
  schemaVersion: "sgp-klp-operational-workspace-v1";
  exportedAt: string;
  storedFiles?: Array<{ id: string; name?: string; type?: string; data: string }>;
};

type ActionResult = { ok: true } | { ok: false; errors: string[] };

type WorkflowState = WorkflowSnapshot & {
  createRecord: (section: WorkflowSection, role: OperationalRole) => string;
  updateRecord: (id: string, role: OperationalRole, patch: { title: string; summary: string; values: Record<string, WorkflowValue> }) => ActionResult;
  advanceRecord: (id: string, role: OperationalRole) => ActionResult;
  returnRecord: (id: string, role: OperationalRole, reason: string) => ActionResult;
  addNote: (id: string, role: OperationalRole, body: string) => ActionResult;
  addAttachment: (id: string, role: OperationalRole, attachment: WorkflowAttachment) => ActionResult;
  removeAttachment: (id: string, role: OperationalRole, attachmentId: string) => ActionResult;
  createSupportCase: (role: OperationalRole, category: string, subject: string, description: string) => string;
  updateSupportCase: (id: string, role: OperationalRole, status: SupportCase["status"], note: string) => ActionResult;
  savePreferences: (role: OperationalRole, preferences: WorkspacePreferences) => void;
  importSnapshot: (value: unknown) => ActionResult;
  reset: () => void;
};

const FIXTURE_TIME = "2026-08-03T09:00:00.000Z";

function uid(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`.toUpperCase();
}

function now() {
  return new Date().toISOString();
}

function event(actor: OperationalRole, action: WorkflowAuditEvent["action"], summary: string, extras: Partial<WorkflowAuditEvent> = {}): WorkflowAuditEvent {
  return { id: uid("EVT"), actor, action, summary, at: now(), ...extras };
}

function seedRecords(): WorkflowRecord[] {
  return WORKFLOW_SEEDS.map((seed) => ({
    ...seed,
    assignedRoles: [...WORKFLOW_DEFINITIONS[seed.section].roles],
    notes: [],
    attachments: [],
    history: [{ id: `EVT-${seed.id}`, actor: WORKFLOW_DEFINITIONS[seed.section].roles[0], action: "created", summary: "Operational record created", at: FIXTURE_TIME }],
    createdAt: FIXTURE_TIME,
    updatedAt: FIXTURE_TIME
  }));
}

function initialSnapshot(): WorkflowSnapshot {
  return {
    records: seedRecords(),
    supportCases: [{
      id: "SUP-KEN-001",
      requesterRole: "national-coordinator",
      category: "Portfolio data correction",
      subject: "Correct district coding for two grants",
      description: "The source records use a legacy district name. Evidence and corrected codes are ready for review.",
      status: "In progress",
      createdAt: FIXTURE_TIME,
      updatedAt: FIXTURE_TIME,
      history: [{ id: "EVT-SUP-KEN-001", actor: "national-coordinator", summary: "Support case opened", at: FIXTURE_TIME }]
    }],
    preferences: {}
  };
}

function recordAccess(record: WorkflowRecord | undefined, role: OperationalRole): record is WorkflowRecord {
  return Boolean(record && record.assignedRoles.includes(role));
}

function recordEditAccess(record: WorkflowRecord | undefined, role: OperationalRole): record is WorkflowRecord {
  return recordAccess(record, role) && canEditWorkflowRecord(record.section, record.stageIndex, role);
}

function updateMatchingRecord(records: WorkflowRecord[], id: string, update: (record: WorkflowRecord) => WorkflowRecord) {
  return records.map((record) => record.id === id ? update(record) : record);
}

const memory = new Map<string, string>();
const memoryStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => { memory.set(name, value); },
  removeItem: (name) => { memory.delete(name); }
};

function isOperationalRole(value: unknown): value is OperationalRole {
  return ["programme-assistant", "reviewer", "nsc", "national-coordinator", "cpmt", "agency-programme"].includes(String(value));
}

function migrateOperationalRole(value: unknown): OperationalRole | null {
  return isOperationalRole(value) ? value : null;
}

function migratePersistedWorkflowState(value: unknown) {
  if (!value || typeof value !== "object") return initialSnapshot();
  const candidate = value as Partial<WorkflowSnapshot>;
  const records = Array.isArray(candidate.records) ? candidate.records.flatMap((record) => {
    const definition = record && WORKFLOW_DEFINITIONS[record.section];
    if (!record || !definition) return [];
    const seedValues = WORKFLOW_SEEDS.find((seed) => seed.id === record.id)?.values || {};
    return [{
      ...record,
      assignedRoles: [...definition.roles],
      values: { ...emptyWorkflowValues(definition), ...seedValues, ...record.values },
      notes: (record.notes || []).flatMap((note) => {
        const createdBy = migrateOperationalRole(note.createdBy);
        return createdBy ? [{ ...note, createdBy }] : [];
      }),
      attachments: (record.attachments || []).flatMap((attachment) => {
        const storedBy = migrateOperationalRole(attachment.storedBy);
        return storedBy ? [{ ...attachment, storedBy }] : [];
      }),
      history: (record.history || []).flatMap((history) => {
        const actor = migrateOperationalRole(history.actor);
        return actor ? [{ ...history, actor }] : [];
      })
    } satisfies WorkflowRecord];
  }) : seedRecords();
  const supportCases = Array.isArray(candidate.supportCases) ? candidate.supportCases.flatMap((item) => {
    const requesterRole = migrateOperationalRole(item.requesterRole);
    if (!requesterRole) return [];
    return [{
      ...item,
      requesterRole,
      history: (item.history || []).flatMap((history) => {
        const actor = migrateOperationalRole(history.actor);
        return actor ? [{ ...history, actor }] : [];
      })
    } satisfies SupportCase];
  }) : [];
  const preferences: WorkflowSnapshot["preferences"] = {};
  for (const [role, preference] of Object.entries(candidate.preferences || {})) {
    const nextRole = migrateOperationalRole(role);
    if (nextRole && preference) preferences[nextRole] = preference;
  }
  return { records, supportCases, preferences };
}

function isWorkflowValue(value: unknown): value is WorkflowValue {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isTimestamp(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function parseSnapshot(value: unknown): WorkflowSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<WorkflowSnapshot>;
  if (!Array.isArray(candidate.records) || !Array.isArray(candidate.supportCases) || !candidate.preferences || typeof candidate.preferences !== "object") return null;
  const records = candidate.records.filter((record): record is WorkflowRecord => {
    if (!record || typeof record !== "object") return false;
    const item = record as WorkflowRecord;
    const definition = WORKFLOW_DEFINITIONS[item.section];
    return typeof item.id === "string" && Boolean(definition)
      && typeof item.title === "string" && typeof item.summary === "string"
      && Number.isInteger(item.stageIndex) && item.stageIndex >= 0 && item.stageIndex < definition.stages.length
      && Array.isArray(item.assignedRoles) && item.assignedRoles.length > 0 && item.assignedRoles.every(isOperationalRole)
      && item.values && typeof item.values === "object" && Object.values(item.values).every(isWorkflowValue)
      && Array.isArray(item.notes) && item.notes.every((note) => note && typeof note.id === "string" && typeof note.body === "string" && isOperationalRole(note.createdBy) && isTimestamp(note.createdAt))
      && Array.isArray(item.attachments) && item.attachments.every((file) => file && typeof file.id === "string" && typeof file.name === "string" && typeof file.size === "number" && typeof file.type === "string" && isOperationalRole(file.storedBy) && isTimestamp(file.storedAt))
      && Array.isArray(item.history) && item.history.every((history) => history && typeof history.id === "string" && typeof history.summary === "string" && isOperationalRole(history.actor) && isTimestamp(history.at))
      && isTimestamp(item.createdAt) && isTimestamp(item.updatedAt);
  });
  if (records.length !== candidate.records.length) return null;
  const supportCases = candidate.supportCases.filter((supportCase): supportCase is SupportCase => {
    if (!supportCase || typeof supportCase !== "object") return false;
    const item = supportCase as SupportCase;
    return typeof item.id === "string" && isOperationalRole(item.requesterRole)
      && typeof item.category === "string" && typeof item.subject === "string" && typeof item.description === "string"
      && ["Open", "In progress", "Resolved"].includes(item.status)
      && isTimestamp(item.createdAt) && isTimestamp(item.updatedAt)
      && Array.isArray(item.history) && item.history.every((history) => history && typeof history.id === "string" && typeof history.summary === "string" && isOperationalRole(history.actor) && isTimestamp(history.at));
  });
  if (supportCases.length !== candidate.supportCases.length) return null;
  const preferences = Object.entries(candidate.preferences).every(([role, preference]) => (
    isOperationalRole(role) && preference && typeof preference === "object"
      && typeof preference.language === "string"
      && typeof preference.deadlineEmails === "boolean"
      && typeof preference.serviceUpdates === "boolean"
  ));
  if (!preferences) return null;
  return { records, supportCases, preferences: candidate.preferences };
}

export function validateWorkflowSnapshot(value: unknown): value is WorkflowBackup {
  return Boolean(parseSnapshot(value));
}

export const useWorkflowStore = create<WorkflowState>()(persist((set, get) => ({
  ...initialSnapshot(),
  createRecord: (section, role) => {
    const definition = WORKFLOW_DEFINITIONS[section];
    if (!definition.roles.includes(role) || !canCreateWorkflowRecord(section, role)) return "";
    const id = uid(section.slice(0, 3));
    const timestamp = now();
    const record: WorkflowRecord = {
      id,
      section,
      title: `New ${definition.singular}`,
      summary: "Complete the required fields and save this record.",
      stageIndex: 0,
      assignedRoles: [...definition.roles],
      values: emptyWorkflowValues(definition),
      notes: [], attachments: [],
      history: [event(role, "created", `${definition.singular} created`)],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    set((state) => ({ records: [record, ...state.records] }));
    return id;
  },
  updateRecord: (id, role, patch) => {
    const record = get().records.find((item) => item.id === id);
    if (!recordAccess(record, role)) return { ok: false, errors: ["This record is outside the active assignment."] };
    if (!recordEditAccess(record, role)) return { ok: false, errors: ["This stage is assigned to another role."] };
    const errors = [!patch.title.trim() ? "Record title is required." : "", !patch.summary.trim() ? "Record summary is required." : ""].filter(Boolean);
    if (errors.length) return { ok: false, errors };
    const timestamp = now();
    set((state) => ({ records: updateMatchingRecord(state.records, id, (item) => ({ ...item, ...patch, updatedAt: timestamp, history: [...item.history, event(role, "updated", "Record fields saved")] })) }));
    return { ok: true };
  },
  advanceRecord: (id, role) => {
    const record = get().records.find((item) => item.id === id);
    if (!recordAccess(record, role)) return { ok: false, errors: ["This record is outside the active assignment."] };
    if (!recordEditAccess(record, role)) return { ok: false, errors: ["This stage is assigned to another role."] };
    const definition = WORKFLOW_DEFINITIONS[record.section];
    const errors = validateWorkflowValues(definition, record.values);
    if (errors.length) return { ok: false, errors };
    if (record.stageIndex >= definition.stages.length - 1) return { ok: false, errors: ["This workflow is already complete."] };
    const next = record.stageIndex + 1;
    const timestamp = now();
    set((state) => ({ records: updateMatchingRecord(state.records, id, (item) => ({
      ...item, stageIndex: next, updatedAt: timestamp,
      history: [...item.history, event(role, "advanced", `Advanced to ${definition.stages[next]}`, { fromStage: item.stageIndex, toStage: next })]
    })) }));
    return { ok: true };
  },
  returnRecord: (id, role, reason) => {
    const record = get().records.find((item) => item.id === id);
    if (!recordAccess(record, role)) return { ok: false, errors: ["This record is outside the active assignment."] };
    if (!recordEditAccess(record, role)) return { ok: false, errors: ["This stage is assigned to another role."] };
    if (!reason.trim()) return { ok: false, errors: ["A return reason is required."] };
    if (record.stageIndex === 0) return { ok: false, errors: ["This record is already at its first stage."] };
    const previous = record.stageIndex - 1;
    const definition = WORKFLOW_DEFINITIONS[record.section];
    const timestamp = now();
    set((state) => ({ records: updateMatchingRecord(state.records, id, (item) => ({
      ...item, stageIndex: previous, updatedAt: timestamp,
      notes: [...item.notes, { id: uid("NOTE"), body: reason.trim(), createdAt: timestamp, createdBy: role }],
      history: [...item.history, event(role, "returned", `Returned to ${definition.stages[previous]}: ${reason.trim()}`, { fromStage: item.stageIndex, toStage: previous })]
    })) }));
    return { ok: true };
  },
  addNote: (id, role, body) => {
    const record = get().records.find((item) => item.id === id);
    if (!recordAccess(record, role)) return { ok: false, errors: ["This record is outside the active assignment."] };
    if (!recordEditAccess(record, role)) return { ok: false, errors: ["This stage is assigned to another role."] };
    if (!body.trim()) return { ok: false, errors: ["Enter a note before adding it."] };
    const timestamp = now();
    set((state) => ({ records: updateMatchingRecord(state.records, id, (item) => ({
      ...item, updatedAt: timestamp,
      notes: [...item.notes, { id: uid("NOTE"), body: body.trim(), createdAt: timestamp, createdBy: role }],
      history: [...item.history, event(role, "noted", "Record note added")]
    })) }));
    return { ok: true };
  },
  addAttachment: (id, role, attachment) => {
    const record = get().records.find((item) => item.id === id);
    if (!recordAccess(record, role)) return { ok: false, errors: ["This record is outside the active assignment."] };
    if (!recordEditAccess(record, role)) return { ok: false, errors: ["This stage is assigned to another role."] };
    set((state) => ({ records: updateMatchingRecord(state.records, id, (item) => ({
      ...item, updatedAt: now(), attachments: [...item.attachments, attachment],
      history: [...item.history, event(role, "file-added", `Evidence file added: ${attachment.name}`)]
    })) }));
    return { ok: true };
  },
  removeAttachment: (id, role, attachmentId) => {
    const record = get().records.find((item) => item.id === id);
    if (!recordAccess(record, role)) return { ok: false, errors: ["This record is outside the active assignment."] };
    if (!recordEditAccess(record, role)) return { ok: false, errors: ["This stage is assigned to another role."] };
    const attachment = record.attachments.find((item) => item.id === attachmentId);
    if (!attachment) return { ok: false, errors: ["Evidence file not found."] };
    set((state) => ({ records: updateMatchingRecord(state.records, id, (item) => ({
      ...item, updatedAt: now(), attachments: item.attachments.filter((file) => file.id !== attachmentId),
      history: [...item.history, event(role, "file-removed", `Evidence file removed: ${attachment.name}`)]
    })) }));
    return { ok: true };
  },
  createSupportCase: (role, category, subject, description) => {
    if (!subject.trim() || !description.trim()) return "";
    const id = uid("SUP");
    const timestamp = now();
    const item: SupportCase = {
      id, requesterRole: role, category, subject: subject.trim(), description: description.trim(), status: "Open",
      createdAt: timestamp, updatedAt: timestamp,
      history: [{ id: uid("EVT"), actor: role, summary: "Support case opened", at: timestamp }]
    };
    set((state) => ({ supportCases: [item, ...state.supportCases] }));
    return id;
  },
  updateSupportCase: (id, role, status, note) => {
    const supportCase = get().supportCases.find((item) => item.id === id && item.requesterRole === role);
    if (!supportCase) return { ok: false, errors: ["Support case not found in this account."] };
    if (!note.trim()) return { ok: false, errors: ["Add an update note."] };
    const timestamp = now();
    set((state) => ({ supportCases: state.supportCases.map((item) => item.id === id ? {
      ...item, status, updatedAt: timestamp,
      history: [...item.history, { id: uid("EVT"), actor: role, summary: `${status}: ${note.trim()}`, at: timestamp }]
    } : item) }));
    return { ok: true };
  },
  savePreferences: (role, preferences) => set((state) => ({ preferences: { ...state.preferences, [role]: preferences } })),
  importSnapshot: (value) => {
    const parsed = parseSnapshot(value);
    if (!parsed) return { ok: false, errors: ["The selected file is not a valid SGP operational workspace export."] };
    set(parsed);
    return { ok: true };
  },
  reset: () => set(initialSnapshot()),
}), {
  name: "sgp-klp-operational-workflows-v1",
  version: 3,
  migrate: (persistedState) => migratePersistedWorkflowState(persistedState),
  storage: createJSONStorage(() => typeof localStorage === "undefined" ? memoryStorage : localStorage),
  partialize: (state) => ({ records: state.records, supportCases: state.supportCases, preferences: state.preferences })
}));

export function recordsForRole(records: WorkflowRecord[], role: OperationalRole, section?: WorkflowSection) {
  return records.filter((record) => record.assignedRoles.includes(role) && (!section || record.section === section));
}

export function operationalRole(role: Role): OperationalRole | null {
  if (role === "agency-admin") return "agency-programme";
  return isOperationalRole(role) ? role : null;
}

export function accountRoleForOperationalRole(role: OperationalRole): Exclude<Role, "public"> {
  return role === "agency-programme" ? "agency-admin" : role;
}
