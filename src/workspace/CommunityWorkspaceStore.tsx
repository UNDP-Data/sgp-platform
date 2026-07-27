import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { OpenGrant } from "../data/open-grants";
import { readStoredJson, writeStoredJson } from "../lib/browser/storage";
import {
  COMMUNITY_APPLICATIONS,
  COMMUNITY_GRANTS,
  COMMUNITY_NOTIFICATIONS,
  COMMUNITY_ORGANIZATIONS,
  COMMUNITY_REPORTS,
  COMMUNITY_SUPPORT_REQUESTS,
  COMMUNITY_VISITS,
  createOp8Sections,
  type CommunityApplication,
  type CommunityGrant,
  type CommunitySupportRequest
} from "./communityWorkspaceData";

const STORAGE_KEY = "sgp-community-workspace-v3";
const LEGACY_DRAFT_KEY = "sgp-community-application-draft-v1";
const STORAGE_VERSION = 4;

export type ApplicationDrafts = Record<string, Record<string, string>>;

export type SubmissionSnapshot = {
  id: string;
  applicationId: string;
  organizationId: string;
  version: number;
  submittedAt: string;
  submittedBy: string;
  destination: string;
  sectionValues: Record<string, string>;
  resultRows: ResultFrameworkRow[];
  budgetRows: BudgetRow[];
  attachmentIds: string[];
};

export type ResultFrameworkRow = {
  id: string;
  level: "Outcome" | "Output";
  statement: string;
  indicator: string;
  baseline: string;
  target: string;
};

export type BudgetRow = {
  id: string;
  category: string;
  requestedAmount: number;
  cofinancingAmount: number;
  contributionStatus: "Planned" | "Confirmed" | "In-kind";
};

export type WorkspaceAttachment = {
  id: string;
  organizationId: string;
  recordId: string;
  sectionId?: string;
  name: string;
  size: number;
  type: string;
  status: "ready";
  uploadedAt: string;
  uploadedBy: string;
};

export type WorkspaceComment = {
  id: string;
  organizationId: string;
  recordId: string;
  sectionId: string;
  author: string;
  role: string;
  body: string;
  createdAt: string;
};

export type ApplicationChangeRequest = {
  id: string;
  organizationId: string;
  applicationId: string;
  sectionId: string;
  message: string;
  requestedBy: string;
  requestedAt: string;
  status: "open" | "resolved";
  response?: string;
  resolvedAt?: string;
};

export type CommunityAuditEvent = {
  id: string;
  organizationId: string;
  recordId: string;
  action:
    | "application-created"
    | "section-updated"
    | "section-assigned"
    | "attachment-added"
    | "attachment-removed"
    | "comment-added"
    | "change-resolved"
    | "application-submitted"
    | "support-created"
    | "support-replied";
  occurredAt: string;
  actor: string;
};

export type CommunityWorkspaceState = {
  version: number;
  activeOrganizationId: string;
  applications: CommunityApplication[];
  grants: CommunityGrant[];
  drafts: ApplicationDrafts;
  resultRows: Record<string, ResultFrameworkRow[]>;
  budgetRows: Record<string, BudgetRow[]>;
  attachments: WorkspaceAttachment[];
  comments: WorkspaceComment[];
  changeRequests: ApplicationChangeRequest[];
  supportRequests: CommunitySupportRequest[];
  submissions: SubmissionSnapshot[];
  auditEvents: CommunityAuditEvent[];
};

export type ValidationIssue = {
  sectionId: string;
  message: string;
};

type SubmitResult = {
  ok: boolean;
  issues: ValidationIssue[];
  snapshot?: SubmissionSnapshot;
};

export type AttachmentInput = Pick<WorkspaceAttachment, "name" | "size" | "type">;

type AttachmentResult = {
  ok: boolean;
  error?: string;
  attachment?: WorkspaceAttachment;
};

type SupportRequestInput = {
  category: string;
  relatedRecordId?: string;
  subject: string;
  message: string;
};

type CommunityWorkspaceContextValue = {
  state: CommunityWorkspaceState;
  activeOrganization: (typeof COMMUNITY_ORGANIZATIONS)[number];
  organizations: typeof COMMUNITY_ORGANIZATIONS;
  applications: CommunityApplication[];
  grants: CommunityGrant[];
  visits: typeof COMMUNITY_VISITS;
  reports: typeof COMMUNITY_REPORTS;
  supportRequests: CommunitySupportRequest[];
  notifications: typeof COMMUNITY_NOTIFICATIONS;
  setActiveOrganizationId: (organizationId: string) => void;
  startApplication: (grant: OpenGrant, organizationId?: string) => CommunityApplication;
  updateApplicationSection: (applicationId: string, sectionId: string, value: string) => boolean;
  assignApplicationSection: (applicationId: string, sectionId: string, memberName: string) => boolean;
  resultRowsForApplication: (applicationId: string) => ResultFrameworkRow[];
  addResultRow: (applicationId: string) => boolean;
  updateResultRow: (applicationId: string, rowId: string, patch: Partial<ResultFrameworkRow>) => boolean;
  removeResultRow: (applicationId: string, rowId: string) => boolean;
  budgetRowsForApplication: (applicationId: string) => BudgetRow[];
  addBudgetRow: (applicationId: string) => boolean;
  updateBudgetRow: (applicationId: string, rowId: string, patch: Partial<BudgetRow>) => boolean;
  removeBudgetRow: (applicationId: string, rowId: string) => boolean;
  attachmentsForRecord: (recordId: string, sectionId?: string) => WorkspaceAttachment[];
  addAttachment: (recordId: string, sectionId: string | undefined, input: AttachmentInput) => AttachmentResult;
  removeAttachment: (attachmentId: string) => boolean;
  commentsForSection: (applicationId: string, sectionId: string) => WorkspaceComment[];
  addComment: (applicationId: string, sectionId: string, body: string) => boolean;
  changeRequestsForApplication: (applicationId: string) => ApplicationChangeRequest[];
  resolveChangeRequest: (applicationId: string, sectionId: string, response: string) => boolean;
  submitApplication: (applicationId: string, attested: boolean) => SubmitResult;
  validateApplication: (applicationId: string) => ValidationIssue[];
  applicationDraft: (applicationId: string, sectionId: string) => string;
  applicationSnapshot: (applicationId: string) => SubmissionSnapshot | undefined;
  getApplication: (applicationId: string) => CommunityApplication | undefined;
  getGrant: (grantId: string) => CommunityGrant | undefined;
  createSupportRequest: (input: SupportRequestInput) => CommunitySupportRequest | undefined;
  addSupportReply: (requestId: string, body: string) => boolean;
};

const CommunityWorkspaceContext = createContext<CommunityWorkspaceContextValue | null>(null);

function cloneApplications() {
  return COMMUNITY_APPLICATIONS.map((application) => ({
    ...application,
    sections: application.sections.map((section) => ({ ...section }))
  }));
}

function cloneGrants() {
  return COMMUNITY_GRANTS.map((grant) => ({
    ...grant,
    requirements: grant.requirements.map((requirement) => ({ ...requirement })),
    milestones: grant.milestones.map((milestone) => ({ ...milestone }))
  }));
}

function cloneSupportRequests() {
  return COMMUNITY_SUPPORT_REQUESTS.map((request) => ({
    ...request,
    messages: request.messages.map((message) => ({ ...message }))
  }));
}

function seedResultRows(): Record<string, ResultFrameworkRow[]> {
  const rows: ResultFrameworkRow[] = [
    {
      id: "result-outcome-1",
      level: "Outcome",
      statement: "Improved community stewardship of priority mangrove areas",
      indicator: "Hectares under community-led restoration",
      baseline: "0",
      target: "120 ha"
    },
    {
      id: "result-output-1",
      level: "Output",
      statement: "Community restoration groups trained and equipped",
      indicator: "Participants applying agreed practices",
      baseline: "0",
      target: "80 people"
    }
  ];
  return {
    "demo-undp-application": rows.map((row) => ({ ...row })),
    "demo-submitted-application": rows.map((row) => ({ ...row }))
  };
}

function seedBudgetRows(): Record<string, BudgetRow[]> {
  const rows: BudgetRow[] = [
    { id: "budget-training", category: "Community training and facilitation", requestedAmount: 12500, cofinancingAmount: 2000, contributionStatus: "Planned" },
    { id: "budget-materials", category: "Restoration materials and equipment", requestedAmount: 19000, cofinancingAmount: 6500, contributionStatus: "Confirmed" },
    { id: "budget-monitoring", category: "Monitoring and learning", requestedAmount: 8500, cofinancingAmount: 1500, contributionStatus: "In-kind" }
  ];
  return {
    "demo-undp-application": rows.map((row) => ({ ...row })),
    "demo-submitted-application": rows.map((row) => ({ ...row }))
  };
}

function seedAttachments(): WorkspaceAttachment[] {
  return [{
    id: "attachment-budget-evidence",
    organizationId: "org-coastal-futures",
    recordId: "demo-undp-application",
    sectionId: "budget",
    name: "community-contribution-letter.pdf",
    size: 284_000,
    type: "application/pdf",
    status: "ready",
    uploadedAt: "2026-07-25T10:42:00.000Z",
    uploadedBy: "James Okoro"
  }];
}

function seedComments(): WorkspaceComment[] {
  return [{
    id: "comment-budget-1",
    organizationId: "org-coastal-futures",
    recordId: "demo-undp-application",
    sectionId: "budget",
    author: "Amina Bello",
    role: "Contributor · Reporting lead",
    body: "The revised community contribution letter is ready for the signatory review.",
    createdAt: "2026-07-26T08:45:00.000Z"
  }];
}

function seedChangeRequests(): ApplicationChangeRequest[] {
  return [{
    id: "change-budget-1",
    organizationId: "org-coastal-futures",
    applicationId: "demo-undp-application",
    sectionId: "budget",
    message: "Explain the variance in local transport costs and attach the corrected expenditure summary while preserving the original submission snapshot.",
    requestedBy: "Ama Boateng · Ghana Country Programme",
    requestedAt: "2026-07-26T09:18:00.000Z",
    status: "open"
  }];
}

function seedSubmissions(): SubmissionSnapshot[] {
  const resultRows = seedResultRows();
  const budgetRows = seedBudgetRows();
  return [
    {
      id: "demo-undp-application-v1",
      applicationId: "demo-undp-application",
      organizationId: "org-coastal-futures",
      version: 1,
      submittedAt: "2026-07-20T14:30:00.000Z",
      submittedBy: "Samuel Mensah",
      destination: "UNDP · Ghana Country Programme",
      sectionValues: {},
      resultRows: resultRows["demo-undp-application"],
      budgetRows: budgetRows["demo-undp-application"],
      attachmentIds: ["attachment-budget-evidence"]
    },
    {
      id: "demo-submitted-application-v1",
      applicationId: "demo-submitted-application",
      organizationId: "org-coastal-futures",
      version: 1,
      submittedAt: "2026-07-04T11:00:00.000Z",
      submittedBy: "Samuel Mensah",
      destination: "UNDP · Ghana Country Programme",
      sectionValues: {},
      resultRows: resultRows["demo-submitted-application"],
      budgetRows: budgetRows["demo-submitted-application"],
      attachmentIds: []
    }
  ];
}

function legacyDrafts(): ApplicationDrafts {
  const flat = readStoredJson<Record<string, string>>(LEGACY_DRAFT_KEY, {}, (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  });
  const nested: ApplicationDrafts = {};
  for (const [key, value] of Object.entries(flat)) {
    const separator = key.indexOf(":");
    if (separator < 1) continue;
    const applicationId = key.slice(0, separator);
    const sectionId = key.slice(separator + 1);
    nested[applicationId] = { ...(nested[applicationId] || {}), [sectionId]: value };
  }
  return nested;
}

export function createInitialCommunityWorkspaceState(): CommunityWorkspaceState {
  return {
    version: STORAGE_VERSION,
    activeOrganizationId: COMMUNITY_ORGANIZATIONS[0].id,
    applications: cloneApplications(),
    grants: cloneGrants(),
    drafts: legacyDrafts(),
    resultRows: seedResultRows(),
    budgetRows: seedBudgetRows(),
    attachments: seedAttachments(),
    comments: seedComments(),
    changeRequests: seedChangeRequests(),
    supportRequests: cloneSupportRequests(),
    submissions: seedSubmissions(),
    auditEvents: []
  };
}

function parseWorkspaceState(value: unknown): CommunityWorkspaceState {
  const fallback = createInitialCommunityWorkspaceState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const candidate = value as Partial<CommunityWorkspaceState>;
  if (candidate.version !== 3 && candidate.version !== STORAGE_VERSION) return fallback;
  const activeOrganizationId = COMMUNITY_ORGANIZATIONS.some((organization) => organization.id === candidate.activeOrganizationId)
    ? candidate.activeOrganizationId as string
    : fallback.activeOrganizationId;
  return {
    version: STORAGE_VERSION,
    activeOrganizationId,
    applications: Array.isArray(candidate.applications) ? candidate.applications : fallback.applications,
    grants: Array.isArray(candidate.grants) ? candidate.grants : fallback.grants,
    drafts: candidate.drafts && typeof candidate.drafts === "object" && !Array.isArray(candidate.drafts)
      ? candidate.drafts
      : fallback.drafts,
    resultRows: candidate.resultRows && typeof candidate.resultRows === "object" && !Array.isArray(candidate.resultRows)
      ? candidate.resultRows
      : fallback.resultRows,
    budgetRows: candidate.budgetRows && typeof candidate.budgetRows === "object" && !Array.isArray(candidate.budgetRows)
      ? candidate.budgetRows
      : fallback.budgetRows,
    attachments: Array.isArray(candidate.attachments) ? candidate.attachments : fallback.attachments,
    comments: Array.isArray(candidate.comments) ? candidate.comments : fallback.comments,
    changeRequests: Array.isArray(candidate.changeRequests) ? candidate.changeRequests : fallback.changeRequests,
    supportRequests: Array.isArray(candidate.supportRequests) ? candidate.supportRequests : fallback.supportRequests,
    submissions: Array.isArray(candidate.submissions)
      ? candidate.submissions.map((snapshot) => ({
        ...snapshot,
        resultRows: Array.isArray(snapshot.resultRows) ? snapshot.resultRows : [],
        budgetRows: Array.isArray(snapshot.budgetRows) ? snapshot.budgetRows : [],
        attachmentIds: Array.isArray(snapshot.attachmentIds) ? snapshot.attachmentIds : []
      }))
      : fallback.submissions,
    auditEvents: Array.isArray(candidate.auditEvents) ? candidate.auditEvents : []
  };
}

function timestamp() {
  return new Date().toISOString();
}

function eventId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLockedApplication(application: CommunityApplication) {
  return ["Submitted", "Resubmitted", "Under review", "Approved"].includes(application.status);
}

function resultRowsComplete(rows: ResultFrameworkRow[]) {
  return rows.length > 0 && rows.every((row) => (
    row.statement.trim() && row.indicator.trim() && row.baseline.trim() && row.target.trim()
  ));
}

function budgetRowsComplete(rows: BudgetRow[]) {
  return rows.length > 0 && rows.every((row) => (
    row.category.trim() && Number.isFinite(row.requestedAmount) && row.requestedAmount > 0
    && Number.isFinite(row.cofinancingAmount) && row.cofinancingAmount >= 0
  ));
}

function derivedSectionStatus(
  sectionId: string,
  value: string,
  resultRows: ResultFrameworkRow[],
  budgetRows: BudgetRow[],
  hasOpenChangeRequest: boolean
) {
  if (hasOpenChangeRequest) return "changes-requested" as const;
  const narrativeReady = value.trim().length >= 80;
  const structuredReady = sectionId === "results"
    ? resultRowsComplete(resultRows)
    : sectionId === "budget"
      ? budgetRowsComplete(budgetRows)
      : true;
  if (narrativeReady && structuredReady) return "complete" as const;
  if (value.trim() || (sectionId === "results" && resultRows.length) || (sectionId === "budget" && budgetRows.length)) {
    return "in-progress" as const;
  }
  return "not-started" as const;
}

function managingAgency(grant: OpenGrant): CommunityApplication["agency"] {
  if (grant.managingAgency === "CI") return "Conservation International";
  return grant.managingAgency;
}

function applicationIdForGrant(grantId: string, organizationId: string) {
  return `application-${organizationId}-${grantId}`;
}

export function createApplicationForGrant(grant: OpenGrant, organizationId: string): CommunityApplication {
  const sections = createOp8Sections().map((section, index) => ({
    ...section,
    status: index === 0 ? "complete" as const : "not-started" as const,
    owner: COMMUNITY_ORGANIZATIONS.find((organization) => organization.id === organizationId)?.members[0]?.name || "Organization administrator"
  }));
  return {
    id: applicationIdForGrant(grant.id, organizationId),
    organizationId,
    opportunityId: grant.id,
    title: grant.title,
    opportunity: grant.title,
    country: grant.countryName,
    agency: managingAgency(grant),
    programme: `${grant.countryName} Country Programme`,
    status: "Application in progress",
    tone: "info",
    progress: Math.round(100 / sections.length),
    deadline: new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${grant.deadline}T12:00:00Z`)),
    updated: "Created just now",
    nextAction: "Complete eligibility and project information",
    sections
  };
}

function sectionProgress(application: CommunityApplication) {
  const complete = application.sections.filter((section) => section.status === "complete").length;
  return Math.round((complete / Math.max(application.sections.length, 1)) * 100);
}

function updateSectionRecord(
  applications: CommunityApplication[],
  applicationId: string,
  sectionId: string,
  status: ApplicationSectionStatus,
  owner?: string
) {
  return applications.map((application) => {
    if (application.id !== applicationId) return application;
    const sections = application.sections.map((section) => section.id === sectionId
      ? { ...section, status, ...(owner ? { owner } : {}) }
      : section);
    return {
      ...application,
      sections,
      progress: sectionProgress({ ...application, sections }),
      updated: "Saved just now"
    };
  });
}

type ApplicationSectionStatus = CommunityApplication["sections"][number]["status"];

export function applicationValidationIssues(application: CommunityApplication | undefined): ValidationIssue[] {
  if (!application) return [{ sectionId: "", message: "Application record is unavailable." }];
  if (application.externalUrl) return [{ sectionId: "", message: "Submission continues in the managing agency system." }];
  return application.sections
    .filter((section) => section.id !== "review" && section.status !== "complete")
    .map((section) => ({
      sectionId: section.id,
      message: `${section.title} must be completed before submission.`
    }));
}

export function CommunityWorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommunityWorkspaceState>(() => (
    readStoredJson(STORAGE_KEY, createInitialCommunityWorkspaceState(), parseWorkspaceState)
  ));

  useEffect(() => {
    writeStoredJson(STORAGE_KEY, state);
  }, [state]);

  const activeOrganization = COMMUNITY_ORGANIZATIONS.find(
    (organization) => organization.id === state.activeOrganizationId
  ) || COMMUNITY_ORGANIZATIONS[0];
  const applications = useMemo(
    () => state.applications.filter((application) => application.organizationId === activeOrganization.id),
    [activeOrganization.id, state.applications]
  );
  const grants = useMemo(
    () => state.grants.filter((grant) => grant.organizationId === activeOrganization.id),
    [activeOrganization.id, state.grants]
  );
  const grantIds = useMemo(() => new Set(grants.map((grant) => grant.id)), [grants]);
  const visits = useMemo(
    () => COMMUNITY_VISITS.filter((visit) => grantIds.has(visit.grantId)),
    [grantIds]
  );
  const reports = useMemo(
    () => COMMUNITY_REPORTS.filter((report) => grantIds.has(report.grantId)),
    [grantIds]
  );
  const supportRequests = useMemo(
    () => state.supportRequests.filter((request) => request.organizationId === activeOrganization.id),
    [activeOrganization.id, state.supportRequests]
  );
  const visibleRecordIds = useMemo(() => new Set([
    ...applications.map((application) => application.id),
    ...grants.map((grant) => grant.id),
    ...visits.map((visit) => visit.id),
    ...reports.map((report) => report.id),
    ...supportRequests.map((request) => request.id)
  ]), [applications, grants, reports, supportRequests, visits]);
  const notifications = useMemo(
    () => COMMUNITY_NOTIFICATIONS.filter((notification) => {
      const recordId = notification.href.split("/")[3];
      return !recordId || visibleRecordIds.has(recordId);
    }),
    [visibleRecordIds]
  );

  const setActiveOrganizationId = (organizationId: string) => {
    if (!COMMUNITY_ORGANIZATIONS.some((organization) => organization.id === organizationId)) return;
    setState((current) => ({ ...current, activeOrganizationId: organizationId }));
  };

  const startApplication = (grant: OpenGrant, organizationId = activeOrganization.id) => {
    const targetOrganization = COMMUNITY_ORGANIZATIONS.find((organization) => organization.id === organizationId);
    if (!targetOrganization) throw new Error("The selected organization is unavailable.");
    const id = applicationIdForGrant(grant.id, targetOrganization.id);
    const existing = state.applications.find(
      (application) => application.id === id && application.organizationId === targetOrganization.id
    );
    if (existing) {
      if (state.activeOrganizationId !== targetOrganization.id) {
        setState((current) => ({ ...current, activeOrganizationId: targetOrganization.id }));
      }
      return existing;
    }
    const application = createApplicationForGrant(grant, targetOrganization.id);
    const occurredAt = timestamp();
    setState((current) => ({
      ...current,
      activeOrganizationId: targetOrganization.id,
      applications: [...current.applications, application],
      resultRows: {
        ...current.resultRows,
        [application.id]: [{
          id: eventId("result"),
          level: "Outcome",
          statement: "",
          indicator: "",
          baseline: "",
          target: ""
        }]
      },
      budgetRows: {
        ...current.budgetRows,
        [application.id]: [{
          id: eventId("budget"),
          category: "",
          requestedAmount: 0,
          cofinancingAmount: 0,
          contributionStatus: "Planned"
        }]
      },
      auditEvents: [...current.auditEvents, {
        id: eventId("application-created"),
        organizationId: targetOrganization.id,
        recordId: application.id,
        action: "application-created",
        occurredAt,
        actor: targetOrganization.members[0]?.name || "Organization administrator"
      }]
    }));
    return application;
  };

  const updateApplicationSection = (applicationId: string, sectionId: string, value: string) => {
    const application = state.applications.find(
      (item) => item.id === applicationId && item.organizationId === activeOrganization.id
    );
    if (!application || isLockedApplication(application) || application.externalUrl) return false;
    const occurredAt = timestamp();
    setState((current) => {
      const nextStatus = derivedSectionStatus(
        sectionId,
        value,
        current.resultRows[applicationId] || [],
        current.budgetRows[applicationId] || [],
        current.changeRequests.some((request) => (
          request.applicationId === applicationId && request.sectionId === sectionId && request.status === "open"
        ))
      );
      const applicationsNext = current.applications.map((item) => {
        if (item.id !== applicationId) return item;
        const sections = item.sections.map((section) => section.id === sectionId
          ? { ...section, status: nextStatus as typeof section.status }
          : section);
        return {
          ...item,
          sections,
          progress: sectionProgress({ ...item, sections }),
          updated: "Saved just now"
        };
      });
      return {
        ...current,
        applications: applicationsNext,
        drafts: {
          ...current.drafts,
          [applicationId]: {
            ...(current.drafts[applicationId] || {}),
            [sectionId]: value
          }
        },
        auditEvents: [...current.auditEvents, {
          id: eventId("section-updated"),
          organizationId: activeOrganization.id,
          recordId: applicationId,
          action: "section-updated",
          occurredAt,
          actor: activeOrganization.members[0]?.name || "Organization administrator"
        }]
      };
    });
    return true;
  };

  const assignApplicationSection = (applicationId: string, sectionId: string, memberName: string) => {
    const application = state.applications.find((item) => (
      item.id === applicationId && item.organizationId === activeOrganization.id
    ));
    if (!application || isLockedApplication(application) || application.externalUrl) return false;
    if (!activeOrganization.members.some((member) => member.name === memberName)) return false;
    setState((current) => ({
      ...current,
      applications: updateSectionRecord(
        current.applications,
        applicationId,
        sectionId,
        application.sections.find((section) => section.id === sectionId)?.status || "not-started",
        memberName
      ),
      auditEvents: [...current.auditEvents, {
        id: eventId("section-assigned"),
        organizationId: activeOrganization.id,
        recordId: applicationId,
        action: "section-assigned",
        occurredAt: timestamp(),
        actor: activeOrganization.members[0]?.name || "Organization administrator"
      }]
    }));
    return true;
  };

  const updateStructuredSection = (
    applicationId: string,
    sectionId: "results" | "budget",
    nextResultRows?: ResultFrameworkRow[],
    nextBudgetRows?: BudgetRow[]
  ) => {
    const application = state.applications.find((item) => (
      item.id === applicationId && item.organizationId === activeOrganization.id
    ));
    if (!application || isLockedApplication(application) || application.externalUrl) return false;
    setState((current) => {
      const resultRows = nextResultRows || current.resultRows[applicationId] || [];
      const budgetRows = nextBudgetRows || current.budgetRows[applicationId] || [];
      const status = derivedSectionStatus(
        sectionId,
        current.drafts[applicationId]?.[sectionId] || "",
        resultRows,
        budgetRows,
        current.changeRequests.some((request) => (
          request.applicationId === applicationId && request.sectionId === sectionId && request.status === "open"
        ))
      );
      return {
        ...current,
        resultRows: nextResultRows ? { ...current.resultRows, [applicationId]: nextResultRows } : current.resultRows,
        budgetRows: nextBudgetRows ? { ...current.budgetRows, [applicationId]: nextBudgetRows } : current.budgetRows,
        applications: updateSectionRecord(current.applications, applicationId, sectionId, status),
        auditEvents: [...current.auditEvents, {
          id: eventId("section-updated"),
          organizationId: activeOrganization.id,
          recordId: applicationId,
          action: "section-updated",
          occurredAt: timestamp(),
          actor: activeOrganization.members[0]?.name || "Organization administrator"
        }]
      };
    });
    return true;
  };

  const addResultRow = (applicationId: string) => updateStructuredSection(
    applicationId,
    "results",
    [...(state.resultRows[applicationId] || []), {
      id: eventId("result"),
      level: "Output",
      statement: "",
      indicator: "",
      baseline: "",
      target: ""
    }]
  );

  const updateResultRow = (applicationId: string, rowId: string, patch: Partial<ResultFrameworkRow>) => (
    updateStructuredSection(
      applicationId,
      "results",
      (state.resultRows[applicationId] || []).map((row) => row.id === rowId ? { ...row, ...patch, id: row.id } : row)
    )
  );

  const removeResultRow = (applicationId: string, rowId: string) => updateStructuredSection(
    applicationId,
    "results",
    (state.resultRows[applicationId] || []).filter((row) => row.id !== rowId)
  );

  const addBudgetRow = (applicationId: string) => updateStructuredSection(
    applicationId,
    "budget",
    undefined,
    [...(state.budgetRows[applicationId] || []), {
      id: eventId("budget"),
      category: "",
      requestedAmount: 0,
      cofinancingAmount: 0,
      contributionStatus: "Planned"
    }]
  );

  const updateBudgetRow = (applicationId: string, rowId: string, patch: Partial<BudgetRow>) => (
    updateStructuredSection(
      applicationId,
      "budget",
      undefined,
      (state.budgetRows[applicationId] || []).map((row) => row.id === rowId ? { ...row, ...patch, id: row.id } : row)
    )
  );

  const removeBudgetRow = (applicationId: string, rowId: string) => updateStructuredSection(
    applicationId,
    "budget",
    undefined,
    (state.budgetRows[applicationId] || []).filter((row) => row.id !== rowId)
  );

  const addAttachment = (
    recordId: string,
    sectionId: string | undefined,
    input: AttachmentInput
  ): AttachmentResult => {
    const application = state.applications.find((item) => (
      item.id === recordId && item.organizationId === activeOrganization.id
    ));
    const supportRequest = state.supportRequests.find((item) => (
      item.id === recordId && item.organizationId === activeOrganization.id
    ));
    if ((!application && !supportRequest) || (application && isLockedApplication(application))) {
      return { ok: false, error: "This record cannot accept uploads." };
    }
    const extension = input.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"].includes(extension)) {
      return { ok: false, error: "Use PDF, Office, JPG or PNG files." };
    }
    if (input.size > 20 * 1024 * 1024) return { ok: false, error: "Files must be 20 MB or smaller." };
    const attachment: WorkspaceAttachment = {
      id: eventId("attachment"),
      organizationId: activeOrganization.id,
      recordId,
      sectionId,
      name: input.name,
      size: input.size,
      type: input.type || "application/octet-stream",
      status: "ready",
      uploadedAt: timestamp(),
      uploadedBy: activeOrganization.members[0]?.name || "Organization member"
    };
    setState((current) => ({
      ...current,
      attachments: [...current.attachments, attachment],
      auditEvents: [...current.auditEvents, {
        id: eventId("attachment-added"),
        organizationId: activeOrganization.id,
        recordId,
        action: "attachment-added",
        occurredAt: attachment.uploadedAt,
        actor: attachment.uploadedBy
      }]
    }));
    return { ok: true, attachment };
  };

  const removeAttachment = (attachmentId: string) => {
    const attachment = state.attachments.find((item) => (
      item.id === attachmentId && item.organizationId === activeOrganization.id
    ));
    if (!attachment) return false;
    const application = state.applications.find((item) => item.id === attachment.recordId);
    if (application && isLockedApplication(application)) return false;
    setState((current) => ({
      ...current,
      attachments: current.attachments.filter((item) => item.id !== attachmentId),
      auditEvents: [...current.auditEvents, {
        id: eventId("attachment-removed"),
        organizationId: activeOrganization.id,
        recordId: attachment.recordId,
        action: "attachment-removed",
        occurredAt: timestamp(),
        actor: activeOrganization.members[0]?.name || "Organization member"
      }]
    }));
    return true;
  };

  const addComment = (applicationId: string, sectionId: string, body: string) => {
    const application = state.applications.find((item) => (
      item.id === applicationId && item.organizationId === activeOrganization.id
    ));
    const member = activeOrganization.members[0];
    if (!application || !body.trim() || !member) return false;
    const comment: WorkspaceComment = {
      id: eventId("comment"),
      organizationId: activeOrganization.id,
      recordId: applicationId,
      sectionId,
      author: member.name,
      role: member.role,
      body: body.trim(),
      createdAt: timestamp()
    };
    setState((current) => ({
      ...current,
      comments: [...current.comments, comment],
      auditEvents: [...current.auditEvents, {
        id: eventId("comment-added"),
        organizationId: activeOrganization.id,
        recordId: applicationId,
        action: "comment-added",
        occurredAt: comment.createdAt,
        actor: member.name
      }]
    }));
    return true;
  };

  const resolveChangeRequest = (applicationId: string, sectionId: string, response: string) => {
    const application = state.applications.find((item) => (
      item.id === applicationId && item.organizationId === activeOrganization.id
    ));
    if (!application || isLockedApplication(application) || response.trim().length < 20) return false;
    const openRequests = state.changeRequests.filter((request) => (
      request.applicationId === applicationId && request.sectionId === sectionId && request.status === "open"
    ));
    if (!openRequests.length) return false;
    const resolvedAt = timestamp();
    setState((current) => {
      const changeRequests = current.changeRequests.map((request) => (
        request.applicationId === applicationId && request.sectionId === sectionId && request.status === "open"
          ? { ...request, status: "resolved" as const, response: response.trim(), resolvedAt }
          : request
      ));
      const status = derivedSectionStatus(
        sectionId,
        current.drafts[applicationId]?.[sectionId] || "",
        current.resultRows[applicationId] || [],
        current.budgetRows[applicationId] || [],
        false
      );
      return {
        ...current,
        changeRequests,
        applications: updateSectionRecord(current.applications, applicationId, sectionId, status),
        auditEvents: [...current.auditEvents, {
          id: eventId("change-resolved"),
          organizationId: activeOrganization.id,
          recordId: applicationId,
          action: "change-resolved",
          occurredAt: resolvedAt,
          actor: activeOrganization.members[0]?.name || "Organization member"
        }]
      };
    });
    return true;
  };

  const validateApplication = (applicationId: string) => {
    const application = state.applications.find((item) => (
      item.id === applicationId && item.organizationId === activeOrganization.id
    ));
    const issues = applicationValidationIssues(application);
    if (application && !resultRowsComplete(state.resultRows[applicationId] || [])) {
      issues.push({ sectionId: "results", message: "Add at least one complete result with an indicator, baseline and target." });
    }
    if (application && !budgetRowsComplete(state.budgetRows[applicationId] || [])) {
      issues.push({ sectionId: "budget", message: "Add at least one valid budget row with a requested amount." });
    }
    for (const request of state.changeRequests.filter((item) => (
      item.applicationId === applicationId && item.status === "open"
    ))) {
      if (!issues.some((issue) => issue.sectionId === request.sectionId)) {
        issues.push({ sectionId: request.sectionId, message: "Respond to the requested change before resubmitting." });
      }
    }
    return issues;
  };

  const submitApplication = (applicationId: string, attested: boolean): SubmitResult => {
    const application = state.applications.find((item) => (
      item.id === applicationId && item.organizationId === activeOrganization.id
    ));
    const issues = validateApplication(applicationId);
    if (!attested) issues.push({ sectionId: "review", message: "The authorized signatory attestation is required." });
    if (!application || issues.length || isLockedApplication(application)) return { ok: false, issues };
    const previousVersions = state.submissions.filter((snapshot) => snapshot.applicationId === applicationId);
    const submittedAt = timestamp();
    const snapshot: SubmissionSnapshot = {
      id: `${applicationId}-v${previousVersions.length + 1}`,
      applicationId,
      organizationId: activeOrganization.id,
      version: previousVersions.length + 1,
      submittedAt,
      submittedBy: activeOrganization.members.find((member) => member.role.includes("Authorized signatory"))?.name
        || activeOrganization.members[0]?.name
        || "Authorized signatory",
      destination: `${application.agency} · ${application.programme}`,
      sectionValues: { ...(state.drafts[applicationId] || {}) },
      resultRows: (state.resultRows[applicationId] || []).map((row) => ({ ...row })),
      budgetRows: (state.budgetRows[applicationId] || []).map((row) => ({ ...row })),
      attachmentIds: state.attachments
        .filter((attachment) => attachment.recordId === applicationId)
        .map((attachment) => attachment.id)
    };
    const resubmission = previousVersions.length > 0 || application.status === "Changes requested";
    setState((current) => ({
      ...current,
      applications: current.applications.map((item) => item.id === applicationId ? {
        ...item,
        status: resubmission ? "Resubmitted" : "Submitted",
        tone: "info",
        progress: 100,
        updated: `Submission snapshot v${snapshot.version}.0`,
        nextAction: "No organization action required while the application is under review",
        sections: item.sections.map((section) => ({ ...section, status: "complete" }))
      } : item),
      submissions: [...current.submissions, snapshot],
      auditEvents: [...current.auditEvents, {
        id: eventId("application-submitted"),
        organizationId: activeOrganization.id,
        recordId: applicationId,
        action: "application-submitted",
        occurredAt: submittedAt,
        actor: snapshot.submittedBy
      }]
    }));
    return { ok: true, issues: [], snapshot };
  };

  const createSupportRequest = (input: SupportRequestInput) => {
    if (!input.subject.trim() || !input.message.trim()) return undefined;
    const createdAt = timestamp();
    const member = activeOrganization.members[0];
    const request: CommunitySupportRequest = {
      id: eventId("support"),
      organizationId: activeOrganization.id,
      relatedRecordId: input.relatedRecordId,
      title: input.subject.trim(),
      category: input.category,
      status: "Submitted",
      tone: "info",
      updated: `Created ${new Date(createdAt).toLocaleDateString()}`,
      owner: activeOrganization.programme,
      messages: [{
        author: member?.name || "Organization member",
        role: activeOrganization.name,
        date: new Date(createdAt).toLocaleString(),
        body: input.message.trim()
      }]
    };
    setState((current) => ({
      ...current,
      supportRequests: [request, ...current.supportRequests],
      auditEvents: [...current.auditEvents, {
        id: eventId("support-created"),
        organizationId: activeOrganization.id,
        recordId: request.id,
        action: "support-created",
        occurredAt: createdAt,
        actor: member?.name || "Organization member"
      }]
    }));
    return request;
  };

  const addSupportReply = (requestId: string, body: string) => {
    const request = state.supportRequests.find((item) => (
      item.id === requestId && item.organizationId === activeOrganization.id
    ));
    const member = activeOrganization.members[0];
    if (!request || !body.trim() || !member) return false;
    const repliedAt = timestamp();
    setState((current) => ({
      ...current,
      supportRequests: current.supportRequests.map((item) => item.id === requestId ? {
        ...item,
        status: "Waiting for programme reply",
        tone: "info",
        updated: `Updated ${new Date(repliedAt).toLocaleDateString()}`,
        messages: [...item.messages, {
          author: member.name,
          role: activeOrganization.name,
          date: new Date(repliedAt).toLocaleString(),
          body: body.trim()
        }]
      } : item),
      auditEvents: [...current.auditEvents, {
        id: eventId("support-replied"),
        organizationId: activeOrganization.id,
        recordId: requestId,
        action: "support-replied",
        occurredAt: repliedAt,
        actor: member.name
      }]
    }));
    return true;
  };

  const value = useMemo<CommunityWorkspaceContextValue>(() => ({
    state,
    activeOrganization,
    organizations: COMMUNITY_ORGANIZATIONS,
    applications,
    grants,
    visits,
    reports,
    supportRequests,
    notifications,
    setActiveOrganizationId,
    startApplication,
    updateApplicationSection,
    assignApplicationSection,
    resultRowsForApplication: (applicationId) => state.resultRows[applicationId] || [],
    addResultRow,
    updateResultRow,
    removeResultRow,
    budgetRowsForApplication: (applicationId) => state.budgetRows[applicationId] || [],
    addBudgetRow,
    updateBudgetRow,
    removeBudgetRow,
    attachmentsForRecord: (recordId, sectionId) => state.attachments.filter((attachment) => (
      attachment.organizationId === activeOrganization.id
      && attachment.recordId === recordId
      && (sectionId === undefined || attachment.sectionId === sectionId)
    )),
    addAttachment,
    removeAttachment,
    commentsForSection: (applicationId, sectionId) => state.comments.filter((comment) => (
      comment.organizationId === activeOrganization.id
      && comment.recordId === applicationId
      && comment.sectionId === sectionId
    )),
    addComment,
    changeRequestsForApplication: (applicationId) => state.changeRequests.filter((request) => (
      request.organizationId === activeOrganization.id && request.applicationId === applicationId
    )),
    resolveChangeRequest,
    submitApplication,
    validateApplication,
    applicationDraft: (applicationId, sectionId) => state.drafts[applicationId]?.[sectionId] || "",
    applicationSnapshot: (applicationId) => state.submissions
      .filter((snapshot) => snapshot.applicationId === applicationId)
      .sort((a, b) => b.version - a.version)[0],
    getApplication: (applicationId) => applications.find((application) => application.id === applicationId),
    getGrant: (grantId) => grants.find((grant) => grant.id === grantId),
    createSupportRequest,
    addSupportReply
  }), [
    activeOrganization,
    applications,
    grants,
    notifications,
    reports,
    state,
    supportRequests,
    visits
  ]);

  return <CommunityWorkspaceContext.Provider value={value}>{children}</CommunityWorkspaceContext.Provider>;
}

export function useCommunityWorkspace() {
  const context = useContext(CommunityWorkspaceContext);
  if (!context) throw new Error("useCommunityWorkspace must be used inside CommunityWorkspaceProvider");
  return context;
}
