import type { Role } from "../auth/roles";

const API_BASE = String(import.meta.env.VITE_SGP_BACKEND_URL || "/api").replace(/\/$/, "");
const SESSION_KEY = "sgp-klp-backend-sessions-v1";
const OFFLINE_RETRY_MS = 10_000;

type BackendSession = { token: string; role: Role; displayName: string; createdAt: string; expiresAt: string };
type SessionMap = Partial<Record<Role, BackendSession>>;

export class BackendApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let offlineUntil = 0;
let sessionRequests = new Map<Role, Promise<BackendSession | null>>();

function enabled() {
  return import.meta.env.VITE_SGP_BACKEND_ENABLED === "true";
}

function readSessions(): SessionMap {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}") as SessionMap;
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveSession(session: BackendSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...readSessions(), [session.role]: session }));
  } catch {
    // A memory-only backend session still works when browser storage is unavailable.
  }
}

function removeSession(role: Role) {
  try {
    const sessions = readSessions();
    delete sessions[role];
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore storage cleanup failures.
  }
}

async function errorFrom(response: Response) {
  try {
    const value = await response.json() as { error?: string; detail?: string; details?: string[] };
    return new BackendApiError(response.status, value.error || value.detail || response.statusText, value.details || []);
  } catch {
    return new BackendApiError(response.status, response.statusText || "Backend request failed.");
  }
}

function proxyIsUnavailable(response: Response) {
  return response.status >= 500 && !response.headers.has("X-Request-Id");
}

export async function ensureBackendSession(role: Role, force = false): Promise<BackendSession | null> {
  if (!enabled() || role === "public" || (!force && Date.now() < offlineUntil)) return null;
  const stored = readSessions()[role];
  if (stored && Date.parse(stored.expiresAt) > Date.now() + 30_000) return stored;
  if (sessionRequests.has(role)) return sessionRequests.get(role) || null;
  const request = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/session`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ role })
      });
      if (proxyIsUnavailable(response)) throw new TypeError("Temporary backend proxy is unavailable.");
      if (!response.ok) throw await errorFrom(response);
      const payload = await response.json() as { session: BackendSession };
      saveSession(payload.session);
      offlineUntil = 0;
      return payload.session;
    } catch (error) {
      if (error instanceof BackendApiError) throw error;
      offlineUntil = Date.now() + OFFLINE_RETRY_MS;
      return null;
    } finally {
      sessionRequests.delete(role);
    }
  })();
  sessionRequests.set(role, request);
  return request;
}

export async function backendRequest<T>(role: Role, path: string, init: RequestInit = {}, retry = true): Promise<T | null> {
  const session = await ensureBackendSession(role);
  if (!session) return null;
  try {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${session.token}`);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (proxyIsUnavailable(response)) throw new TypeError("Temporary backend proxy is unavailable.");
    if (response.status === 401 && retry) {
      removeSession(role);
      const refreshed = await ensureBackendSession(role, true);
      if (!refreshed) return null;
      return backendRequest<T>(role, path, init, false);
    }
    if (!response.ok) throw await errorFrom(response);
    if (response.status === 204) return undefined as T;
    const type = response.headers.get("content-type") || "";
    return (type.includes("application/json") ? response.json() : response.blob()) as Promise<T>;
  } catch (error) {
    if (error instanceof BackendApiError) throw error;
    offlineUntil = Date.now() + OFFLINE_RETRY_MS;
    return null;
  }
}

export async function publicBackendRequest<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  if (!enabled() || Date.now() < offlineUntil) return null;
  try {
    const response = await fetch(`${API_BASE}${path}`, init);
    if (proxyIsUnavailable(response)) throw new TypeError("Temporary backend proxy is unavailable.");
    if (!response.ok) throw await errorFrom(response);
    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof BackendApiError) throw error;
    offlineUntil = Date.now() + OFFLINE_RETRY_MS;
    return null;
  }
}

export function backendAsset(path: string) {
  return `${API_BASE}${path}`;
}
