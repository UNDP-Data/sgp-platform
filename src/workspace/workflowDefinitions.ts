export const WORKFLOW_SECTIONS = [
  "intake", "proposals", "reviews", "decisions", "grants", "monitoring", "results", "amr",
  "knowledge", "analytics", "programmes", "corrections", "agreements", "finance", "safeguards", "data-exchange"
] as const;

export type WorkflowSection = (typeof WORKFLOW_SECTIONS)[number];
export type OperationalRole =
  | "programme-assistant"
  | "reviewer"
  | "nsc"
  | "national-coordinator"
  | "cpmt"
  | "agency-programme";
export type WorkflowValue = string | number | boolean;
export type WorkflowFieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox";

export type WorkflowFieldDefinition = {
  key: string;
  label: string;
  type: WorkflowFieldType;
  required?: boolean;
  help?: string;
  options?: string[];
  min?: number;
  max?: number;
};

export type WorkflowDefinition = {
  section: WorkflowSection;
  singular: string;
  plural: string;
  intro: string;
  stages: string[];
  roles: OperationalRole[];
  fields: WorkflowFieldDefinition[];
};

export type WorkflowPermission = {
  createRoles: OperationalRole[];
  stageOwners: OperationalRole[][];
};

const field = (
  key: string,
  label: string,
  type: WorkflowFieldType,
  options: Partial<Omit<WorkflowFieldDefinition, "key" | "label" | "type">> = {}
): WorkflowFieldDefinition => ({ key, label, type, ...options });

export const WORKFLOW_DEFINITIONS: Record<WorkflowSection, WorkflowDefinition> = {
  intake: {
    section: "intake", singular: "intake record", plural: "Intake", roles: ["programme-assistant", "national-coordinator"],
    intro: "Record the source channel, proponent organization, proposal context and initial completeness decision.",
    stages: ["Received", "Organization matched", "Validated", "Accepted to country process"],
    fields: [
      field("sourceChannel", "Source channel", "select", { required: true, options: ["Country email", "Country office", "National Coordinator", "Agency referral", "Other"] }),
      field("organization", "Proponent organization", "text", { required: true }),
      field("country", "Country programme", "text", { required: true }),
      field("theme", "Primary focal area", "select", { required: true, options: ["Biodiversity", "Climate change", "Land degradation", "International waters", "Chemicals and waste", "Sustainable forest management", "Capacity development", "Urban systems"] }),
      field("completeness", "Completeness notes", "textarea", { required: true })
    ]
  },
  proposals: {
    section: "proposals", singular: "grant application", plural: "Grant Applications", roles: ["programme-assistant", "national-coordinator", "reviewer", "nsc", "cpmt"],
    intro: "Create and validate the complete country grant application, its supporting documents and a controlled submission version.",
    stages: ["Draft", "Complete", "In review", "Decision package"],
    fields: [
      field("proposalCode", "Application code", "text", { required: true }),
      field("organization", "Applicant organization", "text", { required: true }),
      field("organizationEligibility", "Organization eligibility and registration", "textarea", { required: true, help: "Record the legal status, community mandate and country eligibility evidence." }),
      field("primaryContact", "Primary organization contact", "text", { required: true }),
      field("requestedAmount", "Requested amount (USD)", "number", { required: true, min: 0 }),
      field("summary", "Project rationale and summary", "textarea", { required: true }),
      field("expectedOutcomes", "Expected outcomes and indicators", "textarea", { required: true }),
      field("workplan", "Workplan and delivery milestones", "textarea", { required: true }),
      field("budgetNarrative", "Budget and cofinancing justification", "textarea", { required: true }),
      field("safeguards", "Safeguards, consent and risk screening", "textarea", { required: true }),
      field("supportingDocuments", "Supporting document checklist", "textarea", { required: true, help: "List governance, budget, cofinancing, safeguards and other required files." }),
      field("budgetEvidence", "Budget and cofinancing evidence complete", "checkbox", { required: true }),
      field("submissionAttested", "Application accuracy and submission authority confirmed", "checkbox", { required: true })
    ]
  },
  reviews: {
    section: "reviews", singular: "application review", plural: "Application Review", roles: ["reviewer", "national-coordinator", "nsc", "cpmt"],
    intro: "Declare conflicts, assess immutable application evidence and submit an independent, traceable recommendation.",
    stages: ["Assigned", "Conflict cleared", "Evidence assessed", "Recommendation locked"],
    fields: [
      field("reviewType", "Review type", "select", { required: true, options: ["Eligibility", "Technical", "Safeguards", "Financial", "Combined"] }),
      field("conflictStatus", "Conflict declaration", "select", { required: true, options: ["No conflict", "Potential conflict disclosed", "Recused"] }),
      field("criteriaScore", "Criteria score", "number", { required: true, min: 0, max: 100 }),
      field("evidenceAssessment", "Evidence assessment", "textarea", { required: true }),
      field("recommendation", "Recommendation", "select", { required: true, options: ["Recommend", "Recommend with conditions", "Request clarification", "Do not recommend"] })
    ]
  },
  decisions: {
    section: "decisions", singular: "decision package", plural: "Meetings and Decisions", roles: ["nsc", "national-coordinator"],
    intro: "Preserve meeting scope, conflicts, quorum, formal outcomes, conditions and minutes.",
    stages: ["Pack prepared", "Conflicts recorded", "NSC decision", "Outcome attested"],
    fields: [
      field("meetingDate", "Meeting date", "date", { required: true }),
      field("quorumConfirmed", "Quorum confirmed", "checkbox", { required: true }),
      field("conflictRecord", "Conflict record", "textarea", { required: true }),
      field("outcome", "Formal outcome", "select", { required: true, options: ["Approved", "Approved with conditions", "Deferred", "Not approved"] }),
      field("conditions", "Conditions and decision notes", "textarea", { required: true })
    ]
  },
  grants: {
    section: "grants", singular: "grant", plural: "Grants", roles: ["programme-assistant", "national-coordinator", "cpmt"],
    intro: "Create grants from approved decisions and track agreements, milestones, delivery and closure.",
    stages: ["Approved", "MoA signed", "Active", "Completed"],
    fields: [
      field("grantCode", "Grant code", "text", { required: true }),
      field("decisionReference", "Decision reference", "text", { required: true }),
      field("amount", "Approved amount (USD)", "number", { required: true, min: 0 }),
      field("startDate", "Start date", "date", { required: true }),
      field("milestone", "Current milestone", "textarea", { required: true })
    ]
  },
  monitoring: {
    section: "monitoring", singular: "monitoring record", plural: "Monitoring and Field Visits", roles: ["programme-assistant", "reviewer", "national-coordinator"],
    intro: "Plan visits, preserve source evidence and follow corrective actions without overwriting observations.",
    stages: ["Planned", "Evidence captured", "Follow-up assigned", "Closed"],
    fields: [
      field("visitDate", "Visit date", "date", { required: true }),
      field("participants", "Participants and roles", "textarea", { required: true }),
      field("observations", "Observations", "textarea", { required: true }),
      field("followUp", "Required follow-up", "textarea", { required: true }),
      field("evidenceConfirmed", "Source evidence attached", "checkbox", { required: true })
    ]
  },
  results: {
    section: "results", singular: "results record", plural: "Results", roles: ["programme-assistant", "national-coordinator", "cpmt"],
    intro: "Capture indicators, qualitative results and evidence with country validation and reporting status.",
    stages: ["Entered", "Evidence linked", "Country validated", "Reporting ready"],
    fields: [
      field("indicator", "Indicator", "text", { required: true }),
      field("reportedValue", "Reported value", "number", { required: true }),
      field("narrative", "Qualitative result", "textarea", { required: true }),
      field("evidenceReference", "Evidence reference", "text", { required: true }),
      field("countryValidated", "Country validation confirmed", "checkbox", { required: true })
    ]
  },
  amr: {
    section: "amr", singular: "AMR submission", plural: "Results and AMR", roles: ["nsc", "national-coordinator", "cpmt"],
    intro: "Aggregate selected project results while retaining traceability for adjustments and reporting snapshots.",
    stages: ["Projects selected", "Aggregated", "Country endorsed", "CPMT validated"],
    fields: [
      field("reportingYear", "Reporting year", "number", { required: true, min: 2000, max: 2100 }),
      field("projectCount", "Projects included", "number", { required: true, min: 1 }),
      field("aggregationNote", "Aggregation and adjustment note", "textarea", { required: true }),
      field("countryEndorsed", "Country endorsement recorded", "checkbox", { required: true }),
      field("validationNote", "CPMT validation note", "textarea")
    ]
  },
  knowledge: {
    section: "knowledge", singular: "knowledge record", plural: "Documents and Knowledge", roles: ["programme-assistant", "national-coordinator", "cpmt", "agency-programme"],
    intro: "Classify documents and make separate rights, publication, API exposure and AI eligibility decisions.",
    stages: ["Nominated", "Rights checked", "Publication decided", "AI/API decided"],
    fields: [
      field("documentTitle", "Document title", "text", { required: true }),
      field("classification", "Access classification", "select", { required: true, options: ["Public", "Internal", "Restricted", "Confidential"] }),
      field("rightsStatus", "Rights and consent status", "select", { required: true, options: ["Cleared", "Conditions recorded", "Review required", "Not cleared"] }),
      field("publicationStatus", "Publication decision", "select", { required: true, options: ["Not reviewed", "Approved for publication", "Internal only", "Withheld"] }),
      field("aiEligibility", "AI corpus decision", "select", { required: true, options: ["Not reviewed", "Eligible", "Excluded", "Conditional"] })
    ]
  },
  analytics: {
    section: "analytics", singular: "analytics view", plural: "Analytics and Exports", roles: ["nsc", "national-coordinator", "cpmt"],
    intro: "Save scoped analytical views and authorized export decisions without widening record access.",
    stages: ["Source current", "Quality checked", "Scope applied", "Export authorized"],
    fields: [
      field("viewName", "View name", "text", { required: true }),
      field("geography", "Geographic scope", "text", { required: true }),
      field("metric", "Metric set", "textarea", { required: true }),
      field("qualityNote", "Data quality note", "textarea", { required: true }),
      field("exportAuthorized", "Export authorization confirmed", "checkbox", { required: true })
    ]
  },
  programmes: {
    section: "programmes", singular: "programme record", plural: "Country and Agency Programmes", roles: ["cpmt", "agency-programme"],
    intro: "Monitor only country programmes and agency portfolios included in the active assignment.",
    stages: ["Source connected", "Quality checked", "Action assigned", "Current"],
    fields: [
      field("programmeName", "Programme", "text", { required: true }),
      field("assignmentScope", "Assignment scope", "textarea", { required: true }),
      field("healthStatus", "Programme health", "select", { required: true, options: ["On track", "Attention", "Material risk", "Paused"] }),
      field("dataFreshness", "Source data date", "date", { required: true }),
      field("supportNeed", "Support action", "textarea", { required: true })
    ]
  },
  corrections: {
    section: "corrections", singular: "correction request", plural: "Data Quality and Corrections", roles: ["cpmt"],
    intro: "Correct protected values while retaining the original value, evidence and downstream recalculation history.",
    stages: ["Requested", "Evidence verified", "Authorized", "Recalculated"],
    fields: [
      field("fieldName", "Field to correct", "text", { required: true }),
      field("originalValue", "Original value", "textarea", { required: true }),
      field("proposedValue", "Proposed value", "textarea", { required: true }),
      field("evidenceReference", "Evidence reference", "text", { required: true }),
      field("approvalNote", "Authorization note", "textarea", { required: true })
    ]
  },
  agreements: {
    section: "agreements", singular: "agreement record", plural: "Agreements and Assurance", roles: ["agency-programme"],
    intro: "Review approved proposal and agreement packages without changing the underlying NSC outcome.",
    stages: ["Decision verified", "Agreement checked", "Signed", "Activated"],
    fields: [
      field("agreementCode", "Agreement code", "text", { required: true }),
      field("decisionReference", "NSC decision reference", "text", { required: true }),
      field("signatureStatus", "Signature status", "select", { required: true, options: ["Draft", "Sent for signature", "Partially signed", "Fully signed"] }),
      field("assuranceNote", "Assurance review", "textarea", { required: true }),
      field("activationConfirmed", "Activation conditions met", "checkbox", { required: true })
    ]
  },
  finance: {
    section: "finance", singular: "finance exception", plural: "Finance and Reconciliation", roles: ["agency-programme"],
    intro: "Reconcile assigned grant, commitment and payment values while protecting unrelated programme data.",
    stages: ["Source matched", "Variance reviewed", "Resolved", "Reconciled"],
    fields: [
      field("grantCode", "Grant code", "text", { required: true }),
      field("commitmentAmount", "Commitment amount", "number", { required: true, min: 0 }),
      field("paidAmount", "Paid amount", "number", { required: true, min: 0 }),
      field("currency", "Currency", "select", { required: true, options: ["USD", "EUR", "GBP", "Local currency"] }),
      field("reconciliationNote", "Reconciliation evidence", "textarea", { required: true })
    ]
  },
  safeguards: {
    section: "safeguards", singular: "safeguards case", plural: "Safeguards and Risk", roles: ["agency-programme"],
    intro: "Review only safeguards, risk and incident evidence explicitly included in the assignment.",
    stages: ["Screened", "Condition assigned", "Evidence reviewed", "Closed"],
    fields: [
      field("riskType", "Risk type", "select", { required: true, options: ["Environmental", "Social", "Indigenous peoples", "Access and tenure", "Safety", "Other"] }),
      field("severity", "Severity", "select", { required: true, options: ["Low", "Moderate", "High", "Critical"] }),
      field("condition", "Required condition", "textarea", { required: true }),
      field("evidenceAssessment", "Evidence assessment", "textarea", { required: true }),
      field("closureConfirmed", "Closure criteria met", "checkbox", { required: true })
    ]
  },
  "data-exchange": {
    section: "data-exchange", singular: "data exchange record", plural: "Reporting and Data Exchange", roles: ["agency-programme"],
    intro: "Monitor authoritative-source synchronization, reporting handoffs and versioned exchange exceptions.",
    stages: ["Received", "Validated", "Reconciled", "Acknowledged"],
    fields: [
      field("sourceSystem", "Authoritative source", "text", { required: true }),
      field("sourceVersion", "Source version", "text", { required: true }),
      field("schemaStatus", "Schema validation", "select", { required: true, options: ["Valid", "Warnings", "Rejected"] }),
      field("exceptionDetail", "Exception or reconciliation detail", "textarea", { required: true }),
      field("acknowledged", "Receiving system acknowledged", "checkbox", { required: true })
    ]
  }
};

export const WORKFLOW_PERMISSIONS: Record<WorkflowSection, WorkflowPermission> = {
  intake: { createRoles: ["programme-assistant", "national-coordinator"], stageOwners: Array.from({ length: 4 }, () => ["programme-assistant", "national-coordinator"]) },
  proposals: {
    createRoles: ["programme-assistant", "national-coordinator"],
    stageOwners: [
      ["programme-assistant", "national-coordinator"],
      ["programme-assistant", "national-coordinator"],
      ["reviewer", "national-coordinator"],
      ["national-coordinator", "nsc"]
    ]
  },
  reviews: {
    createRoles: ["national-coordinator"],
    stageOwners: [
      ["reviewer", "national-coordinator"],
      ["reviewer"],
      ["reviewer"],
      ["reviewer"]
    ]
  },
  decisions: {
    createRoles: ["national-coordinator"],
    stageOwners: Array.from({ length: 4 }, () => ["nsc", "national-coordinator"])
  },
  grants: {
    createRoles: ["national-coordinator"],
    stageOwners: [
      ["programme-assistant", "national-coordinator"],
      ["programme-assistant", "national-coordinator"],
      ["programme-assistant", "national-coordinator"],
      ["national-coordinator"]
    ]
  },
  monitoring: {
    createRoles: ["programme-assistant", "national-coordinator"],
    stageOwners: [
      ["programme-assistant", "national-coordinator"],
      ["programme-assistant", "reviewer", "national-coordinator"],
      ["programme-assistant", "reviewer", "national-coordinator"],
      ["programme-assistant", "national-coordinator"]
    ]
  },
  results: {
    createRoles: ["programme-assistant", "national-coordinator"],
    stageOwners: [
      ["programme-assistant", "national-coordinator"],
      ["programme-assistant", "national-coordinator", "cpmt"],
      ["national-coordinator", "cpmt"],
      ["national-coordinator", "cpmt"]
    ]
  },
  amr: {
    createRoles: ["national-coordinator"],
    stageOwners: [["national-coordinator"], ["national-coordinator"], ["national-coordinator", "nsc"], ["cpmt"]]
  },
  knowledge: {
    createRoles: ["programme-assistant", "national-coordinator", "cpmt", "agency-programme"],
    stageOwners: Array.from({ length: 4 }, () => ["programme-assistant", "national-coordinator", "cpmt", "agency-programme"])
  },
  analytics: {
    createRoles: ["national-coordinator", "cpmt"],
    stageOwners: [
      ["national-coordinator"],
      ["national-coordinator", "cpmt"],
      ["national-coordinator", "cpmt", "nsc"],
      ["national-coordinator", "cpmt"]
    ]
  },
  programmes: { createRoles: ["cpmt", "agency-programme"], stageOwners: Array.from({ length: 4 }, () => ["cpmt", "agency-programme"]) },
  corrections: { createRoles: ["cpmt"], stageOwners: Array.from({ length: 4 }, () => ["cpmt"]) },
  agreements: { createRoles: ["agency-programme"], stageOwners: Array.from({ length: 4 }, () => ["agency-programme"]) },
  finance: { createRoles: ["agency-programme"], stageOwners: Array.from({ length: 4 }, () => ["agency-programme"]) },
  safeguards: { createRoles: ["agency-programme"], stageOwners: Array.from({ length: 4 }, () => ["agency-programme"]) },
  "data-exchange": { createRoles: ["agency-programme"], stageOwners: Array.from({ length: 4 }, () => ["agency-programme"]) }
};

export function canCreateWorkflowRecord(section: WorkflowSection, role: OperationalRole) {
  return WORKFLOW_PERMISSIONS[section].createRoles.includes(role);
}

export function canEditWorkflowRecord(section: WorkflowSection, stageIndex: number, role: OperationalRole) {
  return WORKFLOW_PERMISSIONS[section].stageOwners[stageIndex]?.includes(role) || false;
}

export type WorkflowSeed = {
  id: string;
  section: WorkflowSection;
  title: string;
  summary: string;
  stageIndex: number;
  values: Record<string, WorkflowValue>;
};

export const WORKFLOW_SEEDS: WorkflowSeed[] = [
  { id: "KEN-INT-001", section: "intake", title: "Coastal resilience proposal intake", summary: "Country email received; completeness review underway.", stageIndex: 1, values: { sourceChannel: "Country email", organization: "Coastal Community Network", country: "Kenya", theme: "Climate change", completeness: "Governance record received; budget narrative still requires confirmation." } },
  { id: "KEN-PRP-014", section: "proposals", title: "Community biodiversity corridors", summary: "Application version 3 is preparing for country review.", stageIndex: 1, values: {
    proposalCode: "SGP-KEN-2026-014", fundingWindow: "Kenya OP8 community action grants", country: "Kenya", projectLocation: "Kwale and Kilifi coastal landscapes", primaryFocalArea: "Biodiversity", secondaryThemes: "Climate change, sustainable livelihoods", durationMonths: 18, requestedAmount: 48000, projectObjective: "Restore priority coastal habitat while strengthening locally governed, climate-resilient livelihoods.",
    organization: "Coastal Community Network", legalStatus: "Registered CSO", registrationNumber: "KEN-CSO-2841", registrationDate: "2018-04-12", organizationEligibility: "Registered community organization with a current governance record and documented coastal community mandate.", primaryContact: "Programme focal point", contactEmail: "programme@coastalcommunity.example", contactPhone: "+254 700 000 000", governance: "The board approves annual plans and budgets; two signatories and quarterly reconciliation are required.", communityMandate: "Village committees identified the priority sites and nominated representatives for project governance.", priorExperience: "The organization has delivered three community conservation initiatives with county and civil-society partners.",
    summary: "Community-led restoration and livelihood activities across two coastal landscapes.", problemStatement: "Coastal habitat loss and livelihood pressure are reducing ecosystem services and community resilience.", proposedApproach: "Community groups will restore priority sites, strengthen sustainable enterprises and use participatory monitoring to adapt delivery.", beneficiaries: "Approximately 1,200 community members, with direct participation by restoration groups, women-led enterprises and youth monitors.", genderAndInclusion: "Representation targets, accessible meeting arrangements and sex-disaggregated participation records are included.", partnerships: "Community committees lead delivery with county technical services and local research support.", innovation: "The approach connects community restoration agreements to livelihood incentives and a locally managed evidence system.",
    expectedOutcomes: "Restore community-managed habitat, strengthen local livelihood resilience and report hectares under improved management.", resultsRows: "[{\"id\":\"result-1\",\"level\":\"Outcome\",\"statement\":\"Improved community stewardship of priority ecosystems\",\"indicator\":\"Hectares under improved management\",\"baseline\":\"0\",\"target\":\"120\",\"verification\":\"Participatory monitoring records\"},{\"id\":\"result-2\",\"level\":\"Output\",\"statement\":\"Community restoration groups trained and active\",\"indicator\":\"Groups applying agreed practices\",\"baseline\":\"0\",\"target\":\"8\",\"verification\":\"Training and field evidence\"}]",
    workplan: "Mobilization, baseline, restoration, livelihoods support, monitoring and closeout milestones over 18 months.", workplanRows: "[{\"id\":\"activity-1\",\"activity\":\"Community mobilization and baseline\",\"result\":\"Output 1\",\"owner\":\"Project coordinator\",\"start\":\"Month 1\",\"end\":\"Month 3\",\"milestone\":\"Baseline and participation plan approved\"},{\"id\":\"activity-2\",\"activity\":\"Restoration and livelihood activities\",\"result\":\"Outcome 1\",\"owner\":\"Community delivery teams\",\"start\":\"Month 3\",\"end\":\"Month 15\",\"milestone\":\"Priority sites under active management\"}]",
    budgetNarrative: "Requested funds cover restoration materials, community delivery and monitoring; cash and in-kind cofinancing are recorded separately.", cofinancingNarrative: "Community labor is valued using the approved country rate; county technical support and partner monitoring funds are documented separately.", budgetRows: "[{\"id\":\"budget-1\",\"category\":\"Community restoration activities\",\"requestedAmount\":30000,\"cofinancingAmount\":8000,\"contributionType\":\"In-kind\",\"status\":\"Confirmed\",\"justification\":\"Materials, local delivery and contributed community labor\"},{\"id\":\"budget-2\",\"category\":\"Monitoring and learning\",\"requestedAmount\":10000,\"cofinancingAmount\":3000,\"contributionType\":\"Cash\",\"status\":\"Planned\",\"justification\":\"Baseline, field monitoring and learning exchange\"},{\"id\":\"budget-3\",\"category\":\"Project coordination\",\"requestedAmount\":8000,\"cofinancingAmount\":2000,\"contributionType\":\"In-kind\",\"status\":\"Confirmed\",\"justification\":\"Part-time coordination and partner technical support\"}]", budgetEvidence: true,
    safeguards: "Access, consent and environmental screening completed; one site-access condition requires follow-up.", consentProcess: "Community assemblies and representative planning groups reviewed the proposed activities and documented consent conditions.", grievanceMechanism: "Feedback can be raised through named community focal points or directly with the country programme; cases are logged and tracked.", sensitiveLocationTreatment: "Generalized for working records", privacyReview: true, riskRows: "[{\"id\":\"risk-1\",\"risk\":\"Seasonal access limits delay field activities\",\"category\":\"Delivery\",\"rating\":\"Moderate\",\"mitigation\":\"Sequence restoration around the seasonal access calendar and maintain alternate sites.\",\"owner\":\"Project coordinator\"},{\"id\":\"risk-2\",\"risk\":\"Community participation is uneven\",\"category\":\"Social\",\"rating\":\"Moderate\",\"mitigation\":\"Use representative planning groups, accessible meeting times and documented feedback channels.\",\"owner\":\"Community engagement lead\"}]",
    monitoringPlan: "Community monitors will collect monthly activity evidence and quarterly outcome measures using agreed verification sources.", learningPlan: "Quarterly reflection meetings will review progress, risks and changes required to the workplan.", knowledgeSharing: "A community practice note and learning exchange will share non-sensitive results with neighboring groups.", sustainabilityPlan: "Community governance agreements, locally maintained monitoring and linked livelihood activities will continue beyond grant closure.",
    supportingDocuments: "Governance record; detailed budget; cofinancing evidence; safeguards screen; workplan; organization registration.", documentChecklist: "[{\"id\":\"registration\",\"label\":\"Organization registration or legal-status evidence\",\"required\":true,\"confirmed\":true},{\"id\":\"governance\",\"label\":\"Governance and authorized-signatory record\",\"required\":true,\"confirmed\":true},{\"id\":\"budget\",\"label\":\"Detailed budget and justification\",\"required\":true,\"confirmed\":true},{\"id\":\"cofinancing\",\"label\":\"Cofinancing confirmation or valuation evidence\",\"required\":true,\"confirmed\":true},{\"id\":\"safeguards\",\"label\":\"Safeguards and risk screening\",\"required\":true,\"confirmed\":true},{\"id\":\"workplan\",\"label\":\"Detailed workplan\",\"required\":true,\"confirmed\":true},{\"id\":\"maps\",\"label\":\"Non-sensitive map or location reference\",\"required\":false,\"confirmed\":false}]", submissionAttested: true
  } },
  { id: "KEN-REV-014", section: "reviews", title: "Technical and safeguards review", summary: "Assigned TAG review due this week.", stageIndex: 0, values: { reviewType: "Combined", conflictStatus: "No conflict", criteriaScore: 82, evidenceAssessment: "Eligibility evidence is complete; safeguards conditions require clarification.", recommendation: "Request clarification" } },
  { id: "KEN-DEC-2026-08", section: "decisions", title: "20 August NSC decision package", summary: "Five proposal outcomes require formal attestation.", stageIndex: 1, values: { meetingDate: "2026-08-20", quorumConfirmed: true, conflictRecord: "Two members recused from one agenda item; quorum remains valid.", outcome: "Approved with conditions", conditions: "Record the safeguards condition before agreement activation." } },
  { id: "KEN-GRT-014", section: "grants", title: "Community biodiversity corridors", summary: "Approved grant awaiting activation review.", stageIndex: 1, values: { grantCode: "SGP-KEN-GRT-014", decisionReference: "KEN-DEC-2026-08", amount: 48000, startDate: "2026-09-01", milestone: "Confirm signed MoA and first delivery milestone." } },
  { id: "KEN-MON-014", section: "monitoring", title: "Coastal livelihoods field visit", summary: "Visit planned with community and country programme participants.", stageIndex: 0, values: { visitDate: "2026-10-12", participants: "National Coordinator; Programme Assistant; community representatives", observations: "Baseline observations will be recorded during the visit.", followUp: "Confirm participant consent and travel plan.", evidenceConfirmed: false } },
  { id: "KEN-RES-014", section: "results", title: "Community biodiversity results", summary: "One indicator requires additional evidence.", stageIndex: 1, values: { indicator: "Hectares under improved community management", reportedValue: 120, narrative: "Community groups established monitoring arrangements and restoration plots.", evidenceReference: "Field monitoring package KEN-MON-014", countryValidated: false } },
  { id: "KEN-AMR-2026", section: "amr", title: "Kenya AMR 2026", summary: "Country aggregation has three validation issues.", stageIndex: 1, values: { reportingYear: 2026, projectCount: 46, aggregationNote: "Two late project records excluded from the current snapshot.", countryEndorsed: false, validationNote: "" } },
  { id: "KEN-KNW-014", section: "knowledge", title: "Community mangrove restoration guide", summary: "Rights evidence received; publication decision pending.", stageIndex: 1, values: { documentTitle: "Community mangrove restoration guide", classification: "Public", rightsStatus: "Cleared", publicationStatus: "Not reviewed", aiEligibility: "Not reviewed" } },
  { id: "KEN-ANL-001", section: "analytics", title: "Country programme coverage", summary: "Saved country view with two quality notices.", stageIndex: 1, values: { viewName: "Kenya country programme coverage", geography: "Kenya", metric: "Active grants; focal area; district coverage; evidence completeness", qualityNote: "Two records have missing district precision.", exportAuthorized: false } },
  { id: "ECA-PRG-001", section: "programmes", title: "Europe and Central Asia programme health", summary: "Regional assignment covers 19 country programmes.", stageIndex: 1, values: { programmeName: "Europe and Central Asia SGP portfolio", assignmentScope: "19 assigned country programmes; regional support and AMR quality", healthStatus: "Attention", dataFreshness: "2026-08-02", supportNeed: "Follow up six AMR submissions and fourteen quality exceptions." } },
  { id: "ECA-COR-014", section: "corrections", title: "Project status correction", summary: "Source evidence attached; authorization required.", stageIndex: 1, values: { fieldName: "project_status", originalValue: "Active", proposedValue: "Completed", evidenceReference: "Final report and country closure note", approvalNote: "Country confirmation received; verify reporting recalculation before authorization." } },
  { id: "UNDP-AGR-014", section: "agreements", title: "Kenya coastal MoA", summary: "Signed package received; assurance review open.", stageIndex: 1, values: { agreementCode: "UNDP-SGP-KEN-014", decisionReference: "KEN-DEC-2026-08", signatureStatus: "Fully signed", assuranceNote: "Signatories and approved amount match the decision package.", activationConfirmed: false } },
  { id: "UNDP-FIN-014", section: "finance", title: "Commitment-to-grant variance", summary: "USD 2,400 variance requires reconciliation.", stageIndex: 1, values: { grantCode: "SGP-KEN-GRT-014", commitmentAmount: 45600, paidAmount: 0, currency: "USD", reconciliationNote: "Commitment excludes the approved contingency line; agency confirmation requested." } },
  { id: "UNDP-SAF-014", section: "safeguards", title: "Coastal access condition", summary: "Follow-up evidence received for agency review.", stageIndex: 2, values: { riskType: "Access and tenure", severity: "Moderate", condition: "Document community access agreement before site work.", evidenceAssessment: "Signed community meeting record and mapped access agreement received.", closureConfirmed: false } },
  { id: "UNDP-EXC-001", section: "data-exchange", title: "UNDP agreement feed", summary: "Two records rejected by schema validation.", stageIndex: 1, values: { sourceSystem: "UNDP grant management source", sourceVersion: "2026-08-02T18:00Z", schemaStatus: "Warnings", exceptionDetail: "Two country codes require canonical ISO3 mapping before reconciliation.", acknowledged: false } }
];

export function workflowDefinition(section: string): WorkflowDefinition | null {
  return WORKFLOW_SECTIONS.includes(section as WorkflowSection)
    ? WORKFLOW_DEFINITIONS[section as WorkflowSection]
    : null;
}

export function emptyWorkflowValues(definition: WorkflowDefinition) {
  return Object.fromEntries(definition.fields.map((item) => [item.key, item.type === "checkbox" ? false : ""])) as Record<string, WorkflowValue>;
}

export function validateWorkflowValues(definition: WorkflowDefinition, values: Record<string, WorkflowValue>) {
  return definition.fields.flatMap((item) => {
    const value = values[item.key];
    if (!item.required) return [];
    if (item.type === "checkbox" && value !== true) return [`${item.label} must be confirmed.`];
    if (value === "" || value === null || value === undefined) return [`${item.label} is required.`];
    if (item.type === "number" && !Number.isFinite(Number(value))) return [`${item.label} must be a number.`];
    return [];
  });
}
