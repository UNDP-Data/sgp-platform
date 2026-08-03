import {
  isAgencyAdmin, isItAdmin, isPlatformAdmin, isSignedIn, type Role
} from "../auth/roles";
import { workspacePathIsAvailable } from "../workspace/workspaceConfig";

export type AccessArea =
  | "your workspace"
  | "agency administration"
  | "platform administration"
  | "IT administration";

export function requiredAccessArea(path: string): AccessArea | null {
  if (path.startsWith("/platform-admin")) return "platform administration";
  if (path.startsWith("/it-admin")) return "IT administration";
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
  if (area === "platform administration") return isPlatformAdmin(role);
  return isItAdmin(role);
}
