import { useEffect } from "react";
import type { Role } from "../auth/roles";
import { BackendApiError, backendRequest } from "../services/backend";
import {
  clearWorkflowFiles, readWorkflowFile, removeWorkflowFile, storeWorkflowFile
} from "./workflowFiles";
import type { OperationalRole, WorkflowSection, WorkflowValue } from "./workflowDefinitions";
import {
  accountRoleForOperationalRole, useWorkflowStore, type SupportCase, type WorkflowAttachment, type WorkflowRecord, type WorkspacePreferences
} from "./workflowStore";

type ActionResult = { ok: true } | { ok: false; errors: string[] };
type Snapshot = Pick<ReturnType<typeof useWorkflowStore.getState>, "records" | "supportCases" | "preferences">;
type MutationPayload = { snapshot: Snapshot; id?: string };

function actionError(error: unknown): ActionResult {
  if (error instanceof BackendApiError) return { ok: false, errors: error.details.length ? error.details : [error.message] };
  return { ok: false, errors: [error instanceof Error ? error.message : "The backend operation failed."] };
}

function applySnapshot(snapshot: Snapshot) {
  const response = useWorkflowStore.getState().importSnapshot(snapshot);
  if (!response.ok) throw new Error(response.errors.join(" "));
}

async function mutation(role: OperationalRole, path: string, init: RequestInit) {
  const payload = await backendRequest<MutationPayload>(accountRoleForOperationalRole(role), path, init);
  if (payload?.snapshot) applySnapshot(payload.snapshot);
  return payload;
}

export function BackendWorkspaceBridge({ role }: { role: Role }) {
  useEffect(() => {
    if (!["programme-assistant", "reviewer", "nsc", "national-coordinator", "cpmt", "agency-admin"].includes(role)) return;
    let active = true;
    backendRequest<{ snapshot: Snapshot }>(role, "/workspace/snapshot").then((payload) => {
      if (active && payload?.snapshot) applySnapshot(payload.snapshot);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [role]);
  return null;
}

export function useWorkflowActions() {
  const local = useWorkflowStore();
  return {
    createRecord: async (section: WorkflowSection, role: OperationalRole) => {
      try {
        const payload = await mutation(role, "/workflows", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section })
        });
        return payload?.id || local.createRecord(section, role);
      } catch {
        return "";
      }
    },
    updateRecord: async (id: string, role: OperationalRole, patch: { title: string; summary: string; values: Record<string, WorkflowValue> }): Promise<ActionResult> => {
      try {
        const payload = await mutation(role, `/workflows/${encodeURIComponent(id)}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch)
        });
        return payload ? { ok: true } : local.updateRecord(id, role, patch);
      } catch (error) { return actionError(error); }
    },
    advanceRecord: async (id: string, role: OperationalRole): Promise<ActionResult> => {
      try {
        const payload = await mutation(role, `/workflows/${encodeURIComponent(id)}/advance`, { method: "POST" });
        return payload ? { ok: true } : local.advanceRecord(id, role);
      } catch (error) { return actionError(error); }
    },
    returnRecord: async (id: string, role: OperationalRole, reason: string): Promise<ActionResult> => {
      try {
        const payload = await mutation(role, `/workflows/${encodeURIComponent(id)}/return`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason })
        });
        return payload ? { ok: true } : local.returnRecord(id, role, reason);
      } catch (error) { return actionError(error); }
    },
    addNote: async (id: string, role: OperationalRole, body: string): Promise<ActionResult> => {
      try {
        const payload = await mutation(role, `/workflows/${encodeURIComponent(id)}/notes`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body })
        });
        return payload ? { ok: true } : local.addNote(id, role, body);
      } catch (error) { return actionError(error); }
    },
    uploadEvidence: async (record: WorkflowRecord, role: OperationalRole, file: File, attachment: WorkflowAttachment): Promise<ActionResult> => {
      try {
        const payload = await mutation(role, `/workflows/${encodeURIComponent(record.id)}/files`, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream", "X-File-Name": encodeURIComponent(file.name), "X-File-Id": attachment.id },
          body: file
        });
        if (payload) return { ok: true };
        await storeWorkflowFile(attachment.id, file);
        const result = local.addAttachment(record.id, role, attachment);
        if (!result.ok) await removeWorkflowFile(attachment.id);
        return result;
      } catch (error) { return actionError(error); }
    },
    downloadEvidence: async (record: WorkflowRecord, role: OperationalRole, attachment: WorkflowAttachment) => {
      const backend = await backendRequest<Blob>(accountRoleForOperationalRole(role), `/workflows/${encodeURIComponent(record.id)}/files/${encodeURIComponent(attachment.id)}`);
      return backend || readWorkflowFile(attachment.id);
    },
    removeEvidence: async (record: WorkflowRecord, role: OperationalRole, attachment: WorkflowAttachment): Promise<ActionResult> => {
      try {
        const payload = await mutation(role, `/workflows/${encodeURIComponent(record.id)}/files/${encodeURIComponent(attachment.id)}`, { method: "DELETE" });
        if (payload) return { ok: true };
        const result = local.removeAttachment(record.id, role, attachment.id);
        if (result.ok) await removeWorkflowFile(attachment.id);
        return result;
      } catch (error) { return actionError(error); }
    },
    createSupportCase: async (role: OperationalRole, category: string, subject: string, description: string) => {
      try {
        const payload = await mutation(role, "/support/cases", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, subject, description })
        });
        return payload?.id || local.createSupportCase(role, category, subject, description);
      } catch { return ""; }
    },
    updateSupportCase: async (id: string, role: OperationalRole, status: SupportCase["status"], note: string): Promise<ActionResult> => {
      try {
        const payload = await mutation(role, `/support/cases/${encodeURIComponent(id)}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note })
        });
        return payload ? { ok: true } : local.updateSupportCase(id, role, status, note);
      } catch (error) { return actionError(error); }
    },
    savePreferences: async (role: OperationalRole, preferences: WorkspacePreferences): Promise<ActionResult> => {
      try {
        const payload = await mutation(role, "/preferences", {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preferences)
        });
        if (!payload) local.savePreferences(role, preferences);
        return { ok: true };
      } catch (error) { return actionError(error); }
    },
    restoreSnapshot: async (role: OperationalRole, snapshot: unknown): Promise<{ result: ActionResult; backend: boolean }> => {
      try {
        const payload = await mutation(role, "/workspace/import", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snapshot)
        });
        if (payload) return { result: { ok: true }, backend: true };
        return { result: local.importSnapshot(snapshot), backend: false };
      } catch (error) { return { result: actionError(error), backend: true }; }
    },
    clearLocalEvidence: clearWorkflowFiles
  };
}
