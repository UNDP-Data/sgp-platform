import {
  ArrowLeft, ArrowRight, CheckCircle2, Download, FileText, History, MessageSquare, Paperclip,
  Plus, RotateCcw, Save, Search, ShieldCheck, Trash2, Upload
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "../auth/roles";
import { AppLink } from "../components/AppLink";
import { Empty } from "../components/PagePrimitives";
import { navigateTo } from "../lib/browser/navigation";
import { withDemoRole } from "../routing/demoRoleRouting";
import { clearWorkflowFiles, storeWorkflowFile } from "./workflowFiles";
import {
  canCreateWorkflowRecord, canEditWorkflowRecord, WORKFLOW_DEFINITIONS, type OperationalRole,
  type WorkflowDefinition, type WorkflowFieldDefinition, type WorkflowSection, type WorkflowValue,
  validateWorkflowValues
} from "./workflowDefinitions";
import {
  accountRoleForOperationalRole, operationalRole, recordsForRole, useWorkflowStore, validateWorkflowSnapshot, type SupportCase, type WorkflowAttachment,
  type WorkflowRecord, type WorkspacePreferences
} from "./workflowStore";
import { useWorkflowActions } from "./workflowBackend";
import { GrantApplicationDetail } from "./GrantApplicationWorkspace";
import { OperationalWorkbench } from "./OperationalWorkbench";

type ResultState = { tone: "success" | "error"; messages: string[] } | null;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Unable to read a stored evidence file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(value: string) {
  const match = /^data:([^;,]+)?(?:;base64)?,(.*)$/.exec(value);
  if (!match) throw new Error("The backup contains an invalid evidence file.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: match[1] || "application/octet-stream" });
}

function ResultMessage({ result }: { result: ResultState }) {
  if (!result) return null;
  return <div className={`workflow-result workflow-result--${result.tone}`} role={result.tone === "error" ? "alert" : "status"}>
    {result.tone === "success" ? <CheckCircle2 /> : <ShieldCheck />}
    <div>{result.messages.map((message) => <p key={message}>{message}</p>)}</div>
  </div>;
}

function recordMatches(record: WorkflowRecord, query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [record.id, record.title, record.summary, ...Object.values(record.values).map(String)]
    .join(" ").toLocaleLowerCase().includes(normalized);
}

function queueProgress(records: WorkflowRecord[], definition: WorkflowDefinition) {
  return definition.stages.map((stage, index) => ({ stage, count: records.filter((record) => record.stageIndex === index).length }));
}

export function OperationalQueue({ section, role, pageLabel, pageDescription }: {
  section: WorkflowSection;
  role: OperationalRole;
  pageLabel?: string;
  pageDescription?: string;
}) {
  const definition = WORKFLOW_DEFINITIONS[section];
  const allRecords = useWorkflowStore((state) => state.records);
  const records = useMemo(() => recordsForRole(allRecords, role, section), [allRecords, role, section]);
  const { createRecord } = useWorkflowActions();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const visible = useMemo(() => records.filter((record) => (
    recordMatches(record, query) && (stage === "all" || record.stageIndex === Number(stage))
  )), [query, records, stage]);
  const progress = queueProgress(records, definition);

  const create = async () => {
    const id = await createRecord(section, role);
    if (id) navigateTo(withDemoRole(`/workspace/${section}/${id}`, accountRoleForOperationalRole(role)));
  };

  const exportRecords = () => {
    const payload = {
      schemaVersion: "sgp-klp-operational-records-v1",
      exportedAt: new Date().toISOString(), role, section, records
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `sgp-${section}-${new Date().toISOString().slice(0, 10)}.json`);
  };

  return <div className="operational-workflow" data-workflow-section={section}>
    <OperationalWorkbench role={role} section={section} records={records} pageLabel={pageLabel} pageDescription={pageDescription} />
    <div className="workspace-section-head workflow-queue-head">
      <div><h2>{definition.plural}</h2><p>{definition.intro}</p></div>
      <div className="workflow-head-actions">
        <button className="button button--secondary" type="button" onClick={exportRecords}><Download /> Export</button>
        {canCreateWorkflowRecord(section, role) && <button className="button button--primary" type="button" onClick={create}><Plus /> New {definition.singular}</button>}
      </div>
    </div>
    <div className="workflow-stage-summary" aria-label={`${definition.plural} progress`}>
      {progress.map((item, index) => <button type="button" className={stage === String(index) ? "active" : ""} onClick={() => setStage(stage === String(index) ? "all" : String(index))} key={item.stage}>
        <span>{item.stage}</span><strong>{item.count}</strong>
      </button>)}
    </div>
    <div className="workflow-filters">
      <label className="search-field"><Search /><span className="sr-only">Search {definition.plural.toLowerCase()}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${definition.plural.toLowerCase()}`} /></label>
      <label><span className="sr-only">Filter by stage</span><select value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">All stages</option>{definition.stages.map((item, index) => <option value={index} key={item}>{item}</option>)}</select></label>
    </div>
    {visible.length ? <div className="workflow-record-list">{visible.map((record) => {
      const completed = record.stageIndex === definition.stages.length - 1;
      return <AppLink href={`/workspace/${section}/${record.id}`} key={record.id}>
        <span className="workflow-record-id">{record.id}</span>
        <span><strong>{record.title}</strong><small>{record.summary}</small></span>
        <span className={`workflow-stage-badge${completed ? " workflow-stage-badge--complete" : ""}`}>{definition.stages[record.stageIndex]}</span>
        <span className="workflow-record-updated">Updated {formatDateTime(record.updatedAt)}</span>
        <ArrowRight />
      </AppLink>;
    })}</div> : <Empty title="No matching records" body="Clear the filters or create a new record in this workflow." />}
    <div className="boundary-callout"><ShieldCheck /><div><strong>Assignment-enforced workflow</strong><p>Records are filtered by the active role and assignment. Required fields are validated before a stage transition, and every change is retained in the record history.</p></div></div>
  </div>;
}

function FieldControl({ field, value, disabled, onChange }: { field: WorkflowFieldDefinition; value: WorkflowValue; disabled: boolean; onChange: (value: WorkflowValue) => void }) {
  if (field.type === "textarea") return <textarea rows={4} value={String(value ?? "")} disabled={disabled} onChange={(event) => onChange(event.target.value)} required={field.required} />;
  if (field.type === "select") return <select value={String(value ?? "")} disabled={disabled} onChange={(event) => onChange(event.target.value)} required={field.required}><option value="">Select</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>;
  if (field.type === "checkbox") return <span className="workflow-check"><input type="checkbox" checked={value === true} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span>{field.help || "Confirm this requirement"}</span></span>;
  return <input type={field.type} value={String(value ?? "")} min={field.min} max={field.max} disabled={disabled} required={field.required} onChange={(event) => onChange(field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} />;
}

function EvidenceFiles({ record, role, editable }: { record: WorkflowRecord; role: OperationalRole; editable: boolean }) {
  const { uploadEvidence, downloadEvidence, removeEvidence } = useWorkflowActions();
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ResultState>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    const attachment: WorkflowAttachment = { id: `${record.id}-${Date.now()}`, name: file.name, size: file.size, type: file.type || "application/octet-stream", storedAt: new Date().toISOString(), storedBy: role };
    try {
      const response = await uploadEvidence(record, role, file, attachment);
      if (!response.ok) throw new Error(response.errors.join(" "));
      setResult({ tone: "success", messages: [`${file.name} stored with this record.`] });
    } catch (error) {
      setResult({ tone: "error", messages: [error instanceof Error ? error.message : "Unable to store the selected file."] });
    } finally {
      setBusy(false);
    }
  };

  const download = async (attachment: WorkflowAttachment) => {
    const blob = await downloadEvidence(record, role, attachment);
    if (!blob) { setResult({ tone: "error", messages: ["The file content is unavailable. Its audit metadata remains on the record."] }); return; }
    downloadBlob(blob, attachment.name);
  };

  const remove = async (attachment: WorkflowAttachment) => {
    const response = await removeEvidence(record, role, attachment);
    setResult(response.ok ? { tone: "success", messages: [`${attachment.name} removed.`] } : { tone: "error", messages: response.errors });
  };

  return <section className="workflow-panel">
    <div className="workflow-panel-head"><div><Paperclip /><span><h3>Evidence files</h3><p>Files use the temporary backend when available and retain an offline browser fallback.</p></span></div>{editable && <button type="button" className="button button--secondary" disabled={busy} onClick={() => input.current?.click()}><Upload />{busy ? "Storing..." : "Add file"}</button>}</div>
    <input className="sr-only" ref={input} type="file" onChange={upload} />
    {record.attachments.length ? <div className="workflow-file-list">{record.attachments.map((attachment) => <div key={attachment.id}><FileText /><span><strong>{attachment.name}</strong><small>{formatBytes(attachment.size)} · {formatDateTime(attachment.storedAt)}</small></span><button type="button" title={`Download ${attachment.name}`} onClick={() => download(attachment)}><Download /></button>{editable && <button type="button" title={`Remove ${attachment.name}`} onClick={() => remove(attachment)}><Trash2 /></button>}</div>)}</div> : <p className="workflow-empty-note">No evidence files have been added.</p>}
    <ResultMessage result={result} />
  </section>;
}

function WorkflowHistory({ record }: { record: WorkflowRecord }) {
  return <section className="workflow-panel"><div className="workflow-panel-head"><div><History /><span><h3>Audit history</h3><p>Chronological record of saved changes and lifecycle transitions.</p></span></div></div><ol className="workflow-history">{[...record.history].reverse().map((item) => <li key={item.id}><i /><span><strong>{item.summary}</strong><small>{item.actor.replaceAll("-", " ")} · {formatDateTime(item.at)}</small></span></li>)}</ol></section>;
}

export function OperationalDetail({ section, recordId, role }: { section: WorkflowSection; recordId: string; role: OperationalRole }) {
  const definition = WORKFLOW_DEFINITIONS[section];
  const record = useWorkflowStore((state) => state.records.find((item) => item.id === recordId));
  const { updateRecord, advanceRecord, returnRecord, addNote } = useWorkflowActions();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [values, setValues] = useState<Record<string, WorkflowValue>>({});
  const [result, setResult] = useState<ResultState>(null);
  const [note, setNote] = useState("");
  const [returnReason, setReturnReason] = useState("");

  useEffect(() => {
    if (!record) return;
    setTitle(record.title); setSummary(record.summary); setValues(record.values); setResult(null);
  }, [record?.id]);

  if (!record || record.section !== section || !record.assignedRoles.includes(role)) return <Empty title="Record unavailable" body="This record does not exist or is outside the active assignment." />;
  const complete = record.stageIndex === definition.stages.length - 1;
  const editable = canEditWorkflowRecord(section, record.stageIndex, role);
  const validation = validateWorkflowValues(definition, values);

  const save = async () => {
    const response = await updateRecord(record.id, role, { title, summary, values });
    setResult(response.ok ? { tone: "success", messages: ["Changes saved."] } : { tone: "error", messages: response.errors });
    return response.ok;
  };

  const submit = async (event: FormEvent) => { event.preventDefault(); await save(); };
  const advance = async () => {
    if (!await save()) return;
    const response = await advanceRecord(record.id, role);
    setResult(response.ok ? { tone: "success", messages: [complete ? "Workflow complete." : "Record advanced to the next stage."] } : { tone: "error", messages: response.errors });
  };
  const sendBack = async () => {
    const response = await returnRecord(record.id, role, returnReason);
    if (response.ok) setReturnReason("");
    setResult(response.ok ? { tone: "success", messages: ["Record returned one stage with the reason preserved in its history."] } : { tone: "error", messages: response.errors });
  };
  const addRecordNote = async (event: FormEvent) => {
    event.preventDefault();
    const response = await addNote(record.id, role, note);
    if (response.ok) setNote("");
    setResult(response.ok ? { tone: "success", messages: ["Note added."] } : { tone: "error", messages: response.errors });
  };

  return <div className="operational-workflow workflow-detail-page" data-record-id={record.id}>
    <AppLink href={`/workspace/${section}`} className="workflow-return"><ArrowLeft /> Return to {definition.plural.toLowerCase()}</AppLink>
    <div className="workflow-detail-heading"><div><span className="workflow-record-id">{record.id}</span><h2>{record.title}</h2><p>{record.summary}</p></div><span className={`workflow-stage-badge${complete ? " workflow-stage-badge--complete" : ""}`}>{definition.stages[record.stageIndex]}</span></div>
    <div className="workspace-detail-steps">{definition.stages.map((stage, index) => <span className={index < record.stageIndex ? "complete" : index === record.stageIndex ? "active" : ""} key={stage}>{stage}</span>)}</div>
    {!editable && <div className="boundary-callout"><ShieldCheck /><div><strong>Read-only at this stage</strong><p>This record is visible in the active assignment, but its current lifecycle stage is owned by another role. Its evidence and audit history remain available.</p></div></div>}
    <form className="workflow-record-form" onSubmit={submit}>
      <div className="workflow-form-grid">
        <label className="workflow-field workflow-field--wide"><span>Record title <b>*</b></span><input value={title} disabled={!editable} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label className="workflow-field workflow-field--wide"><span>Queue summary <b>*</b></span><textarea rows={2} value={summary} disabled={!editable} onChange={(event) => setSummary(event.target.value)} required /></label>
        {definition.fields.map((item) => <label className={`workflow-field${item.type === "textarea" || item.type === "checkbox" ? " workflow-field--wide" : ""}`} key={item.key}><span>{item.label}{item.required && <b> *</b>}</span><FieldControl field={item} value={values[item.key]} disabled={!editable} onChange={(value) => setValues((current) => ({ ...current, [item.key]: value }))} />{item.help && item.type !== "checkbox" && <small>{item.help}</small>}</label>)}
      </div>
      {validation.length > 0 && <p className="workflow-validation-summary">{validation.length} required {validation.length === 1 ? "item remains" : "items remain"} before this record can advance.</p>}
      <ResultMessage result={result} />
      {editable && <div className="workflow-form-actions"><button className="button button--secondary" type="submit"><Save /> Save changes</button><button className="button button--primary" type="button" disabled={complete} onClick={advance}>{complete ? <CheckCircle2 /> : <ArrowRight />}{complete ? "Workflow complete" : `Advance to ${definition.stages[record.stageIndex + 1]}`}</button></div>}
    </form>
    <div className="workflow-detail-grid">
      <EvidenceFiles record={record} role={role} editable={editable} />
      <section className="workflow-panel"><div className="workflow-panel-head"><div><MessageSquare /><span><h3>Record notes</h3><p>Notes remain attributable and cannot silently replace prior evidence.</p></span></div></div>{editable && <form className="workflow-note-form" onSubmit={addRecordNote}><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Add an operational note" /><button className="button button--secondary" type="submit">Add note</button></form>}{record.notes.length ? <div className="workflow-note-list">{[...record.notes].reverse().map((item) => <article key={item.id}><p>{item.body}</p><small>{item.createdBy.replaceAll("-", " ")} · {formatDateTime(item.createdAt)}</small></article>)}</div> : <p className="workflow-empty-note">No notes have been added.</p>}</section>
    </div>
    {editable && <section className="workflow-panel workflow-return-panel"><div className="workflow-panel-head"><div><RotateCcw /><span><h3>Return for correction</h3><p>Move the record back one stage and preserve the reason in its notes and audit history.</p></span></div></div><textarea value={returnReason} onChange={(event) => setReturnReason(event.target.value)} rows={2} placeholder="Required return reason" /><button className="button button--secondary" type="button" disabled={record.stageIndex === 0} onClick={sendBack}>Return one stage</button></section>}
    <WorkflowHistory record={record} />
  </div>;
}

export function SupportWorkspace({ role, requestId }: { role: OperationalRole; requestId?: string }) {
  const allSupportCases = useWorkflowStore((state) => state.supportCases);
  const supportCases = useMemo(() => allSupportCases.filter((item) => item.requesterRole === role), [allSupportCases, role]);
  const { createSupportCase, updateSupportCase } = useWorkflowActions();
  const [category, setCategory] = useState("General support");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<SupportCase["status"]>("In progress");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<ResultState>(null);
  const selected = requestId ? supportCases.find((item) => item.id === requestId) : null;

  useEffect(() => {
    if (selected) setStatus(selected.status);
  }, [selected?.id, selected?.status]);

  if (requestId && !selected) return <Empty title="Support case unavailable" body="This request does not exist or belongs to another account." />;
  if (selected) {
    const update = async (event: FormEvent) => {
      event.preventDefault();
      const response = await updateSupportCase(selected.id, role, status, note);
      if (response.ok) setNote("");
      setResult(response.ok ? { tone: "success", messages: ["Support case updated."] } : { tone: "error", messages: response.errors });
    };
    return <div className="operational-workflow"><AppLink href="/workspace/support" className="workflow-return"><ArrowLeft /> Return to support</AppLink><div className="workflow-detail-heading"><div><span className="workflow-record-id">{selected.id}</span><h2>{selected.subject}</h2><p>{selected.description}</p></div><span className="workflow-stage-badge">{selected.status}</span></div><section className="workflow-panel"><h3>Case details</h3><p><strong>Category:</strong> {selected.category}</p><p><strong>Opened:</strong> {formatDateTime(selected.createdAt)}</p><form className="workflow-note-form" onSubmit={update}><label>Status<select value={status} onChange={(event) => setStatus(event.target.value as SupportCase["status"])}><option>Open</option><option>In progress</option><option>Resolved</option></select></label><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Add a case update" required /><button className="button button--primary" type="submit">Save case update</button></form><ResultMessage result={result} /></section><section className="workflow-panel"><h3>Case history</h3><ol className="workflow-history">{[...selected.history].reverse().map((item) => <li key={item.id}><i /><span><strong>{item.summary}</strong><small>{formatDateTime(item.at)}</small></span></li>)}</ol></section></div>;
  }

  const create = async (event: FormEvent) => {
    event.preventDefault();
    const id = await createSupportCase(role, category, subject, description);
    if (!id) { setResult({ tone: "error", messages: ["Subject and description are required."] }); return; }
    navigateTo(withDemoRole(`/workspace/support/${id}`, accountRoleForOperationalRole(role)));
  };
  return <div className="operational-workflow"><div className="workspace-section-head"><h2>Guidance and support cases</h2><p>Open, resume and resolve account-scoped support requests with a complete case history.</p></div><div className="workflow-detail-grid"><section className="workflow-panel"><h3>Open a support request</h3><form className="workflow-note-form" onSubmit={create}><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>General support</option><option>Access and assignment</option><option>Portfolio data correction</option><option>Review and decision</option><option>Knowledge and rights</option><option>Technical issue</option></select></label><label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} required /></label><label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} required /></label><button className="button button--primary" type="submit"><Plus /> Create support case</button></form><ResultMessage result={result} /></section><section className="workflow-panel"><h3>Your support cases</h3>{supportCases.length ? <div className="workflow-case-list">{supportCases.map((item) => <AppLink href={`/workspace/support/${item.id}`} key={item.id}><span><strong>{item.subject}</strong><small>{item.category} · Updated {formatDateTime(item.updatedAt)}</small></span><span className="workflow-stage-badge">{item.status}</span><ArrowRight /></AppLink>)}</div> : <p className="workflow-empty-note">No support cases have been opened for this account.</p>}</section></div></div>;
}

export function ProfileWorkspace({ role, scope }: { role: OperationalRole; scope: Array<{ label: string; value: string }> }) {
  const saved = useWorkflowStore((state) => state.preferences[role]);
  const { savePreferences, downloadEvidence, uploadEvidence, restoreSnapshot } = useWorkflowActions();
  const records = useWorkflowStore((state) => state.records);
  const supportCases = useWorkflowStore((state) => state.supportCases);
  const preferences = useWorkflowStore((state) => state.preferences);
  const [form, setForm] = useState<WorkspacePreferences>(saved || { language: "Browser selection", deadlineEmails: true, serviceUpdates: true });
  const [result, setResult] = useState<ResultState>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const response = await savePreferences(role, form);
    setResult(response.ok ? { tone: "success", messages: ["Preferences saved and will be restored on the next visit."] } : { tone: "error", messages: response.errors });
  };
  const exportWorkspace = async () => {
    const attachments = [...new Map(records.flatMap((record) => record.attachments.map((attachment) => [attachment.id, { record, attachment }] as const))).values()];
    const storedFiles = (await Promise.all(attachments.map(async ({ record, attachment }) => {
      const blob = await downloadEvidence(record, role, attachment);
      return blob ? { id: attachment.id, name: attachment.name, type: attachment.type, data: await blobToDataUrl(blob) } : null;
    }))).filter(Boolean);
    const missing = attachments.length - storedFiles.length;
    downloadBlob(new Blob([JSON.stringify({ schemaVersion: "sgp-klp-operational-workspace-v1", exportedAt: new Date().toISOString(), records, supportCases, preferences, storedFiles }, null, 2)], { type: "application/json" }), `sgp-operational-workspace-${new Date().toISOString().slice(0, 10)}.json`);
    setResult({ tone: missing ? "error" : "success", messages: [missing ? `Backup created, but ${missing} evidence file could not be read in this browser.` : `Backup created with ${storedFiles.length} evidence files.`] });
  };
  const importWorkspace = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { records?: unknown; supportCases?: unknown; preferences?: unknown; storedFiles?: Array<{ id: string; data: string }> };
      if (!validateWorkflowSnapshot(parsed)) {
        setResult({ tone: "error", messages: ["The selected file is not a valid SGP operational workspace export."] });
        return;
      }
      if (parsed.storedFiles && !Array.isArray(parsed.storedFiles)) {
        setResult({ tone: "error", messages: ["The selected backup has an invalid evidence file collection."] });
        return;
      }
      const decoded = (parsed.storedFiles || []).map((stored) => {
        if (!stored || typeof stored.id !== "string" || typeof stored.data !== "string") throw new Error("The selected backup contains invalid evidence file data.");
        return { ...stored, blob: dataUrlToBlob(stored.data) };
      });
      const restored = await restoreSnapshot(role, parsed);
      if (!restored.result.ok) { setResult({ tone: "error", messages: restored.result.errors }); return; }
      await clearWorkflowFiles();
      if (restored.backend) {
        for (const stored of decoded) {
          const record = parsed.records?.find((candidate) => candidate.attachments.some((attachment) => attachment.id === stored.id));
          const attachment = record?.attachments.find((candidate) => candidate.id === stored.id);
          if (!record || !attachment) throw new Error("Evidence metadata is missing from the restored record.");
          const response = await uploadEvidence(record, role, new File([stored.blob], attachment.name, { type: attachment.type }), attachment);
          if (!response.ok) throw new Error(response.errors.join(" "));
        }
      } else {
        for (const stored of decoded) await storeWorkflowFile(stored.id, stored.blob);
      }
      setResult({ tone: "success", messages: [`Operational records, support cases, preferences and ${decoded.length} evidence files imported.`] });
    } catch { setResult({ tone: "error", messages: ["The selected file is not valid JSON."] }); }
  };

  return <div className="operational-workflow"><div className="workspace-section-head"><h2>Profile, assignments and preferences</h2><p>Review active scope, persist notification preferences and back up or restore operational workspace data.</p></div><div className="workspace-scope-grid">{scope.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div><form className="profile-settings" onSubmit={save}><label>Interface language<select value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}><option>Browser selection</option><option>English</option><option>Francais</option><option>Espanol</option><option>Portugues</option><option>Russian</option><option>Chinese</option><option>Arabic</option></select></label><label className="check-row"><input type="checkbox" checked={form.deadlineEmails} onChange={(event) => setForm((current) => ({ ...current, deadlineEmails: event.target.checked }))} />Email me about deadlines and decisions</label><label className="check-row"><input type="checkbox" checked={form.serviceUpdates} onChange={(event) => setForm((current) => ({ ...current, serviceUpdates: event.target.checked }))} />Show platform service updates</label><button className="button button--primary" type="submit"><Save /> Save preferences</button></form><section className="workflow-panel workflow-data-tools"><div><h3>Operational data backup</h3><p>Export and restore all local records, case history, preferences and stored evidence files.</p></div><div><button className="button button--secondary" type="button" onClick={exportWorkspace}><Download /> Export workspace</button><button className="button button--secondary" type="button" onClick={() => importRef.current?.click()}><Upload /> Import workspace</button><input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={importWorkspace} /></div></section><ResultMessage result={result} /></div>;
}

export function WorkflowRoute({ section, recordId, role, pageLabel, pageDescription }: {
  section: WorkflowSection;
  recordId?: string;
  role: Role;
  pageLabel?: string;
  pageDescription?: string;
}) {
  const operatingRole = operationalRole(role);
  if (!operatingRole || !WORKFLOW_DEFINITIONS[section].roles.includes(operatingRole)) return <Empty title="Workflow unavailable" body="The active role does not have access to this workflow." />;
  if (section === "proposals" && recordId && operatingRole === "national-coordinator") return <GrantApplicationDetail recordId={recordId} />;
  return recordId
    ? <OperationalDetail section={section} recordId={recordId} role={operatingRole} />
    : <OperationalQueue section={section} role={operatingRole} pageLabel={pageLabel} pageDescription={pageDescription} />;
}
