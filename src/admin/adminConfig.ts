import type { PrivilegedRole } from "../auth/roles";

export type AdminKind = "fao" | "ci" | "undp" | "platform" | "it-frontend" | "it-backend" | "super";

export type AdminRow = {
  name: string;
  status: string;
  action: string;
};

export type AdminSection = {
  id: string;
  label: string;
  description: string;
  rows: AdminRow[];
};

export type AdminOverviewPanel = {
  title: string;
  body: string;
  section: string;
  action: string;
};

export type AdminConfig = {
  kind: AdminKind;
  role: PrivilegedRole;
  basePath: string;
  label: string;
  eyebrow: string;
  description: string;
  primaryAction: string;
  boundaryTitle: string;
  boundaryBody: string;
  metrics: Array<{ label: string; value: string }>;
  overviewPanels: AdminOverviewPanel[];
  sections: AdminSection[];
};

const agencySections: AdminSection[] = [
  { id: "overview", label: "Overview", description: "Monitor attention items, recent changes, refreshes, service health and administrative activity.", rows: [] },
  { id: "documents", label: "Document Management", description: "Curate documents, metadata, taxonomy, rights, publication state, translations and AI eligibility.", rows: [
    { name: "Documents awaiting review", status: "12 items", action: "Review" },
    { name: "Metadata requiring correction", status: "7 items", action: "Resolve" },
    { name: "AI corpus eligibility", status: "4 decisions", action: "Assess" },
    { name: "Translations and versions", status: "9 updates", action: "Manage" }
  ] },
  { id: "data", label: "Data Management", description: "Validate portfolio records, refreshes, source coverage, duplicate resolution, geography and exports.", rows: [
    { name: "Portfolio refresh", status: "Completed 2 hours ago", action: "Inspect" },
    { name: "Missing or inconsistent fields", status: "38 records", action: "Validate" },
    { name: "Potential duplicate projects", status: "11 groups", action: "Reconcile" },
    { name: "Sensitive geographic precision", status: "6 records", action: "Review" }
  ] },
  { id: "site-content", label: "Site Content", description: "Manage homepage features, events, static pages, help content, stories, navigation and alerts.", rows: [
    { name: "Scheduled homepage feature", status: "Publishes tomorrow", action: "Review" },
    { name: "Events awaiting approval", status: "3 records", action: "Edit" },
    { name: "Stories and Voices metadata", status: "8 changes", action: "Manage" },
    { name: "Navigation and alerts", status: "No active alert", action: "Configure" }
  ] },
  { id: "ai", label: "AI Management", description: "Inspect corpus coverage, indexing, retrieval, citations, prompts, evaluations, feedback and failures.", rows: [
    { name: "Corpus coverage", status: "92% of eligible records", action: "Inspect" },
    { name: "Recently indexed", status: "184 documents", action: "Review" },
    { name: "Flagged answers", status: "3 open", action: "Evaluate" },
    { name: "Retrieval test suite", status: "96.4% passing", action: "Run tests" }
  ] },
  { id: "integrations", label: "API Access & Integrations", description: "Manage technical access, API documentation, credentials, datasets, synchronization and errors.", rows: [] },
  { id: "users", label: "User Management", description: "Manage invitations, roles, access scope, specialist permissions, API access and audit history.", rows: [
    { name: "Pending invitations", status: "5 users", action: "Review" },
    { name: "Role changes requested", status: "2 requests", action: "Approve" },
    { name: "API permissions", status: "7 active keys", action: "Manage" },
    { name: "Recent administrative activity", status: "42 events", action: "Audit" }
  ] }
];

function createAgencyConfig(kind: "fao" | "ci" | "undp"): AdminConfig {
  const undp = kind === "undp";
  const fao = kind === "fao";
  const basePath = undp ? "/admin/undp" : "/admin";
  const agencyName = fao ? "FAO" : "Conservation International";
  return {
    kind,
    role: undp ? "undp-admin" : fao ? "fao-admin" : "ci-admin",
    basePath,
    label: undp ? "UNDP Admin" : `${agencyName} Admin`,
    eyebrow: undp ? "UNDP ADMIN" : `${agencyName} Admin`,
    description: undp
      ? "UNDP-scoped administration for programme content, data, AI, integrations and access."
      : `${agencyName}-scoped administration for governed content, data, AI, integrations and access.`,
    primaryAction: "Create or import",
    boundaryTitle: "Governed administrative action",
    boundaryBody: "This preview does not change production records. Each action requires scoped permissions, audit history and a connected service.",
    metrics: [
      { label: "Items requiring attention", value: "18" },
      { label: "Data refresh", value: "Current" },
      { label: "AI service", value: "Online" },
      { label: "Integration errors", value: "2" }
    ],
    overviewPanels: [
      { title: "Attention queue", body: "12 document reviews, 4 corpus decisions and 2 integration errors.", section: "documents", action: "Open queue" },
      { title: "Recent changes", body: "Portfolio refresh completed and 184 documents were re-indexed.", section: "users", action: "View activity" },
      { title: "Service status", body: "Data, AI and content services are available. One agency sync is delayed.", section: "integrations", action: "Inspect services" }
    ],
    sections: agencySections
  };
}

const platformConfig: AdminConfig = {
  kind: "platform",
  role: "platform-admin",
  basePath: "/platform-admin",
  label: "Platform Admin",
  eyebrow: "PLATFORM ADMIN",
  description: "Cross-agency programme oversight for authorized GEF and SGP leadership and operating teams.",
  primaryAction: "Open controls",
  boundaryTitle: "Cross-agency governance preview",
  boundaryBody: "Programme-wide decisions require explicit authority and audit. This role does not inherit agency editing, infrastructure or emergency-access permissions.",
  metrics: [
    { label: "Agencies reporting", value: "12 / 14" },
    { label: "Items requiring attention", value: "18" },
    { label: "Services available", value: "All core" },
    { label: "Access reviews due", value: "9" }
  ],
  overviewPanels: [
    { title: "Leadership attention", body: "Three overdue data refreshes, two publication exceptions and one governance decision.", section: "governance", action: "Review decisions" },
    { title: "Agency participation", body: "Twelve agencies are connected; two onboarding plans remain active.", section: "agencies", action: "Compare agencies" },
    { title: "Programme performance", body: "Portfolio, knowledge and AI adoption briefing is ready for review.", section: "reports", action: "Open briefing" }
  ],
  sections: [
    { id: "overview", label: "Overview", description: "Monitor cross-agency attention, risk, service status, recent decisions and operating activity.", rows: [] },
    { id: "agencies", label: "Agency Oversight", description: "Compare agency participation, compliance, data contribution, review performance and integration health.", rows: [
      { name: "Agency reporting coverage", status: "12 of 14 current", action: "Compare" },
      { name: "Onboarding plans", status: "2 active", action: "Review" },
      { name: "Policy attestations", status: "96% current", action: "Inspect" },
      { name: "Agency integration health", status: "2 need attention", action: "Open" }
    ] },
    { id: "portfolio", label: "Programme & Portfolio", description: "Monitor portfolio coverage, refreshes, data quality, duplicates and sensitive geography across agencies.", rows: [
      { name: "Projects represented", status: "30,906 baseline", action: "Explore" },
      { name: "Country coverage", status: "136 represented", action: "Compare" },
      { name: "Material data exceptions", status: "142 records", action: "Review" },
      { name: "Cross-agency duplicates", status: "24 groups", action: "Reconcile" }
    ] },
    { id: "knowledge", label: "Knowledge & Content", description: "Oversee publishing, rights, translations, corrections, withdrawals and AI eligibility across agencies.", rows: [
      { name: "Resources awaiting publication", status: "73 items", action: "Review" },
      { name: "Rights or consent exceptions", status: "14 open", action: "Assess" },
      { name: "Translation coverage gaps", status: "118 resources", action: "Prioritize" },
      { name: "Corpus eligibility conflicts", status: "9 records", action: "Resolve" }
    ] },
    { id: "ai", label: "AI Oversight", description: "Review corpus coverage, evaluations, flagged answers, safety checks and usage by agency.", rows: [
      { name: "Evaluation pass rate", status: "94%", action: "Inspect" },
      { name: "Flagged answers", status: "11 open", action: "Review" },
      { name: "Corpus coverage", status: "87% of eligible", action: "Compare" },
      { name: "Agency usage anomalies", status: "2 signals", action: "Investigate" }
    ] },
    { id: "integrations", label: "API & Integrations", description: "Monitor agency connections, permissions, synchronization, rate limits, failures and compatibility.", rows: [
      { name: "Active integrations", status: "19 connections", action: "Inspect" },
      { name: "Synchronization success", status: "98.7%", action: "Compare" },
      { name: "Open integration failures", status: "6 errors", action: "Review" },
      { name: "Schema compatibility", status: "2 upgrades due", action: "Plan" }
    ] },
    { id: "users", label: "Users & Access", description: "Review cross-agency roles, approvals, temporary grants, dormant accounts and access certification.", rows: [
      { name: "Privileged accounts", status: "46 active", action: "Review" },
      { name: "Access reviews due", status: "9 assignments", action: "Certify" },
      { name: "Temporary grants", status: "3 active", action: "Inspect" },
      { name: "Dormant accounts", status: "17 candidates", action: "Resolve" }
    ] },
    { id: "governance", label: "Governance & Audit", description: "Track policies, clearances, exceptions, risks, control evidence and auditable programme decisions.", rows: [
      { name: "Open policy exceptions", status: "14 decisions", action: "Review" },
      { name: "Policies current", status: "21 of 22", action: "Update" },
      { name: "Audit actions", status: "7 open", action: "Assign" },
      { name: "Publication clearances", status: "18 pending", action: "Inspect" }
    ] },
    { id: "reports", label: "Performance & Reports", description: "Prepare leadership KPIs, adoption reports, programme performance and exportable briefings.", rows: [
      { name: "Monthly active users", status: "6,240", action: "Analyze" },
      { name: "Knowledge reuse", status: "18% increase", action: "Explore" },
      { name: "Scheduled briefings", status: "4 ready", action: "Open" },
      { name: "Agency scorecards", status: "12 updated", action: "Compare" }
    ] }
  ]
};

const itFrontendConfig: AdminConfig = {
  kind: "it-frontend",
  role: "it-frontend",
  basePath: "/it-admin/frontend",
  label: "IT Frontend",
  eyebrow: "L8 · IT FRONTEND",
  description: "Frontend delivery, site health and sanitized diagnostics without protected content access.",
  primaryAction: "Open diagnostics",
  boundaryTitle: "Data-minimized frontend operations",
  boundaryBody: "Telemetry excludes credentials, personal data, source document text, AI prompts and response payloads. Production actions require environment-scoped authority and audit.",
  metrics: [
    { label: "Core services", value: "12 / 12" },
    { label: "Availability", value: "99.96%" },
    { label: "Active incidents", value: "1" },
    { label: "Jobs running", value: "7" }
  ],
  overviewPanels: [
    { title: "Experience health", body: "All public surfaces are available. One downstream dependency is degraded.", section: "health", action: "Open experience map" },
    { title: "Current incident", body: "A low-severity browser issue is assigned and contained.", section: "incidents", action: "View incident" },
    { title: "Release readiness", body: "Production v1.8.2 is healthy and the previous release remains rollback-ready.", section: "environments", action: "Inspect releases" }
  ],
  sections: [
    { id: "overview", label: "Overview", description: "Monitor frontend service status, incidents, releases, queued work and operational priorities from one place.", rows: [] },
    { id: "health", label: "Service Health", description: "Monitor web availability, UX performance, browser errors, dependency health and regional availability.", rows: [
      { name: "Public web application", status: "Healthy · 99.99%", action: "Inspect" },
      { name: "Workspace interface", status: "Healthy · 410 ms p95", action: "Trace" },
      { name: "Static media delivery", status: "Healthy · 0.2% errors", action: "Inspect" },
      { name: "Downstream dependencies", status: "1 degraded", action: "Review" }
    ] },
    { id: "environments", label: "Environments & Releases", description: "Review environment status, release history, deployment gates, approvals and rollback readiness.", rows: [
      { name: "Production", status: "v1.8.2 · Healthy", action: "Inspect" },
      { name: "Staging", status: "v1.9.0-rc2 · Testing", action: "Review" },
      { name: "Pending release gates", status: "2 checks", action: "Open" },
      { name: "Rollback checkpoint", status: "Ready", action: "Verify" }
    ] },
    { id: "incidents", label: "Incidents", description: "Coordinate severity, ownership, affected services, timelines, communications and post-incident review.", rows: [
      { name: "INC-204 Indexing delay", status: "SEV-3 · Contained", action: "Open" },
      { name: "Incident communications", status: "Updated 14 min ago", action: "Review" },
      { name: "Corrective actions", status: "3 assigned", action: "Track" },
      { name: "Postmortems due", status: "1 this week", action: "Prepare" }
    ] },
    { id: "jobs", label: "Jobs & Pipelines", description: "Monitor frontend builds, static-data synchronization, media publishing, failures and rollback checkpoints.", rows: [
      { name: "Application builds", status: "3 running", action: "Inspect" },
      { name: "Static-data synchronization", status: "Queue 184", action: "Monitor" },
      { name: "Media publishing", status: "2 running", action: "Inspect" },
      { name: "Retryable build failures", status: "3 jobs", action: "Retry" }
    ] },
    { id: "integrations", label: "Integrations & APIs", description: "Inspect endpoint contracts, CORS, identity handoff and health without response-body access.", rows: [
      { name: "API gateway", status: "Healthy · 61% capacity", action: "Inspect" },
      { name: "Identity provider", status: "Healthy", action: "Trace" },
      { name: "Agency webhooks", status: "2 delayed", action: "Review" },
      { name: "Authentication failures", status: "17 today", action: "Investigate" }
    ] },
    { id: "logs", label: "Logs & Diagnostics", description: "Correlate sanitized browser errors, traces, request identifiers and performance evidence.", rows: [
      { name: "Sanitized browser events", status: "182K per hour", action: "Search" },
      { name: "Trace coverage", status: "91%", action: "Inspect" },
      { name: "Open alerts", status: "8 signals", action: "Review" },
      { name: "Retention policy", status: "Current", action: "Verify" }
    ] },
    { id: "security", label: "Security & Resilience", description: "Track dependencies, CSP, browser supply-chain risk, delivery resilience and static rollback readiness.", rows: [
      { name: "Critical frontend findings", status: "0 open", action: "Inspect" },
      { name: "CSP and security headers", status: "Current", action: "Verify" },
      { name: "Fallback delivery test", status: "Passed 8 days ago", action: "Review" },
      { name: "Dependency updates", status: "2 due in 30 days", action: "Plan" }
    ] }
  ]
};

const itBackendConfig: AdminConfig = {
  kind: "it-backend",
  role: "it-backend",
  basePath: "/it-admin/backend",
  label: "IT Backend",
  eyebrow: "L9 · IT BACKEND",
  description: "Purpose-bound backend operations for protected data, identity, AI, pipelines and audit.",
  primaryAction: "Request diagnostic access",
  boundaryTitle: "Purpose-bound protected-data operations",
  boundaryBody: "Backend access requires an approved task, named operator, minimum environment and dataset scope, automatic expiry and immutable query-level audit. Routine browsing of user or programme content is prohibited.",
  metrics: [
    { label: "Backend services", value: "12 / 12" },
    { label: "Protected assets", value: "1.8M" },
    { label: "JIT sessions active", value: "2" },
    { label: "Access reviews due", value: "4" }
  ],
  overviewPanels: [
    { title: "Protected service map", body: "Application, data, search, AI and document services are healthy.", section: "health", action: "Open service map" },
    { title: "Access review", body: "Four purpose-bound assignments require certification or expiry.", section: "access", action: "Review access" },
    { title: "Pipeline attention", body: "Three retryable jobs and one schema exception require action.", section: "pipelines", action: "Inspect pipelines" }
  ],
  sections: [
    { id: "overview", label: "Overview", description: "Monitor protected services, access reviews, pipeline health, operational risk and immediate priorities from one place.", rows: [] },
    { id: "health", label: "Service & Data Health", description: "Monitor protected services, databases, storage, search, AI dependencies and operational signals.", rows: [
      { name: "Application services", status: "Healthy · 99.98%", action: "Inspect" },
      { name: "Databases and object storage", status: "Healthy", action: "Inspect" },
      { name: "Search and vector indexes", status: "Healthy · 430 ms p95", action: "Trace" },
      { name: "AI and document services", status: "1 degraded dependency", action: "Review" }
    ] },
    { id: "documents", label: "Data Stores & Documents", description: "Operate protected document objects, extracted text, metadata, indexes, retention and recovery.", rows: [
      { name: "Document object store", status: "1.8M assets", action: "Inspect" },
      { name: "Extracted text and metadata", status: "Current", action: "Validate" },
      { name: "Search and vector indexes", status: "2 refreshes running", action: "Monitor" },
      { name: "Retention and deletion queue", status: "14 governed actions", action: "Review" }
    ] },
    { id: "users", label: "Identity & User Data", description: "Administer identity, user records and authentication evidence under an approved operational purpose.", rows: [
      { name: "Active user sessions", status: "8.4K", action: "Inspect" },
      { name: "Authentication risk signals", status: "6 open", action: "Review" },
      { name: "Data-subject requests", status: "2 in progress", action: "Track" },
      { name: "Identity access review", status: "Due this week", action: "Certify" }
    ] },
    { id: "ai-audit", label: "AI Queries & Audit", description: "Audit prompts, retrieval, citations, safety signals and protected AI usage under explicit authorization.", rows: [
      { name: "AI requests", status: "1.2K per hour", action: "Monitor" },
      { name: "Flagged queries", status: "9 open", action: "Review" },
      { name: "Retrieval and citation evidence", status: "98% captured", action: "Inspect" },
      { name: "Purpose-bound query audit", status: "Verified", action: "Audit" }
    ] },
    { id: "pipelines", label: "Pipelines & Integrations", description: "Operate imports, document processing, indexing, APIs and participating-agency connections.", rows: [
      { name: "Agency data imports", status: "3 running", action: "Inspect" },
      { name: "Intranet document pipeline", status: "Queue 184", action: "Monitor" },
      { name: "Search and AI indexing", status: "2 running", action: "Inspect" },
      { name: "Retry and dead-letter queues", status: "3 jobs", action: "Retry" }
    ] },
    { id: "security", label: "Security & Secrets", description: "Operate secrets, encryption, privileged service identities and tightly restricted diagnostics.", rows: [
      { name: "Managed secrets", status: "42", action: "Inspect" },
      { name: "Rotation coverage", status: "98% current", action: "Review" },
      { name: "Encryption controls", status: "Verified", action: "Audit" },
      { name: "Privileged service identities", status: "7 active", action: "Certify" }
    ] },
    { id: "access", label: "Access Review & Diagnostics", description: "Review JIT sessions, purpose-bound access, break-glass activity and immutable operator evidence.", rows: [
      { name: "Pending access reviews", status: "4 assignments", action: "Review" },
      { name: "JIT sessions", status: "2 active", action: "Inspect" },
      { name: "Break-glass grants", status: "0 active", action: "Verify" },
      { name: "Operator query audit", status: "Current", action: "Audit" }
    ] }
  ]
};

const superConfig: AdminConfig = {
  kind: "super",
  role: "super-admin",
  basePath: "/super-admin",
  label: "Super Admin",
  eyebrow: "SUPER ADMIN",
  description: "Rare, controlled administration for identity, access policy, global configuration and emergency actions.",
  primaryAction: "Request change",
  boundaryTitle: "Privileged control-plane action",
  boundaryBody: "High-risk actions require a named account, MFA, independent approval, short expiry, immutable audit and post-access review.",
  metrics: [
    { label: "Privileged accounts", value: "14" },
    { label: "High-risk changes", value: "2" },
    { label: "Emergency grants", value: "0" },
    { label: "Control posture", value: "Verified" }
  ],
  overviewPanels: [
    { title: "Immediate attention", body: "Two high-risk changes and one privileged access review require approval.", section: "audit", action: "Review controls" },
    { title: "Identity posture", body: "All privileged accounts have MFA; three temporary assignments expire this week.", section: "identity", action: "Inspect identities" },
    { title: "Global configuration", body: "No configuration drift detected. Two feature rollouts remain active.", section: "features", action: "View rollouts" }
  ],
  sections: [
    { id: "overview", label: "Overview", description: "Surface high-risk changes, privileged accounts, expiring credentials, emergency grants and control posture.", rows: [] },
    { id: "identity", label: "Identity & Roles", description: "Manage privileged identities, role definitions, invitations, deactivation and assignment review.", rows: [
      { name: "Privileged identities", status: "14 active", action: "Review" },
      { name: "Temporary assignments", status: "3 expiring", action: "Inspect" },
      { name: "Pending invitations", status: "2 users", action: "Approve" },
      { name: "Dormant privileged accounts", status: "0 found", action: "Verify" }
    ] },
    { id: "policies", label: "Access Policies", description: "Define agency, country, specialist and environment scopes plus authentication and approval rules.", rows: [
      { name: "Active access policies", status: "34 policies", action: "Review" },
      { name: "Policy exceptions", status: "5 active", action: "Assess" },
      { name: "MFA and session controls", status: "Enforced", action: "Verify" },
      { name: "Approval chains", status: "2 updates pending", action: "Review" }
    ] },
    { id: "configuration", label: "Global Configuration", description: "Control tenant boundaries, platform-wide defaults, reserved settings, impact preview and rollback.", rows: [
      { name: "Global settings", status: "48 managed", action: "Inspect" },
      { name: "Pending configuration changes", status: "3 requests", action: "Approve" },
      { name: "Configuration drift", status: "None detected", action: "Verify" },
      { name: "Rollback versions", status: "4 retained", action: "Review" }
    ] },
    { id: "features", label: "Environments & Features", description: "Manage feature flags, maintenance modes, rollout gates, kill switches and controlled activation.", rows: [
      { name: "Feature flags", status: "27 managed", action: "Inspect" },
      { name: "Active rollouts", status: "2 progressive", action: "Review" },
      { name: "Maintenance mode", status: "Off", action: "Configure" },
      { name: "Emergency kill switches", status: "Ready", action: "Verify" }
    ] },
    { id: "audit", label: "Audit & Emergency Access", description: "Review immutable audit and grant, expire or revoke tightly controlled break-glass access.", rows: [
      { name: "Audit integrity", status: "Verified", action: "Inspect" },
      { name: "Break-glass grants", status: "0 active", action: "Review" },
      { name: "Post-access reviews", status: "1 pending", action: "Complete" },
      { name: "High-risk changes", status: "2 awaiting approval", action: "Assess" }
    ] }
  ]
};

export const ADMIN_CONFIGS: AdminConfig[] = [
  createAgencyConfig("undp"),
  createAgencyConfig("fao"),
  createAgencyConfig("ci"),
  platformConfig,
  itFrontendConfig,
  itBackendConfig,
  superConfig
];

export function adminConfigForRole(role: PrivilegedRole) {
  return ADMIN_CONFIGS.find((config) => config.role === role) || null;
}

export function resolveAdminRoute(path: string, role?: PrivilegedRole) {
  const matchingConfigs = ADMIN_CONFIGS.filter(({ basePath }) => path === basePath || path.startsWith(`${basePath}/`));
  const config = matchingConfigs.find((candidate) => candidate.role === role) || matchingConfigs[0];
  if (!config) return null;
  const sectionId = path.slice(config.basePath.length).replace(/^\//, "") || config.sections[0].id;
  const section = config.sections.find((item) => item.id === sectionId) || null;
  return { config, section };
}

export function adminSectionHref(config: AdminConfig, sectionId: string) {
  return sectionId === "overview" ? config.basePath : `${config.basePath}/${sectionId}`;
}
