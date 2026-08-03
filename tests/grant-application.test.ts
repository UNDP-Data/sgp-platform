import { describe, expect, test } from "vitest";
import {
  DEFAULT_BUDGET_ROWS, GRANT_APPLICATION_SECTIONS, grantApplicationProgress, parseStructuredRows,
  seedStructuredApplicationValues, serializeStructuredRows, validateGrantApplication, type BudgetRow
} from "../src/workspace/grantApplicationModel";
import { WORKFLOW_SEEDS, type WorkflowValue } from "../src/workspace/workflowDefinitions";

describe("National Coordinator grant application model", () => {
  test("covers every editable application area and validates the representative record", () => {
    expect(GRANT_APPLICATION_SECTIONS.map((section) => section.id)).toEqual([
      "overview", "organization", "rationale", "results", "workplan", "budget",
      "safeguards", "monitoring", "documents", "review"
    ]);
    const seed = WORKFLOW_SEEDS.find((item) => item.id === "KEN-PRP-014")!;
    expect(validateGrantApplication(seed.values, seed.title, seed.summary)).toEqual([]);
    expect(grantApplicationProgress(seed.values, seed.title, seed.summary)).toBe(100);
  });

  test("reports incomplete sections instead of accepting a shallow application", () => {
    const values = seedStructuredApplicationValues({
      proposalCode: "SGP-KEN-DRAFT", requestedAmount: 48000, submissionAttested: false
    });
    const issues = validateGrantApplication(values, "Draft project", "Draft application requiring completion");
    expect(new Set(issues.map((issue) => issue.sectionId))).toEqual(new Set([
      "overview", "organization", "rationale", "results", "workplan", "budget",
      "safeguards", "monitoring", "documents", "review"
    ]));
    expect(grantApplicationProgress(values, "Draft project", "Draft application requiring completion")).toBe(0);
  });

  test("preserves structured rows and detects a requested-budget mismatch", () => {
    const seed = WORKFLOW_SEEDS.find((item) => item.id === "KEN-PRP-014")!;
    const rows = parseStructuredRows<BudgetRow>(seed.values.budgetRows, []);
    expect(rows).toHaveLength(3);
    expect(rows.reduce((sum, row) => sum + row.requestedAmount, 0)).toBe(48000);
    expect(parseStructuredRows<BudgetRow>(serializeStructuredRows(rows), [])).toEqual(rows);

    const mismatched: Record<string, WorkflowValue> = {
      ...seed.values,
      budgetRows: serializeStructuredRows(DEFAULT_BUDGET_ROWS.map((row, index) => index === 0 ? { ...row, requestedAmount: row.requestedAmount + 1 } : row))
    };
    expect(validateGrantApplication(mismatched, seed.title, seed.summary).some((issue) => (
      issue.sectionId === "budget" && issue.message.includes("must equal")
    ))).toBe(true);
  });
});
