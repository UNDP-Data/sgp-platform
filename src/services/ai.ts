export const AI_API_BASE = import.meta.env.DEV ? "/api/sgp-ai" : "https://sea-ai-api.azurewebsites.net/pages/sgp-ai";
export const AI_DATA_SOURCE = "innovation_library";
export type AiUiLocale = "en" | "pt" | "fr" | "es" | "ru" | "zh" | "ar";

function apiEndpoint(path: string) {
  return new URL(`${AI_API_BASE}/${path}`, window.location.origin);
}

export type AiRole = "human" | "user" | "assistant";
export type AiMessage = { id: string; role: AiRole; content: string; createdAt: string };
export type AiSource = {
  title?: string;
  url?: string;
  summary?: string;
  language?: string;
  dataset?: string;
  corpus?: string;
  source?: string;
  source_id?: string;
  year?: number | string;
  document_id?: string;
};
export type RelevanceDocument = AiSource & {
  relevance?: number;
  document_type?: string;
  topics?: string[] | string;
  country_codes?: string[] | string;
  region_codes?: string[] | string;
};
export type StreamEvent = { content?: unknown; documents?: AiSource[]; ideas?: string[] };

async function apiError(response: Response) {
  const text = await response.text();
  try {
    const payload = JSON.parse(text) as { detail?: string; error?: string };
    return payload.detail || payload.error || response.statusText;
  } catch {
    return text || response.statusText;
  }
}

export function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(extractText).join("");
  if (content && typeof content === "object") {
    const value = content as { text?: unknown; content?: unknown };
    if (typeof value.text === "string") return value.text;
    if (value.text && typeof value.text === "object" && "value" in value.text) return String((value.text as { value: unknown }).value || "");
    if (value.content) return extractText(value.content);
  }
  return "";
}

export function decodeAiText(value: string): string {
  const named: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (entity, code: string) => {
    if (code[0] !== "#") return named[code.toLowerCase()] || entity;
    const numeric = code[1].toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
    return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : entity;
  });
}

export async function getAiStatus(signal?: AbortSignal) {
  const endpoint = apiEndpoint("status");
  endpoint.searchParams.set("data_source", AI_DATA_SOURCE);
  const response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal });
  if (!response.ok) throw new Error(await apiError(response));
  return response.json() as Promise<{ corpus_ready: boolean; document_count: number }>;
}

export async function getRelevanceMap(query: string, signal?: AbortSignal) {
  const endpoint = apiEndpoint("relevance-map");
  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("data_source", AI_DATA_SOURCE);
  const response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal });
  if (!response.ok) throw new Error(await apiError(response));
  const payload = await response.json() as { documents?: RelevanceDocument[] };
  return payload.documents || [];
}

export async function streamAnswer(
  query: string,
  uiLocale: AiUiLocale,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
) {
  const endpoint = apiEndpoint("model");
  endpoint.searchParams.set("data_source", AI_DATA_SOURCE);
  endpoint.searchParams.set("ui_locale", uiLocale);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/x-ndjson", "Content-Type": "application/json" },
    body: JSON.stringify([{ role: "human", content: query }]),
    signal
  });
  if (!response.ok) throw new Error(await apiError(response));
  if (!response.body) throw new Error("The AI service returned no response stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as StreamEvent);
    if (done) break;
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as StreamEvent);
}
