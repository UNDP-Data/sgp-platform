import { useCallback, useState } from "react";
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

export function usePreviewSession() {
  const [role, setRoleState] = useState<Role>(() => {
    const stored = readStoredValue(ROLE_KEY);
    const parsed = parseRole(stored);
    if (stored === "klp-admin") writeStoredValue(ROLE_KEY, parsed);
    return parsed;
  });
  const [saved, setSaved] = useState<string[]>(readSavedItems);

  const setRole = useCallback((nextRole: Role) => {
    setRoleState(nextRole);
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
