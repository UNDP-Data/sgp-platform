import type { WorkflowValue } from "./workflowDefinitions";

export type GrantApplicationSectionId =
  | "overview"
  | "organization"
  | "rationale"
  | "results"
  | "workplan"
  | "budget"
  | "safeguards"
  | "monitoring"
  | "documents"
  | "review";

export type GrantApplicationField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "email" | "date" | "select" | "checkbox";
  required?: boolean;
  wide?: boolean;
  help?: string;
  options?: string[];
};

export type GrantApplicationSection = {
  id: GrantApplicationSectionId;
  title: string;
  summary: string;
  guidance: string;
  prompt: string;
  fields: GrantApplicationField[];
};

export type ResultRow = {
  id: string;
  level: "Outcome" | "Output";
  statement: string;
  indicator: string;
  baseline: string;
  target: string;
  verification: string;
};

export type WorkplanRow = {
  id: string;
  activity: string;
  result: string;
  owner: string;
  start: string;
  end: string;
  milestone: string;
};

export type BudgetRow = {
  id: string;
  category: string;
  requestedAmount: number;
  cofinancingAmount: number;
  contributionType: "Cash" | "In-kind" | "Not applicable";
  status: "Planned" | "Confirmed";
  justification: string;
};

export type RiskRow = {
  id: string;
  risk: string;
  category: "Environmental" | "Social" | "Fiduciary" | "Delivery" | "Safety" | "Other";
  rating: "Low" | "Moderate" | "High";
  mitigation: string;
  owner: string;
};

export type DocumentChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  confirmed: boolean;
};

export type GrantApplicationIssue = {
  sectionId: GrantApplicationSectionId;
  fieldKey?: string;
  message: string;
};

const field = (
  key: string,
  label: string,
  type: GrantApplicationField["type"],
  options: Omit<GrantApplicationField, "key" | "label" | "type"> = {}
): GrantApplicationField => ({ key, label, type, ...options });

export const GRANT_APPLICATION_SECTIONS: GrantApplicationSection[] = [
  {
    id: "overview",
    title: "Application overview",
    summary: "Identify the funding window, project, location, focal areas, duration and requested amount.",
    guidance: "Confirm the country opportunity and use a concise working title that can remain stable through review and approval.",
    prompt: "What should a strong SGP grant application overview include?",
    fields: [
      field("proposalCode", "Application code", "text", { required: true }),
      field("fundingWindow", "Funding window", "text", { required: true }),
      field("country", "Country programme", "text", { required: true }),
      field("projectLocation", "Project location", "text", { required: true }),
      field("primaryFocalArea", "Primary focal area", "select", { required: true, options: ["Biodiversity", "Climate change", "Land degradation", "International waters", "Chemicals and waste", "Sustainable forest management", "Capacity development", "Urban systems"] }),
      field("secondaryThemes", "Secondary themes", "text", { help: "Separate multiple themes with commas." }),
      field("durationMonths", "Duration (months)", "number", { required: true }),
      field("requestedAmount", "Requested amount (USD)", "number", { required: true }),
      field("projectObjective", "Overall project objective", "textarea", { required: true, wide: true })
    ]
  },
  {
    id: "organization",
    title: "Organization and eligibility",
    summary: "Record the applicant organization, legal status, governance, contacts, mandate and delivery experience.",
    guidance: "Use verified organization information where available and document the basis for country-programme eligibility.",
    prompt: "Which records should be checked when confirming organization eligibility for an SGP grant?",
    fields: [
      field("organization", "Applicant organization", "text", { required: true }),
      field("legalStatus", "Legal status", "select", { required: true, options: ["Registered CSO", "Community-based organization", "Indigenous Peoples organization", "Non-profit NGO", "Other eligible entity"] }),
      field("registrationNumber", "Registration number", "text", { required: true }),
      field("registrationDate", "Registration date", "date"),
      field("primaryContact", "Primary contact", "text", { required: true }),
      field("contactEmail", "Contact email", "email", { required: true }),
      field("contactPhone", "Contact phone", "text"),
      field("organizationEligibility", "Eligibility assessment", "textarea", { required: true, wide: true }),
      field("governance", "Governance and financial controls", "textarea", { required: true, wide: true }),
      field("communityMandate", "Community mandate and participation", "textarea", { required: true, wide: true }),
      field("priorExperience", "Relevant delivery experience", "textarea", { required: true, wide: true })
    ]
  },
  {
    id: "rationale",
    title: "Project rationale and approach",
    summary: "Describe the environmental challenge, communities, proposed response, beneficiaries and implementation approach.",
    guidance: "Connect local evidence and community priorities to the selected focal area without including unnecessary personal data.",
    prompt: "Show me comparable SGP projects that address a similar environmental challenge through community action.",
    fields: [
      field("summary", "Project summary", "textarea", { required: true, wide: true }),
      field("problemStatement", "Environmental and community context", "textarea", { required: true, wide: true }),
      field("proposedApproach", "Proposed approach", "textarea", { required: true, wide: true }),
      field("beneficiaries", "Participants and beneficiaries", "textarea", { required: true, wide: true }),
      field("genderAndInclusion", "Gender equality and social inclusion", "textarea", { required: true, wide: true }),
      field("partnerships", "Partners and stakeholder roles", "textarea", { required: true, wide: true }),
      field("innovation", "Innovation and replication potential", "textarea", { wide: true })
    ]
  },
  {
    id: "results",
    title: "Results framework",
    summary: "Connect outcomes and outputs to indicators, baselines, targets and verification sources.",
    guidance: "Use measurable changes that can be monitored during the grant period and align each output to the project objective.",
    prompt: "Suggest practical indicators for this project without rewriting the application.",
    fields: [field("expectedOutcomes", "Results framework narrative", "textarea", { required: true, wide: true })]
  },
  {
    id: "workplan",
    title: "Workplan and delivery",
    summary: "Sequence activities, responsibilities, delivery periods, milestones and dependencies.",
    guidance: "Every activity should contribute to a result and have an accountable owner and realistic delivery period.",
    prompt: "What should I check when sequencing an SGP project workplan?",
    fields: [field("workplan", "Workplan assumptions and dependencies", "textarea", { required: true, wide: true })]
  },
  {
    id: "budget",
    title: "Budget and cofinancing",
    summary: "Build the budget by category and identify requested funds, cash contributions and in-kind contributions.",
    guidance: "Explain major cost drivers and identify the source and status of each cofinancing contribution.",
    prompt: "Explain the distinction between requested funds, cash cofinancing and in-kind cofinancing.",
    fields: [
      field("budgetNarrative", "Budget justification", "textarea", { required: true, wide: true }),
      field("cofinancingNarrative", "Cofinancing evidence and valuation", "textarea", { required: true, wide: true }),
      field("budgetEvidence", "Budget and cofinancing evidence complete", "checkbox", { required: true, wide: true })
    ]
  },
  {
    id: "safeguards",
    title: "Safeguards, risk and consent",
    summary: "Identify environmental, social, fiduciary and delivery risks with mitigation, ownership and escalation.",
    guidance: "Record consent and safeguard evidence without duplicating sensitive personal information in the narrative.",
    prompt: "Which safeguards and risk questions should be reviewed for this type of community project?",
    fields: [
      field("safeguards", "Safeguards screening and mitigation summary", "textarea", { required: true, wide: true }),
      field("consentProcess", "Community participation and consent process", "textarea", { required: true, wide: true }),
      field("grievanceMechanism", "Grievance and feedback mechanism", "textarea", { required: true, wide: true }),
      field("sensitiveLocationTreatment", "Sensitive location treatment", "select", { required: true, options: ["No sensitive location recorded", "Generalized for working records", "Controlled access required"] }),
      field("privacyReview", "Privacy and data-minimization review completed", "checkbox", { required: true, wide: true })
    ]
  },
  {
    id: "monitoring",
    title: "Monitoring, learning and sustainability",
    summary: "Define participatory monitoring, reflection, adaptation, knowledge sharing and continuation after the grant.",
    guidance: "Specify who will collect evidence, how often progress will be reviewed and how learning will improve delivery.",
    prompt: "Give examples of proportionate participatory monitoring and learning approaches for an SGP project.",
    fields: [
      field("monitoringPlan", "Monitoring and evidence plan", "textarea", { required: true, wide: true }),
      field("learningPlan", "Reflection and adaptive management", "textarea", { required: true, wide: true }),
      field("knowledgeSharing", "Knowledge products and sharing", "textarea", { required: true, wide: true }),
      field("sustainabilityPlan", "Sustainability and exit strategy", "textarea", { required: true, wide: true })
    ]
  },
  {
    id: "documents",
    title: "Supporting documents",
    summary: "Confirm the required evidence package and attach files to the correct application section.",
    guidance: "Store only the records needed for appraisal and apply the appropriate access classification to sensitive evidence.",
    prompt: "Which supporting documents are normally required before an SGP application can be submitted?",
    fields: [field("supportingDocuments", "Document package notes", "textarea", { required: true, wide: true })]
  },
  {
    id: "review",
    title: "Review and submit",
    summary: "Resolve validation issues, review the complete package, confirm authority and create a controlled submission snapshot.",
    guidance: "Submission preserves a versioned snapshot for TAG and NSC review. Later changes must begin as a controlled revision.",
    prompt: "Help me create a final quality checklist for this application.",
    fields: []
  }
];

export const DEFAULT_RESULT_ROWS: ResultRow[] = [
  { id: "result-1", level: "Outcome", statement: "Improved community stewardship of priority ecosystems", indicator: "Hectares under improved management", baseline: "0", target: "120", verification: "Participatory monitoring records" },
  { id: "result-2", level: "Output", statement: "Community restoration groups trained and active", indicator: "Groups applying agreed practices", baseline: "0", target: "8", verification: "Training and field evidence" }
];

export const DEFAULT_WORKPLAN_ROWS: WorkplanRow[] = [
  { id: "activity-1", activity: "Community mobilization and baseline", result: "Output 1", owner: "Project coordinator", start: "Month 1", end: "Month 3", milestone: "Baseline and participation plan approved" },
  { id: "activity-2", activity: "Restoration and livelihood activities", result: "Outcome 1", owner: "Community delivery teams", start: "Month 3", end: "Month 15", milestone: "Priority sites under active management" }
];

export const DEFAULT_BUDGET_ROWS: BudgetRow[] = [
  { id: "budget-1", category: "Community restoration activities", requestedAmount: 30000, cofinancingAmount: 8000, contributionType: "In-kind", status: "Confirmed", justification: "Materials, local delivery and contributed community labor" },
  { id: "budget-2", category: "Monitoring and learning", requestedAmount: 10000, cofinancingAmount: 3000, contributionType: "Cash", status: "Planned", justification: "Baseline, field monitoring and learning exchange" },
  { id: "budget-3", category: "Project coordination", requestedAmount: 8000, cofinancingAmount: 2000, contributionType: "In-kind", status: "Confirmed", justification: "Part-time coordination and partner technical support" }
];

export const DEFAULT_RISK_ROWS: RiskRow[] = [
  { id: "risk-1", risk: "Seasonal access limits delay field activities", category: "Delivery", rating: "Moderate", mitigation: "Sequence restoration around the seasonal access calendar and maintain alternate sites.", owner: "Project coordinator" },
  { id: "risk-2", risk: "Community participation is uneven", category: "Social", rating: "Moderate", mitigation: "Use representative planning groups, accessible meeting times and documented feedback channels.", owner: "Community engagement lead" }
];

export const DEFAULT_DOCUMENT_CHECKLIST: DocumentChecklistItem[] = [
  { id: "registration", label: "Organization registration or legal-status evidence", required: true, confirmed: true },
  { id: "governance", label: "Governance and authorized-signatory record", required: true, confirmed: true },
  { id: "budget", label: "Detailed budget and justification", required: true, confirmed: true },
  { id: "cofinancing", label: "Cofinancing confirmation or valuation evidence", required: true, confirmed: true },
  { id: "safeguards", label: "Safeguards and risk screening", required: true, confirmed: true },
  { id: "workplan", label: "Detailed workplan", required: true, confirmed: true },
  { id: "maps", label: "Non-sensitive map or location reference", required: false, confirmed: false }
];

export function parseStructuredRows<T>(value: WorkflowValue | undefined, fallback: T[]): T[] {
  if (typeof value !== "string" || !value.trim()) return fallback.map((item) => ({ ...item }));
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : fallback.map((item) => ({ ...item }));
  } catch {
    return fallback.map((item) => ({ ...item }));
  }
}

export function serializeStructuredRows(value: unknown[]) {
  return JSON.stringify(value);
}

function present(value: WorkflowValue | undefined) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0;
  return typeof value === "string" && value.trim().length > 0;
}

function structuredRowsComplete(sectionId: GrantApplicationSectionId, values: Record<string, WorkflowValue>) {
  if (sectionId === "results") {
    return parseStructuredRows(values.resultsRows, [] as ResultRow[]).some((row) => row.statement.trim() && row.indicator.trim() && row.target.trim());
  }
  if (sectionId === "workplan") {
    return parseStructuredRows(values.workplanRows, [] as WorkplanRow[]).some((row) => row.activity.trim() && row.owner.trim() && row.milestone.trim());
  }
  if (sectionId === "budget") {
    return parseStructuredRows(values.budgetRows, [] as BudgetRow[]).some((row) => row.category.trim() && row.requestedAmount > 0 && row.justification.trim());
  }
  if (sectionId === "safeguards") {
    return parseStructuredRows(values.riskRows, [] as RiskRow[]).some((row) => row.risk.trim() && row.mitigation.trim() && row.owner.trim());
  }
  if (sectionId === "documents") {
    const rows = parseStructuredRows(values.documentChecklist, [] as DocumentChecklistItem[]);
    return rows.length > 0 && rows.filter((row) => row.required).every((row) => row.confirmed);
  }
  return true;
}

export function validateGrantApplication(
  values: Record<string, WorkflowValue>,
  title: string,
  queueSummary: string
): GrantApplicationIssue[] {
  const issues: GrantApplicationIssue[] = [];
  if (!title.trim()) issues.push({ sectionId: "overview", message: "Enter the project title." });
  if (!queueSummary.trim()) issues.push({ sectionId: "overview", message: "Enter the application queue summary." });
  for (const section of GRANT_APPLICATION_SECTIONS) {
    for (const item of section.fields) {
      if (item.required && !present(values[item.key])) {
        issues.push({ sectionId: section.id, fieldKey: item.key, message: `${item.label} is required.` });
      }
      if (item.type === "email" && present(values[item.key]) && !/^\S+@\S+\.\S+$/.test(String(values[item.key]))) {
        issues.push({ sectionId: section.id, fieldKey: item.key, message: `${item.label} must be a valid email address.` });
      }
    }
    if (!structuredRowsComplete(section.id, values)) {
      const label = section.id === "documents" ? "Confirm every required supporting document." : `Complete at least one valid ${section.title.toLowerCase()} row.`;
      issues.push({ sectionId: section.id, message: label });
    }
  }
  const budgetRows = parseStructuredRows(values.budgetRows, [] as BudgetRow[]);
  const requestedTotal = budgetRows.reduce((total, row) => total + Math.max(0, Number(row.requestedAmount) || 0), 0);
  if (budgetRows.length && Number(values.requestedAmount || 0) !== requestedTotal) {
    issues.push({ sectionId: "budget", fieldKey: "budgetRows", message: "The detailed requested budget must equal the requested application amount." });
  }
  if (values.submissionAttested !== true) {
    issues.push({ sectionId: "review", fieldKey: "submissionAttested", message: "Confirm submission authority and application accuracy." });
  }
  return issues;
}

export function grantApplicationProgress(values: Record<string, WorkflowValue>, title: string, queueSummary: string) {
  const issues = validateGrantApplication(values, title, queueSummary);
  const incomplete = new Set(issues.map((issue) => issue.sectionId));
  const completeSections = GRANT_APPLICATION_SECTIONS.filter((section) => !incomplete.has(section.id)).length;
  return Math.round((completeSections / GRANT_APPLICATION_SECTIONS.length) * 100);
}

export function seedStructuredApplicationValues(values: Record<string, WorkflowValue>) {
  return {
    ...values,
    resultsRows: values.resultsRows || serializeStructuredRows(DEFAULT_RESULT_ROWS),
    workplanRows: values.workplanRows || serializeStructuredRows(DEFAULT_WORKPLAN_ROWS),
    budgetRows: values.budgetRows || serializeStructuredRows(DEFAULT_BUDGET_ROWS),
    riskRows: values.riskRows || serializeStructuredRows(DEFAULT_RISK_ROWS),
    documentChecklist: values.documentChecklist || serializeStructuredRows(DEFAULT_DOCUMENT_CHECKLIST)
  };
}
