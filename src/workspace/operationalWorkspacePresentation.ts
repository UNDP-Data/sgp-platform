import {
  canEditWorkflowRecord, validateWorkflowValues, WORKFLOW_DEFINITIONS,
  type OperationalRole, type WorkflowSection
} from "./workflowDefinitions";
import type { WorkflowRecord } from "./workflowStore";

export type OperationalWorkbenchVariant =
  | "intake"
  | "decision"
  | "delivery"
  | "evidence"
  | "reporting"
  | "publication"
  | "analytics"
  | "quality"
  | "assurance"
  | "exchange";

export type OperationalWorkbenchDefinition = {
  title: string;
  summary: string;
  focusItems: string[];
  controls: string[];
  variant: OperationalWorkbenchVariant;
};

export type OperationalWorkbenchMetric = {
  label: string;
  value: string;
  detail: string;
};

const ROLE_FOCUS: Record<OperationalRole, string[]> = {
  "programme-assistant": [
    "Prepare complete source records for country review.",
    "Link each operational claim to its supporting evidence.",
    "Escalate exceptions without changing accountable decisions."
  ],
  reviewer: [
    "Work only within the active TAG assignment.",
    "Declare conflicts before protected evidence is assessed.",
    "Preserve an independent evidence-linked recommendation."
  ],
  nsc: [
    "Review the authorized committee package and material exceptions.",
    "Record conflicts, quorum, conditions and formal outcomes.",
    "Retain committee accountability in the decision history."
  ],
  "national-coordinator": [
    "Maintain the complete country-level source record.",
    "Resolve evidence and validation gaps before submission.",
    "Keep project, decision, delivery and reporting records traceable."
  ],
  cpmt: [
    "Compare only countries and functions in the active assignment.",
    "Prioritize material exceptions and country support needs.",
    "Validate programme evidence without replacing country ownership."
  ],
  "agency-programme": [
    "Operate only over agency-managed records in scope.",
    "Reconcile agency evidence with the preserved programme decision.",
    "Keep assurance, finance and exchange actions separately auditable."
  ]
};

const SECTION_CONTROLS: Record<WorkflowSection, string[]> = {
  intake: ["Source and organization identified", "Country eligibility checked", "Completeness decision recorded"],
  proposals: ["Controlled application version", "Required evidence complete", "Decision package readiness"],
  reviews: ["Conflict declaration", "Immutable evidence assessed", "Independent recommendation locked"],
  decisions: ["Meeting authority and quorum", "Conflicts and conditions recorded", "Outcome formally attested"],
  grants: ["Approved decision linked", "Signed agreement verified", "Delivery and closure evidence"],
  monitoring: ["Visit scope and consent", "Observations linked to evidence", "Follow-up actions closed"],
  results: ["Indicator and baseline traceability", "Evidence coverage", "Country validation"],
  amr: ["Project selection complete", "Aggregation and duplication checks", "Country and CPMT validation"],
  knowledge: ["Rights and consent", "Publication classification", "AI and API eligibility"],
  analytics: ["Source freshness", "Visible filters and quality notes", "Export authorization"],
  programmes: ["Assignment scope", "Programme health and freshness", "Support action ownership"],
  corrections: ["Original value retained", "Evidence and authorization", "Downstream recalculation"],
  agreements: ["NSC decision preserved", "Signature and assurance review", "Activation conditions"],
  finance: ["Authoritative values matched", "Variance evidence", "Reconciliation completed"],
  safeguards: ["Risk and severity classified", "Condition evidence reviewed", "Closure criteria confirmed"],
  "data-exchange": ["Authoritative source version", "Schema and exception validation", "Receiving-system acknowledgement"]
};

const SECTION_VARIANTS: Record<WorkflowSection, OperationalWorkbenchVariant> = {
  intake: "intake",
  proposals: "decision",
  reviews: "decision",
  decisions: "decision",
  grants: "delivery",
  monitoring: "evidence",
  results: "evidence",
  amr: "reporting",
  knowledge: "publication",
  analytics: "analytics",
  programmes: "analytics",
  corrections: "quality",
  agreements: "assurance",
  finance: "assurance",
  safeguards: "assurance",
  "data-exchange": "exchange"
};

const DETAILED_WORKBENCHES: Partial<Record<`${OperationalRole}:${WorkflowSection}`, Partial<OperationalWorkbenchDefinition>>> = {
  "national-coordinator:results": {
    title: "Project results and evidence readiness",
    summary: "Validate project indicators, qualitative results, completion material and source evidence before country reporting.",
    focusItems: [
      "Resolve indicators whose reported value is not supported by project evidence.",
      "Review qualitative results against monitoring and completion documents.",
      "Keep every country validation attributable to the project record."
    ]
  },
  "national-coordinator:amr": {
    title: "Annual monitoring report preparation",
    summary: "Select the reporting population, review contribution and evidence readiness, and preserve project-level traceability through aggregation.",
    focusItems: [
      "Confirm the included project population and explain every exclusion.",
      "Review contribution values and prevent duplicate aggregation.",
      "Complete country endorsement before CPMT validation."
    ]
  },
  "cpmt:programmes": {
    title: "Assigned country programme health",
    summary: "Compare data freshness, programme risks and support actions across only the countries in the active CPMT assignment.",
    focusItems: [
      "Prioritize countries with stale source data or material reporting exceptions.",
      "Keep geography and functional permissions visible in every comparison.",
      "Assign support actions without taking ownership away from the country programme."
    ]
  },
  "cpmt:proposals": {
    title: "Proposal lifecycle and decision readiness",
    summary: "Surface assignment-scoped exceptions across application completeness, approval dates, decision evidence and signed-agreement activation.",
    focusItems: [
      "Review lifecycle exceptions instead of re-performing country appraisal.",
      "Check that approval dates and formal decisions are internally consistent.",
      "Escalate missing signed MoAs before activation."
    ]
  },
  "cpmt:grants": {
    title: "Grant delivery and reconciliation",
    summary: "Compare delivery milestones, agreement status and material financial variances across the assigned portfolio.",
    focusItems: [
      "Identify grants whose delivery status conflicts with their agreement state.",
      "Trace financial variances back to the authoritative agency source.",
      "Route controlled corrections to the accountable owner."
    ]
  },
  "cpmt:results": {
    title: "Results quality and evidence coverage",
    summary: "Review project-to-indicator traceability, evidence coverage and country validation before results enter programme reporting.",
    focusItems: [
      "Prioritize reported values with incomplete or weak evidence.",
      "Compare quantitative indicators with qualitative project results.",
      "Record validation decisions without overwriting source submissions."
    ]
  },
  "cpmt:amr": {
    title: "Country reporting readiness",
    summary: "Validate country AMR populations, aggregation logic, project traceability and endorsement status across the active assignment.",
    focusItems: [
      "Compare readiness across assigned country submissions.",
      "Inspect the projects contributing to each aggregate indicator.",
      "Return specific validation issues with an attributable reason."
    ]
  },
  "cpmt:corrections": {
    title: "Controlled data correction",
    summary: "Resolve duplicate identifiers, geography and taxonomy issues with before-and-after values, evidence and a complete audit trail.",
    focusItems: [
      "Retain the original value and the proposed replacement side by side.",
      "Separate correction preparation from authorization where required.",
      "Confirm downstream calculations after an authorized change."
    ]
  },
  "cpmt:knowledge": {
    title: "Knowledge publication and AI eligibility",
    summary: "Review project linkage, rights, consent, public visibility and AI eligibility as distinct governed decisions.",
    focusItems: [
      "Do not infer publication rights from document type or source location.",
      "Keep public visibility separate from AI and API eligibility.",
      "Route unresolved rights or sensitive-content signals to review."
    ]
  },
  "cpmt:analytics": {
    title: "Scoped analytics and export jobs",
    summary: "Make filters, portfolio coverage, quality notes and export authorization visible before an asynchronous export is created.",
    focusItems: [
      "Expose the active country, lifecycle and thematic filters.",
      "Save reusable definitions without widening the underlying access scope.",
      "Track large export jobs to completion with attributable status."
    ]
  },
  "agency-programme:agreements": {
    title: "Agreement assurance workbench",
    summary: "Verify the approved decision, signature package and activation conditions while preserving the NSC outcome as read-only evidence."
  },
  "agency-programme:finance": {
    title: "Financial reconciliation workbench",
    summary: "Compare commitment, payment and grant values from authoritative agency records and resolve only assigned variances."
  },
  "agency-programme:safeguards": {
    title: "Safeguards assurance workbench",
    summary: "Review assigned risk conditions and closure evidence without exposing unrelated restricted programme material."
  },
  "agency-programme:data-exchange": {
    title: "Agency data exchange workbench",
    summary: "Monitor source versions, schema validation, synchronization exceptions and receiving-system acknowledgement."
  }
};

export function operationalWorkbenchDefinition(
  role: OperationalRole,
  section: WorkflowSection,
  pageLabel?: string,
  pageDescription?: string
): OperationalWorkbenchDefinition {
  const override = DETAILED_WORKBENCHES[`${role}:${section}`];
  return {
    title: override?.title || `${pageLabel || WORKFLOW_DEFINITIONS[section].plural} operating view`,
    summary: override?.summary || pageDescription || WORKFLOW_DEFINITIONS[section].intro,
    focusItems: override?.focusItems || ROLE_FOCUS[role],
    controls: override?.controls || SECTION_CONTROLS[section],
    variant: override?.variant || SECTION_VARIANTS[section]
  };
}

export function operationalWorkbenchMetrics(
  records: WorkflowRecord[],
  role: OperationalRole,
  section: WorkflowSection
): OperationalWorkbenchMetric[] {
  const definition = WORKFLOW_DEFINITIONS[section];
  const completed = records.filter((record) => record.stageIndex === definition.stages.length - 1).length;
  const actionable = records.filter((record) => (
    record.stageIndex < definition.stages.length - 1 && canEditWorkflowRecord(section, record.stageIndex, role)
  )).length;
  const ready = records.filter((record) => validateWorkflowValues(definition, record.values).length === 0).length;
  const evidence = records.filter((record) => (
    record.attachments.length > 0
    || Boolean(record.values.evidenceReference)
    || record.values.evidenceConfirmed === true
    || Boolean(record.values.supportingDocuments)
  )).length;
  const denominator = Math.max(records.length * Math.max(definition.stages.length - 1, 1), 1);
  const lifecyclePercent = Math.round(records.reduce((sum, record) => sum + record.stageIndex, 0) / denominator * 100);

  return [
    { label: "Records in scope", value: String(records.length), detail: "Filtered by active assignment" },
    { label: "Actionable now", value: String(actionable), detail: "Current stage owned by this role" },
    { label: "Validation ready", value: String(ready), detail: `${evidence} with linked evidence signals` },
    { label: "Lifecycle progress", value: `${lifecyclePercent}%`, detail: `${completed} at the final stage` }
  ];
}

export function detailedOperationalWorkbenchKeys() {
  return Object.keys(DETAILED_WORKBENCHES);
}
