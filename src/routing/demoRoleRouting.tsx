import { createContext, type ReactNode, useContext } from "react";
import { parseRole, type Role } from "../auth/roles";
import { splitLocalizedPath } from "../lib/browser/navigation";
import { requiredAccessArea } from "./access";

export const DEMO_ROLE_QUERY_PARAM = "role";

export type DemoSignedInRole = Exclude<Role, "public">;

const DemoRoleRoutingContext = createContext<Role>("public");

export function DemoRoleRoutingProvider({ role, children }: { role: Role; children: ReactNode }) {
  return <DemoRoleRoutingContext.Provider value={role}>{children}</DemoRoleRoutingContext.Provider>;
}

export function useDemoRoleForLinks() {
  return useContext(DemoRoleRoutingContext);
}

export function isDemoRoleRoute(path: string) {
  return requiredAccessArea(path) !== null;
}

export function demoRoleFromSearch(search: string): DemoSignedInRole | null {
  const value = new URLSearchParams(search).get(DEMO_ROLE_QUERY_PARAM);
  if (!value) return null;
  const role = parseRole(value);
  return role === "public" ? null : role;
}

export function demoRoleFromLocation(path: string, search: string) {
  return isDemoRoleRoute(path) ? demoRoleFromSearch(search) : null;
}

export function withDemoRole(href: string, role: Role) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "https://sgp-demo.invalid");
  const { path } = splitLocalizedPath(url.pathname);
  if (!isDemoRoleRoute(path)) return href;
  if (role === "public") url.searchParams.delete(DEMO_ROLE_QUERY_PARAM);
  else url.searchParams.set(DEMO_ROLE_QUERY_PARAM, role);
  return `${url.pathname}${url.search}${url.hash}`;
}
