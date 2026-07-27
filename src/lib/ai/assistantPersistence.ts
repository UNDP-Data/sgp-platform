import type { AiMessage, AiSource } from "../../services/ai";

export type AssistantSnapshot = {
  messages: AiMessage[];
  sources: AiSource[];
  ideas: string[];
};

const MESSAGE_ROLES = new Set(["human", "user", "assistant"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMessage(value: unknown): value is AiMessage {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.content === "string"
    && typeof value.createdAt === "string"
    && typeof value.role === "string"
    && MESSAGE_ROLES.has(value.role);
}

function isSource(value: unknown): value is AiSource {
  return isRecord(value)
    && Object.values(value).every((field) => (
      field == null
      || typeof field === "string"
      || typeof field === "number"
      || Array.isArray(field)
    ));
}

export function parseAssistantSnapshot(value: unknown): AssistantSnapshot {
  if (!isRecord(value)) return { messages: [], sources: [], ideas: [] };
  return {
    messages: Array.isArray(value.messages) ? value.messages.filter(isMessage).slice(-100) : [],
    sources: Array.isArray(value.sources) ? value.sources.filter(isSource).slice(0, 100) : [],
    ideas: Array.isArray(value.ideas)
      ? value.ideas.filter((idea): idea is string => typeof idea === "string" && idea.trim().length > 0).slice(0, 20)
      : []
  };
}
