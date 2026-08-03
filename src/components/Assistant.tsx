import {
  ArrowUp, Bot, BookOpen, Database, ExternalLink, Maximize2,
  LoaderCircle, RotateCcw, Sparkles, Square, X
} from "lucide-react";
import { type FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAssistant } from "../contexts/AssistantContext";
import { useI18n } from "../i18n";
import { selectStarterIdeas } from "../lib/ai/starterIdeas";
import { navigateTo } from "../lib/browser/navigation";
import { decodeAiText, type AiDataSource, type AiSource, type RelevanceDocument } from "../services/ai";

const ASSISTANT_PROMPT = "Ask the SGP Innovation Library…";

function AnswerText({ children }: { children: string }) {
  const decoded = decodeAiText(children);
  return <div className="message-content">{decoded.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>
  )}</div>;
}

function uniqueSources(sources: AiSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.document_id || source.url || `${source.title || ""}|${source.year || ""}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function SourceList({ sources, compact = false }: { sources: AiSource[]; compact?: boolean }) {
  const clean = uniqueSources(sources);
  if (!clean.length) return <p className="muted">Cited documents appear with the answer.</p>;
  return <div className={compact ? "compact-source-list" : undefined}>{clean.map((source, index) => (
    <article className="source-row" key={source.document_id || source.url || `${source.title}-${index}`}>
      <strong>{decodeAiText(source.title || "Untitled source")}</strong>
      <p>{[source.year, source.language, source.dataset || source.corpus || source.source].filter(Boolean).join(" · ").replace(/[_-]+/g, " ")}</p>
      {!compact && source.summary && <small>{decodeAiText(source.summary)}</small>}
      {source.url && <a href={source.url} target="_blank" rel="noreferrer">Inspect source <ExternalLink size={13} /></a>}
    </article>
  ))}</div>;
}

function relevanceScore(item: RelevanceDocument) {
  const value = Number(item.relevance || 0);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function relevanceColor(item: RelevanceDocument) {
  const score = relevanceScore(item);
  const hue = Math.round(204 - score * 32);
  const saturation = Math.round(38 + score * 36);
  const lightness = Math.round(91 - score * 56);
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function relevanceLabel(item: RelevanceDocument) {
  return `${decodeAiText(item.title || "Document")} · ${Math.round(relevanceScore(item) * 100)}%`;
}

function RelevancePanel({ documents }: { documents: RelevanceDocument[] }) {
  const sorted = useMemo(() => documents.slice().sort((a, b) => Number(b.relevance || 0) - Number(a.relevance || 0)).slice(0, 80), [documents]);
  const [selected, setSelected] = useState<RelevanceDocument | null>(null);
  useEffect(() => { setSelected(sorted[0] || null); }, [sorted]);
  const highlighted = selected ? [selected, ...sorted.filter((item) => item !== selected).slice(0, 4)] : sorted.slice(0, 5);
  if (!sorted.length) return null;
  return <div className="evidence-section relevance-section">
    <h3>Relevance map <span>{sorted.length}</span></h3>
    <div className="relevance-map" aria-label="Document relevance scores">
      {sorted.map((item, index) => <button
        type="button"
        key={item.document_id || index}
        className={item === selected ? "selected" : ""}
        style={{ backgroundColor: relevanceColor(item) }}
        title={relevanceLabel(item)}
        aria-label={relevanceLabel(item)}
        onMouseEnter={() => setSelected(item)}
        onFocus={() => setSelected(item)}
        onClick={() => setSelected(item)}
      />)}
    </div>
    <div className="relevance-scale" aria-hidden="true"><span>Lower</span><i /><span>Higher</span></div>
    <div className="relevance-top">
      <span>{selected ? "Selected and top matches" : "Top matches"}</span>
      {highlighted.map((item, index) => <article key={item.document_id || index}>
        {item.url ? <a href={item.url} target="_blank" rel="noreferrer">{decodeAiText(item.title || "Untitled document")}</a> : <strong>{decodeAiText(item.title || "Untitled document")}</strong>}
        <small>{Math.round(relevanceScore(item) * 100)}% relevant{item.year ? ` · ${item.year}` : ""}</small>
      </article>)}
    </div>
  </div>;
}

const DATA_SOURCES: Array<{ id: AiDataSource; label: string }> = [
  { id: "innovation_library", label: "Library" },
  { id: "projects", label: "Projects" },
  { id: "all", label: "All" }
];

function DatasetSelector({ compact = false }: { compact?: boolean }) {
  const assistant = useAssistant();
  const help = assistant.dataSource === "innovation_library"
    ? "Searches approved Innovation Library resources."
    : assistant.dataSource === "projects"
      ? "Searches prepared project database records."
      : "Searches both approved knowledge and prepared project records.";
  return <fieldset className={`dataset-selector${compact ? " dataset-selector--compact" : ""}`}>
    <legend>Knowledge source</legend>
    <div className="segmented-control">{DATA_SOURCES.map((source) => <label className={assistant.dataSource === source.id ? "selected" : ""} key={source.id}>
      <input type="radio" name={compact ? "compact-data-source" : "studio-data-source"} value={source.id} checked={assistant.dataSource === source.id} onChange={() => assistant.setDataSource(source.id)} />
      <span>{source.label}</span>
    </label>)}</div>
    {!compact && <p className="field-help">{help}</p>}
  </fieldset>;
}

function CompactTools({ ideas }: { ideas: string[] }) {
  const assistant = useAssistant();
  const toolsRef = useRef<HTMLDivElement>(null);
  const closeTools = () => toolsRef.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((tool) => tool.removeAttribute("open"));
  useEffect(() => {
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const openTool = toolsRef.current?.querySelector<HTMLDetailsElement>("details[open]");
      if (openTool && target && !openTool.contains(target)) closeTools();
    };
    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    return () => document.removeEventListener("pointerdown", closeOnOutsideInteraction);
  }, []);
  const useIdea = (idea: string) => {
    closeTools();
    void assistant.send(idea);
  };
  return <div ref={toolsRef} className="assistant-compact-tools" aria-label="Assistant tools">
    <details className="assistant-tool">
      <summary title="Choose knowledge source"><Database size={16} /><span>Data</span></summary>
      <div className="assistant-tool-panel assistant-tool-panel--dataset"><strong>Knowledge source</strong><DatasetSelector compact /></div>
    </details>
    <details className="assistant-tool">
      <summary title="View cited resources"><BookOpen size={16} /><span>Sources</span><b>{assistant.sources.length}</b></summary>
      <div className="assistant-tool-panel"><div className="tool-panel-heading"><strong>Cited resources</strong><span>{assistant.sources.length}</span></div><SourceList compact sources={assistant.sources} /></div>
    </details>
    <details className="assistant-tool assistant-tool--prompts">
      <summary title="View suggested questions"><Sparkles size={16} /><span>Prompts</span></summary>
      <div className="assistant-tool-panel"><strong>Suggested questions</strong><div className="compact-prompt-list">{ideas.slice(0, 3).map((idea) => <button type="button" key={idea} onClick={() => useIdea(idea)}>{decodeAiText(idea)}</button>)}</div></div>
    </details>
    <span className={`compact-service-status service-status--${assistant.status}`} title={assistant.statusText} aria-label={assistant.statusText}><i aria-hidden="true" /></span>
    {!!assistant.messages.length && <button className="assistant-tool-button" type="button" onClick={assistant.clear} title="Start a new conversation" aria-label="Start a new conversation"><RotateCcw size={16} /></button>}
  </div>;
}

export function AssistantConversation({ studio = false }: { studio?: boolean }) {
  const assistant = useAssistant();
  const { locale } = useI18n();
  const [frontendStarterIdeas, setFrontendStarterIdeas] = useState(() => selectStarterIdeas(locale));
  const previousLocale = useRef(locale);
  const conversationWasActive = useRef(assistant.messages.length > 0);
  const [query, setQuery] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const latestAnswerRef = useRef<HTMLElement>(null);
  const positionedInitialAnswer = useRef(false);
  const latestAnswerId = assistant.messages.filter((item) => item.role === "assistant").at(-1)?.id;
  useLayoutEffect(() => {
    if (!positionedInitialAnswer.current) {
      positionedInitialAnswer.current = true;
      if (!studio && !assistant.running && bodyRef.current && latestAnswerRef.current) {
        const bodyTop = bodyRef.current.getBoundingClientRect().top;
        const answerTop = latestAnswerRef.current.getBoundingClientRect().top;
        bodyRef.current.scrollTop += answerTop - bodyTop;
        return;
      }
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [assistant.messages, assistant.running, studio]);
  useEffect(() => {
    if (!assistant.draft) return;
    setQuery(assistant.draft);
    assistant.setDraft("");
  }, [assistant.draft, assistant.setDraft]);
  useEffect(() => {
    const conversationIsActive = assistant.messages.length > 0;
    const localeChanged = previousLocale.current !== locale;
    const conversationCleared = conversationWasActive.current && !conversationIsActive;
    if (localeChanged || conversationCleared) {
      setFrontendStarterIdeas(selectStarterIdeas(locale));
    }
    previousLocale.current = locale;
    conversationWasActive.current = conversationIsActive;
  }, [assistant.messages.length, locale]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    void assistant.send(query);
    setQuery("");
  };
  const starterIdeas = assistant.ideas.length ? assistant.ideas : frontendStarterIdeas;
  const lastHuman = assistant.messages.filter((item) => item.role !== "assistant").at(-1)?.content || "";
  return (
    <div className={`assistant-experience ${studio ? "assistant-experience--studio" : "assistant-experience--compact"}`}>
      {studio ? <div className="assistant-controls">
        <DatasetSelector />
        <div className={`service-status service-status--${assistant.status}`} role="status"><span aria-hidden="true" />{assistant.statusText}</div>
        {!!assistant.messages.length && <button className="icon-button" type="button" onClick={assistant.clear} title="Start a new conversation" aria-label="Start a new conversation"><RotateCcw size={18} /></button>}
      </div> : <CompactTools ideas={starterIdeas} />}
      <div ref={bodyRef} className="assistant-body" aria-live="polite">
        {!assistant.messages.length && <div className="assistant-welcome"><Bot size={32} aria-hidden="true" /><h2>Ask SGP knowledge</h2><p>Search the Innovation Library, prepared project database, or both with sources you can inspect.</p><small>{assistant.scopeLabel}</small></div>}
        {assistant.messages.map((message) => <article ref={message.id === latestAnswerId ? latestAnswerRef : undefined} key={message.id} className={`message message--${message.role === "assistant" ? "assistant" : "human"}`}>
          <strong>{message.role === "assistant" ? "SGP assistant" : "You"}</strong>
          {message.content ? <AnswerText>{message.content}</AnswerText> : <p>{assistant.running ? "Searching approved sources…" : "No answer was returned."}</p>}
        </article>)}
        {assistant.error && <div className="error-state" role="alert"><strong>The assistant could not complete this request.</strong><p>{assistant.error}</p><button type="button" onClick={() => void assistant.send(lastHuman)}>Retry</button></div>}
        <div ref={endRef} />
      </div>
      {studio && <aside className="assistant-evidence" aria-label="Answer evidence">
        <div className="evidence-section"><h3>Sources <span>{uniqueSources(assistant.sources).length}</span></h3><SourceList sources={assistant.sources} /></div>
        <RelevancePanel documents={assistant.relevance} />
      </aside>}
      {studio && <div className="assistant-suggestions" aria-label="Suggested questions">{starterIdeas.slice(0, 3).map((idea) => <button type="button" key={idea} onClick={() => void assistant.send(idea)}>{decodeAiText(idea)}</button>)}</div>}
      <form className="assistant-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor={studio ? "studio-query" : "dock-query"}>Ask a question</label>
        <textarea id={studio ? "studio-query" : "dock-query"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ASSISTANT_PROMPT} rows={2} />
        {assistant.running
          ? <button className="icon-button icon-button--stop" type="button" onClick={assistant.stop} aria-label="Stop response"><Square size={16} /></button>
          : <button className="icon-button icon-button--send" type="submit" disabled={query.trim().length < 2 || assistant.status !== "ready"} aria-label="Send question"><ArrowUp size={18} /></button>}
      </form>
      <p className="assistant-boundary">AI retrieves and summarizes approved knowledge. Check the cited resources before acting.</p>
    </div>
  );
}

export function AssistantDock() {
  const { dockOpen, setDockOpen, running } = useAssistant();
  const [activity, setActivity] = useState<"idle" | "thinking" | "ready">("idle");
  const minimizedRequest = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const minimizeDock = () => {
    if (running) {
      minimizedRequest.current = true;
      setActivity("thinking");
    }
    setDockOpen(false);
  };
  const openDock = () => {
    minimizedRequest.current = false;
    setActivity("idle");
    setDockOpen(true);
  };
  useEffect(() => {
    if (dockOpen) {
      minimizedRequest.current = false;
      setActivity("idle");
    } else if (minimizedRequest.current && !running) {
      minimizedRequest.current = false;
      setActivity("ready");
    }
  }, [dockOpen, running]);
  useEffect(() => {
    if (!dockOpen) return;
    dialogRef.current?.querySelector<HTMLElement>("textarea,button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { minimizeDock(); triggerRef.current?.focus(); }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button,[href],summary,textarea,input:not([type="hidden"])')];
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable.at(-1)!;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [dockOpen, running, setDockOpen]);
  const triggerLabel = activity === "thinking" ? "SGP is thinking" : activity === "ready" ? "Answer ready" : "Ask SGP";
  return <>
    <button ref={triggerRef} className={`assistant-trigger assistant-trigger--${activity}`} type="button" onClick={openDock} aria-label={activity === "idle" ? "Open SGP assistant" : triggerLabel}>
      {activity === "thinking" ? <LoaderCircle className="assistant-thinking-icon" size={20} /> : <Bot size={20} />}
      <span>{triggerLabel}</span>
      {activity === "ready" && <i className="assistant-trigger-notification" aria-hidden="true" />}
    </button>
    <span className="sr-only" role="status" aria-live="polite">{activity === "idle" ? "" : triggerLabel}</span>
    {dockOpen && <div className="assistant-backdrop" onMouseDown={(event) => event.target === event.currentTarget && minimizeDock()}>
      <section ref={dialogRef} className="assistant-dock" role="dialog" aria-modal="true" aria-label="SGP knowledge assistant">
        <header><div><span className="eyebrow">Knowledge service</span><h2>Ask SGP</h2></div><div className="dock-actions"><button className="icon-button" type="button" onClick={() => { setActivity("idle"); setDockOpen(false); navigateTo("/knowledge/studio"); }} aria-label="Open Knowledge Studio"><Maximize2 size={18} /></button><button className="icon-button" type="button" onClick={() => { minimizeDock(); triggerRef.current?.focus(); }} aria-label="Close assistant"><X size={20} /></button></div></header>
        <AssistantConversation />
      </section>
    </div>}
  </>;
}
