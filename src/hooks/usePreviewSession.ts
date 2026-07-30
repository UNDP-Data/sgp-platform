import { useCallback, useEffect, useState } from "react";
import { parseRole, type Role } from "../auth/roles";
import { readStoredJson, readStoredValue, removeStoredValue, writeStoredJson, writeStoredValue } from "../lib/browser/storage";

const ROLE_KEY = "sgp-klp-preview-role";
const SAVED_KEY = "sgp-klp-saved-items";

function readSavedItems() {
  return readStoredJson(SAVED_KEY, [], (parsed) => {
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((item): item is string => typeof item === "string" && item.length > 0))];
  });
}

export function usePreviewSession(routeRole: Exclude<Role, "public"> | null = null) {
  const [storedRole, setStoredRole] = useState<Role>(() => {
    if (routeRole) return routeRole;
    const stored = readStoredValue(ROLE_KEY);
    const parsed = parseRole(stored);
    if (stored === "agency-admin" || stored === "klp-admin") writeStoredValue(ROLE_KEY, parsed);
    return parsed;
  });
  const role = routeRole || storedRole;

  useEffect(() => {
    if (!routeRole) return;
    setStoredRole(routeRole);
    writeStoredValue(ROLE_KEY, routeRole);
  }, [routeRole]);

  const [saved, setSaved] = useState<string[]>(readSavedItems);

  const setRole = useCallback((nextRole: Role) => {
    setStoredRole(nextRole);
    if (nextRole === "public") removeStoredValue(ROLE_KEY);
    else writeStoredValue(ROLE_KEY, nextRole);
  }, []);

  const toggleSaved = useCallback((id: string) => {
    if (!id) return;
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      writeStoredJson(SAVED_KEY, next);
      return next;
    });
  }, []);

  return { role, setRole, saved, toggleSaved };
}
