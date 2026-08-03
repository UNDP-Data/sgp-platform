import {
  ROLE_ACCESS_LEVELS, ROLE_ACCESS_SUMMARIES, isPrivilegedRole, type PrivilegedRole, type Role, type StandardRole
} from "../auth/roles";
import { adminConfigForRole, adminSectionHref } from "../admin/adminConfig";

export type WorkspaceNavItem = {
  id: string;
  label: string;
  href: string;
  group: "work" | "access" | "account";
  description: string;
};

export type WorkspaceAccessCard = {
  title: string;
  body: string;
  href: string;
  meta: string;
};

export type WorkspacePriority = {
  title: string;
  meta: string;
  href: string;
  status: string;
};

export type WorkspaceScope = {
  label: string;
  value: string;
};

export type WorkspaceConfig = {
  label: string;
  homeHref: string;
  intro: string;
  nav: WorkspaceNavItem[];
  scope: WorkspaceScope[];
  summary: Array<{ label: string; value: string }>;
  accessCards: WorkspaceAccessCard[];
  priorities: WorkspacePriority[];
};

const sharedNav: WorkspaceNavItem[] = [
  { id: "learning", label: "Learning", href: "/workspace/learning", group: "account", description: "Follow role-aware courses that explain how to prepare materials, use evidence and complete assigned workflows." },
  { id: "saved", label: "Saved and AI History", href: "/workspace/saved", group: "account", description: "Return to saved platform items and permitted Ask SGP conversations." },
  { id: "profile", label: "Profile", href: "/workspace/profile", group: "account", description: "Review identity, language, assignments, delegation and access expiry." }
];

type OperationalWorkspaceRole = StandardRole | "agency-programme";

const operationalNav: Record<OperationalWorkspaceRole, WorkspaceNavItem[]> = {
  "programme-assistant": [
    { id: "intake", label: "Intake", href: "/workspace/intake", group: "work", description: "Capture proposals received through the authorized country process." },
    { id: "proposals", label: "Proposals", href: "/workspace/proposals", group: "work", description: "Prepare proposal records, documents and completeness checks for NC review." },
    { id: "grants", label: "Grants", href: "/workspace/grants", group: "work", description: "Maintain delegated agreement, milestone and delivery records after approval." },
    { id: "monitoring", label: "Monitoring", href: "/workspace/monitoring", group: "work", description: "Prepare visits, evidence and follow-up actions within delegated scope." },
    { id: "results", label: "Results and Reports", href: "/workspace/results", group: "work", description: "Enter evidence-linked results and prepare country reporting material." },
    { id: "knowledge", label: "Documents and Knowledge", href: "/workspace/knowledge", group: "work", description: "Classify documents and prepare knowledge nominations for review." },
    { id: "support", label: "Support", href: "/workspace/support", group: "work", description: "Use country guidance and follow record-linked support cases." }
  ],
  reviewer: [
    { id: "proposals", label: "Application Evidence", href: "/workspace/proposals", group: "work", description: "Inspect the immutable application version and evidence attached to an active TAG review assignment." },
    { id: "reviews", label: "Assigned Reviews", href: "/workspace/reviews", group: "work", description: "Declare conflicts and complete evidence-linked technical appraisal assignments." },
    { id: "monitoring", label: "Assigned Visits", href: "/workspace/monitoring", group: "work", description: "Open only monitoring visits explicitly assigned to this TAG account." },
    { id: "support", label: "Support", href: "/workspace/support", group: "work", description: "Use TAG guidance and follow assignment-linked support cases." }
  ],
  nsc: [
    { id: "decisions", label: "Meetings and Decisions", href: "/workspace/decisions", group: "work", description: "Review meeting packs and record conflicts, quorum, conditions and decisions." },
    { id: "analytics", label: "Country Portfolio", href: "/workspace/analytics", group: "work", description: "Review authorized country portfolio and material exception summaries." },
    { id: "amr", label: "Country Reports", href: "/workspace/amr", group: "work", description: "Review country reporting material requiring committee oversight." },
    { id: "support", label: "Support", href: "/workspace/support", group: "work", description: "Open committee guidance and access support." }
  ],
  "national-coordinator": [
    { id: "intake", label: "Grant Opportunities and Intake", href: "/workspace/intake", group: "work", description: "Manage country funding cycles, application windows, source channels and incoming application records." },
    { id: "proposals", label: "Grant Applications", href: "/workspace/proposals", group: "work", description: "Create, edit, validate, preview and submit complete grant applications with controlled versions and supporting materials." },
    { id: "reviews", label: "Application Review", href: "/workspace/reviews", group: "work", description: "Assign TAG reviewers, coordinate clarification and manage the review record without replacing their independent recommendation." },
    { id: "decisions", label: "NSC Decisions", href: "/workspace/decisions", group: "work", description: "Prepare meeting packs and attest the formal committee outcome without replacing NSC authority." },
    { id: "grants", label: "Grants", href: "/workspace/grants", group: "work", description: "Prepare MoAs and manage approved awards through closure." },
    { id: "monitoring", label: "Monitoring and Field Visits", href: "/workspace/monitoring", group: "work", description: "Plan visits, record evidence and resolve follow-up actions." },
    { id: "results", label: "Results", href: "/workspace/results", group: "work", description: "Validate project indicators, evidence and completion records." },
    { id: "amr", label: "Results and AMR", href: "/workspace/amr", group: "work", description: "Prepare traceable country aggregation and reporting submissions." },
    { id: "knowledge", label: "Documents and Knowledge", href: "/workspace/knowledge", group: "work", description: "Classify documents and nominate suitable knowledge for clearance." },
    { id: "analytics", label: "Country Analytics and Exports", href: "/workspace/analytics", group: "work", description: "Review country coverage, quality and authorized exports." },
    { id: "support", label: "Support", href: "/workspace/support", group: "work", description: "Open country guidance and follow escalated support cases." }
  ],
  cpmt: [
    { id: "programmes", label: "Country Programmes", href: "/workspace/programmes", group: "work", description: "Monitor only the regions and country programmes in the active assignment." },
    { id: "proposals", label: "Proposals and Decisions", href: "/workspace/proposals", group: "work", description: "Review assignment-scoped lifecycle exceptions and country support needs." },
    { id: "grants", label: "Grants and Delivery", href: "/workspace/grants", group: "work", description: "Review assigned portfolio delivery risks without replacing country ownership." },
    { id: "results", label: "Results", href: "/workspace/results", group: "work", description: "Review evidence and indicator quality enabled by the active function." },
    { id: "amr", label: "Results and AMR", href: "/workspace/amr", group: "work", description: "Validate assigned country submissions and global reporting snapshots." },
    { id: "corrections", label: "Data Quality and Corrections", href: "/workspace/corrections", group: "work", description: "Resolve only the record types and fields granted to this assignment." },
    { id: "knowledge", label: "Knowledge and Publication", href: "/workspace/knowledge", group: "work", description: "Review rights, publication and AI eligibility when editorial scope is active." },
    { id: "analytics", label: "Analytics and Exports", href: "/workspace/analytics", group: "work", description: "Compare authorized country, regional or global programme data." },
    { id: "support", label: "Assignments and Support", href: "/workspace/support", group: "work", description: "Review active scopes, country requests and escalations." }
  ],
  "agency-programme": [
    { id: "programmes", label: "Agency Portfolio", href: "/workspace/programmes", group: "work", description: "Review agency-managed programmes and records in the active assignment." },
    { id: "agreements", label: "Agreements and Assurance", href: "/workspace/agreements", group: "work", description: "Review approved proposal and agreement packages without changing NSC decisions." },
    { id: "finance", label: "Finance and Reconciliation", href: "/workspace/finance", group: "work", description: "Resolve assigned commitment, payment and linkage exceptions." },
    { id: "safeguards", label: "Safeguards and Risk", href: "/workspace/safeguards", group: "work", description: "Review only safeguards evidence and cases explicitly assigned." },
    { id: "data-exchange", label: "Reporting and Data Exchange", href: "/workspace/data-exchange", group: "work", description: "Monitor authoritative-source synchronization and reporting handoffs." },
    { id: "knowledge", label: "Knowledge and Publication", href: "/workspace/knowledge", group: "work", description: "Perform agency rights, branding or editorial work when assigned." },
    { id: "support", label: "Assignments and Support", href: "/workspace/support", group: "work", description: "Review operating mode, active functions and integration support." }
  ]
};

const standardConfigs: Record<OperationalWorkspaceRole, Omit<WorkspaceConfig, "homeHref" | "intro" | "nav">> = {
  "programme-assistant": {
    label: "Programme Assistant workspace",
    scope: [
      { label: "Country programme", value: "Kenya" },
      { label: "Delegated functions", value: "Proposal preparation and reporting support" },
      { label: "Access", value: "Active through 31 December 2026" }
    ],
    summary: [{ label: "Records to prepare", value: "12" }, { label: "Validation issues", value: "4" }, { label: "Reports due", value: "2" }],
    accessCards: [
      { title: "Proposal intake", body: "Prepare organization, proposal and source-document records.", href: "/workspace/intake", meta: "7 new" },
      { title: "Monitoring evidence", body: "Complete visit and follow-up records delegated by the NC.", href: "/workspace/monitoring", meta: "3 open" },
      { title: "Reporting preparation", body: "Resolve validation issues before NC review.", href: "/workspace/results", meta: "2 due" }
    ],
    priorities: [
      { title: "Complete coastal proposal record", meta: "Review and advance the current proposal", href: "/workspace/proposals/KEN-PRP-014", status: "Prepare" },
      { title: "Upload signed monitoring evidence", meta: "Evidence remains attached to the visit record", href: "/workspace/monitoring/KEN-MON-014", status: "Due soon" }
    ]
  },
  reviewer: {
    label: "TAG Reviewer workspace",
    scope: [
      { label: "Assignment", value: "Technical and safeguards review" },
      { label: "Record", value: "SGP-KEN-2026-014" },
      { label: "Access", value: "Expires 22 August 2026" }
    ],
    summary: [{ label: "Assigned reviews", value: "2" }, { label: "Due this week", value: "1" }, { label: "Conflicts pending", value: "1" }],
    accessCards: [
      { title: "Conflict declaration", body: "Confirm independence before protected evidence opens.", href: "/workspace/reviews/KEN-REV-014", meta: "Required" },
      { title: "Evidence review", body: "Complete criteria against the immutable application version.", href: "/workspace/reviews", meta: "2 assigned" },
      { title: "TAG support", body: "Use review guidance or raise an assignment-linked case.", href: "/workspace/support", meta: "No open case" }
    ],
    priorities: [
      { title: "Declare conflict status", meta: "Required before evidence access", href: "/workspace/reviews/KEN-REV-014", status: "Required" },
      { title: "Submit technical recommendation", meta: "Complete the assigned evidence review", href: "/workspace/reviews/KEN-REV-014", status: "Continue" }
    ]
  },
  nsc: {
    label: "NSC workspace",
    scope: [
      { label: "Committee", value: "Kenya National Steering Committee" },
      { label: "Appointment", value: "Member and biodiversity specialist" },
      { label: "Term", value: "Active through June 2027" }
    ],
    summary: [{ label: "Meeting packs", value: "1" }, { label: "Decisions pending", value: "5" }, { label: "Conflicts to declare", value: "2" }],
    accessCards: [
      { title: "Next NSC meeting", body: "Review the final packages available for the scheduled meeting.", href: "/workspace/decisions", meta: "20 August" },
      { title: "Country portfolio", body: "Review approved oversight summaries and material exceptions.", href: "/workspace/analytics", meta: "46 active grants" },
      { title: "Country reporting", body: "Review the annual submission requiring committee oversight.", href: "/workspace/amr", meta: "Draft ready" }
    ],
    priorities: [
      { title: "Declare proposal conflicts", meta: "Confirm the meeting conflict record", href: "/workspace/decisions/KEN-DEC-2026-08", status: "Required" },
      { title: "Review decision package", meta: "Meeting opens 20 August", href: "/workspace/decisions/KEN-DEC-2026-08", status: "Review" }
    ]
  },
  "national-coordinator": {
    label: "National Coordinator workspace",
    scope: [
      { label: "Country programme", value: "Kenya" },
      { label: "Role", value: "National Coordinator" },
      { label: "Operating cycle", value: "OP8 country programme" }
    ],
    summary: [{ label: "Open applications", value: "18" }, { label: "Active grants", value: "46" }, { label: "AMR issues", value: "3" }],
    accessCards: [
      { title: "Grant applications", body: "Continue application sections, supporting documents, validation and controlled submission.", href: "/workspace/proposals", meta: "18 open" },
      { title: "Application review", body: "Complete country eligibility, technical, safeguards and financial assessment before the NSC pack.", href: "/workspace/reviews", meta: "2 require action" },
      { title: "Delivery and results", body: "Track monitoring, evidence, completion and country reporting.", href: "/workspace/results", meta: "7 require action" },
      { title: "Country analytics", body: "Review coverage, data quality and authorized exports.", href: "/workspace/analytics", meta: "Updated today" }
    ],
    priorities: [
      { title: "Complete coastal grant application", meta: "Workplan, cofinancing and safeguards sections require confirmation", href: "/workspace/proposals/KEN-PRP-014", status: "Continue" },
      { title: "Finalize NSC decision package", meta: "Five proposals · meeting 20 August", href: "/workspace/decisions", status: "Prepare" },
      { title: "Resolve AMR validation issues", meta: "Three project results need evidence", href: "/workspace/amr", status: "Resolve" }
    ]
  },
  cpmt: {
    label: "CPMT workspace",
    scope: [
      { label: "CPMT assignment", value: "Regional support" },
      { label: "Geography", value: "Europe and Central Asia · 19 country programmes" },
      { label: "Excluded", value: "Banking detail, publication decisions and other regions" }
    ],
    summary: [{ label: "Countries in scope", value: "19" }, { label: "Programme exceptions", value: "14" }, { label: "AMRs requiring action", value: "6" }],
    accessCards: [
      { title: "Country programme health", body: "Compare assigned countries and open support needs.", href: "/workspace/programmes", meta: "19 countries" },
      { title: "Results and AMR", body: "Review reporting readiness within the active assignment.", href: "/workspace/amr", meta: "6 require action" },
      { title: "Assignment scope", body: "Confirm current geography, function and excluded data.", href: "/workspace/profile", meta: "Regional support" }
    ],
    priorities: [
      { title: "Review country AMR exceptions", meta: "Six submissions require follow-up", href: "/workspace/amr", status: "Review" },
      { title: "Resolve regional data quality cases", meta: "Fourteen open exceptions", href: "/workspace/corrections", status: "Triage" }
    ]
  },
  "agency-programme": {
    label: "Agency workspace",
    scope: [
      { label: "Agency", value: "UNDP" },
      { label: "Operating mode", value: "Native KLP grant management" },
      { label: "Functional assignment", value: "Agreement and assurance · Kenya" }
    ],
    summary: [{ label: "Agreement reviews", value: "4" }, { label: "Assurance conditions", value: "7" }, { label: "Exchange exceptions", value: "2" }],
    accessCards: [
      { title: "Agreements and assurance", body: "Review approved proposal and MoA packages without changing NSC decisions.", href: "/workspace/agreements", meta: "4 waiting" },
      { title: "Agency portfolio", body: "Review only agency-managed programmes and assigned records.", href: "/workspace/programmes", meta: "Kenya scope" },
      { title: "Reporting and exchange", body: "Monitor authoritative-source status and handoff exceptions.", href: "/workspace/data-exchange", meta: "2 exceptions" }
    ],
    priorities: [
      { title: "Review signed MoA package", meta: "NSC decision is read-only", href: "/workspace/agreements/UNDP-AGR-014", status: "Review" },
      { title: "Resolve reporting handoff", meta: "Reconcile the source and receiving-system versions", href: "/workspace/data-exchange/UNDP-EXC-001", status: "Resolve" }
    ]
  }
};

const privilegedAreaLabels: Record<PrivilegedRole, string> = {
  "agency-admin": "Agency workspace",
  "platform-admin": "Platform administration",
  "it-admin": "IT administration"
};

function privilegedWorkspace(role: PrivilegedRole): WorkspaceConfig {
  const admin = adminConfigForRole(role);
  if (!admin) throw new Error(`No administration configuration for ${role}`);
  const accessNav = admin.sections.map((section) => ({
    id: `access-${section.id}`,
    label: section.id === "overview" ? "Overview" : section.label,
    href: adminSectionHref(admin, section.id),
    group: "access" as const,
    description: section.description
  }));
  const accessCards = admin.sections.filter((section) => section.id !== "overview").slice(0, 3).map((section, index) => ({
    title: section.label,
    body: section.description,
    href: adminSectionHref(admin, section.id),
    meta: index === 0 ? admin.eyebrow : "Authorized access"
  }));
  const priorities = admin.overviewPanels.map((panel) => ({
    title: panel.title,
    meta: panel.body,
    href: adminSectionHref(admin, panel.section),
    status: panel.action
  }));
  if (role === "agency-admin") {
    const programme = standardConfigs["agency-programme"];
    return {
      label: privilegedAreaLabels[role],
      homeHref: admin.basePath,
      intro: `${ROLE_ACCESS_SUMMARIES[role]}. Programme operations and governed administration share one agency-scoped workspace.`,
      nav: [accessNav[0], ...operationalNav["agency-programme"], ...accessNav.slice(1), ...sharedNav],
      scope: programme.scope,
      summary: admin.metrics.slice(0, 3),
      accessCards: [...programme.accessCards.slice(0, 2), ...accessCards.slice(0, 1)],
      priorities: [...programme.priorities, ...priorities.slice(0, 1)]
    };
  }
  return {
    label: privilegedAreaLabels[role],
    homeHref: admin.basePath,
    intro: `${ROLE_ACCESS_SUMMARIES[role]}. This signed-in area combines the operating and account tools assigned to this role.`,
    nav: [...accessNav, ...sharedNav],
    scope: [
      { label: "Access class", value: `L${ROLE_ACCESS_LEVELS[role]} · ${admin.eyebrow}` },
      { label: "Scope", value: admin.description },
      { label: "Boundary", value: admin.boundaryTitle }
    ],
    summary: admin.metrics.slice(0, 3),
    accessCards,
    priorities
  };
}

export function workspaceConfigForRole(role: Role): WorkspaceConfig {
  if (role === "public") throw new Error("Public visitors do not have a workspace");
  if (isPrivilegedRole(role)) return privilegedWorkspace(role);
  const config = standardConfigs[role];
  return {
    ...config,
    homeHref: "/workspace",
    intro: `${ROLE_ACCESS_SUMMARIES[role]}. This workspace shows only the tools and records enabled by the active assignment.`,
    nav: [
      { id: "overview", label: "Overview", href: "/workspace", group: "work", description: "See role scope, priorities and every page available to this account." },
      ...operationalNav[role],
      ...sharedNav
    ]
  };
}

export function workspacePathIsAvailable(role: Role, path: string) {
  if (role === "public") return false;
  if (path === "/workspace") return true;
  const section = path.split("/")[2];
  return workspaceConfigForRole(role).nav.some((item) => (
    item.href.startsWith("/workspace/") && item.id === section
  ));
}
