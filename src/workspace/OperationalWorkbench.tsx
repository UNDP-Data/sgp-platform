import { ArrowRight, CheckCircle2, CircleGauge, ClipboardCheck, Layers3, ShieldCheck } from "lucide-react";
import { AppLink } from "../components/AppLink";
import {
  canEditWorkflowRecord, WORKFLOW_DEFINITIONS, type OperationalRole, type WorkflowSection
} from "./workflowDefinitions";
import {
  operationalWorkbenchDefinition, operationalWorkbenchMetrics
} from "./operationalWorkspacePresentation";
import type { WorkflowRecord } from "./workflowStore";

function stageStatus(records: WorkflowRecord[], stageIndex: number) {
  const count = records.filter((record) => record.stageIndex === stageIndex).length;
  const passed = records.filter((record) => record.stageIndex > stageIndex).length;
  if (count > 0) return { label: `${count} active`, tone: "active" };
  if (passed > 0) return { label: "Passed", tone: "complete" };
  return { label: "Waiting", tone: "waiting" };
}

export function OperationalWorkbench({
  role, section, records, pageLabel, pageDescription
}: {
  role: OperationalRole;
  section: WorkflowSection;
  records: WorkflowRecord[];
  pageLabel?: string;
  pageDescription?: string;
}) {
  const definition = WORKFLOW_DEFINITIONS[section];
  const blueprint = operationalWorkbenchDefinition(role, section, pageLabel, pageDescription);
  const metrics = operationalWorkbenchMetrics(records, role, section);
  const activeRecords = [...records]
    .filter((record) => record.stageIndex < definition.stages.length - 1)
    .sort((a, b) => Number(canEditWorkflowRecord(section, b.stageIndex, role)) - Number(canEditWorkflowRecord(section, a.stageIndex, role)) || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  return <section className={`operational-workbench operational-workbench--${blueprint.variant}`} aria-labelledby={`${section}-workbench-title`}>
    <header className="operational-workbench__head">
      <div>
        <span><CircleGauge /> Live role workbench</span>
        <h2 id={`${section}-workbench-title`}>{blueprint.title}</h2>
        <p>{blueprint.summary}</p>
      </div>
      <span className="operational-workbench__scope"><ShieldCheck /> Assignment scoped</span>
    </header>

    <div className="operational-workbench__metrics">
      {metrics.map((metric) => <div key={metric.label}>
        <span>{metric.label}</span>
        <strong>{metric.value}</strong>
        <small>{metric.detail}</small>
      </div>)}
    </div>

    <div className="operational-workbench__grid">
      <article className="operational-workbench__panel">
        <div className="operational-workbench__panel-title"><Layers3 /><div><h3>Operational focus</h3><p>Responsibilities represented in this view</p></div></div>
        <ul className="operational-workbench__focus">
          {blueprint.focusItems.map((item) => <li key={item}><CheckCircle2 /><span>{item}</span></li>)}
        </ul>
      </article>

      <article className="operational-workbench__panel">
        <div className="operational-workbench__panel-title"><ClipboardCheck /><div><h3>Control gates</h3><p>Evidence and authority checks for this workflow</p></div></div>
        <div className="operational-workbench__controls">
          {blueprint.controls.map((control, index) => {
            const status = stageStatus(records, Math.min(index, definition.stages.length - 1));
            return <div key={control}><span><i className={`status-dot status-dot--${status.tone}`} />{control}</span><strong>{status.label}</strong></div>;
          })}
        </div>
      </article>
    </div>

    <div className="operational-workbench__lifecycle">
      <div className="operational-workbench__lifecycle-head"><div><h3>Lifecycle coverage</h3><p>Every record advances independently through the controlled stages.</p></div><span>{records.length} total</span></div>
      <div className="operational-workbench__stage-bars">
        {definition.stages.map((stage, index) => {
          const count = records.filter((record) => record.stageIndex === index).length;
          const width = records.length ? Math.max(count / records.length * 100, count ? 8 : 0) : 0;
          return <div key={stage}><span>{stage}</span><i><b style={{ width: `${width}%` }} /></i><strong>{count}</strong></div>;
        })}
      </div>
    </div>

    {activeRecords.length > 0 && <div className="operational-workbench__attention">
      <div><h3>Priority records</h3><p>Current items are ordered by role ownership and latest activity.</p></div>
      <div>{activeRecords.map((record) => <AppLink href={`/workspace/${section}/${record.id}`} key={record.id}>
        <span><strong>{record.title}</strong><small>{definition.stages[record.stageIndex]} · {record.id}</small></span>
        <ArrowRight />
      </AppLink>)}</div>
    </div>}
  </section>;
}
