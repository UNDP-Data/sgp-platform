import { beforeEach, describe, expect, test } from "vitest";
import { emptyWorkflowValues, WORKFLOW_DEFINITIONS } from "../src/workspace/workflowDefinitions";
import { recordsForRole, useWorkflowStore } from "../src/workspace/workflowStore";

function validValues(section: keyof typeof WORKFLOW_DEFINITIONS) {
  const definition = WORKFLOW_DEFINITIONS[section];
  const values = emptyWorkflowValues(definition);
  for (const field of definition.fields) {
    if (field.type === "checkbox") values[field.key] = true;
    else if (field.type === "number") values[field.key] = field.min || 1;
    else if (field.type === "select") values[field.key] = field.options?.[0] || "Selected";
    else if (field.type === "date") values[field.key] = "2026-08-03";
    else values[field.key] = `${field.label} value`;
  }
  return values;
}

describe("operational workflow store", () => {
  beforeEach(() => useWorkflowStore.getState().reset());

  test("seeds every operational record family and scopes records by role", () => {
    const state = useWorkflowStore.getState();
    expect(new Set(state.records.map((record) => record.section))).toEqual(new Set(Object.keys(WORKFLOW_DEFINITIONS)));
    expect(recordsForRole(state.records, "agency-programme").every((record) => record.assignedRoles.includes("agency-programme"))).toBe(true);
    expect(recordsForRole(state.records, "national-coordinator").some((record) => record.section === "reviews")).toBe(true);
    expect(recordsForRole(state.records, "national-coordinator").some((record) => record.section === "finance")).toBe(false);
    expect(recordsForRole(state.records, "reviewer").some((record) => record.section === "finance")).toBe(false);
  });

  test("validates, saves, advances and returns a record with audit history", () => {
    const store = useWorkflowStore.getState();
    const id = store.createRecord("proposals", "national-coordinator");
    expect(id).toBeTruthy();
    expect(store.createRecord("finance", "national-coordinator")).toBe("");

    expect(useWorkflowStore.getState().advanceRecord(id, "national-coordinator")).toMatchObject({ ok: false });
    expect(useWorkflowStore.getState().updateRecord(id, "national-coordinator", {
      title: "Functional proposal",
      summary: "Complete proposal record ready for progression.",
      values: validValues("proposals")
    })).toEqual({ ok: true });
    expect(useWorkflowStore.getState().advanceRecord(id, "national-coordinator")).toEqual({ ok: true });
    expect(useWorkflowStore.getState().returnRecord(id, "national-coordinator", "Budget source needs a second check.")).toEqual({ ok: true });

    const record = useWorkflowStore.getState().records.find((item) => item.id === id)!;
    expect(record.stageIndex).toBe(0);
    expect(record.notes.at(-1)?.body).toContain("Budget source");
    expect(record.history.map((item) => item.action)).toEqual(["created", "updated", "advanced", "returned"]);
  });

  test("persists attributable notes and attachment metadata", () => {
    const id = "KEN-MON-014";
    expect(useWorkflowStore.getState().addNote(id, "programme-assistant", "Consent confirmation received.")).toEqual({ ok: true });
    expect(useWorkflowStore.getState().addAttachment(id, "programme-assistant", {
      id: "FILE-1", name: "visit-evidence.pdf", size: 2048, type: "application/pdf",
      storedAt: "2026-08-03T12:00:00.000Z", storedBy: "programme-assistant"
    })).toEqual({ ok: true });
    const record = useWorkflowStore.getState().records.find((item) => item.id === id)!;
    expect(record.notes.at(-1)?.createdBy).toBe("programme-assistant");
    expect(record.attachments[0].name).toBe("visit-evidence.pdf");
    expect(record.history.at(-1)?.action).toBe("file-added");
  });

  test("separates workflow visibility, creation permission and stage ownership", () => {
    expect(useWorkflowStore.getState().createRecord("proposals", "reviewer")).toBe("");
    expect(useWorkflowStore.getState().updateRecord("KEN-PRP-014", "reviewer", {
      title: "TAG Reviewer should not overwrite a complete application",
      summary: "Read-only record",
      values: validValues("proposals")
    })).toEqual({ ok: false, errors: ["This stage is assigned to another role."] });

    expect(useWorkflowStore.getState().updateRecord("KEN-REV-014", "reviewer", {
      title: "Technical and safeguards review",
      summary: "TAG Reviewer-owned assessment",
      values: validValues("reviews")
    })).toEqual({ ok: true });
    expect(useWorkflowStore.getState().advanceRecord("KEN-REV-014", "reviewer")).toEqual({ ok: true });
    expect(useWorkflowStore.getState().addNote("KEN-REV-014", "national-coordinator", "Attempted override")).toEqual({
      ok: false,
      errors: ["This stage is assigned to another role."]
    });
  });

  test("creates and resolves account-scoped support cases", () => {
    const id = useWorkflowStore.getState().createSupportCase("cpmt", "Data quality", "Country total mismatch", "The country summary differs from the reporting snapshot.");
    expect(id).toBeTruthy();
    expect(useWorkflowStore.getState().updateSupportCase(id, "national-coordinator", "Resolved", "Incorrect account")).toMatchObject({ ok: false });
    expect(useWorkflowStore.getState().updateSupportCase(id, "cpmt", "Resolved", "Source refresh corrected the total.")).toEqual({ ok: true });
    expect(useWorkflowStore.getState().supportCases.find((item) => item.id === id)?.status).toBe("Resolved");
  });

  test("rejects malformed imports without replacing current records", () => {
    const before = useWorkflowStore.getState().records.length;
    expect(useWorkflowStore.getState().importSnapshot({ records: "invalid" })).toMatchObject({ ok: false });
    expect(useWorkflowStore.getState().records).toHaveLength(before);
  });
});
