import {
  isAgencyAdmin, isItBackend, isItFrontend, isPlatformAdmin, isSignedIn, isSuperAdmin, isUndpAdmin, type Role
} from "../auth/roles";
import { workspacePathIsAvailable } from "../workspace/workspaceConfig";

export type AccessArea =
  | "your workspace"
  | "agency administration"
  | "UNDP administration"
  | "platform administration"
  | "IT frontend administration"
  | "IT backend administration"
  | "super administration";

export function requiredAccessArea(path: string): AccessArea | null {
  if (path.startsWith("/platform-admin")) return "platform administration";
  if (path.startsWith("/it-admin/backend")) return "IT backend administration";
  if (path.startsWith("/it-admin")) return "IT frontend administration";
  if (path.startsWith("/super-admin")) return "super administration";
  if (path.startsWith("/admin/undp")) return "UNDP administration";
  if (path.startsWith("/admin")) return "agency administration";
  if (path.startsWith("/workspace") || path === "/knowledge/saved") return "your workspace";
  return null;
}

export function canAccessPath(role: Role, path: string) {
  const area = requiredAccessArea(path);
  if (!area) return true;
  if (area === "your workspace") {
    if (path === "/knowledge/saved") return isSignedIn(role);
    return workspacePathIsAvailable(role, path);
  }
  if (area === "agency administration") return isAgencyAdmin(role);
  if (area === "UNDP administration") return isUndpAdmin(role);
  if (area === "platform administration") return isPlatformAdmin(role);
  if (area === "IT frontend administration") return isItFrontend(role);
  if (area === "IT backend administration") return isItBackend(role);
  return isSuperAdmin(role);
}
