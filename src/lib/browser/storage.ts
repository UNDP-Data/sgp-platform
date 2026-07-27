export function readStoredJson<T>(key: string, fallback: T, parse: (value: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function readStoredValue(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function writeStoredValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStoredValue(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

export function readSessionJson<T>(key: string, fallback: T, parse: (value: unknown) => T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw == null ? fallback : parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function writeSessionJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
