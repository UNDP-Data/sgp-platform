import {
  ROLE_ACCESS_SUMMARIES, isPrivilegedRole, type PrivilegedRole, type Role, type StandardRole
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

export type WorkspaceConfig = {
  label: string;
  homeHref: string;
  intro: string;
  nav: WorkspaceNavItem[];
  summary: Array<{ label: string; value: string }>;
  accessCards: WorkspaceAccessCard[];
  priorities: WorkspacePriority[];
};

const sharedNav: WorkspaceNavItem[] = [
  { id: "notifications", label: "Notifications", href: "/workspace/notifications", group: "account", description: "Review action alerts, decisions, deadlines and platform updates." },
  { id: "saved", label: "Saved", href: "/workspace/saved", group: "account", description: "Return to saved resources, templates, stories, grants and other platform items." },
  { id: "ai-chat-history", label: "AI Chat History", href: "/workspace/ai-chat-history", group: "account", description: "Reopen previous Ask SGP conversations with their citations and context." },
  { id: "profile", label: "Profile", href: "/workspace/profile", group: "account", description: "Manage identity, language, access and notification preferences." }
];

const operationalNav: Record<StandardRole, WorkspaceNavItem[]> = {
  applicant: [
    { id: "applications", label: "Applications", href: "/workspace/applications", group: "work", description: "Continue drafts and track submitted applications through decision." },
    { id: "support", label: "Support", href: "/workspace/support", group: "work", description: "Open signed-in guidance and follow support cases through resolution." }
  ],
  grantee: [
    { id: "applications", label: "Applications", href: "/workspace/applications", group: "work", description: "Return to application history, submitted versions and award decisions." },
    { id: "grants", label: "Grants", href: "/workspace/grants", group: "work", description: "Track active awards, milestones, documents and delivery status." },
    { id: "visits", label: "Field Visits", href: "/workspace/visits", group: "work", description: "Prepare visits, record observations and follow up on actions." },
    { id: "reports", label: "Reports", href: "/workspace/reports", group: "work", description: "Prepare reports and respond to reviewer feedback." },
    { id: "support", label: "Support", href: "/workspace/support", group: "work", description: "Open signed-in guidance and follow support cases through resolution." }
  ],
  reviewer: [
    { id: "reviews", label: "Reviews", href: "/workspace/reviews", group: "work", description: "Work through assigned evidence checks and decision drafts." },
    { id: "visits", label: "Field Visits", href: "/workspace/visits", group: "work", description: "Prepare visits, record observations and follow up on actions." },
    { id: "support", label: "Support", href: "/workspace/support", group: "work", description: "Use reviewer guidance and follow support cases through resolution." }
  ],
  national: [
    { id: "applications", label: "Applications", href: "/workspace/applications", group: "work", description: "Track country applications from draft through decision." },
    { id: "grants", label: "Grants", href: "/workspace/grants", group: "work", description: "Coordinate active awards, milestones and delivery status." },
    { id: "reviews", label: "Reviews", href: "/workspace/reviews", group: "work", description: "Manage assigned evidence checks and programme decisions." },
    { id: "visits", label: "Field Visits", href: "/workspace/visits", group: "work", description: "Plan visits, record observations and track follow-up actions." },
    { id: "reports", label: "Reports", href: "/workspace/reports", group: "work", description: "Validate programme reports and reviewer feedback." },
    { id: "support", label: "Support", href: "/workspace/support", group: "work", description: "Open programme guidance and follow support cases through resolution." }
  ]
};

const standardConfigs: Record<StandardRole, Omit<WorkspaceConfig, "homeHref" | "intro" | "nav">> = {
  applicant: {
    label: "Applicant workspace",
    summary: [{ label: "Open applications", value: "1" }, { label: "Next deadline", value: "18 Sep" }, { label: "Unread notices", value: "2" }],
    accessCards: [
      { title: "Applications", body: "Continue drafts and track submitted applications.", href: "/workspace/applications", meta: "1 open" },
      { title: "Open grants", body: "Find suitable opportunities and official application guidance.", href: "/funding", meta: "10 examples" },
      { title: "Applicant guidance", body: "Review eligibility, required material and next steps.", href: "/help/applicants", meta: "Public guidance" }
    ],
    priorities: [
      { title: "Complete coastal resilience application", meta: "Draft updated today", href: "/workspace/applications/demo-undp-application", status: "Continue" },
      { title: "Confirm eligibility evidence", meta: "Required before submission", href: "/help/applicants", status: "Review" }
    ]
  },
  grantee: {
    label: "Grantee workspace",
    summary: [{ label: "Active grants", value: "2" }, { label: "Reports due", value: "1" }, { label: "Follow-up actions", value: "3" }],
    accessCards: [
      { title: "Grant delivery", body: "Track milestones, documents and delivery status.", href: "/workspace/grants", meta: "2 active" },
      { title: "Reporting", body: "Prepare reports and respond to reviewer feedback.", href: "/workspace/reports", meta: "1 due" },
      { title: "Field visits", body: "Prepare observations and follow-up actions.", href: "/workspace/visits", meta: "1 planned" }
    ],
    priorities: [
      { title: "Annual progress report", meta: "Draft is 62% complete", href: "/workspace/reports/demo-report", status: "Continue" },
      { title: "Prepare coastal livelihoods field visit", meta: "Visit scheduled 12 Oct", href: "/workspace/visits/demo-visit", status: "Prepare" }
    ]
  },
  reviewer: {
    label: "Reviewer workspace",
    summary: [{ label: "Assigned reviews", value: "2" }, { label: "Due this week", value: "1" }, { label: "Conflicts declared", value: "0" }],
    accessCards: [
      { title: "Review queue", body: "Work through evidence checks and decision drafts.", href: "/workspace/reviews", meta: "2 assigned" },
      { title: "Reviewer support", body: "Open guidance and track support cases.", href: "/workspace/support", meta: "1 case" },
      { title: "Knowledge evidence", body: "Search approved resources and cited project evidence.", href: "/knowledge/library", meta: "29K records" }
    ],
    priorities: [
      { title: "Eligibility and safeguards review", meta: "Due Friday", href: "/workspace/reviews/demo-review", status: "Start" },
      { title: "Resolve evidence clarification", meta: "Applicant response received", href: "/workspace/reviews/demo-review-2", status: "Continue" }
    ]
  },
  national: {
    label: "National programme workspace",
    summary: [{ label: "Active programme items", value: "9" }, { label: "Reviews due", value: "2" }, { label: "Reports due", value: "1" }],
    accessCards: [
      { title: "Country programme", body: "Coordinate applications, grants and delivery activity.", href: "/workspace/grants", meta: "6 active" },
      { title: "Reviews", body: "Track evidence checks and programme decisions.", href: "/workspace/reviews", meta: "2 due" },
      { title: "Portfolio dashboard", body: "Inspect country coverage and project evidence.", href: "/portfolio", meta: "Live data" }
    ],
    priorities: [
      { title: "Review two country applications", meta: "Decision notes due this week", href: "/workspace/reviews", status: "Review" },
      { title: "Validate annual programme report", meta: "One data issue remains", href: "/workspace/reports", status: "Resolve" }
    ]
  }
};

const privilegedAreaLabels: Record<PrivilegedRole, string> = {
  "agency-admin": "Agency administration",
  "undp-admin": "UNDP administration",
  "platform-admin": "Platform administration",
  "it-frontend": "IT frontend administration",
  "it-backend": "IT backend administration",
  "super-admin": "Super administration"
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
  return {
    label: privilegedAreaLabels[role],
    homeHref: admin.basePath,
    intro: `${ROLE_ACCESS_SUMMARIES[role]}. This signed-in area combines the operating and account tools assigned to this role.`,
    nav: [...accessNav, ...sharedNav],
    summary: admin.metrics.slice(0, 3),
    accessCards,
    priorities
  };
}

export function workspaceConfigForRole(
  role: Role,
  options: { includeApplicantGrants?: boolean } = {}
): WorkspaceConfig {
  if (role === "public") throw new Error("Public visitors do not have a workspace");
  if (isPrivilegedRole(role)) return privilegedWorkspace(role);
  const config = standardConfigs[role];
  const operational = options.includeApplicantGrants && role === "applicant"
    ? [
      operationalNav.applicant[0],
      { id: "grants", label: "Grants", href: "/workspace/grants", group: "work", description: "Complete conditional award requirements and follow award preparation." } satisfies WorkspaceNavItem,
      ...operationalNav.applicant.slice(1)
    ]
    : operationalNav[role];
  return {
    ...config,
    homeHref: "/workspace",
    intro: `${ROLE_ACCESS_SUMMARIES[role]}. Your workspace is limited to the tools and records assigned to this account.`,
    nav: [
      { id: "overview", label: "Overview", href: "/workspace", group: "work", description: "See current status, priorities and every area available to this role." },
      ...operational,
      ...sharedNav
    ]
  };
}

export function workspacePathIsAvailable(role: Role, path: string) {
  if (role === "public") return false;
  if (path === "/workspace") return true;
  const section = path.split("/")[2];
  if (role === "applicant" && section === "grants") return true;
  return workspaceConfigForRole(role).nav.some((item) => item.href.startsWith("/workspace/") && item.id === section);
}
