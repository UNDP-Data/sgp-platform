import {
  AlertCircle, ArrowLeft, BookOpen, Check, CheckCircle2, ChevronRight, Download, FileCheck2,
  FileText, History, LockKeyhole, MessageSquareText, Paperclip, Plus, RotateCcw, Save, Send,
  ShieldCheck, Sparkles, Trash2, Upload, WifiOff, X
} from "lucide-react";
import {
  type ChangeEvent, type CSSProperties, type FormEvent, useCallback, useEffect, useMemo, useRef, useState
} from "react";
import { AppLink } from "../components/AppLink";
import { Empty } from "../components/PagePrimitives";
import { useAssistant } from "../contexts/AssistantContext";
import {
  DEFAULT_BUDGET_ROWS, DEFAULT_DOCUMENT_CHECKLIST, DEFAULT_RESULT_ROWS, DEFAULT_RISK_ROWS,
  DEFAULT_WORKPLAN_ROWS, GRANT_APPLICATION_SECTIONS, grantApplicationProgress, parseStructuredRows,
  seedStructuredApplicationValues, serializeStructuredRows, validateGrantApplication,
  type BudgetRow, type DocumentChecklistItem, type GrantApplicationField, type GrantApplicationSectionId,
  type ResultRow, type RiskRow, type WorkplanRow
} from "./grantApplicationModel";
import { canEditWorkflowRecord, type WorkflowValue } from "./workflowDefinitions";
import { useWorkflowActions } from "./workflowBackend";
import { type WorkflowAttachment, type WorkflowNote, useWorkflowStore } from "./workflowStore";

type SaveState = "Saved" | "Unsaved changes" | "Saving" | "Save failed";
type ResultState = { tone: "success" | "error"; message: string } | null;

function uid(prefix: string) {
  const value = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${value}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function noteSection(body: string) {
  const match = /^\[application-section:([^\]]+)]\s*/.exec(body);
  return match ? { sectionId: match[1], body: body.slice(match[0].length) } : null;
}

function attachmentSection(recordId: string, attachment: WorkflowAttachment) {
  const prefix = `${recordId}--`;
  if (!attachment.id.startsWith(prefix)) return "documents";
  return attachment.id.slice(prefix.length).split("--")[0] || "documents";
}

function ApplicationProgress({ value }: { value: number }) {
  return <div className="grant-application-progress" style={{ "--application-progress": `${value}%` } as CSSProperties}>
    <div><span>Application completeness</span><strong>{value}%</strong></div>
    <span><i /></span>
  </div>;
}

function FieldControl({ field, value, disabled, onChange }: {
  field: GrantApplicationField;
  value: WorkflowValue | undefined;
  disabled: boolean;
  onChange: (value: WorkflowValue) => void;
}) {
  if (field.type === "textarea") return <textarea rows={5} value={String(value ?? "")} disabled={disabled} onChange={(event) => onChange(event.target.value)} />;
  if (field.type === "select") return <select value={String(value ?? "")} disabled={disabled} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>;
  if (field.type === "checkbox") return <span className="grant-application-check"><input type="checkbox" checked={value === true} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span>{field.help || "Confirm this requirement"}</span></span>;
  return <input type={field.type} min={field.type === "number" ? 0 : undefined} value={String(value ?? "")} disabled={disabled} onChange={(event) => onChange(field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} />;
}

function ResultsEditor({ rows, disabled, onChange }: { rows: ResultRow[]; disabled: boolean; onChange: (rows: ResultRow[]) => void }) {
  const update = (id: string, patch: Partial<ResultRow>) => onChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  return <div className="grant-structured-table grant-structured-table--results">
    <div className="grant-structured-head"><span>Level</span><span>Result statement</span><span>Indicator</span><span>Baseline</span><span>Target</span><span>Verification</span><span /></div>
    {rows.map((row) => <div className="grant-structured-row" key={row.id}>
      <select aria-label="Result level" disabled={disabled} value={row.level} onChange={(event) => update(row.id, { level: event.target.value as ResultRow["level"] })}><option>Outcome</option><option>Output</option></select>
      <input aria-label="Result statement" disabled={disabled} value={row.statement} onChange={(event) => update(row.id, { statement: event.target.value })} />
      <input aria-label="Result indicator" disabled={disabled} value={row.indicator} onChange={(event) => update(row.id, { indicator: event.target.value })} />
      <input aria-label="Result baseline" disabled={disabled} value={row.baseline} onChange={(event) => update(row.id, { baseline: event.target.value })} />
      <input aria-label="Result target" disabled={disabled} value={row.target} onChange={(event) => update(row.id, { target: event.target.value })} />
      <input aria-label="Verification source" disabled={disabled} value={row.verification} onChange={(event) => update(row.id, { verification: event.target.value })} />
      <button type="button" disabled={disabled || rows.length === 1} title="Remove result" onClick={() => onChange(rows.filter((item) => item.id !== row.id))}><Trash2 /></button>
    </div>)}
    <button type="button" disabled={disabled} onClick={() => onChange([...rows, { id: uid("result"), level: "Output", statement: "", indicator: "", baseline: "", target: "", verification: "" }])}><Plus /> Add result</button>
  </div>;
}

function WorkplanEditor({ rows, disabled, onChange }: { rows: WorkplanRow[]; disabled: boolean; onChange: (rows: WorkplanRow[]) => void }) {
  const update = (id: string, patch: Partial<WorkplanRow>) => onChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  return <div className="grant-structured-table grant-structured-table--workplan">
    <div className="grant-structured-head"><span>Activity</span><span>Linked result</span><span>Owner</span><span>Start</span><span>End</span><span>Milestone</span><span /></div>
    {rows.map((row) => <div className="grant-structured-row" key={row.id}>
      <input aria-label="Workplan activity" disabled={disabled} value={row.activity} onChange={(event) => update(row.id, { activity: event.target.value })} />
      <input aria-label="Linked result" disabled={disabled} value={row.result} onChange={(event) => update(row.id, { result: event.target.value })} />
      <input aria-label="Activity owner" disabled={disabled} value={row.owner} onChange={(event) => update(row.id, { owner: event.target.value })} />
      <input aria-label="Activity start" disabled={disabled} value={row.start} onChange={(event) => update(row.id, { start: event.target.value })} />
      <input aria-label="Activity end" disabled={disabled} value={row.end} onChange={(event) => update(row.id, { end: event.target.value })} />
      <input aria-label="Activity milestone" disabled={disabled} value={row.milestone} onChange={(event) => update(row.id, { milestone: event.target.value })} />
      <button type="button" disabled={disabled || rows.length === 1} title="Remove activity" onClick={() => onChange(rows.filter((item) => item.id !== row.id))}><Trash2 /></button>
    </div>)}
    <button type="button" disabled={disabled} onClick={() => onChange([...rows, { id: uid("activity"), activity: "", result: "", owner: "", start: "", end: "", milestone: "" }])}><Plus /> Add activity</button>
  </div>;
}

function BudgetEditor({ rows, disabled, onChange }: { rows: BudgetRow[]; disabled: boolean; onChange: (rows: BudgetRow[]) => void }) {
  const update = (id: string, patch: Partial<BudgetRow>) => onChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  const requested = rows.reduce((sum, row) => sum + (Number(row.requestedAmount) || 0), 0);
  const cofinancing = rows.reduce((sum, row) => sum + (Number(row.cofinancingAmount) || 0), 0);
  return <div className="grant-structured-table grant-structured-table--budget">
    <div className="grant-structured-head"><span>Category</span><span>Requested</span><span>Cofinancing</span><span>Type</span><span>Status</span><span>Justification</span><span /></div>
    {rows.map((row) => <div className="grant-structured-row" key={row.id}>
      <input aria-label="Budget category" disabled={disabled} value={row.category} onChange={(event) => update(row.id, { category: event.target.value })} />
      <input aria-label="Requested amount" type="number" min="0" disabled={disabled} value={row.requestedAmount} onChange={(event) => update(row.id, { requestedAmount: Number(event.target.value) })} />
      <input aria-label="Cofinancing amount" type="number" min="0" disabled={disabled} value={row.cofinancingAmount} onChange={(event) => update(row.id, { cofinancingAmount: Number(event.target.value) })} />
      <select aria-label="Contribution type" disabled={disabled} value={row.contributionType} onChange={(event) => update(row.id, { contributionType: event.target.value as BudgetRow["contributionType"] })}><option>Cash</option><option>In-kind</option><option>Not applicable</option></select>
      <select aria-label="Contribution status" disabled={disabled} value={row.status} onChange={(event) => update(row.id, { status: event.target.value as BudgetRow["status"] })}><option>Planned</option><option>Confirmed</option></select>
      <input aria-label="Budget justification" disabled={disabled} value={row.justification} onChange={(event) => update(row.id, { justification: event.target.value })} />
      <button type="button" disabled={disabled || rows.length === 1} title="Remove budget row" onClick={() => onChange(rows.filter((item) => item.id !== row.id))}><Trash2 /></button>
    </div>)}
    <div className="grant-structured-total"><strong>Total</strong><span>US$ {requested.toLocaleString()}</span><span>US$ {cofinancing.toLocaleString()}</span><span /><span /><span /><span /></div>
    <button type="button" disabled={disabled} onClick={() => onChange([...rows, { id: uid("budget"), category: "", requestedAmount: 0, cofinancingAmount: 0, contributionType: "Not applicable", status: "Planned", justification: "" }])}><Plus /> Add budget row</button>
  </div>;
}

function RiskEditor({ rows, disabled, onChange }: { rows: RiskRow[]; disabled: boolean; onChange: (rows: RiskRow[]) => void }) {
  const update = (id: string, patch: Partial<RiskRow>) => onChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  return <div className="grant-structured-table grant-structured-table--risks">
    <div className="grant-structured-head"><span>Risk</span><span>Category</span><span>Rating</span><span>Mitigation</span><span>Owner</span><span /></div>
    {rows.map((row) => <div className="grant-structured-row" key={row.id}>
      <input aria-label="Risk description" disabled={disabled} value={row.risk} onChange={(event) => update(row.id, { risk: event.target.value })} />
      <select aria-label="Risk category" disabled={disabled} value={row.category} onChange={(event) => update(row.id, { category: event.target.value as RiskRow["category"] })}><option>Environmental</option><option>Social</option><option>Fiduciary</option><option>Delivery</option><option>Safety</option><option>Other</option></select>
      <select aria-label="Risk rating" disabled={disabled} value={row.rating} onChange={(event) => update(row.id, { rating: event.target.value as RiskRow["rating"] })}><option>Low</option><option>Moderate</option><option>High</option></select>
      <input aria-label="Risk mitigation" disabled={disabled} value={row.mitigation} onChange={(event) => update(row.id, { mitigation: event.target.value })} />
      <input aria-label="Risk owner" disabled={disabled} value={row.owner} onChange={(event) => update(row.id, { owner: event.target.value })} />
      <button type="button" disabled={disabled || rows.length === 1} title="Remove risk" onClick={() => onChange(rows.filter((item) => item.id !== row.id))}><Trash2 /></button>
    </div>)}
    <button type="button" disabled={disabled} onClick={() => onChange([...rows, { id: uid("risk"), risk: "", category: "Other", rating: "Moderate", mitigation: "", owner: "" }])}><Plus /> Add risk</button>
  </div>;
}

function DocumentsEditor({ rows, disabled, onChange }: { rows: DocumentChecklistItem[]; disabled: boolean; onChange: (rows: DocumentChecklistItem[]) => void }) {
  return <div className="grant-document-checklist">
    {rows.map((row) => <label key={row.id}><input type="checkbox" disabled={disabled} checked={row.confirmed} onChange={(event) => onChange(rows.map((item) => item.id === row.id ? { ...item, confirmed: event.target.checked } : item))} /><span><strong>{row.label}</strong><small>{row.required ? "Required for submission" : "Include when relevant"}</small></span></label>)}
  </div>;
}

function ApplicationFiles({ recordId, sectionId, disabled }: { recordId: string; sectionId: GrantApplicationSectionId; disabled: boolean }) {
  const record = useWorkflowStore((state) => state.records.find((item) => item.id === recordId));
  const { uploadEvidence, downloadEvidence, removeEvidence } = useWorkflowActions();
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ResultState>(null);
  const [busy, setBusy] = useState(false);
  const files = (record?.attachments || []).filter((item) => attachmentSection(recordId, item) === sectionId);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!record || !selected.length) return;
    setBusy(true);
    let stored = 0;
    for (const file of selected) {
      const attachment: WorkflowAttachment = {
        id: `${record.id}--${sectionId}--${Date.now()}-${stored}`,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        storedAt: new Date().toISOString(),
        storedBy: "national-coordinator"
      };
      const response = await uploadEvidence(record, "national-coordinator", file, attachment);
      if (response.ok) stored += 1;
      else setResult({ tone: "error", message: response.errors.join(" ") });
    }
    if (stored) setResult({ tone: "success", message: `${stored} ${stored === 1 ? "file" : "files"} added to ${GRANT_APPLICATION_SECTIONS.find((item) => item.id === sectionId)?.title}.` });
    setBusy(false);
  };

  const download = async (attachment: WorkflowAttachment) => {
    if (!record) return;
    const blob = await downloadEvidence(record, "national-coordinator", attachment);
    if (blob) downloadBlob(blob, attachment.name);
    else setResult({ tone: "error", message: "The stored file content is unavailable." });
  };

  const remove = async (attachment: WorkflowAttachment) => {
    if (!record) return;
    const response = await removeEvidence(record, "national-coordinator", attachment);
    setResult(response.ok ? { tone: "success", message: `${attachment.name} removed.` } : { tone: "error", message: response.errors.join(" ") });
  };

  return <section className="grant-application-files">
    <header><div><Paperclip /><span><h4>Section documents</h4><p>Attach evidence directly to this application section.</p></span></div>{!disabled && <button type="button" onClick={() => input.current?.click()} disabled={busy}><Upload /> {busy ? "Uploading" : "Add files"}</button>}</header>
    <input ref={input} className="sr-only" type="file" multiple onChange={upload} />
    {files.length ? <div>{files.map((attachment) => <article key={attachment.id}><FileText /><span><strong>{attachment.name}</strong><small>{formatBytes(attachment.size)} · {formatDateTime(attachment.storedAt)}</small></span><button type="button" title={`Download ${attachment.name}`} onClick={() => download(attachment)}><Download /></button>{!disabled && <button type="button" title={`Remove ${attachment.name}`} onClick={() => remove(attachment)}><Trash2 /></button>}</article>)}</div> : <p className="grant-empty-note">No files attached to this section.</p>}
    {result && <p className={`grant-inline-result grant-inline-result--${result.tone}`} role={result.tone === "error" ? "alert" : "status"}>{result.message}</p>}
  </section>;
}

function ApplicationComments({ recordId, sectionId, disabled }: { recordId: string; sectionId: GrantApplicationSectionId; disabled: boolean }) {
  const notes = useWorkflowStore((state) => state.records.find((item) => item.id === recordId)?.notes || []);
  const { addNote } = useWorkflowActions();
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const comments = notes.flatMap((note) => {
    const parsed = noteSection(note.body);
    return parsed?.sectionId === sectionId ? [{ ...note, body: parsed.body }] : [];
  });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await addNote(recordId, "national-coordinator", `[application-section:${sectionId}] ${comment.trim()}`);
    if (response.ok) { setComment(""); setError(""); }
    else setError(response.errors.join(" "));
  };
  return <section className="grant-application-comments">
    <header><MessageSquareText /><div><h4>Section notes</h4><p>Internal collaboration remains attributable in the audit record.</p></div></header>
    {comments.length ? <div>{[...comments].reverse().map((note: WorkflowNote) => <article key={note.id}><strong>{note.createdBy.replaceAll("-", " ")}</strong><small>{formatDateTime(note.createdAt)}</small><p>{note.body}</p></article>)}</div> : <p className="grant-empty-note">No notes on this section.</p>}
    {!disabled && <form onSubmit={submit}><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a section note" /><button type="submit" disabled={!comment.trim()} title="Add note"><Send /></button></form>}
    {error && <p className="grant-inline-result grant-inline-result--error" role="alert">{error}</p>}
  </section>;
}

function ContextualAssistant({ prompt }: { prompt: string }) {
  const assistant = useAssistant();
  return <section className="grant-application-ai"><header><Sparkles /><div><h4>Ask SGP AI</h4><p>Use approved guidance and comparable project evidence.</p></div></header><button type="button" onClick={() => { assistant.setDraft(prompt); assistant.setDockOpen(true); }}>{prompt}<ChevronRight /></button><small><ShieldCheck /> AI cannot determine eligibility, approve or submit this application.</small></section>;
}

function SubmissionSnapshot({ value }: { value: WorkflowValue | undefined }) {
  if (typeof value !== "string" || !value) return null;
  try {
    const snapshot = JSON.parse(value) as { version: number; submittedAt: string; submittedBy: string };
    return <div className="grant-submission-confirmation"><CheckCircle2 /><span><strong>Submission version {snapshot.version}.0 preserved</strong><small>{formatDateTime(snapshot.submittedAt)} · {snapshot.submittedBy}</small></span></div>;
  } catch {
    return null;
  }
}

export function GrantApplicationDetail({ recordId }: { recordId: string }) {
  const record = useWorkflowStore((state) => state.records.find((item) => item.id === recordId));
  const { updateRecord, advanceRecord, returnRecord } = useWorkflowActions();
  const updateRecordRef = useRef(updateRecord);
  const [title, setTitle] = useState("");
  const [queueSummary, setQueueSummary] = useState("");
  const [values, setValues] = useState<Record<string, WorkflowValue>>({});
  const [activeSectionId, setActiveSectionId] = useState<GrantApplicationSectionId>("overview");
  const [saveState, setSaveState] = useState<SaveState>("Saved");
  const [dirty, setDirty] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const revision = useRef(0);
  const modal = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!record) return;
    setTitle(record.title);
    setQueueSummary(record.summary);
    setValues(seedStructuredApplicationValues(record.values));
    setDirty(false);
    setSaveState("Saved");
  }, [record?.id]);

  useEffect(() => {
    updateRecordRef.current = updateRecord;
  }, [updateRecord]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  const locked = Boolean(record && (record.stageIndex >= 2 || !canEditWorkflowRecord("proposals", record.stageIndex, "national-coordinator")));
  const issues = useMemo(() => validateGrantApplication(values, title, queueSummary), [queueSummary, title, values]);
  const progress = useMemo(() => grantApplicationProgress(values, title, queueSummary), [queueSummary, title, values]);
  const issueSections = useMemo(() => new Set(issues.map((issue) => issue.sectionId)), [issues]);
  const activeSection = GRANT_APPLICATION_SECTIONS.find((section) => section.id === activeSectionId) || GRANT_APPLICATION_SECTIONS[0];

  const markDirty = () => {
    revision.current += 1;
    setDirty(true);
    setSaveState("Unsaved changes");
  };
  const changeValue = (key: string, value: WorkflowValue) => {
    setValues((current) => ({ ...current, [key]: value }));
    markDirty();
  };
  const changeTitle = (value: string) => { setTitle(value); markDirty(); };
  const changeQueueSummary = (value: string) => { setQueueSummary(value); markDirty(); };

  const save = useCallback(async (capturedRevision = revision.current) => {
    if (!record || locked) return false;
    setSaveState("Saving");
    const response = await updateRecordRef.current(record.id, "national-coordinator", { title, summary: queueSummary, values });
    if (!response.ok) {
      setSaveState("Save failed");
      setResult({ tone: "error", message: response.errors.join(" ") });
      return false;
    }
    if (capturedRevision === revision.current) {
      setDirty(false);
      setSaveState("Saved");
    }
    return true;
  }, [locked, queueSummary, record?.id, title, values]);

  useEffect(() => {
    if (!dirty || locked) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    const captured = revision.current;
    saveTimer.current = window.setTimeout(() => { void save(captured); }, 900);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [dirty, locked, save]);

  useEffect(() => {
    if (!submitOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSubmitOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    modal.current?.querySelector<HTMLElement>("button")?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitOpen]);

  if (!record || record.section !== "proposals" || !record.assignedRoles.includes("national-coordinator")) {
    return <Empty title="Application unavailable" body="This grant application does not exist or is outside the National Coordinator assignment." />;
  }

  const rows = {
    results: parseStructuredRows(values.resultsRows, DEFAULT_RESULT_ROWS),
    workplan: parseStructuredRows(values.workplanRows, DEFAULT_WORKPLAN_ROWS),
    budget: parseStructuredRows(values.budgetRows, DEFAULT_BUDGET_ROWS),
    risks: parseStructuredRows(values.riskRows, DEFAULT_RISK_ROWS),
    documents: parseStructuredRows(values.documentChecklist, DEFAULT_DOCUMENT_CHECKLIST)
  };

  const selectSection = async (sectionId: GrantApplicationSectionId) => {
    if (dirty) await save();
    setActiveSectionId(sectionId);
    window.requestAnimationFrame(() => document.querySelector(".grant-application-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const exportApplication = () => {
    const payload = { schemaVersion: "sgp-klp-grant-application-v1", exportedAt: new Date().toISOString(), record: { ...record, title, summary: queueSummary, values }, validation: issues };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${record.id}-grant-application.json`);
  };

  const confirmSubmission = async () => {
    const attestedValues: Record<string, WorkflowValue> = { ...values, submissionAttested: true };
    const validation = validateGrantApplication(attestedValues, title, queueSummary);
    if (validation.length) {
      setValues(attestedValues);
      markDirty();
      setActiveSectionId(validation[0].sectionId);
      setSubmitOpen(false);
      setResult({ tone: "error", message: `${validation.length} validation ${validation.length === 1 ? "issue remains" : "issues remain"}.` });
      return;
    }
    setSubmitting(true);
    const previous = typeof values.submissionSnapshot === "string" ? (() => { try { return JSON.parse(values.submissionSnapshot as string) as { version?: number }; } catch { return {}; } })() : {};
    const snapshotValues: Record<string, WorkflowValue> = { ...attestedValues };
    delete snapshotValues.submissionSnapshot;
    const snapshot = JSON.stringify({ version: Number(previous.version || 0) + 1, submittedAt: new Date().toISOString(), submittedBy: "National Coordinator", title, summary: queueSummary, values: snapshotValues, attachments: record.attachments });
    const finalValues = { ...attestedValues, submissionSnapshot: snapshot };
    setValues(finalValues);
    const saved = await updateRecord(record.id, "national-coordinator", { title, summary: queueSummary, values: finalValues });
    if (!saved.ok) {
      setSubmitting(false);
      setResult({ tone: "error", message: saved.errors.join(" ") });
      return;
    }
    let response = { ok: true } as { ok: true } | { ok: false; errors: string[] };
    const advances = Math.max(1, 2 - record.stageIndex);
    for (let index = 0; index < advances && response.ok; index += 1) response = await advanceRecord(record.id, "national-coordinator");
    setSubmitting(false);
    setSubmitOpen(false);
    setDirty(false);
    setSaveState("Saved");
    setResult(response.ok ? { tone: "success", message: "Application submitted for review and a controlled version was preserved." } : { tone: "error", message: response.errors.join(" ") });
  };

  const openRevision = async () => {
    const response = await returnRecord(record.id, "national-coordinator", "Controlled application revision opened after submission.");
    setResult(response.ok ? { tone: "success", message: "A controlled revision is open. Update and resubmit the application when ready." } : { tone: "error", message: response.errors.join(" ") });
  };

  const structuredEditor = activeSectionId === "results"
    ? <ResultsEditor rows={rows.results} disabled={locked} onChange={(next) => changeValue("resultsRows", serializeStructuredRows(next))} />
    : activeSectionId === "workplan"
      ? <WorkplanEditor rows={rows.workplan} disabled={locked} onChange={(next) => changeValue("workplanRows", serializeStructuredRows(next))} />
      : activeSectionId === "budget"
        ? <BudgetEditor rows={rows.budget} disabled={locked} onChange={(next) => changeValue("budgetRows", serializeStructuredRows(next))} />
        : activeSectionId === "safeguards"
          ? <RiskEditor rows={rows.risks} disabled={locked} onChange={(next) => changeValue("riskRows", serializeStructuredRows(next))} />
          : activeSectionId === "documents"
            ? <DocumentsEditor rows={rows.documents} disabled={locked} onChange={(next) => changeValue("documentChecklist", serializeStructuredRows(next))} />
            : null;

  return <div className="grant-application-workspace" data-record-id={record.id}>
    <AppLink className="workflow-return" href="/workspace/proposals"><ArrowLeft /> Return to grant applications</AppLink>
    <header className="grant-application-header">
      <div><span>Grant application · {record.id}</span><h2>{title || "Untitled grant application"}</h2><p>{String(values.organization || "Organization not entered")} · {String(values.country || "Country programme not entered")}</p></div>
      <div><button type="button" className="button button--secondary" onClick={exportApplication}><Download /> Export</button><button type="button" className="button button--secondary" onClick={() => selectSection("review")}><FileCheck2 /> Review</button></div>
    </header>
    <div className="grant-application-context">
      <div><span>Lifecycle state</span><strong>{["Draft", "Complete", "Submitted for review", "Decision package"][record.stageIndex]}</strong></div>
      <div><span>Funding window</span><strong>{String(values.fundingWindow || "Not selected")}</strong></div>
      <div><span>Requested amount</span><strong>US$ {Number(values.requestedAmount || 0).toLocaleString()}</strong></div>
      <ApplicationProgress value={progress} />
    </div>
    <div className="grant-application-save-strip" role="status">{online ? <Save /> : <WifiOff />}<strong>{online ? saveState : "Offline · changes remain in this browser"}</strong><span>Updated {formatDateTime(record.updatedAt)}</span>{locked && <em><LockKeyhole /> Submitted version locked</em>}</div>
    <SubmissionSnapshot value={values.submissionSnapshot} />
    {result && <div className={`grant-application-result grant-application-result--${result.tone}`} role={result.tone === "error" ? "alert" : "status"}>{result.tone === "success" ? <CheckCircle2 /> : <AlertCircle />}<span>{result.message}</span></div>}
    {locked && record.stageIndex === 2 && <div className="grant-revision-strip"><History /><div><strong>The submitted version is read-only</strong><p>Open a controlled revision to respond to review comments without changing the preserved submission.</p></div><button type="button" className="button button--secondary" onClick={openRevision}><RotateCcw /> Open controlled revision</button></div>}
    <div className="grant-application-layout">
      <nav className="grant-application-sections" aria-label="Grant application sections">
        <h3>Application sections</h3>
        {GRANT_APPLICATION_SECTIONS.map((section, index) => {
          const hasIssue = issueSections.has(section.id);
          return <button type="button" className={activeSectionId === section.id ? "active" : ""} onClick={() => selectSection(section.id)} key={section.id}><span className={hasIssue ? "incomplete" : "complete"}>{hasIssue ? index + 1 : <Check />}</span><span><strong>{section.title}</strong><small>{hasIssue ? `${issues.filter((issue) => issue.sectionId === section.id).length} to resolve` : "Complete"}</small></span></button>;
        })}
      </nav>
      <main className="grant-application-editor">
        <header><div><span>{locked ? "Submitted application" : "Editable section"}</span><h3>{activeSection.title}</h3><p>{activeSection.summary}</p></div><span className={issueSections.has(activeSection.id) ? "grant-section-status grant-section-status--warning" : "grant-section-status grant-section-status--complete"}>{issueSections.has(activeSection.id) ? "Needs attention" : "Complete"}</span></header>
        <div className="grant-application-guidance"><BookOpen /><div><strong>Section guidance</strong><p>{activeSection.guidance}</p></div></div>
        {activeSection.id === "review" ? <section className="grant-review-panel">
          <div className="grant-readiness"><strong>{progress}%</strong><span>Application completeness</span></div>
          <div className="grant-review-sections">{GRANT_APPLICATION_SECTIONS.filter((section) => section.id !== "review").map((section) => {
            const count = issues.filter((issue) => issue.sectionId === section.id).length;
            return <button type="button" key={section.id} onClick={() => selectSection(section.id)}><span className={count ? "incomplete" : "complete"}>{count ? <AlertCircle /> : <Check />}</span><span><strong>{section.title}</strong><small>{count ? `${count} ${count === 1 ? "issue" : "issues"}` : "Ready"}</small></span><ChevronRight /></button>;
          })}</div>
          <label className="grant-review-attestation"><input type="checkbox" disabled={locked} checked={values.submissionAttested === true} onChange={(event) => changeValue("submissionAttested", event.target.checked)} /><span><strong>Submission authority and accuracy</strong><small>I confirm that I am authorized to submit this application and that the information and evidence have been reviewed.</small></span></label>
          {issues.length > 0 && <div className="grant-review-issues"><AlertCircle /><span><strong>{issues.length} validation {issues.length === 1 ? "issue remains" : "issues remain"}</strong><small>Select a section above to resolve it before submission.</small></span></div>}
          {!locked && <button className="button button--primary grant-submit-button" type="button" disabled={issues.length > 0} onClick={() => setSubmitOpen(true)}><FileCheck2 /> Submit application for review</button>}
        </section> : <>
          {activeSection.id === "overview" && <div className="grant-application-core-fields"><label><span>Project title <b>*</b></span><input disabled={locked} value={title} onChange={(event) => changeTitle(event.target.value)} /></label><label><span>Queue summary <b>*</b></span><textarea rows={3} disabled={locked} value={queueSummary} onChange={(event) => changeQueueSummary(event.target.value)} /></label></div>}
          <div className="grant-application-fields">{activeSection.fields.map((field) => <label data-grant-field={field.key} className={field.wide ? "wide" : ""} key={field.key}><span>{field.label}{field.required && <b> *</b>}</span><FieldControl field={field} value={values[field.key]} disabled={locked} onChange={(value) => changeValue(field.key, value)} />{field.help && <small>{field.help}</small>}</label>)}</div>
          {structuredEditor}
          <ApplicationFiles recordId={record.id} sectionId={activeSection.id} disabled={locked} />
          {!locked && <div className="grant-section-actions"><button type="button" className="button button--secondary" onClick={() => save()}><Save /> Save section</button><button type="button" className="button button--primary" onClick={() => selectSection(GRANT_APPLICATION_SECTIONS[Math.min(GRANT_APPLICATION_SECTIONS.findIndex((item) => item.id === activeSection.id) + 1, GRANT_APPLICATION_SECTIONS.length - 1)].id)}>Continue <ChevronRight /></button></div>}
        </>}
      </main>
      <aside className="grant-application-context-rail">
        <ContextualAssistant prompt={activeSection.prompt} />
        <ApplicationComments recordId={record.id} sectionId={activeSection.id} disabled={locked} />
        <section className="grant-validation-card"><header>{issueSections.has(activeSection.id) ? <AlertCircle /> : <CheckCircle2 />}<div><h4>Section validation</h4><p>{issueSections.has(activeSection.id) ? `${issues.filter((issue) => issue.sectionId === activeSection.id).length} items require attention` : "This section is complete"}</p></div></header>{issues.filter((issue) => issue.sectionId === activeSection.id).slice(0, 4).map((issue) => <button type="button" key={`${issue.fieldKey}:${issue.message}`} onClick={() => issue.fieldKey && document.querySelector<HTMLElement>(`[data-grant-field="${issue.fieldKey}"] input, [data-grant-field="${issue.fieldKey}"] textarea`)?.focus()}>{issue.message}</button>)}</section>
      </aside>
    </div>
    <section className="grant-application-audit"><header><History /><div><h3>Application history</h3><p>Saved changes, lifecycle transitions, files and notes remain attributable.</p></div></header><ol>{[...record.history].reverse().map((event) => <li key={event.id}><i /><span><strong>{event.summary}</strong><small>{event.actor.replaceAll("-", " ")} · {formatDateTime(event.at)}</small></span></li>)}</ol></section>
    {submitOpen && <div className="grant-submit-backdrop" role="presentation" onMouseDown={() => setSubmitOpen(false)}><section ref={modal} className="grant-submit-modal" role="dialog" aria-modal="true" aria-labelledby="grant-submit-title" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="grant-submit-close" onClick={() => setSubmitOpen(false)} title="Close"><X /></button><span><FileCheck2 /></span><h2 id="grant-submit-title">Submit grant application</h2><p>This creates a controlled, read-only submission for TAG and NSC review. A later update must be opened as a new controlled revision.</p><div><strong>{title}</strong><small>{record.id} · {progress}% complete · {record.attachments.length} files</small></div><div className="grant-submit-modal-actions"><button type="button" className="button button--secondary" onClick={() => setSubmitOpen(false)}>Cancel</button><button type="button" className="button button--primary" disabled={submitting} onClick={confirmSubmission}>{submitting ? "Submitting..." : "Confirm submission"}</button></div></section></div>}
  </div>;
}
