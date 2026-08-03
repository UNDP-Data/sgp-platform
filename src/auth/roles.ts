export const ROLES = [
  "public",
  "programme-assistant",
  "reviewer",
  "nsc",
  "national-coordinator",
  "cpmt",
  "agency-admin",
  "platform-admin",
  "it-admin"
] as const;

export type Role = (typeof ROLES)[number];
export const PRIVILEGED_ROLES = [
  "agency-admin",
  "platform-admin",
  "it-admin"
] as const satisfies readonly Role[];
export type PrivilegedRole = (typeof PRIVILEGED_ROLES)[number];
export type StandardRole = Exclude<Role, "public" | PrivilegedRole>;

export const ROLE_LABELS: Record<Role, string> = {
  public: "Public visitor",
  "programme-assistant": "Programme Assistant",
  reviewer: "TAG Reviewer",
  nsc: "NSC Member / Chair",
  "national-coordinator": "National Coordinator",
  cpmt: "CPMT programme user",
  "agency-admin": "Agency administrator",
  "platform-admin": "Platform administrator",
  "it-admin": "IT administrator"
};

const ROLE_SET = new Set<string>(ROLES);
const PRIVILEGED_ROLE_SET = new Set<string>(PRIVILEGED_ROLES);
const LEGACY_ROLE_ALIASES: Record<string, Role> = {
  applicant: "national-coordinator",
  grantee: "national-coordinator",
  national: "national-coordinator",
  "agency-programme": "agency-admin",
  "fao-admin": "agency-admin",
  "ci-admin": "agency-admin",
  "undp-admin": "agency-admin",
  "klp-admin": "platform-admin",
  "super-admin": "platform-admin",
  "it-frontend": "it-admin",
  "it-backend": "it-admin"
};

export const TEST_ROLES = ROLES.filter((role): role is Exclude<Role, "public"> => role !== "public");

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLE_SET.has(value);
}

export function parseRole(value: unknown): Role {
  if (isRole(value)) return value;
  return typeof value === "string" ? LEGACY_ROLE_ALIASES[value] || "public" : "public";
}

export function isSignedIn(role: Role) {
  return role !== "public";
}

export function isAgencyAdmin(role: Role) {
  return role === "agency-admin";
}

export function isPlatformAdmin(role: Role) {
  return role === "platform-admin";
}

export function isItAdmin(role: Role) {
  return role === "it-admin";
}

export function isPrivilegedRole(role: Role): role is PrivilegedRole {
  return PRIVILEGED_ROLE_SET.has(role);
}

export const ROLE_ACCESS_LEVELS: Record<Role, number> = {
  public: 0,
  "programme-assistant": 1,
  reviewer: 2,
  nsc: 3,
  "national-coordinator": 4,
  cpmt: 5,
  "agency-admin": 6,
  "platform-admin": 10,
  "it-admin": 9
};

export const ROLE_ACCESS_SUMMARIES: Record<Role, string> = {
  public: "Public platform access",
  "programme-assistant": "Delegated country records, documents and reporting support",
  reviewer: "Assigned application reviews, protected evidence and independent recommendations",
  nsc: "Country committee meetings, decisions and oversight",
  "national-coordinator": "Country grant applications, reviews, programme operations, results and reporting",
  cpmt: "Assignment-scoped regional, global, M&E or knowledge work",
  "agency-admin": "Agency programme operations, users, integrations, content, data and governed configuration",
  "platform-admin": "Platform-wide governance, access policy, configuration and cross-agency oversight",
  "it-admin": "Frontend delivery and purpose-bound backend, data, identity and AI operations"
};
