import { ROLE_ACCESS_LEVELS, type Role } from "../auth/roles";

export type SignedInRole = Exclude<Role, "public">;
export type SignedInAccessLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const ROLE_AREA_ACCENT_BY_LEVEL: Record<SignedInAccessLevel, string> = {
  1: "#006B73",
  2: "#1A706D",
  3: "#347466",
  4: "#4E765D",
  5: "#596947",
  6: "#6C6538",
  7: "#7C5E2E",
  8: "#8E5623",
  9: "#A24E19",
  10: "#B04715"
};

export function roleAreaPresentation(role: Role) {
  if (role === "public") throw new Error("Public visitors do not have a role-area presentation");
  const level = ROLE_ACCESS_LEVELS[role] as SignedInAccessLevel;
  return {
    level,
    accent: ROLE_AREA_ACCENT_BY_LEVEL[level]
  };
}
