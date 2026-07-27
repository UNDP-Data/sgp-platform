import type { Role } from "../auth/roles";

// Demonstration records preserve the relationships expected by future live services.
export type CommunityWorkspaceRole = Extract<Role, "applicant" | "grantee">;
export type RecordStatusTone = "neutral" | "info" | "warning" | "success" | "danger";
export type ManagingAgency = "UNDP" | "FAO" | "Conservation International";

export type CommunityOrganization = {
  id: string;
  name: string;
  country: string;
  programme: string;
  verification: string;
  members: Array<{ name: string; role: string; initials: string }>;
};

export type ApplicationSection = {
  id: string;
  title: string;
  summary: string;
  status: "complete" | "in-progress" | "not-started" | "changes-requested";
  owner: string;
  fieldLabel: string;
  guidance: string;
  prompt: string;
};

export type CommunityApplication = {
  id: string;
  organizationId: string;
  opportunityId: string;
  title: string;
  opportunity: string;
  country: string;
  agency: ManagingAgency;
  programme: string;
  status: string;
  tone: RecordStatusTone;
  progress: number;
  deadline: string;
  updated: string;
  nextAction: string;
  sections: ApplicationSection[];
  externalUrl?: string;
  externalMessage?: string;
};

export type CommunityGrant = {
  id: string;
  applicationId: string;
  organizationId: string;
  title: string;
  reference: string;
  country: string;
  agency: ManagingAgency;
  programme: string;
  status: string;
  tone: RecordStatusTone;
  progress: number;
  period: string;
  nextAction: string;
  amount: string;
  requirements: Array<{ title: string; status: string; due: string }>;
  milestones: Array<{ title: string; status: string; date: string }>;
};

export type CommunityVisit = {
  id: string;
  grantId: string;
  title: string;
  date: string;
  location: string;
  status: string;
  tone: RecordStatusTone;
  lead: string;
  preparation: Array<{ title: string; complete: boolean }>;
  observations: Array<{ label: string; value: string }>;
  followUp: Array<{ title: string; owner: string; due: string; status: string }>;
};

export type CommunityReport = {
  id: string;
  grantId: string;
  title: string;
  period: string;
  due: string;
  status: string;
  tone: RecordStatusTone;
  progress: number;
  sections: Array<{ title: string; status: string; owner: string }>;
  requestedChanges?: string[];
  knowledgeCandidate?: {
    title: string;
    summary: string;
    clearance: string;
  };
};

export type CommunitySupportRequest = {
  id: string;
  organizationId: string;
  relatedRecordId?: string;
  title: string;
  category: string;
  status: string;
  tone: RecordStatusTone;
  updated: string;
  owner: string;
  messages: Array<{ author: string; role: string; date: string; body: string }>;
};

const op8Sections: ApplicationSection[] = [
  {
    id: "organization",
    title: "Organization profile",
    summary: "Confirm legal identity, governance, contacts, community mandate and previous experience.",
    status: "complete",
    owner: "James Okoro",
    fieldLabel: "Organization experience",
    guidance: "Reuse verified organization information and update only details that have changed.",
    prompt: "What evidence should a community organization include to demonstrate relevant delivery experience?"
  },
  {
    id: "project-summary",
    title: "Project summary",
    summary: "Define the challenge, proposed response, location, community and overall objective.",
    status: "in-progress",
    owner: "James Okoro",
    fieldLabel: "Project rationale and objective",
    guidance: "Connect the local environmental challenge to the community-led response and the opportunity priorities.",
    prompt: "Show me comparable SGP projects that link mangrove restoration with community livelihoods."
  },
  {
    id: "results",
    title: "Results framework",
    summary: "Connect outcomes, outputs, indicators, baselines, targets and verification sources.",
    status: "in-progress",
    owner: "Amina Bello",
    fieldLabel: "Expected outcomes",
    guidance: "Use measurable changes that the organization can monitor during the grant period.",
    prompt: "Suggest practical indicators for community-led mangrove restoration without rewriting my proposal."
  },
  {
    id: "workplan",
    title: "Workplan",
    summary: "Sequence activities, responsibilities, delivery periods and dependencies.",
    status: "not-started",
    owner: "Amina Bello",
    fieldLabel: "Activities and timing",
    guidance: "Align every activity to a result and identify realistic community responsibilities.",
    prompt: "What should I check when sequencing a community restoration workplan?"
  },
  {
    id: "budget",
    title: "Budget and cofinancing",
    summary: "Build the budget by category and connect contributions to planned activities.",
    status: "changes-requested",
    owner: "Samuel Mensah",
    fieldLabel: "Budget justification",
    guidance: "Explain major cost drivers and distinguish requested funds from cash and in-kind cofinancing.",
    prompt: "Explain the difference between cash and in-kind cofinancing for an SGP application."
  },
  {
    id: "safeguards",
    title: "Safeguards and risk",
    summary: "Identify social, environmental, delivery and fiduciary risks with mitigation and ownership.",
    status: "in-progress",
    owner: "James Okoro",
    fieldLabel: "Risk and mitigation summary",
    guidance: "Do not include unnecessary personal data. Escalate unresolved safeguard questions to the country team.",
    prompt: "Which safeguards questions should a community mangrove project review before submission?"
  },
  {
    id: "monitoring",
    title: "Monitoring and learning",
    summary: "Describe participatory monitoring, reflection, adaptation and knowledge-sharing activities.",
    status: "not-started",
    owner: "Amina Bello",
    fieldLabel: "Monitoring and learning approach",
    guidance: "Identify who will collect evidence, how often the team will reflect and how findings may be shared.",
    prompt: "Give examples of participatory monitoring approaches used in community environmental projects."
  },
  {
    id: "review",
    title: "Review and submit",
    summary: "Resolve validation issues, preview the complete proposal, confirm attestations and submit.",
    status: "not-started",
    owner: "James Okoro",
    fieldLabel: "Submission readiness",
    guidance: "Submission creates a locked snapshot. Requested changes are completed in a later controlled revision.",
    prompt: "Help me create a final quality checklist for this application."
  }
];

export function createOp8Sections() {
  return op8Sections.map((section) => ({ ...section }));
}

export const COMMUNITY_ORGANIZATIONS: CommunityOrganization[] = [
  {
    id: "org-coastal-futures",
    name: "Coastal Futures Collective",
    country: "Ghana",
    programme: "Ghana Country Programme",
    verification: "Verified organization profile",
    members: [
      { name: "James Okoro", role: "Organization administrator · Application lead", initials: "JO" },
      { name: "Amina Bello", role: "Contributor · Reporting lead", initials: "AB" },
      { name: "Samuel Mensah", role: "Authorized signatory", initials: "SM" }
    ]
  },
  {
    id: "org-forest-action",
    name: "Forest Action Network",
    country: "Kenya",
    programme: "Kenya Country Programme",
    verification: "Organization profile under review",
    members: [
      { name: "Grace Wanjiku", role: "Organization administrator", initials: "GW" },
      { name: "David Otieno", role: "Contributor", initials: "DO" }
    ]
  }
];

export const COMMUNITY_APPLICATIONS: CommunityApplication[] = [
  {
    id: "demo-undp-application",
    organizationId: "org-coastal-futures",
    opportunityId: "opp-coastal-resilience",
    title: "Community mangrove restoration and resilient livelihoods",
    opportunity: "OP8 Community Action for Coastal Resilience",
    country: "Ghana",
    agency: "UNDP",
    programme: "Ghana Country Programme",
    status: "Changes requested",
    tone: "warning",
    progress: 63,
    deadline: "18 September 2026",
    updated: "Edited 12 minutes ago by James Okoro",
    nextAction: "Revise the budget justification and resolve two validation issues",
    sections: op8Sections
  },
  {
    id: "demo-submitted-application",
    organizationId: "org-coastal-futures",
    opportunityId: "opp-landscape-restoration",
    title: "Community watershed and agroforestry initiative",
    opportunity: "OP8 Sustainable Landscapes Call",
    country: "Ghana",
    agency: "UNDP",
    programme: "Ghana Country Programme",
    status: "Submitted",
    tone: "info",
    progress: 100,
    deadline: "Submitted 04 July 2026",
    updated: "Submission snapshot v1.0",
    nextAction: "No organization action required while the application is under review",
    sections: op8Sections.map((section) => ({ ...section, status: "complete" }))
  },
  {
    id: "demo-external-application",
    organizationId: "org-forest-action",
    opportunityId: "opp-fao-restoration",
    title: "Community forest and food systems concept",
    opportunity: "Community Forest Restoration Window",
    country: "Kenya",
    agency: "FAO",
    programme: "Kenya Country Programme",
    status: "Continue with managing agency",
    tone: "neutral",
    progress: 20,
    deadline: "30 September 2026",
    updated: "Opportunity context saved in the KLP",
    nextAction: "Open the FAO application destination to continue operational work",
    sections: op8Sections.slice(0, 2),
    externalUrl: "https://www.fao.org/",
    externalMessage: "FAO owns this application workflow. The KLP retains the opportunity, guidance and approved knowledge context without reproducing the agency record."
  }
];

export const COMMUNITY_GRANTS: CommunityGrant[] = [
  {
    id: "demo-grant",
    applicationId: "demo-submitted-application",
    organizationId: "org-coastal-futures",
    title: "Community watershed and agroforestry initiative",
    reference: "GHA/SGP/OP8/2026/014",
    country: "Ghana",
    agency: "UNDP",
    programme: "Ghana Country Programme",
    status: "Active grant",
    tone: "success",
    progress: 42,
    period: "01 August 2026 – 31 July 2028",
    nextAction: "Prepare the first progress report and confirm the October field visit",
    amount: "US$ 48,500",
    requirements: [
      { title: "Signed grant agreement", status: "Complete", due: "Completed 27 July" },
      { title: "Bank verification", status: "Complete", due: "Completed 29 July" },
      { title: "Safeguards action confirmation", status: "Complete", due: "Completed 30 July" }
    ],
    milestones: [
      { title: "Community inception workshop", status: "Complete", date: "15 August 2026" },
      { title: "First field implementation cycle", status: "In progress", date: "30 November 2026" },
      { title: "Progress report 1", status: "Due soon", date: "15 December 2026" }
    ]
  },
  {
    id: "demo-conditional-grant",
    applicationId: "demo-undp-application",
    organizationId: "org-coastal-futures",
    title: "Community mangrove restoration and resilient livelihoods",
    reference: "GHA/SGP/OP8/2026/021",
    country: "Ghana",
    agency: "UNDP",
    programme: "Ghana Country Programme",
    status: "Award requirements in progress",
    tone: "warning",
    progress: 58,
    period: "Proposed start: 01 November 2026",
    nextAction: "Upload bank verification and complete the award conditions",
    amount: "US$ 50,000",
    requirements: [
      { title: "Accept conditional decision", status: "Complete", due: "Completed 22 July" },
      { title: "Bank verification", status: "Required", due: "08 August 2026" },
      { title: "Updated workplan", status: "In review", due: "Submitted 25 July" },
      { title: "Authorized signatory confirmation", status: "Required", due: "08 August 2026" }
    ],
    milestones: []
  }
];

export const COMMUNITY_VISITS: CommunityVisit[] = [
  {
    id: "demo-visit",
    grantId: "demo-grant",
    title: "Watershed implementation field visit",
    date: "12 October 2026",
    location: "Afram Plains, Ghana",
    status: "Preparation in progress",
    tone: "info",
    lead: "Country Programme Team · Ama Boateng",
    preparation: [
      { title: "Confirm community participants and accessibility needs", complete: true },
      { title: "Upload the latest workplan and activity evidence", complete: true },
      { title: "Agree the visit schedule and focal points", complete: false },
      { title: "Review consent and safe documentation guidance", complete: false }
    ],
    observations: [
      { label: "Implementation progress", value: "First agroforestry plots established; watershed committee meets monthly." },
      { label: "Community perspective", value: "Participants report strong engagement and request more practical nursery training." },
      { label: "Evidence", value: "Attendance list, geotag-safe activity photos and monitoring notes." }
    ],
    followUp: [
      { title: "Share nursery training options", owner: "Country Team", due: "20 October", status: "Open" },
      { title: "Update seasonal risk plan", owner: "Coastal Futures Collective", due: "31 October", status: "Open" }
    ]
  }
];

export const COMMUNITY_REPORTS: CommunityReport[] = [
  {
    id: "demo-report",
    grantId: "demo-grant",
    title: "Progress report 1",
    period: "August – November 2026",
    due: "15 December 2026",
    status: "Draft",
    tone: "info",
    progress: 62,
    sections: [
      { title: "Progress against results", status: "In progress", owner: "Amina Bello" },
      { title: "Activities and participation", status: "Complete", owner: "Amina Bello" },
      { title: "Challenges and adaptation", status: "In progress", owner: "James Okoro" },
      { title: "Financial delivery", status: "Not started", owner: "Samuel Mensah" },
      { title: "Safeguards and risk update", status: "Complete", owner: "James Okoro" },
      { title: "Learning and next period", status: "Not started", owner: "Amina Bello" }
    ]
  },
  {
    id: "demo-returned-report",
    grantId: "demo-grant",
    title: "Financial delivery update",
    period: "August – September 2026",
    due: "Revision due 06 August 2026",
    status: "Changes requested",
    tone: "warning",
    progress: 88,
    sections: [
      { title: "Expenditure by category", status: "Changes requested", owner: "Samuel Mensah" },
      { title: "Cofinancing update", status: "Complete", owner: "Samuel Mensah" },
      { title: "Variance explanation", status: "Changes requested", owner: "James Okoro" }
    ],
    requestedChanges: [
      "Explain the variance in local transport costs.",
      "Attach the corrected expenditure summary and preserve the original submission snapshot."
    ]
  },
  {
    id: "demo-final-report",
    grantId: "demo-grant",
    title: "Final report and learning contribution",
    period: "Grant closeout",
    due: "Future requirement",
    status: "Not yet available",
    tone: "neutral",
    progress: 0,
    sections: [
      { title: "Final results", status: "Not started", owner: "Amina Bello" },
      { title: "Community lessons", status: "Not started", owner: "James Okoro" },
      { title: "Sustainability and continuation", status: "Not started", owner: "James Okoro" }
    ],
    knowledgeCandidate: {
      title: "Community-led watershed governance and agroforestry",
      summary: "A potential learning contribution derived from the final report after organization review, rights confirmation and publication clearance.",
      clearance: "Not cleared for publication or AI inclusion"
    }
  }
];

export const COMMUNITY_SUPPORT_REQUESTS: CommunitySupportRequest[] = [
  {
    id: "support-1042",
    organizationId: "org-coastal-futures",
    relatedRecordId: "demo-undp-application",
    title: "Clarification on cofinancing evidence",
    category: "Application and eligibility",
    status: "Waiting for your reply",
    tone: "warning",
    updated: "Updated 26 July 2026",
    owner: "Ghana Country Programme",
    messages: [
      {
        author: "James Okoro",
        role: "Coastal Futures Collective",
        date: "25 July · 10:42",
        body: "Can a signed community contribution letter support the in-kind cofinancing entry?"
      },
      {
        author: "Ama Boateng",
        role: "Ghana Country Programme",
        date: "26 July · 09:18",
        body: "Yes. Please identify the contributor, describe the contribution and use a reasonable valuation method. Upload the letter with the budget evidence."
      }
    ]
  },
  {
    id: "support-1038",
    organizationId: "org-coastal-futures",
    relatedRecordId: "demo-grant",
    title: "Field visit accessibility request",
    category: "Field visit support",
    status: "In progress",
    tone: "info",
    updated: "Updated 24 July 2026",
    owner: "Ghana Country Programme",
    messages: [
      {
        author: "Amina Bello",
        role: "Coastal Futures Collective",
        date: "23 July · 16:05",
        body: "We need an accessible meeting location and additional travel time for two participants."
      }
    ]
  }
];

export const COMMUNITY_ACTIVITY = [
  { title: "Budget section reopened", meta: "Ama Boateng · 26 July · Application GHA-OP8-021", tone: "warning" as const },
  { title: "Field visit evidence uploaded", meta: "Amina Bello · 24 July · Grant GHA/SGP/OP8/2026/014", tone: "info" as const },
  { title: "Application submitted", meta: "James Okoro · 04 July · Snapshot v1.0", tone: "success" as const }
];

export const COMMUNITY_SERVICE_CATALOG = [
  { id: "application", title: "Application and eligibility", body: "Ask about opportunity requirements, submission, requested changes or evidence." },
  { id: "grant", title: "Grant delivery", body: "Request help with award requirements, milestones, changes or implementation." },
  { id: "visit", title: "Field visit support", body: "Coordinate preparation, accessibility, evidence and follow-up." },
  { id: "report", title: "Reporting and learning", body: "Clarify report requirements, feedback, closeout or knowledge contribution." },
  { id: "access", title: "Access and organization", body: "Resolve membership, roles, language, accessibility or account issues." },
  { id: "rights", title: "Rights, consent and privacy", body: "Escalate publication, Indigenous knowledge, consent or sensitive-information concerns." }
];

export const COMMUNITY_NOTIFICATIONS = [
  { id: "notice-1", title: "Budget revision requested", body: "Two comments require attention before 18 September.", href: "/workspace/applications/demo-undp-application", read: false },
  { id: "notice-2", title: "Field visit preparation opened", body: "Confirm participants and schedule for the 12 October visit.", href: "/workspace/visits/demo-visit", read: false },
  { id: "notice-3", title: "Support reply received", body: "The Ghana Country Programme replied to your cofinancing question.", href: "/workspace/support/support-1042", read: true }
];

export const COMMUNITY_UI_TEXT = {
  organization: "Organization",
  role: "Workspace role",
  verification: "Verification",
  switchOrganization: "Switch organization",
  organizationContext: "Active organization context",
  applicantRole: "Applicant · Organization administrator",
  granteeRole: "Grantee · Grant focal point",
  managingAgency: "Managing agency",
  programme: "Programme",
  deadline: "Deadline",
  updated: "Last activity",
  status: "Status",
  progress: "Completion",
  nextAction: "Next action",
  overview: {
    title: "Your work, in one place",
    body: "Continue the highest-priority action, monitor upcoming dates and stay connected to your organization’s full SGP history.",
    priority: "Priority action",
    currentWork: "Current work",
    upcoming: "Upcoming dates",
    support: "Open support",
    activity: "Recent activity",
    continue: "Continue work",
    viewAll: "View all",
    noGrantTitle: "No active grant yet",
    noGrantBody: "Award and delivery tools appear here when an application reaches the relevant stage."
  },
  applications: {
    title: "Applications",
    body: "Create, continue and track applications while preserving every submitted version.",
    new: "Start an application",
    all: "All applications",
    drafts: "Drafts",
    submitted: "Submitted",
    historical: "Historical",
    return: "Return to applications",
    applicationRecord: "Application record",
    sections: "Application sections",
    collaboration: "Collaboration",
    activity: "Record activity",
    comments: "Comments",
    preview: "Preview proposal",
    export: "Export PDF",
    save: "Saved",
    saving: "Saving",
    edit: "Edit section",
    sectionOwner: "Section owner",
    validation: "Validation",
    resolve: "Resolve issue",
    submit: "Submit application",
    confirmSubmit: "Confirm submission",
    cancel: "Cancel",
    locked: "Submitted snapshot · editing locked",
    requested: "Changes requested",
    external: "External agency handoff",
    openAgency: "Continue with managing agency"
  },
  grants: {
    title: "Grants",
    body: "Move from award requirements into active delivery without losing the application history.",
    return: "Return to grants",
    grantRecord: "Grant record",
    award: "Award requirements",
    milestones: "Milestones",
    delivery: "Delivery overview",
    changes: "Change requests",
    documents: "Documents and evidence",
    amount: "Grant amount",
    period: "Grant period",
    createChange: "Request a grant change"
  },
  visits: {
    title: "Field Visits",
    body: "Prepare visits, record agreed evidence and follow actions through completion.",
    return: "Return to field visits",
    visitRecord: "Field visit record",
    preparation: "Visit preparation",
    observations: "Visit observations",
    followUp: "Follow-up actions",
    complete: "Mark preparation complete"
  },
  reports: {
    title: "Reports",
    body: "Prepare structured reports, respond to feedback and retain submitted snapshots.",
    return: "Return to reports",
    reportRecord: "Report record",
    sections: "Report sections",
    changes: "Requested changes",
    learning: "Knowledge contribution",
    submit: "Submit report",
    due: "Due"
  },
  support: {
    title: "Support",
    body: "Use guided service requests for operational help that needs a traceable response.",
    new: "New support request",
    open: "Open requests",
    catalog: "What do you need help with?",
    return: "Return to support",
    requestRecord: "Support request",
    category: "Request category",
    related: "Related record",
    subject: "Subject",
    message: "Message",
    send: "Send request",
    reply: "Add reply",
    owner: "Assigned team"
  },
  account: {
    notifications: "Notifications",
    saved: "Saved items",
    history: "AI Chat History",
    profile: "Profile and organization",
    members: "Organization members",
    preferences: "Preferences",
    invite: "Invite member",
    save: "Save preferences"
  },
  ai: {
    title: "Ask SGP in context",
    body: "Questions use approved public guidance in an organization-scoped conversation. The assistant does not read or change this record.",
    ask: "Ask this question",
    limitation: "AI cannot determine eligibility, approve a grant, submit records or make safeguard decisions."
  },
  system: {
    autosaved: "All changes saved",
    offline: "Offline · changes stay on this device until connection returns",
    conflict: "A newer version exists. Review changes before replacing this section.",
    errors: "2 issues require attention",
    prototype: "Interactive workflow prototype",
    external: "Operational action continues in the managing agency system."
  },
  actions: {
    open: "Open record",
    continue: "Continue",
    review: "Review",
    prepare: "Prepare",
    reply: "Reply",
    download: "Download",
    upload: "Upload file",
    close: "Close",
    add: "Add",
    remove: "Remove",
    view: "View",
    retry: "Retry"
  }
} as const;

export function isCommunityWorkspaceRole(role: Role): role is CommunityWorkspaceRole {
  return role === "applicant" || role === "grantee";
}

export function communityRouteMeta(path: string) {
  const section = path.split("/")[2] || "overview";
  const detail = path.split("/").length > 3;
  if (section === "applications") {
    return {
      title: detail ? COMMUNITY_UI_TEXT.applications.applicationRecord : COMMUNITY_UI_TEXT.applications.title,
      intro: COMMUNITY_UI_TEXT.applications.body
    };
  }
  if (section === "grants") {
    return {
      title: detail ? COMMUNITY_UI_TEXT.grants.grantRecord : COMMUNITY_UI_TEXT.grants.title,
      intro: COMMUNITY_UI_TEXT.grants.body
    };
  }
  if (section === "visits") {
    return {
      title: detail ? COMMUNITY_UI_TEXT.visits.visitRecord : COMMUNITY_UI_TEXT.visits.title,
      intro: COMMUNITY_UI_TEXT.visits.body
    };
  }
  if (section === "reports") {
    return {
      title: detail ? COMMUNITY_UI_TEXT.reports.reportRecord : COMMUNITY_UI_TEXT.reports.title,
      intro: COMMUNITY_UI_TEXT.reports.body
    };
  }
  if (section === "support") {
    return {
      title: detail ? COMMUNITY_UI_TEXT.support.requestRecord : COMMUNITY_UI_TEXT.support.title,
      intro: COMMUNITY_UI_TEXT.support.body
    };
  }
  if (section === "notifications") return { title: COMMUNITY_UI_TEXT.account.notifications, intro: "Action alerts, decisions, deadlines and platform updates." };
  if (section === "saved") return { title: COMMUNITY_UI_TEXT.account.saved, intro: "Return to resources, grants, stories, templates and other saved platform items." };
  if (section === "ai-chat-history") return { title: COMMUNITY_UI_TEXT.account.history, intro: "Reopen previous questions with their citations and record context." };
  if (section === "profile") return { title: COMMUNITY_UI_TEXT.account.profile, intro: "Manage organization membership, identity, language, access and notifications." };
  return { title: "Overview", intro: COMMUNITY_UI_TEXT.overview.body };
}

export function communityRecordRelationshipsAreValid() {
  const applications = new Set(COMMUNITY_APPLICATIONS.map((record) => record.id));
  const grants = new Set(COMMUNITY_GRANTS.map((record) => record.id));
  return COMMUNITY_GRANTS.every((record) => applications.has(record.applicationId))
    && COMMUNITY_VISITS.every((record) => grants.has(record.grantId))
    && COMMUNITY_REPORTS.every((record) => grants.has(record.grantId));
}
