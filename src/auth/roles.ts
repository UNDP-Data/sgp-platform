export const ROLES = [
  "public",
  "applicant",
  "reviewer",
  "grantee",
  "national",
  "agency-admin",
  "undp-admin",
  "platform-admin",
  "it-frontend",
  "it-backend",
  "super-admin"
] as const;

export type Role = (typeof ROLES)[number];
export const PRIVILEGED_ROLES = [
  "agency-admin",
  "undp-admin",
  "platform-admin",
  "it-frontend",
  "it-backend",
  "super-admin"
] as const satisfies readonly Role[];
export type PrivilegedRole = (typeof PRIVILEGED_ROLES)[number];
export type StandardRole = Exclude<Role, "public" | PrivilegedRole>;

export const ROLE_LABELS: Record<Role, string> = {
  public: "Public visitor",
  applicant: "Grant applicant",
  grantee: "Grantee partner",
  reviewer: "Reviewer",
  national: "National programme user",
  "agency-admin": "Agency administrator",
  "undp-admin": "UNDP administrator",
  "platform-admin": "Platform administrator",
  "it-frontend": "IT frontend operator",
  "it-backend": "IT backend operator",
  "super-admin": "Super administrator"
};

const ROLE_SET = new Set<string>(ROLES);
const PRIVILEGED_ROLE_SET = new Set<string>(PRIVILEGED_ROLES);
const LEGACY_ROLE_ALIASES: Record<string, Role> = {
  "klp-admin": "platform-admin",
  "it-admin": "it-frontend"
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

export function isUndpAdmin(role: Role) {
  return role === "undp-admin";
}

export function isPlatformAdmin(role: Role) {
  return role === "platform-admin";
}

export function isItFrontend(role: Role) {
  return role === "it-frontend";
}

export function isItBackend(role: Role) {
  return role === "it-backend";
}

export function isSuperAdmin(role: Role) {
  return role === "super-admin";
}

export function isPrivilegedRole(role: Role): role is PrivilegedRole {
  return PRIVILEGED_ROLE_SET.has(role);
}

export const ROLE_ACCESS_LEVELS: Record<Role, number> = {
  public: 0,
  applicant: 1,
  reviewer: 2,
  grantee: 3,
  national: 4,
  "agency-admin": 5,
  "undp-admin": 6,
  "platform-admin": 7,
  "it-frontend": 8,
  "it-backend": 9,
  "super-admin": 10
};

export const ROLE_ACCESS_SUMMARIES: Record<Role, string> = {
  public: "Public platform access",
  applicant: "Applications, saved knowledge and support",
  reviewer: "Assigned reviews, evidence and support",
  grantee: "Active grants, reporting and field delivery",
  national: "Country programme operations and oversight",
  "agency-admin": "Agency-scoped content, data, AI, integrations and users",
  "undp-admin": "UNDP-scoped programme administration",
  "platform-admin": "Cross-agency programme oversight and governance",
  "it-frontend": "Frontend delivery, site health and sanitized diagnostics",
  "it-backend": "Purpose-bound backend, data, identity and AI operations",
  "super-admin": "Global access policy and controlled platform configuration"
};
