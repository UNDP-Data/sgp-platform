import type { ProjectRecord } from "../lib/data/schema";
import { publicBackendRequest } from "./backend";

export type ArchiveItem = {
  id: string;
  title: string;
  kind: string;
  recordKind?: string | null;
  routeType?: string | null;
  status?: string | null;
  path?: string | null;
  sourceUrl?: string | null;
  summary?: string;
  contextTitle?: string | null;
  section?: string | null;
  source: string;
};

export type EditorialStory = {
  id: string; sourceKey: string; title: string; summary: string; body: string; canonicalUrl: string;
  publishedAt?: string | null; author?: string | null; imageUrl?: string | null; imageAlt?: string; imageCount: number;
  blocks?: Array<{ type: "paragraph" | "heading" | "quote" | "list_item"; text: string; level?: number }>;
};
export type EditorialVideo = {
  id: string; videoId: string; title: string; canonicalUrl: string; thumbnailUrl: string;
  isVoice: boolean; category: string; context?: string;
};
export type EditorialPublication = {
  id: string; title: string; canonicalUrl: string; downloadUrl: string; countries: string[];
  focalAreas: string[]; types: string[]; appearances: number;
};
export type EditorialPhoto = {
  id: string; title: string; imageUrl: string; alt: string; canonicalUrl: string; publishedAt?: string | null;
};
export type EditorialIndex = {
  generatedAt: string;
  counts: { stories: number; videos: number; voices: number; publications: number; photos: number };
  stories: EditorialStory[]; videos: EditorialVideo[]; publications: EditorialPublication[]; photos: EditorialPhoto[];
};

type CompactTable<T> = { fields: Array<keyof T>; rows: unknown[][] };

function asset(path: string) {
  const clean = path.replace(/^\/+/, "");
  const base = import.meta.env.BASE_URL || "/";
  return `${base.endsWith("/") ? base : `${base}/`}${clean}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const backendPath: Record<string, string> = {
    "generated/knowledge/archive-index.json": "/content/archive",
    "generated/knowledge/editorial-index.json": "/content/editorial",
    "generated/portfolio/data/projects.runtime.json": "/content/projects",
    "generated/provenance.json": "/content/provenance"
  };
  const backend = backendPath[path] ? await publicBackendRequest<T>(backendPath[path]) : null;
  if (backend) return backend;
  const response = await fetch(asset(path));
  if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
  return response.json() as Promise<T>;
}

export async function loadArchiveItems() {
  const payload = await fetchJson<{ items: ArchiveItem[] }>("generated/knowledge/archive-index.json");
  return payload.items;
}

export async function loadEditorialIndex() {
  return fetchJson<EditorialIndex>("generated/knowledge/editorial-index.json");
}

export async function loadProjects() {
  const table = await fetchJson<CompactTable<ProjectRecord>>("generated/portfolio/data/projects.runtime.json");
  return table.rows.map((row) => Object.fromEntries(table.fields.map((field, index) => [field, row[index] ?? null])) as ProjectRecord);
}

export async function loadProvenance() {
  return fetchJson<{ generatedAt: string; sources: Array<{ artifact: string; records: number; sha256: string }> }>("generated/provenance.json");
}

export function normalizedSearch(value: unknown) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
