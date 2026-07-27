// Applicant and grantee workflows share this record-centred workspace experience.
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  History,
  Languages,
  LockKeyhole,
  MessageSquareText,
  Paperclip,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  WifiOff,
  X
} from "lucide-react";
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { AppLink } from "../components/AppLink";
import { Empty } from "../components/PagePrimitives";
import { useAssistant } from "../contexts/AssistantContext";
import { openGrantById, openGrantHref } from "../data/open-grants";
import {
  COMMUNITY_ACTIVITY,
  COMMUNITY_SERVICE_CATALOG,
  COMMUNITY_UI_TEXT,
  type ApplicationSection,
  type CommunityApplication,
  type CommunityGrant,
  type CommunityReport,
  type CommunitySupportRequest,
  type CommunityVisit,
  type CommunityWorkspaceRole,
  type RecordStatusTone
} from "./communityWorkspaceData";
import {
  useCommunityWorkspace,
  type BudgetRow,
  type ResultFrameworkRow,
  type SubmissionSnapshot,
  type ValidationIssue
} from "./CommunityWorkspaceStore";
import "./communityWorkspace.css";

type CommunityWorkspaceProps = {
  path: string;
  role: CommunityWorkspaceRole;
  saved: string[];
};

type ContextRecord = {
  title: string;
  agency: string;
  programme: string;
  status: string;
  deadline?: string;
};

const TEXT = COMMUNITY_UI_TEXT;

function toneClass(tone: RecordStatusTone) {
  return `community-status community-status--${tone}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Status({ children, tone = "neutral" }: { children: ReactNode; tone?: RecordStatusTone }) {
  return <span className={toneClass(tone)}>{children}</span>;
}

function Progress({ value, label = TEXT.progress }: { value: number; label?: string }) {
  const style = { "--community-progress": `${Math.max(0, Math.min(value, 100))}%` } as CSSProperties;
  return <div className="community-progress" style={style} aria-label={`${label}: ${value}%`}>
    <div><span>{label}</span><strong>{value}%</strong></div>
    <span className="community-progress__track"><span /></span>
  </div>;
}

function RecordContext({ record }: { record: ContextRecord }) {
  return <section className="community-record-context" aria-label={TEXT.organizationContext}>
    <div><span>{TEXT.managingAgency}</span><strong>{record.agency}</strong></div>
    <div><span>{TEXT.programme}</span><strong>{record.programme}</strong></div>
    <div><span>{TEXT.status}</span><strong>{record.status}</strong></div>
    {record.deadline && <div><span>{TEXT.deadline}</span><strong>{record.deadline}</strong></div>}
  </section>;
}

function WorkspaceContext({ role }: { role: CommunityWorkspaceRole }) {
  const workspace = useCommunityWorkspace();
  const organization = workspace.activeOrganization;
  return <section className="community-organization-bar" aria-label={TEXT.organizationContext}>
    <label>
      <span>{TEXT.organization}</span>
      <select value={organization.id} onChange={(event) => workspace.setActiveOrganizationId(event.target.value)} aria-label={TEXT.switchOrganization}>
        {workspace.organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <div><span>{TEXT.role}</span><strong>{role === "applicant" ? TEXT.applicantRole : TEXT.granteeRole}</strong></div>
    <div><span>{TEXT.programme}</span><strong>{organization.programme}</strong></div>
    <div><span>{TEXT.verification}</span><strong><ShieldCheck /> {organization.verification}</strong></div>
  </section>;
}

function ContextualAssistant({ prompts }: { prompts: string[] }) {
  const assistant = useAssistant();
  return <aside className="community-ai-card">
    <header><span><Sparkles /></span><div><h3>{TEXT.ai.title}</h3><p>{TEXT.ai.body}</p></div></header>
    <div className="community-ai-prompts">
      {prompts.map((prompt) => <button type="button" key={prompt} onClick={() => {
        assistant.setDraft(prompt);
        assistant.setDockOpen(true);
      }}><MessageSquareText />{prompt}<ChevronRight /></button>)}
    </div>
    <small><ShieldCheck />{TEXT.ai.limitation}</small>
  </aside>;
}

function RecordCard({
  href,
  title,
  eyebrow,
  status,
  tone,
  progress,
  metadata,
  action = TEXT.actions.open
}: {
  href: string;
  title: string;
  eyebrow: string;
  status: string;
  tone: RecordStatusTone;
  progress?: number;
  metadata: string[];
  action?: string;
}) {
  return <AppLink href={href} className="community-record-card">
    <div className="community-record-card__top"><span>{eyebrow}</span><Status tone={tone}>{status}</Status></div>
    <h3>{title}</h3>
    <div className="community-record-card__meta">{metadata.map((item) => <span key={item}>{item}</span>)}</div>
    {typeof progress === "number" && <Progress value={progress} />}
    <strong className="community-record-card__action">{action}<ArrowRight /></strong>
  </AppLink>;
}

function Overview({ role }: { role: CommunityWorkspaceRole }) {
  const workspace = useCommunityWorkspace();
  const primaryApplication = workspace.applications[0];
  const primaryGrant = workspace.grants[0];
  const nextVisit = workspace.visits[0];
  const nextReport = workspace.reports[0];
  const primarySupport = workspace.supportRequests[0];
  const applicant = role === "applicant";
  const currentRecord = applicant ? primaryApplication : primaryGrant;
  const currentHref = applicant
    ? primaryApplication && `/workspace/applications/${primaryApplication.id}`
    : nextReport
      ? `/workspace/reports/${nextReport.id}`
      : primaryGrant && `/workspace/grants/${primaryGrant.id}`;
  if (!currentRecord) return <div className="community-overview">
    <header className="community-section-intro">
      <div><span className="community-kicker">{TEXT.overview.title}</span><h2>{workspace.activeOrganization.name}</h2><p>{TEXT.overview.body}</p></div>
    </header>
    <section className="community-zero-state">
      <FolderOpen />
      <div><h3>{applicant ? "No applications yet" : "No active grant records"}</h3><p>{applicant ? "Choose an eligible UNDP-managed opportunity to create the first application for this organization." : "Award and delivery records will appear when they are available to this organization."}</p></div>
      {applicant && <AppLink className="button button--primary" href="/funding">Explore open grants<ArrowRight /></AppLink>}
    </section>
  </div>;
  return <div className="community-overview">
    <header className="community-section-intro">
      <div><span className="community-kicker">{TEXT.overview.title}</span><h2>{workspace.activeOrganization.name}</h2><p>{TEXT.overview.body}</p></div>
      <Status tone="success"><CheckCircle2 />{TEXT.system.autosaved}</Status>
    </header>
    <section className="community-priority">
      <div className="community-priority__icon"><AlertCircle /></div>
      <div><span>{TEXT.overview.priority}</span><h3>{currentRecord.nextAction}</h3><p>{applicant ? `${primaryApplication.title} · ${primaryApplication.deadline}` : `${primaryGrant.title}${nextReport ? ` · ${nextReport.due}` : ""}`}</p></div>
      {currentHref && <AppLink className="button button--primary" href={currentHref}>{TEXT.overview.continue}<ArrowRight /></AppLink>}
    </section>
    <div className="community-overview-grid">
      <section className="community-panel community-panel--work">
        <header><div><span>{TEXT.overview.currentWork}</span><h3>{applicant ? TEXT.applications.title : TEXT.grants.title}</h3></div><AppLink href={applicant ? "/workspace/applications" : "/workspace/grants"}>{TEXT.overview.viewAll}</AppLink></header>
        {applicant ? <RecordCard
          href={`/workspace/applications/${primaryApplication.id}`}
          title={primaryApplication.title}
          eyebrow={primaryApplication.opportunity}
          status={primaryApplication.status}
          tone={primaryApplication.tone}
          progress={primaryApplication.progress}
          metadata={[primaryApplication.agency, primaryApplication.programme, primaryApplication.deadline]}
          action={TEXT.actions.continue}
        /> : <RecordCard
          href={`/workspace/grants/${primaryGrant.id}`}
          title={primaryGrant.title}
          eyebrow={primaryGrant.reference}
          status={primaryGrant.status}
          tone={primaryGrant.tone}
          progress={primaryGrant.progress}
          metadata={[primaryGrant.agency, primaryGrant.period, primaryGrant.amount]}
        />}
      </section>
      <section className="community-panel">
        <header><div><span>{TEXT.overview.upcoming}</span><h3>{TEXT.nextAction}</h3></div></header>
        <div className="community-date-list">
          {(applicant ? [
            { date: primaryApplication.deadline, title: primaryApplication.nextAction, href: `/workspace/applications/${primaryApplication.id}` },
            ...(primarySupport ? [{ date: primarySupport.updated, title: primarySupport.title, href: `/workspace/support/${primarySupport.id}` }] : [])
          ] : [
            ...(nextVisit ? [{ date: nextVisit.date, title: nextVisit.title, href: `/workspace/visits/${nextVisit.id}` }] : []),
            ...(nextReport ? [{ date: nextReport.due, title: nextReport.title, href: `/workspace/reports/${nextReport.id}` }] : [])
          ]).map((item) => <AppLink href={item.href} key={item.title}><CalendarDays /><span><strong>{item.title}</strong><small>{item.date}</small></span><ChevronRight /></AppLink>)}
        </div>
      </section>
      <section className="community-panel">
        <header><div><span>{TEXT.overview.support}</span><h3>{primarySupport?.status || "No open requests"}</h3></div><AppLink href="/workspace/support">{TEXT.overview.viewAll}</AppLink></header>
        {primarySupport ? <AppLink className="community-support-summary" href={`/workspace/support/${primarySupport.id}`}>
          <MessageSquareText /><span><strong>{primarySupport.title}</strong><small>{primarySupport.owner} · {primarySupport.updated}</small></span><ChevronRight />
        </AppLink> : <div className="community-empty-inline"><MessageSquareText /><p>No support request is currently open for this organization.</p></div>}
      </section>
      <section className="community-panel">
        <header><div><span>{TEXT.overview.activity}</span><h3>{TEXT.updated}</h3></div></header>
        <div className="community-activity-list">{COMMUNITY_ACTIVITY.map((item) => <div key={item.title}><Status tone={item.tone}><Circle /></Status><span><strong>{item.title}</strong><small>{item.meta}</small></span></div>)}</div>
      </section>
    </div>
    <ContextualAssistant prompts={[
      primaryApplication?.sections[1]?.prompt || "Which approved guidance is relevant to this organization's current work?",
      "What should this organization prioritize next based on its current records?"
    ]} />
  </div>;
}

function ApplicationsList() {
  const workspace = useCommunityWorkspace();
  const [filter, setFilter] = useState<string>(TEXT.applications.all);
  const [query, setQuery] = useState("");
  const filters = [TEXT.applications.all, TEXT.applications.drafts, TEXT.applications.submitted, TEXT.applications.historical];
  const records = useMemo(() => workspace.applications.filter((record) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || [
      record.title,
      record.opportunity,
      record.agency,
      record.programme,
      record.status
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
    if (!matchesQuery) return false;
    if (filter === TEXT.applications.submitted) return record.status === "Submitted";
    if (filter === TEXT.applications.drafts) return !["Submitted", "Archived", "Withdrawn", "Not selected"].includes(record.status);
    if (filter === TEXT.applications.historical) return ["Archived", "Withdrawn", "Not selected"].includes(record.status);
    return true;
  }), [filter, query, workspace.applications]);
  return <div>
    <header className="community-section-intro">
      <div><span className="community-kicker">{TEXT.applications.title}</span><h2>{TEXT.applications.body}</h2></div>
      <AppLink href="/funding" className="button button--primary"><Plus />{TEXT.applications.new}</AppLink>
    </header>
    <div className="community-filter-row" role="toolbar" aria-label={TEXT.applications.title}>
      {filters.map((item) => <button type="button" className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}
      <label className="community-compact-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={TEXT.applications.title} /></label>
    </div>
    {records.length ? <div className="community-record-grid">
      {records.map((record) => <RecordCard
        key={record.id}
        href={`/workspace/applications/${record.id}`}
        title={record.title}
        eyebrow={record.opportunity}
        status={record.status}
        tone={record.tone}
        progress={record.progress}
        metadata={[record.agency, record.programme, record.deadline, record.updated]}
        action={record.externalUrl ? TEXT.applications.openAgency : TEXT.actions.open}
      />)}
    </div> : <Empty title="No matching applications" body="Change the filter or search, or start an eligible application from Open Grants." />}
  </div>;
}

function SectionNavigation({
  sections,
  active,
  onSelect
}: {
  sections: ApplicationSection[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return <nav className="community-section-nav" aria-label={TEXT.applications.sections}>
    <h3>{TEXT.applications.sections}</h3>
    {sections.map((section, index) => <button type="button" className={active === section.id ? "active" : ""} key={section.id} onClick={() => onSelect(section.id)}>
      <span className={`community-section-state community-section-state--${section.status}`}>
        {section.status === "complete" ? <Check /> : section.status === "changes-requested" ? <AlertCircle /> : index + 1}
      </span>
      <span><strong>{section.title}</strong><small>{section.owner}</small></span>
    </button>)}
  </nav>;
}

function ApplicationDetail({ application }: { application: CommunityApplication }) {
  const workspace = useCommunityWorkspace();
  const opportunityGrant = openGrantById(application.opportunityId);
  const [activeSectionId, setActiveSectionId] = useState(() => (
    application.sections.find((section) => section.status === "changes-requested")?.id
    || application.sections.find((section) => section.status === "in-progress")?.id
    || application.sections[0]?.id
    || ""
  ));
  const [saveState, setSaveState] = useState<string>(TEXT.system.autosaved);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [attested, setAttested] = useState(false);
  const [submitIssues, setSubmitIssues] = useState<ValidationIssue[]>([]);
  const [confirmation, setConfirmation] = useState<SubmissionSnapshot | null>(null);
  const [comment, setComment] = useState("");
  const [changeResponse, setChangeResponse] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [online, setOnline] = useState(() => navigator.onLine);
  const saveTimerRef = useRef<number | null>(null);
  const priorFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLElement | null>(null);
  const sectionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const activeSection = application.sections.find((section) => section.id === activeSectionId) || application.sections[0];
  const submitted = ["Submitted", "Resubmitted", "Under review", "Approved"].includes(application.status);
  const issues = workspace.validateApplication(application.id);
  const snapshot = confirmation || workspace.applicationSnapshot(application.id);
  const comments = workspace.commentsForSection(application.id, activeSection.id);
  const attachments = workspace.attachmentsForRecord(application.id, activeSection.id);
  const changeRequests = workspace.changeRequestsForApplication(application.id)
    .filter((request) => request.sectionId === activeSection.id);
  const openChangeRequest = changeRequests.find((request) => request.status === "open");

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
  }, []);

  useEffect(() => {
    if (!submitOpen) return;
    const modal = modalRef.current;
    const focusable = () => Array.from(modal?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), [href]"
    ) || []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSubmitOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      priorFocusRef.current?.focus();
    };
  }, [submitOpen]);

  const updateDraft = (value: string) => {
    if (!workspace.updateApplicationSection(application.id, activeSection.id, value)) return;
    setSaveState(TEXT.applications.saving);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setSaveState(TEXT.system.autosaved);
      saveTimerRef.current = null;
    }, 300);
  };

  const uploadFiles = (files: FileList | null) => {
    setUploadError("");
    for (const file of Array.from(files || [])) {
      const result = workspace.addAttachment(application.id, activeSection.id, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      if (!result.ok) setUploadError(result.error || "The file could not be added.");
    }
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };

  const resolveRequestedChange = () => {
    if (!workspace.resolveChangeRequest(application.id, activeSection.id, changeResponse)) return;
    setChangeResponse("");
    setSaveState("Requested change resolved");
  };

  const exportApplication = () => {
    const payload = {
      application,
      sectionValues: Object.fromEntries(application.sections.map((section) => [
        section.id,
        workspace.applicationDraft(application.id, section.id)
      ])),
      resultsFramework: workspace.resultRowsForApplication(application.id),
      budget: workspace.budgetRowsForApplication(application.id),
      attachments: workspace.attachmentsForRecord(application.id),
      changeRequests: workspace.changeRequestsForApplication(application.id),
      latestSubmission: snapshot || null
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${application.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openSubmission = () => {
    priorFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSubmitIssues([]);
    setAttested(false);
    setSubmitOpen(true);
  };

  const confirmSubmission = () => {
    const result = workspace.submitApplication(application.id, attested);
    if (!result.ok) {
      setSubmitIssues(result.issues);
      return;
    }
    setConfirmation(result.snapshot || null);
    setSubmitOpen(false);
  };

  if (application.externalUrl) return <ExternalApplication application={application} />;

  return <div className="community-detail">
    <AppLink className="community-return-link" href="/workspace/applications"><ArrowLeft />{TEXT.applications.return}</AppLink>
    <header className="community-record-header">
      <div><span>{TEXT.applications.applicationRecord} · {application.opportunity}</span><h2>{application.title}</h2><p>{application.country} · {application.programme}</p></div>
      <div className="community-record-actions">
        {opportunityGrant && <AppLink className="button button--secondary" href={openGrantHref(opportunityGrant.id)}><BookOpen />View grant opportunity</AppLink>}
        <button type="button" className="button button--secondary" onClick={exportApplication}><Download />{TEXT.applications.export}</button>
        <button type="button" className="button button--secondary" onClick={() => setActiveSectionId("review")}><FileCheck2 />{TEXT.applications.preview}</button>
      </div>
    </header>
    <RecordContext record={{ title: application.title, agency: application.agency, programme: application.programme, status: application.status, deadline: application.deadline }} />
    <section className="community-save-strip" role="status">
      {online ? <Save /> : <WifiOff />}
      <strong>{online ? saveState : TEXT.system.offline}</strong>
      <span>{application.updated}</span>
      {submitted && <Status tone="info"><LockKeyhole />{TEXT.applications.locked}</Status>}
    </section>
    {snapshot && !submitted && <section className="community-revision-strip" role="status">
      <History />
      <div><strong>Working revision {snapshot.version + 1}.0</strong><span>Based on preserved submission {snapshot.version}.0 · only the next submission creates a new locked snapshot.</span></div>
    </section>}
    {snapshot && submitted && <section className="community-submission-confirmation" role="status">
      <CheckCircle2 />
      <div><strong>Submission confirmed · version {snapshot.version}.0</strong><span>{new Date(snapshot.submittedAt).toLocaleString()} · {snapshot.destination} · {snapshot.submittedBy}</span></div>
    </section>}
    <div className="community-editor-layout">
      <SectionNavigation sections={application.sections} active={activeSection.id} onSelect={setActiveSectionId} />
      <section className="community-editor" aria-labelledby="community-active-section">
        <header>
          <div><span>{submitted ? TEXT.actions.view : TEXT.applications.edit}</span><h3 id="community-active-section">{activeSection.title}</h3><p>{activeSection.summary}</p></div>
          <div className="community-editor-status">
            <Status tone={activeSection.status === "complete" ? "success" : activeSection.status === "changes-requested" ? "warning" : "info"}>{activeSection.status.replaceAll("-", " ")}</Status>
            <label>
              <span>{TEXT.applications.sectionOwner}</span>
              <select
                disabled={submitted}
                aria-label={`Assign ${activeSection.title}`}
                value={activeSection.owner}
                onChange={(event) => workspace.assignApplicationSection(application.id, activeSection.id, event.target.value)}
              >
                {workspace.activeOrganization.members.map((member) => <option key={member.name} value={member.name}>{member.name}</option>)}
              </select>
            </label>
          </div>
        </header>
        {openChangeRequest && <section className="community-feedback-banner">
          <AlertCircle />
          <div>
            <strong>{TEXT.applications.requested}</strong>
            <p>{openChangeRequest.message}</p>
            <small>{openChangeRequest.requestedBy} · {new Date(openChangeRequest.requestedAt).toLocaleDateString()}</small>
            <label>
              <span>Response for the reviewer</span>
              <textarea rows={3} value={changeResponse} onChange={(event) => setChangeResponse(event.target.value)} placeholder="Describe what changed and where the reviewer can verify it." />
            </label>
          </div>
          <button type="button" disabled={changeResponse.trim().length < 20} onClick={resolveRequestedChange}>{TEXT.applications.resolve}</button>
        </section>}
        {!openChangeRequest && changeRequests.some((request) => request.status === "resolved") && <div className="community-resolved-change"><CheckCircle2 /><span><strong>Reviewer request resolved</strong><small>The response will be included with the next submission snapshot.</small></span></div>}
        <div className="community-guidance"><BookOpen /><div><strong>{activeSection.fieldLabel}</strong><p>{activeSection.guidance}</p></div></div>
        {activeSection.id === "results" ? <ResultsFramework
          inputRef={sectionInputRef}
          locked={submitted}
          value={workspace.applicationDraft(application.id, activeSection.id)}
          rows={workspace.resultRowsForApplication(application.id)}
          onChange={updateDraft}
          onAdd={() => workspace.addResultRow(application.id)}
          onUpdate={(rowId, patch) => workspace.updateResultRow(application.id, rowId, patch)}
          onRemove={(rowId) => workspace.removeResultRow(application.id, rowId)}
        /> : activeSection.id === "budget" ? <BudgetEditor
          inputRef={sectionInputRef}
          locked={submitted}
          value={workspace.applicationDraft(application.id, activeSection.id)}
          rows={workspace.budgetRowsForApplication(application.id)}
          onChange={updateDraft}
          onAdd={() => workspace.addBudgetRow(application.id)}
          onUpdate={(rowId, patch) => workspace.updateBudgetRow(application.id, rowId, patch)}
          onRemove={(rowId) => workspace.removeBudgetRow(application.id, rowId)}
        /> : activeSection.id === "review" ? <SubmissionReview application={application} issues={issues} snapshot={snapshot} locked={submitted} onReview={setActiveSectionId} onSubmit={openSubmission} /> : <label className="community-long-field">
          <span>{activeSection.fieldLabel}</span>
          <textarea
            rows={13}
            ref={sectionInputRef}
            disabled={submitted}
            value={workspace.applicationDraft(application.id, activeSection.id)}
            onChange={(event) => updateDraft(event.target.value)}
            placeholder={activeSection.guidance}
          />
          <small>{activeSection.owner} · {TEXT.applications.sectionOwner}</small>
        </label>}
        <section className="community-attachments">
          <header>
            <div><span>{TEXT.grants.documents}</span><h3>{activeSection.title}</h3></div>
            <button type="button" disabled={submitted} title={submitted ? TEXT.applications.locked : "Add document metadata to this local prototype"} onClick={() => attachmentInputRef.current?.click()}><Upload />{TEXT.actions.upload}</button>
            <input ref={attachmentInputRef} className="community-file-input" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => uploadFiles(event.target.files)} />
          </header>
          {uploadError && <p className="community-field-error" role="alert">{uploadError}</p>}
          {attachments.length ? attachments.map((attachment) => <div key={attachment.id}>
            <FileText />
            <span><strong>{attachment.name}</strong><small>{formatFileSize(attachment.size)} · {attachment.uploadedBy} · metadata saved locally</small></span>
            <button type="button" disabled={submitted} aria-label={`Remove ${attachment.name}`} title="Remove attachment" onClick={() => workspace.removeAttachment(attachment.id)}><Trash2 /></button>
          </div>) : <p className="community-empty-attachments">No documents added to this section.</p>}
        </section>
      </section>
      <aside className="community-context-rail">
        <ContextualAssistant prompts={[activeSection.prompt]} />
        <section className="community-collaboration">
          <header><div><span>{TEXT.applications.collaboration}</span><h3>{TEXT.applications.comments}</h3></div><Users /></header>
          {workspace.activeOrganization.members.slice(0, 3).map((member) => <div className="community-member" key={member.name}><span>{member.initials}</span><div><strong>{member.name}</strong><small>{member.role}</small></div></div>)}
          {comments.map((item) => <article className="community-comment" key={item.id}><strong>{item.author}</strong><small>{new Date(item.createdAt).toLocaleString()}</small><p>{item.body}</p></article>)}
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!comment.trim()) return;
            workspace.addComment(application.id, activeSection.id, comment);
            setComment("");
          }}>
            <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder={TEXT.applications.comments} />
            <button type="submit" aria-label={TEXT.actions.add}><Send /></button>
          </form>
        </section>
        <section className="community-validation">
          <header>{issues.length ? <AlertCircle /> : <CheckCircle2 />}<div><strong>{TEXT.applications.validation}</strong><small>{issues.length ? `${issues.length} issue${issues.length === 1 ? "" : "s"} remaining` : "Ready for submission"}</small></div></header>
          {issues[0] && <button type="button" onClick={() => setActiveSectionId(issues[0].sectionId)}>{TEXT.applications.resolve}<ChevronRight /></button>}
        </section>
      </aside>
    </div>
    {submitOpen && <div className="community-modal-backdrop" role="presentation" onMouseDown={() => setSubmitOpen(false)}>
      <section ref={modalRef} className="community-modal" role="dialog" aria-modal="true" aria-labelledby="community-submit-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="community-modal__close" onClick={() => setSubmitOpen(false)} aria-label={TEXT.actions.close}><X /></button>
        <span className="community-modal__icon"><FileCheck2 /></span>
        <h2 id="community-submit-title">{TEXT.applications.confirmSubmit}</h2>
        <p>{TEXT.applications.locked}</p>
        <label className="community-check-row"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} />I confirm that I am authorized to submit this application and that the information has been reviewed.</label>
        {submitIssues.length > 0 && <div className="community-modal-errors" role="alert">{submitIssues.map((issue) => <p key={`${issue.sectionId}:${issue.message}`}>{issue.message}</p>)}</div>}
        <div><button type="button" className="button button--secondary" onClick={() => setSubmitOpen(false)}>{TEXT.applications.cancel}</button><button type="button" className="button button--primary" disabled={!attested} onClick={confirmSubmission}>{TEXT.applications.submit}</button></div>
      </section>
    </div>}
  </div>;
}

function ResultsFramework({
  inputRef,
  locked,
  value,
  rows,
  onChange,
  onAdd,
  onUpdate,
  onRemove
}: {
  inputRef: RefObject<HTMLTextAreaElement>;
  locked: boolean;
  value: string;
  rows: ResultFrameworkRow[];
  onChange: (value: string) => void;
  onAdd: () => void;
  onUpdate: (rowId: string, patch: Partial<ResultFrameworkRow>) => void;
  onRemove: (rowId: string) => void;
}) {
  return <div className="community-structured-table">
    <div className="community-structured-head"><span>Level</span><span>Result statement</span><span>Indicator</span><span>Baseline</span><span>Target</span><span aria-hidden="true" /></div>
    {rows.map((row) => <div className="community-structured-row" key={row.id}>
      <select disabled={locked} aria-label="Result level" value={row.level} onChange={(event) => onUpdate(row.id, { level: event.target.value as ResultFrameworkRow["level"] })}><option>Outcome</option><option>Output</option></select>
      <input disabled={locked} aria-label="Result statement" value={row.statement} onChange={(event) => onUpdate(row.id, { statement: event.target.value })} />
      <input disabled={locked} aria-label="Result indicator" value={row.indicator} onChange={(event) => onUpdate(row.id, { indicator: event.target.value })} />
      <input disabled={locked} aria-label="Result baseline" value={row.baseline} onChange={(event) => onUpdate(row.id, { baseline: event.target.value })} />
      <input disabled={locked} aria-label="Result target" value={row.target} onChange={(event) => onUpdate(row.id, { target: event.target.value })} />
      <button type="button" disabled={locked} aria-label="Remove result row" onClick={() => onRemove(row.id)}><Trash2 /></button>
    </div>)}
    <button type="button" disabled={locked} onClick={onAdd}><Plus />Add result</button>
    <label className="community-structured-summary"><span>Results framework notes and verification</span><textarea ref={inputRef} disabled={locked} rows={5} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Explain how the proposed outcomes, outputs, indicators, baselines and targets connect." /></label>
  </div>;
}

function BudgetEditor({
  inputRef,
  locked,
  value,
  rows,
  onChange,
  onAdd,
  onUpdate,
  onRemove
}: {
  inputRef: RefObject<HTMLTextAreaElement>;
  locked: boolean;
  value: string;
  rows: BudgetRow[];
  onChange: (value: string) => void;
  onAdd: () => void;
  onUpdate: (rowId: string, patch: Partial<BudgetRow>) => void;
  onRemove: (rowId: string) => void;
}) {
  const requestedTotal = rows.reduce((total, row) => total + row.requestedAmount, 0);
  const cofinancingTotal = rows.reduce((total, row) => total + row.cofinancingAmount, 0);
  return <div className="community-structured-table community-structured-table--budget">
    <div className="community-structured-head"><span>Budget category</span><span>Requested (US$)</span><span>Cofinancing (US$)</span><span>Contribution status</span><span aria-hidden="true" /></div>
    {rows.map((row) => <div className="community-structured-row" key={row.id}>
      <input disabled={locked} aria-label="Budget category" value={row.category} onChange={(event) => onUpdate(row.id, { category: event.target.value })} />
      <input disabled={locked} aria-label="Requested amount" min="0" type="number" value={row.requestedAmount} onChange={(event) => onUpdate(row.id, { requestedAmount: Number(event.target.value) })} />
      <input disabled={locked} aria-label="Cofinancing amount" min="0" type="number" value={row.cofinancingAmount} onChange={(event) => onUpdate(row.id, { cofinancingAmount: Number(event.target.value) })} />
      <select disabled={locked} aria-label="Contribution status" value={row.contributionStatus} onChange={(event) => onUpdate(row.id, { contributionStatus: event.target.value as BudgetRow["contributionStatus"] })}><option>Planned</option><option>Confirmed</option><option>In-kind</option></select>
      <button type="button" disabled={locked} aria-label="Remove budget row" onClick={() => onRemove(row.id)}><Trash2 /></button>
    </div>)}
    <div className="community-budget-total"><strong>Total</strong><span>US$ {requestedTotal.toLocaleString()}</span><span>US$ {cofinancingTotal.toLocaleString()}</span><span /><span /></div>
    <button type="button" disabled={locked} onClick={onAdd}><Plus />Add budget row</button>
    <label className="community-structured-summary"><span>Budget justification and cofinancing evidence</span><textarea ref={inputRef} disabled={locked} rows={5} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Explain major cost drivers and the source, nature and status of cash and in-kind contributions." /></label>
  </div>;
}

function SubmissionReview({
  application,
  issues,
  snapshot,
  locked,
  onReview,
  onSubmit
}: {
  application: CommunityApplication;
  issues: ValidationIssue[];
  snapshot?: SubmissionSnapshot;
  locked: boolean;
  onReview: (sectionId: string) => void;
  onSubmit: () => void;
}) {
  const complete = application.sections.filter((section) => section.status === "complete").length;
  return <section className="community-submission-review">
    <div className="community-readiness-score"><strong>{Math.round((complete / application.sections.length) * 100)}%</strong><span>{TEXT.applications.validation}</span></div>
    <div>{application.sections.map((section) => <div key={section.id}><span className={`community-section-state community-section-state--${section.status}`}>{section.status === "complete" ? <Check /> : <AlertCircle />}</span><span><strong>{section.title}</strong><small>{section.status.replaceAll("-", " ")}</small></span><button type="button" onClick={() => onReview(section.id)}>{TEXT.actions.review}</button></div>)}</div>
    {locked && snapshot ? <div className="community-readonly-notice"><LockKeyhole /><span><strong>Submitted version {snapshot.version}.0</strong><small>{new Date(snapshot.submittedAt).toLocaleString()} · {snapshot.destination}</small></span></div> : <>
      {issues.length > 0 && <div className="community-review-errors" role="status"><AlertCircle /><span><strong>{issues.length} required section{issues.length === 1 ? "" : "s"} remain</strong><small>Review every highlighted section before submission.</small></span></div>}
      <button className="button button--primary" type="button" disabled={issues.length > 0} onClick={onSubmit}>{TEXT.applications.submit}<ArrowRight /></button>
    </>}
  </section>;
}

function ExternalApplication({ application }: { application: CommunityApplication }) {
  const opportunityGrant = openGrantById(application.opportunityId);
  return <div className="community-detail">
    <AppLink className="community-return-link" href="/workspace/applications"><ArrowLeft />{TEXT.applications.return}</AppLink>
    <header className="community-record-header"><div><span>{TEXT.applications.external}</span><h2>{application.title}</h2><p>{application.opportunity}</p></div><div className="community-record-actions">{opportunityGrant && <AppLink className="button button--secondary" href={openGrantHref(opportunityGrant.id)}><BookOpen />View grant opportunity</AppLink>}<Status tone={application.tone}>{application.status}</Status></div></header>
    <RecordContext record={{ title: application.title, agency: application.agency, programme: application.programme, status: application.status, deadline: application.deadline }} />
    <section className="community-external-handoff">
      <span><ExternalLink /></span>
      <div><h3>{TEXT.applications.external}</h3><p>{application.externalMessage}</p><small><ShieldCheck />{TEXT.system.external}</small></div>
      <a className="button button--primary" href={application.externalUrl} target="_blank" rel="noreferrer">{TEXT.applications.openAgency}<ExternalLink /></a>
    </section>
    <div className="community-two-column">
      <section className="community-panel"><header><div><span>{TEXT.applications.applicationRecord}</span><h3>{TEXT.nextAction}</h3></div></header><p>{application.nextAction}</p><div className="community-record-card__meta"><span>{application.updated}</span><span>{application.deadline}</span></div></section>
      <ContextualAssistant prompts={application.sections.map((section) => section.prompt)} />
    </div>
  </div>;
}

function GrantsList() {
  const workspace = useCommunityWorkspace();
  return <div>
    <header className="community-section-intro"><div><span className="community-kicker">{TEXT.grants.title}</span><h2>{TEXT.grants.body}</h2></div></header>
    {workspace.grants.length ? <div className="community-record-grid">{workspace.grants.map((record) => <RecordCard
      key={record.id}
      href={`/workspace/grants/${record.id}`}
      title={record.title}
      eyebrow={record.reference}
      status={record.status}
      tone={record.tone}
      progress={record.progress}
      metadata={[record.agency, record.period, record.amount, record.nextAction]}
    />)}</div> : <Empty title="No grant records available" body="Conditional awards and active grants appear only for the selected organization." />}
  </div>;
}

function GrantDetail({ grant }: { grant: CommunityGrant }) {
  const active = grant.status === "Active grant";
  return <div className="community-detail">
    <AppLink className="community-return-link" href="/workspace/grants"><ArrowLeft />{TEXT.grants.return}</AppLink>
    <header className="community-record-header"><div><span>{TEXT.grants.grantRecord} · {grant.reference}</span><h2>{grant.title}</h2><p>{grant.country} · {grant.period}</p></div><button type="button" className="button button--secondary"><FolderOpen />{TEXT.grants.documents}</button></header>
    <RecordContext record={{ title: grant.title, agency: grant.agency, programme: grant.programme, status: grant.status }} />
    <div className="community-grant-summary">
      <div><span>{TEXT.grants.amount}</span><strong>{grant.amount}</strong></div>
      <div><span>{TEXT.grants.period}</span><strong>{grant.period}</strong></div>
      <div><span>{TEXT.nextAction}</span><strong>{grant.nextAction}</strong></div>
      <Progress value={grant.progress} label={active ? TEXT.grants.delivery : TEXT.grants.award} />
    </div>
    <div className="community-two-column community-two-column--wide">
      <section className="community-panel">
        <header><div><span>{active ? TEXT.grants.milestones : TEXT.grants.award}</span><h3>{grant.status}</h3></div></header>
        <div className="community-requirement-list">{(active ? grant.milestones : grant.requirements).map((item) => <div key={item.title}><span className={`community-section-state community-section-state--${item.status === "Complete" ? "complete" : "in-progress"}`}>{item.status === "Complete" ? <Check /> : <Clock3 />}</span><span><strong>{item.title}</strong><small>{"date" in item ? item.date : item.due}</small></span><Status tone={item.status === "Complete" ? "success" : item.status.includes("Required") || item.status.includes("Due") ? "warning" : "info"}>{item.status}</Status></div>)}</div>
      </section>
      <section className="community-panel">
        <header><div><span>{TEXT.grants.changes}</span><h3>{TEXT.nextAction}</h3></div><button type="button"><Plus />{TEXT.grants.createChange}</button></header>
        <div className="community-empty-inline"><RefreshCw /><p>{active ? grant.nextAction : grant.requirements.find((item) => item.status === "Required")?.title}</p></div>
      </section>
    </div>
    <ContextualAssistant prompts={[
      "What evidence should we prepare for the next grant milestone?",
      "Find practical resources related to this grant’s implementation priorities."
    ]} />
  </div>;
}

function VisitsList() {
  const workspace = useCommunityWorkspace();
  return <div>
    <header className="community-section-intro"><div><span className="community-kicker">{TEXT.visits.title}</span><h2>{TEXT.visits.body}</h2></div></header>
    {workspace.visits.length ? <div className="community-record-grid">{workspace.visits.map((record) => <RecordCard
      key={record.id}
      href={`/workspace/visits/${record.id}`}
      title={record.title}
      eyebrow={record.location}
      status={record.status}
      tone={record.tone}
      progress={Math.round((record.preparation.filter((item) => item.complete).length / record.preparation.length) * 100)}
      metadata={[record.date, record.lead, workspace.grants.find((grant) => grant.id === record.grantId)?.title || record.grantId]}
      action={TEXT.actions.prepare}
    />)}</div> : <Empty title="No field visits available" body="Visit preparation appears when an authorized visit is linked to one of this organization's grants." />}
  </div>;
}

function VisitDetail({ visit }: { visit: CommunityVisit }) {
  const [preparation, setPreparation] = useState(visit.preparation);
  return <div className="community-detail">
    <AppLink className="community-return-link" href="/workspace/visits"><ArrowLeft />{TEXT.visits.return}</AppLink>
    <header className="community-record-header"><div><span>{TEXT.visits.visitRecord}</span><h2>{visit.title}</h2><p>{visit.date} · {visit.location}</p></div><Status tone={visit.tone}>{visit.status}</Status></header>
    <RecordContext record={{ title: visit.title, agency: "UNDP", programme: "Ghana Country Programme", status: visit.status, deadline: visit.date }} />
    <div className="community-visit-grid">
      <section className="community-panel">
        <header><div><span>{TEXT.visits.preparation}</span><h3>{visit.date}</h3></div></header>
        <div className="community-checklist">{preparation.map((item, index) => <label key={item.title}><input type="checkbox" checked={item.complete} onChange={() => setPreparation((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, complete: !entry.complete } : entry))} /><span><strong>{item.title}</strong><small>{item.complete ? TEXT.system.autosaved : TEXT.nextAction}</small></span></label>)}</div>
      </section>
      <section className="community-panel">
        <header><div><span>{TEXT.visits.observations}</span><h3>{TEXT.actions.review}</h3></div></header>
        <div className="community-observation-list">{visit.observations.map((item) => <div key={item.label}><strong>{item.label}</strong><p>{item.value}</p></div>)}</div>
      </section>
      <section className="community-panel community-panel--full">
        <header><div><span>{TEXT.visits.followUp}</span><h3>{visit.followUp.length} {TEXT.nextAction}</h3></div></header>
        <div className="community-requirement-list">{visit.followUp.map((item) => <div key={item.title}><AlertCircle /><span><strong>{item.title}</strong><small>{item.owner} · {item.due}</small></span><Status tone="warning">{item.status}</Status></div>)}</div>
      </section>
    </div>
    <ContextualAssistant prompts={["Create a field visit preparation checklist based on approved SGP guidance."]} />
  </div>;
}

function ReportsList() {
  const workspace = useCommunityWorkspace();
  return <div>
    <header className="community-section-intro"><div><span className="community-kicker">{TEXT.reports.title}</span><h2>{TEXT.reports.body}</h2></div></header>
    {workspace.reports.length ? <div className="community-record-grid">{workspace.reports.map((record) => <RecordCard
      key={record.id}
      href={`/workspace/reports/${record.id}`}
      title={record.title}
      eyebrow={record.period}
      status={record.status}
      tone={record.tone}
      progress={record.progress}
      metadata={[`${TEXT.reports.due}: ${record.due}`, workspace.grants.find((grant) => grant.id === record.grantId)?.title || record.grantId]}
      action={record.status === "Changes requested" ? TEXT.actions.review : TEXT.actions.continue}
    />)}</div> : <Empty title="No reports available" body="Reporting requirements appear when they are linked to one of this organization's grants." />}
  </div>;
}

function ReportDetail({ report }: { report: CommunityReport }) {
  return <div className="community-detail">
    <AppLink className="community-return-link" href="/workspace/reports"><ArrowLeft />{TEXT.reports.return}</AppLink>
    <header className="community-record-header"><div><span>{TEXT.reports.reportRecord} · {report.period}</span><h2>{report.title}</h2><p>{TEXT.reports.due}: {report.due}</p></div><Status tone={report.tone}>{report.status}</Status></header>
    <RecordContext record={{ title: report.title, agency: "UNDP", programme: "Ghana Country Programme", status: report.status, deadline: report.due }} />
    {report.requestedChanges?.length && <section className="community-requested-changes"><AlertCircle /><div><h3>{TEXT.reports.changes}</h3>{report.requestedChanges.map((item) => <p key={item}>{item}</p>)}</div></section>}
    <div className="community-two-column community-two-column--wide">
      <section className="community-panel">
        <header><div><span>{TEXT.reports.sections}</span><h3>{report.progress}%</h3></div></header>
        <Progress value={report.progress} />
        <div className="community-requirement-list">{report.sections.map((section) => <div key={section.title}><span className={`community-section-state community-section-state--${section.status === "Complete" ? "complete" : section.status === "Changes requested" ? "changes-requested" : "in-progress"}`}>{section.status === "Complete" ? <Check /> : section.status === "Changes requested" ? <AlertCircle /> : <Circle />}</span><span><strong>{section.title}</strong><small>{section.owner}</small></span><Status tone={section.status === "Complete" ? "success" : section.status === "Changes requested" ? "warning" : "info"}>{section.status}</Status></div>)}</div>
      </section>
      <section className="community-panel">
        <header><div><span>{TEXT.reports.learning}</span><h3>{report.knowledgeCandidate?.title || TEXT.nextAction}</h3></div></header>
        {report.knowledgeCandidate ? <div className="community-learning-card"><BookOpen /><p>{report.knowledgeCandidate.summary}</p><Status tone="warning">{report.knowledgeCandidate.clearance}</Status></div> : <div className="community-guidance"><FileText /><div><strong>{TEXT.reports.body}</strong><p>{TEXT.ai.limitation}</p></div></div>}
      </section>
    </div>
    <ContextualAssistant prompts={[
      "Which evidence should be included in a progress report for this type of project?",
      "Help me identify learning from these results without drafting unverified claims."
    ]} />
  </div>;
}

function SupportLanding() {
  const workspace = useCommunityWorkspace();
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<CommunitySupportRequest | null>(null);
  const [selectedService, setSelectedService] = useState(COMMUNITY_SERVICE_CATALOG[0].id);
  const openRequest = (serviceId = COMMUNITY_SERVICE_CATALOG[0].id) => {
    setSelectedService(serviceId);
    setCreatedRequest(null);
    setNewRequestOpen(true);
  };
  return <div>
    <header className="community-section-intro">
      <div><span className="community-kicker">{TEXT.support.title}</span><h2>{TEXT.support.body}</h2></div>
      <button type="button" className="button button--primary" onClick={() => openRequest()}><Plus />{TEXT.support.new}</button>
    </header>
    <section className="community-service-catalog">
      <header><span>{TEXT.support.catalog}</span><h3>{TEXT.support.new}</h3></header>
      <div>{COMMUNITY_SERVICE_CATALOG.map((item) => <button type="button" key={item.id} onClick={() => openRequest(item.id)}><span><MessageSquareText /></span><strong>{item.title}</strong><p>{item.body}</p><ArrowRight /></button>)}</div>
    </section>
    <section className="community-panel">
      <header><div><span>{TEXT.support.open}</span><h3>{workspace.supportRequests.length}</h3></div></header>
      {workspace.supportRequests.length ? <div className="community-support-list">{workspace.supportRequests.map((request) => <AppLink href={`/workspace/support/${request.id}`} key={request.id}><MessageSquareText /><span><strong>{request.title}</strong><small>{request.category} · {request.updated} · {request.owner}</small></span><Status tone={request.tone}>{request.status}</Status><ChevronRight /></AppLink>)}</div> : <div className="community-empty-inline"><MessageSquareText /><p>No support requests are open for this organization.</p></div>}
    </section>
    {newRequestOpen && <div className="community-modal-backdrop" role="presentation" onMouseDown={() => setNewRequestOpen(false)}>
      <section className="community-modal community-modal--form" role="dialog" aria-modal="true" aria-label={TEXT.support.new} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="community-modal__close" onClick={() => setNewRequestOpen(false)} aria-label={TEXT.actions.close}><X /></button>
        {createdRequest ? <div className="community-success-state"><CheckCircle2 /><h2>Request {createdRequest.id} created</h2><p>Your message is saved in this organization workspace and can be continued from its request record.</p><div><AppLink className="button button--primary" href={`/workspace/support/${createdRequest.id}`}>Open request</AppLink><button type="button" className="button button--secondary" onClick={() => setNewRequestOpen(false)}>{TEXT.actions.close}</button></div></div> : <form onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const created = workspace.createSupportRequest({
            category: COMMUNITY_SERVICE_CATALOG.find((item) => item.id === selectedService)?.title || selectedService,
            relatedRecordId: String(form.get("relatedRecordId") || "") || undefined,
            subject: String(form.get("subject") || ""),
            message: String(form.get("message") || "")
          });
          if (created) setCreatedRequest(created);
        }}>
          <h2>{TEXT.support.new}</h2>
          <label>{TEXT.support.category}<select value={selectedService} onChange={(event) => setSelectedService(event.target.value)}>{COMMUNITY_SERVICE_CATALOG.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label>{TEXT.support.related}<select name="relatedRecordId"><option value="">General support</option>{[...workspace.applications, ...workspace.grants].map((record) => <option key={record.id} value={record.id}>{record.title}</option>)}</select></label>
          <label>{TEXT.support.subject}<input name="subject" required /></label>
          <label>{TEXT.support.message}<textarea name="message" rows={6} required /></label>
          <button className="button button--primary" type="submit">{TEXT.support.send}</button>
        </form>}
      </section>
    </div>}
  </div>;
}

function SupportDetail({ request }: { request: CommunitySupportRequest }) {
  const workspace = useCommunityWorkspace();
  const [reply, setReply] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachments = workspace.attachmentsForRecord(request.id);
  return <div className="community-detail">
    <AppLink className="community-return-link" href="/workspace/support"><ArrowLeft />{TEXT.support.return}</AppLink>
    <header className="community-record-header"><div><span>{TEXT.support.requestRecord} · {request.id}</span><h2>{request.title}</h2><p>{request.category} · {request.updated}</p></div><Status tone={request.tone}>{request.status}</Status></header>
    <section className="community-support-meta"><div><span>{TEXT.support.owner}</span><strong>{request.owner}</strong></div><div><span>{TEXT.support.related}</span><strong>{request.relatedRecordId}</strong></div><div><span>{TEXT.status}</span><strong>{request.status}</strong></div></section>
    <div className="community-support-thread">
      {request.messages.map((message, index) => <article key={`${message.date}-${index}`} className={index % 2 ? "team" : ""}><div><strong>{message.author}</strong><span>{message.role} · {message.date}</span></div><p>{message.body}</p></article>)}
      {attachments.length > 0 && <section className="community-support-files"><strong>Request documents</strong>{attachments.map((attachment) => <span key={attachment.id}><Paperclip />{attachment.name}<small>{formatFileSize(attachment.size)}</small></span>)}</section>}
      {uploadError && <p className="community-field-error" role="alert">{uploadError}</p>}
      <form onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (!reply.trim()) return;
        workspace.addSupportReply(request.id, reply);
        setReply("");
      }}>
        <label>{TEXT.support.reply}<textarea rows={4} value={reply} onChange={(event) => setReply(event.target.value)} /></label>
        <div>
          <input ref={fileInputRef} className="community-file-input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const result = workspace.addAttachment(request.id, undefined, { name: file.name, size: file.size, type: file.type });
            setUploadError(result.ok ? "" : result.error || "The file could not be added.");
            event.target.value = "";
          }} />
          <button type="button" className="button button--secondary" onClick={() => fileInputRef.current?.click()}><Paperclip />{TEXT.actions.upload}</button>
          <button type="submit" className="button button--primary"><Send />{TEXT.actions.reply}</button>
        </div>
      </form>
    </div>
  </div>;
}

function Notifications() {
  const workspace = useCommunityWorkspace();
  return <div><header className="community-section-intro"><div><span className="community-kicker">{TEXT.account.notifications}</span><h2>{TEXT.nextAction}</h2></div></header>{workspace.notifications.length ? <div className="community-notification-list">{workspace.notifications.map((item) => <AppLink key={item.id} href={item.href} className={item.read ? "" : "unread"}><Bell /><span><strong>{item.title}</strong><p>{item.body}</p></span><ChevronRight /></AppLink>)}</div> : <Empty title="No notifications" body="Action alerts for the selected organization will appear here." />}</div>;
}

function SavedItems({ count }: { count: number }) {
  const rows = [
    [TEXT.account.saved, `${count}`, "/knowledge/saved"],
    [TEXT.grants.title, "1", "/funding"],
    [TEXT.applications.title, "2", "/workspace/applications"]
  ];
  return <div><header className="community-section-intro"><div><span className="community-kicker">{TEXT.account.saved}</span><h2>{TEXT.overview.currentWork}</h2></div></header><div className="community-saved-grid">{rows.map(([title, value, href]) => <AppLink href={href} key={title}><BookOpen /><strong>{value}</strong><span>{title}</span><ArrowRight /></AppLink>)}</div></div>;
}

function AiHistory() {
  const assistant = useAssistant();
  return <div><header className="community-section-intro"><div><span className="community-kicker">{TEXT.account.history}</span><h2>{TEXT.ai.title}</h2></div></header>{assistant.messages.length ? <div className="community-history-card"><History /><div><strong>{assistant.messages.filter((item) => item.role === "human").at(-1)?.content}</strong><p>{assistant.statusText}</p></div><button type="button" onClick={() => assistant.setDockOpen(true)}>{TEXT.actions.open}<ArrowRight /></button></div> : <Empty title={TEXT.account.history} body={TEXT.ai.body} />}</div>;
}

function Profile() {
  const workspace = useCommunityWorkspace();
  const [saved, setSaved] = useState(false);
  return <div>
    <header className="community-section-intro"><div><span className="community-kicker">{TEXT.account.profile}</span><h2>{workspace.activeOrganization.name}</h2></div><button type="button" className="button button--secondary"><UserPlus />{TEXT.account.invite}</button></header>
    <div className="community-profile-grid">
      <section className="community-panel"><header><div><span>{TEXT.account.members}</span><h3>{workspace.activeOrganization.members.length}</h3></div></header>{workspace.activeOrganization.members.map((member) => <div className="community-profile-member" key={member.name}><span>{member.initials}</span><div><strong>{member.name}</strong><small>{member.role}</small></div><button type="button" aria-label={TEXT.actions.review}><ChevronRight /></button></div>)}</section>
      <form className="community-panel" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}><header><div><span>{TEXT.account.preferences}</span><h3>{TEXT.account.profile}</h3></div></header><label><Languages />{TEXT.account.preferences}<select><option>English</option><option>Français</option><option>Español</option><option>العربية</option></select></label><label className="community-check-row"><input type="checkbox" defaultChecked />{TEXT.account.notifications}</label><label className="community-check-row"><input type="checkbox" defaultChecked />{TEXT.updated}</label><button className="button button--primary" type="submit">{TEXT.account.save}</button>{saved && <Status tone="success"><CheckCircle2 />{TEXT.system.autosaved}</Status>}</form>
    </div>
  </div>;
}

function RecordUnavailable({ type }: { type: string }) {
  return <section className="community-zero-state community-zero-state--warning" role="status">
    <ShieldCheck />
    <div><h2>{type} unavailable</h2><p>This record does not exist or is not available to the selected organization. No other organization’s data has been shown.</p></div>
    <AppLink className="button button--secondary" href={`/workspace/${type.toLowerCase()}`}>Return to {type.toLowerCase()}</AppLink>
  </section>;
}

export function CommunityWorkspace({ path, role, saved }: CommunityWorkspaceProps) {
  const workspace = useCommunityWorkspace();
  const section = path.split("/")[2] || "overview";
  const recordId = path.split("/")[3];
  let content: ReactNode;
  if (section === "overview") content = <Overview role={role} />;
  else if (section === "applications") {
    const application = recordId ? workspace.getApplication(recordId) : null;
    content = recordId ? application ? <ApplicationDetail application={application} /> : <RecordUnavailable type="Applications" /> : <ApplicationsList />;
  } else if (section === "grants") {
    const grant = recordId ? workspace.getGrant(recordId) : null;
    content = recordId ? grant ? <GrantDetail grant={grant} /> : <RecordUnavailable type="Grants" /> : <GrantsList />;
  } else if (section === "visits") {
    const visit = recordId ? workspace.visits.find((item) => item.id === recordId) : null;
    content = recordId ? visit ? <VisitDetail visit={visit} /> : <RecordUnavailable type="Visits" /> : <VisitsList />;
  } else if (section === "reports") {
    const report = recordId ? workspace.reports.find((item) => item.id === recordId) : null;
    content = recordId ? report ? <ReportDetail report={report} /> : <RecordUnavailable type="Reports" /> : <ReportsList />;
  } else if (section === "support") {
    const request = recordId ? workspace.supportRequests.find((item) => item.id === recordId) : null;
    content = recordId ? request ? <SupportDetail request={request} /> : <RecordUnavailable type="Support" /> : <SupportLanding />;
  } else if (section === "notifications") content = <Notifications />;
  else if (section === "saved") content = <SavedItems count={saved.length} />;
  else if (section === "ai-chat-history") content = <AiHistory />;
  else if (section === "profile") content = <Profile />;
  else content = <Overview role={role} />;

  return <div className="community-workspace">
    <WorkspaceContext role={role} />
    {content}
  </div>;
}
