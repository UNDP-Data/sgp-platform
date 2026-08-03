import {
  emptyWorkflowValues, WORKFLOW_DEFINITIONS, WORKFLOW_SEEDS, type OperationalRole
} from "../src/workspace/workflowDefinitions";
import type {
  SupportCase, WorkflowRecord, WorkspacePreferences
} from "../src/workspace/workflowStore";
import type { AssistantSnapshot } from "../src/lib/ai/assistantPersistence";
import { parseRole, type Role } from "../src/auth/roles";

export type BackendState = {
  schemaVersion: 5;
  records: WorkflowRecord[];
  supportCases: SupportCase[];
  preferences: Partial<Record<OperationalRole, WorkspacePreferences>>;
  savedItems: Partial<Record<Exclude<Role, "public">, string[]>>;
  assistantSnapshots: Record<string, AssistantSnapshot>;
};

const FIXTURE_TIME = "2026-08-03T09:00:00.000Z";

function migrateOperationalRole(value: unknown): OperationalRole | null {
  return ["programme-assistant", "reviewer", "nsc", "national-coordinator", "cpmt", "agency-programme"].includes(String(value))
    ? value as OperationalRole
    : null;
}

function migrateSignedInRole(value: string) {
  const role = parseRole(value);
  return role === "public" ? null : role;
}

export function initialBackendState(): BackendState {
  return {
    schemaVersion: 5,
    records: WORKFLOW_SEEDS.map((seed) => ({
      ...seed,
      assignedRoles: [...WORKFLOW_DEFINITIONS[seed.section].roles],
      notes: [],
      attachments: [],
      history: [{
        id: `EVT-${seed.id}`,
        actor: WORKFLOW_DEFINITIONS[seed.section].roles[0],
        action: "created",
        summary: "Operational record created",
        at: FIXTURE_TIME
      }],
      createdAt: FIXTURE_TIME,
      updatedAt: FIXTURE_TIME
    })),
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
    preferences: {},
    savedItems: {},
    assistantSnapshots: {}
  };
}

export function migrateBackendState(value: unknown): BackendState {
  if (!value || typeof value !== "object") return initialBackendState();
  const candidate = value as Partial<BackendState>;
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
  }) : initialBackendState().records;
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
  const preferences: BackendState["preferences"] = {};
  for (const [role, preference] of Object.entries(candidate.preferences || {})) {
    const nextRole = migrateOperationalRole(role);
    if (nextRole && preference) preferences[nextRole] = preference;
  }
  const savedItems: BackendState["savedItems"] = {};
  for (const [role, items] of Object.entries(candidate.savedItems || {})) {
    const nextRole = migrateSignedInRole(role);
    if (!nextRole || !Array.isArray(items)) continue;
    savedItems[nextRole] = [...new Set([...(savedItems[nextRole] || []), ...items.filter((item): item is string => typeof item === "string")])];
  }
  const assistantSnapshots: Record<string, AssistantSnapshot> = {};
  for (const [key, snapshot] of Object.entries(candidate.assistantSnapshots || {})) {
    const separator = key.indexOf("::");
    if (separator < 0) continue;
    const role = migrateSignedInRole(key.slice(0, separator));
    if (role) assistantSnapshots[`${role}${key.slice(separator)}`] = snapshot;
  }
  return { schemaVersion: 5, records, supportCases, preferences, savedItems, assistantSnapshots };
}

export function emptyAssistantSnapshot(): AssistantSnapshot {
  return { messages: [], sources: [], ideas: [] };
}
