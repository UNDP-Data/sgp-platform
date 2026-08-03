import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AI_RUNTIME_ENABLED,
  extractText,
  getAiStatus,
  getRelevanceMap,
  streamAnswer,
  type AiDataSource,
  type AiMessage,
  type AiSource,
  type RelevanceDocument
} from "../services/ai";
import { parseAssistantSnapshot, type AssistantSnapshot } from "../lib/ai/assistantPersistence";
import { readStoredJson, writeStoredJson } from "../lib/browser/storage";
import { useI18n } from "../i18n";
import type { Role } from "../auth/roles";
import { backendRequest } from "../services/backend";

type AssistantState = {
  messages: AiMessage[];
  sources: AiSource[];
  ideas: string[];
  relevance: RelevanceDocument[];
  status: "checking" | "ready" | "unavailable";
  statusText: string;
  running: boolean;
  error: string;
  draft: string;
  setDraft: (value: string) => void;
  send: (query: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
  dockOpen: boolean;
  setDockOpen: (value: boolean) => void;
  scopeLabel: string;
  setScope: (scopeId: string, label: string) => void;
  dataSource: AiDataSource;
  setDataSource: (source: AiDataSource) => void;
};

const AssistantContext = createContext<AssistantState | null>(null);
const STORAGE_KEY = "sgp-klp-assistant-v1";
const DEFAULT_SCOPE = "general:public";
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const storageKey = (scopeId: string) => scopeId === DEFAULT_SCOPE ? STORAGE_KEY : `${STORAGE_KEY}:${scopeId}`;

export function AssistantProvider({ children, role }: { children: ReactNode; role: Role }) {
  const { locale } = useI18n();
  const saved = useMemo(
    () => readStoredJson(STORAGE_KEY, parseAssistantSnapshot(null), parseAssistantSnapshot),
    []
  );
  const [messages, setMessages] = useState<AiMessage[]>(saved.messages);
  const [sources, setSources] = useState<AiSource[]>(saved.sources);
  const [ideas, setIdeas] = useState<string[]>(saved.ideas);
  const [ideasLocale, setIdeasLocale] = useState<typeof locale | null>(null);
  const [relevance, setRelevance] = useState<RelevanceDocument[]>([]);
  const [status, setStatus] = useState<AssistantState["status"]>("checking");
  const [statusText, setStatusText] = useState("Checking knowledge service");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [dockOpen, setDockOpen] = useState(false);
  const [scopeLabel, setScopeLabel] = useState("General SGP knowledge");
  const [dataSource, setDataSource] = useState<AiDataSource>(() => {
    try {
      const stored = localStorage.getItem("sgp-klp-ai-source");
      return stored === "innovation_library" || stored === "projects" || stored === "all" ? stored : "all";
    } catch { return "all"; }
  });
  const controller = useRef<AbortController | null>(null);
  const scopeRef = useRef(DEFAULT_SCOPE);
  const snapshotRef = useRef({ messages: saved.messages, sources: saved.sources, ideas: saved.ideas });

  useEffect(() => {
    const snapshot = { messages, sources, ideas };
    snapshotRef.current = snapshot;
    writeStoredJson(storageKey(scopeRef.current), snapshot);
    if (role === "public") return;
    const timer = window.setTimeout(() => {
      backendRequest(role, `/assistant/history?scope=${encodeURIComponent(scopeRef.current)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snapshot)
      }).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [ideas, messages, role, sources]);

  useEffect(() => () => controller.current?.abort(), []);

  useEffect(() => {
    if (!AI_RUNTIME_ENABLED) {
      setStatus("unavailable");
      setStatusText("Knowledge service unavailable");
      return;
    }
    const next = new AbortController();
    setStatus("checking");
    getAiStatus(dataSource, next.signal).then((payload) => {
      setStatus(payload.corpus_ready ? "ready" : "unavailable");
      setStatusText(payload.corpus_ready ? `Ready · ${payload.document_count.toLocaleString()} documents` : "Corpus is not ready");
    }).catch((reason: Error) => {
      if (reason.name === "AbortError") return;
      setStatus("unavailable");
      setStatusText("Knowledge service unavailable");
    });
    return () => next.abort();
  }, [dataSource]);

  useEffect(() => {
    try { localStorage.setItem("sgp-klp-ai-source", dataSource); } catch { /* Continue without persistence. */ }
  }, [dataSource]);

  const stop = () => controller.current?.abort();
  const clear = () => {
    stop(); setMessages([]); setSources([]); setIdeas([]); setIdeasLocale(null); setRelevance([]); setError("");
  };

  const setScope = useCallback((scopeId: string, label: string) => {
    const nextScope = scopeId.trim() || DEFAULT_SCOPE;
    setScopeLabel(label);
    if (nextScope === scopeRef.current) return;
    controller.current?.abort();
    controller.current = null;
    writeStoredJson(storageKey(scopeRef.current), snapshotRef.current);
    const next = readStoredJson(storageKey(nextScope), parseAssistantSnapshot(null), parseAssistantSnapshot);
    scopeRef.current = nextScope;
    snapshotRef.current = next;
    setMessages(next.messages);
    setSources(next.sources);
    setIdeas(next.ideas);
    setIdeasLocale(null);
    setRelevance([]);
    setError("");
    setDraft("");
    setRunning(false);
    if (role !== "public") {
      backendRequest<{ snapshot: AssistantSnapshot }>(role, `/assistant/history?scope=${encodeURIComponent(nextScope)}`).then((payload) => {
        if (!payload || scopeRef.current !== nextScope) return;
        const restored = parseAssistantSnapshot(payload.snapshot);
        snapshotRef.current = restored;
        setMessages(restored.messages); setSources(restored.sources); setIdeas(restored.ideas);
      }).catch(() => undefined);
    }
  }, [role]);

  const send = async (query: string) => {
    const clean = query.trim();
    if (clean.length < 2 || controller.current) return;
    const human: AiMessage = { id: id(), role: "human", content: clean, createdAt: new Date().toISOString() };
    const assistant: AiMessage = { id: id(), role: "assistant", content: "", createdAt: new Date().toISOString() };
    const requestMessages = [...messages, human];
    setMessages([...requestMessages, assistant]);
    setSources([]); setIdeas([]); setRelevance([]); setError(""); setRunning(true);
    const next = new AbortController();
    controller.current = next;
    getRelevanceMap(clean, dataSource, next.signal).then(setRelevance).catch(() => undefined);
    try {
      await streamAnswer(clean, locale, (event) => {
        const text = extractText(event.content);
        if (text) setMessages((current) => current.map((item) => item.id === assistant.id ? { ...item, content: item.content + text } : item));
        if (event.documents?.length) setSources(event.documents);
        if (event.ideas?.length) {
          setIdeas(event.ideas.filter(Boolean));
          setIdeasLocale(locale);
        }
      }, dataSource, next.signal);
    } catch (reason) {
      if ((reason as Error).name !== "AbortError") setError((reason as Error).message || "The knowledge service could not complete this request.");
    } finally {
      setRunning(false);
      controller.current = null;
    }
  };

  const value = useMemo<AssistantState>(() => ({
    messages, sources, ideas: ideasLocale === locale ? ideas : [], relevance, status, statusText, running, error, draft, setDraft, send, stop, clear, dockOpen, setDockOpen, scopeLabel, setScope,
    dataSource, setDataSource
  }), [messages, sources, ideas, ideasLocale, locale, relevance, status, statusText, running, error, draft, dockOpen, scopeLabel, setScope, dataSource]);
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used inside AssistantProvider");
  return context;
}
