import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import sitemap from "../src/sitemap.json";
import { decodeAiText, extractText } from "../src/services/ai";
import { findRoute, routePatternMatches } from "../src/routing";
import { apiMessage, apiMessageCoverage } from "../src/api-i18n";
import { OPEN_GRANTS, OPEN_GRANT_THEMES } from "../src/data/open-grants";
import { interfaceCompletionCoverage } from "../src/i18n-interface-completion";
import { uiCompletionCoverage } from "../src/i18n-ui-completion";
import { parseRole, ROLE_ACCESS_LEVELS, TEST_ROLES } from "../src/auth/roles";
import { ADMIN_CONFIGS } from "../src/admin/adminConfig";
import { canAccessPath, requiredAccessArea } from "../src/routing/access";
import { workspaceConfigForRole } from "../src/workspace/workspaceConfig";
import { legacyDestination, preserveLocation } from "../src/routing/legacyRedirects";
import { localizedRouteHref, normalizePath, splitLocalizedPath } from "../src/lib/browser/navigation";
import { publicAssetUrl } from "../src/lib/browser/assets";
import { hasVisibleFocalArea, projectYearDomain, topValues } from "../src/lib/dashboard/model";
import { parseAssistantSnapshot } from "../src/lib/ai/assistantPersistence";
import { ROLE_AREA_ACCENT_BY_LEVEL, roleAreaPresentation } from "../src/workspace/roleAreaPresentation";
import {
  ASSISTANT_STARTER_IDEAS,
  selectStarterIdeas,
  starterIdeasForLocale
} from "../src/lib/ai/starterIdeas";

const root = path.resolve(import.meta.dirname, "..");

describe("route contract", () => {
  test("declares unique route ids and paths", () => {
    const ids = sitemap.routes.map((route) => route.id);
    const paths = sitemap.routes.map((route) => route.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.at(-1)).toBe("*");
  });

  test.each([
    ["/knowledge/resources/:resourceId", "/knowledge/resources/archive%3A42"],
    ["/stories/:contentId", "/stories/story-825"],
    ["/community/events/:eventId", "/community/events/learning-session"],
    ["/workspace/visits/:visitId", "/workspace/visits/demo-visit"],
    ["/workspace/reports/:reportId", "/workspace/reports/demo-report"]
  ])("matches %s", (pattern, concretePath) => {
    expect(routePatternMatches(pattern, concretePath)).toBe(true);
    expect(findRoute(sitemap.routes, concretePath)?.path).toBe(pattern);
  });

  test("publishes every scoped administration route family", () => {
    expect(findRoute(sitemap.routes, "/admin/integrations")?.id).toBe("admin-integrations");
    expect(findRoute(sitemap.routes, "/admin/undp/integrations")?.id).toBe("undp-admin-integrations");
    expect(findRoute(sitemap.routes, "/platform-admin/governance")?.id).toBe("platform-admin-governance");
    expect(findRoute(sitemap.routes, "/it-admin/frontend/incidents")?.id).toBe("it-frontend-incidents");
    expect(findRoute(sitemap.routes, "/it-admin/backend/ai-audit")?.id).toBe("it-backend-ai-audit");
    expect(findRoute(sitemap.routes, "/super-admin/audit")?.id).toBe("super-admin-audit");
  });

  test("removes consolidated prototype routes from the canonical contract", () => {
    for (const route of ["/funding/opportunities", "/portfolio/dashboard", "/knowledge/projects", "/community/exchange", "/workspace/contributions", "/api"]) {
      expect(findRoute(sitemap.routes, route)?.path).toBe("*");
    }
  });

  test("uses the explicit not-found route for unknown paths", () => {
    expect(findRoute(sitemap.routes, "/not-a-real-section")?.path).toBe("*");
  });
});

describe("navigation and access policy", () => {
  test("resolves public assets through the configured application base", () => {
    expect(publicAssetUrl("/media/dashboard/preview.png")).toBe("/media/dashboard/preview.png");
    expect(publicAssetUrl("brand/favicon.ico")).toBe("/brand/favicon.ico");
    expect(publicAssetUrl("https://example.org/image.jpg")).toBe("https://example.org/image.jpg");
    expect(publicAssetUrl("data:image/gif;base64,R0lGODlhAQABAAAAACw=")).toBe("data:image/gif;base64,R0lGODlhAQABAAAAACw=");
  });

  test("normalizes paths and resolves legacy routes deterministically", () => {
    expect(normalizePath("/knowledge/library///")).toBe("/knowledge/library");
    expect(splitLocalizedPath("/fr/knowledge/library")).toEqual({ locale: "fr", path: "/knowledge/library" });
    expect(splitLocalizedPath("/ar")).toEqual({ locale: "ar", path: "/" });
    expect(splitLocalizedPath("/knowledge/library")).toEqual({ locale: null, path: "/knowledge/library" });
    expect(localizedRouteHref("/knowledge/library?scope=projects#results", "pt")).toBe("/pt/knowledge/library?scope=projects#results");
    expect(localizedRouteHref("/fr/knowledge/library?scope=projects", "es")).toBe("/es/knowledge/library?scope=projects");
    expect(localizedRouteHref("/pt/knowledge/library", "en")).toBe("/knowledge/library");
    expect(legacyDestination("/portfolio/projects/Community%20forest")).toBe("/portfolio?q=Community%20forest");
    expect(legacyDestination("/stories/places/TUR")).toBe("/stories?place=TUR");
    expect(legacyDestination("/knowledge/library")).toBeNull();
    expect(preserveLocation("/portfolio", "?countries=TUR", "#map")).toBe("/portfolio?countries=TUR#map");
    expect(preserveLocation("/stories#sgp-voices", "?theme=water", "")).toBe("/stories?theme=water#sgp-voices");
  });

  test("rejects invalid persisted roles and enforces scoped route access", () => {
    expect(parseRole("not-a-role")).toBe("public");
    expect(parseRole("klp-admin")).toBe("platform-admin");
    expect(parseRole("it-admin")).toBe("it-frontend");
    expect(requiredAccessArea("/knowledge/saved")).toBe("your workspace");
    expect(requiredAccessArea("/admin/undp/data")).toBe("UNDP administration");
    expect(requiredAccessArea("/platform-admin/agencies")).toBe("platform administration");
    expect(requiredAccessArea("/it-admin/frontend")).toBe("IT frontend administration");
    expect(requiredAccessArea("/it-admin/backend/documents")).toBe("IT backend administration");
    expect(requiredAccessArea("/super-admin/audit")).toBe("super administration");
    expect(canAccessPath("public", "/workspace")).toBe(false);
    expect(canAccessPath("applicant", "/workspace")).toBe(true);
    expect(canAccessPath("agency-admin", "/admin/data")).toBe(true);
    expect(canAccessPath("agency-admin", "/admin/undp/data")).toBe(false);
    expect(canAccessPath("undp-admin", "/admin/data")).toBe(false);
    expect(canAccessPath("platform-admin", "/platform-admin/governance")).toBe(true);
    expect(canAccessPath("platform-admin", "/admin/data")).toBe(false);
    expect(canAccessPath("it-frontend", "/it-admin/frontend/incidents")).toBe(true);
    expect(canAccessPath("it-frontend", "/it-admin/backend/documents")).toBe(false);
    expect(canAccessPath("it-backend", "/it-admin/backend/documents")).toBe(true);
    expect(canAccessPath("it-backend", "/it-admin/frontend/logs")).toBe(false);
    expect(canAccessPath("it-frontend", "/platform-admin/agencies")).toBe(false);
    expect(canAccessPath("super-admin", "/super-admin/audit")).toBe(true);
    expect(canAccessPath("super-admin", "/it-admin/backend/security")).toBe(false);
  });

  test("limits Workspace tools to the signed-in role", () => {
    expect(canAccessPath("applicant", "/workspace/applications")).toBe(true);
    expect(canAccessPath("applicant", "/workspace/reviews")).toBe(false);
    expect(canAccessPath("reviewer", "/workspace/reviews")).toBe(true);
    expect(canAccessPath("reviewer", "/workspace/grants")).toBe(false);
    expect(canAccessPath("platform-admin", "/workspace/notifications")).toBe(true);
    expect(canAccessPath("platform-admin", "/workspace/applications")).toBe(false);
    expect(workspaceConfigForRole("agency-admin").accessCards[0].href).toBe("/admin/documents");
    expect(workspaceConfigForRole("it-frontend").accessCards[0].href).toBe("/it-admin/frontend/health");
    expect(workspaceConfigForRole("it-backend").accessCards[0].href).toBe("/it-admin/backend/health");
  });

  test("exposes one role-specific primary area without duplicate privileged homes", () => {
    const privilegedAreas = [
      ["agency-admin", "Agency administration", "/admin", 7],
      ["undp-admin", "UNDP administration", "/admin/undp", 7],
      ["platform-admin", "Platform administration", "/platform-admin", 9],
      ["it-frontend", "IT frontend administration", "/it-admin/frontend", 8],
      ["it-backend", "IT backend administration", "/it-admin/backend", 8],
      ["super-admin", "Super administration", "/super-admin", 6]
    ] as const;

    for (const [role, label, homeHref, roleSectionCount] of privilegedAreas) {
      const workspace = workspaceConfigForRole(role);
      expect(workspace.label).toBe(label);
      expect(workspace.homeHref).toBe(homeHref);
      expect(workspace.nav[0].href).toBe(homeHref);
      expect(workspace.nav[0].label).toBe("Overview");
      expect(workspace.nav.every((item) => item.description.length > 0)).toBe(true);
      expect(workspace.nav.filter((item) => item.href === "/workspace")).toHaveLength(0);
      expect(workspace.nav).toHaveLength(roleSectionCount + 4);
      expect(new Set(workspace.nav.map((item) => item.href)).size).toBe(workspace.nav.length);
    }

    expect(workspaceConfigForRole("applicant").homeHref).toBe("/workspace");
    expect(workspaceConfigForRole("reviewer").homeHref).toBe("/workspace");
    for (const role of ["applicant", "grantee", "reviewer", "national"] as const) {
      const workspace = workspaceConfigForRole(role);
      expect(workspace.nav[0]).toMatchObject({ id: "overview", href: "/workspace", label: "Overview" });
      expect(workspace.nav.every((item) => item.description.length > 0)).toBe(true);
    }
  });

  test("maps L1-L10 to a contrast-safe teal-to-orange role scale", () => {
    const relativeLuminance = (hex: string) => {
      const channels = hex.slice(1).match(/../g)!.map((channel) => parseInt(channel, 16) / 255);
      const [red, green, blue] = channels.map((value) => (
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      ));
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };

    expect(Object.keys(ROLE_AREA_ACCENT_BY_LEVEL)).toHaveLength(10);
    expect(ROLE_AREA_ACCENT_BY_LEVEL[1]).toBe("#006B73");
    expect(ROLE_AREA_ACCENT_BY_LEVEL[10]).toBe("#B04715");
    for (const role of TEST_ROLES) {
      const presentation = roleAreaPresentation(role);
      expect(presentation.level).toBe(ROLE_ACCESS_LEVELS[role]);
      expect(presentation.accent).toBe(ROLE_AREA_ACCENT_BY_LEVEL[presentation.level]);
      expect(1.05 / (relativeLuminance(presentation.accent) + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("keeps privileged administration configurations distinct", () => {
    expect(ADMIN_CONFIGS.map((config) => config.role)).toEqual([
      "undp-admin", "agency-admin", "platform-admin", "it-frontend", "it-backend", "super-admin"
    ]);
    expect(ADMIN_CONFIGS.find((config) => config.role === "platform-admin")?.sections).toHaveLength(9);
    expect(ADMIN_CONFIGS.find((config) => config.role === "it-frontend")?.sections).toHaveLength(8);
    expect(ADMIN_CONFIGS.find((config) => config.role === "it-backend")?.sections).toHaveLength(8);
    expect(ADMIN_CONFIGS.find((config) => config.role === "super-admin")?.sections).toHaveLength(6);
    expect(ADMIN_CONFIGS.every((config) => config.sections[0].id === "overview")).toBe(true);
  });
});

describe("dashboard model", () => {
  test("keeps placeholder focal areas out of visible themes", () => {
    expect(hasVisibleFocalArea("Biodiversity")).toBe(true);
    expect(hasVisibleFocalArea("Missing")).toBe(false);
    expect(hasVisibleFocalArea("N/A")).toBe(false);
    expect(hasVisibleFocalArea(null)).toBe(false);
  });

  test("derives stable value rankings and year domains", () => {
    expect(topValues(
      [{ country: "TUR" }, { country: "FJI" }, { country: "TUR" }],
      (item) => item.country
    )).toEqual([{ value: "TUR", count: 2 }, { value: "FJI", count: 1 }]);
    expect(projectYearDomain([
      { startYear: 2020 },
      { startYear: null },
      { startYear: 1998 }
    ] as Parameters<typeof projectYearDomain>[0])).toEqual([1998, 2020]);
    expect(projectYearDomain([])).toEqual([1992, 2026]);
  });
});

describe("AI response adapter", () => {
  test("normalizes string, array and nested response content", () => {
    expect(extractText("answer")).toBe("answer");
    expect(extractText([{ text: "cited " }, { content: "answer" }])).toBe("cited answer");
    expect(extractText({ text: { value: "nested" } })).toBe("nested");
  });

  test("decodes service HTML entities without interpreting markup", () => {
    expect(decodeAiText("SGP &amp; communities &quot;learn&quot; &#x27;together&#x27;")).toBe('SGP & communities "learn" \'together\'');
    expect(decodeAiText("&lt;script&gt;")).toBe("<script>");
  });

  test("sanitizes corrupted assistant state before hydration", () => {
    expect(parseAssistantSnapshot({ dataset: "invalid", messages: "bad", sources: null, ideas: [42] })).toEqual({
      messages: [],
      sources: [],
      ideas: []
    });
    expect(parseAssistantSnapshot({
      dataset: "project_database",
      messages: [{ id: "1", role: "human", content: "Question", createdAt: "2026-07-23" }, { role: "bad" }],
      sources: [{ title: "Source", year: 2025 }, "invalid"],
      ideas: ["Follow up", "", 4]
    })).toMatchObject({
      messages: [{ id: "1", role: "human", content: "Question", createdAt: "2026-07-23" }],
      sources: [{ title: "Source", year: 2025 }],
      ideas: ["Follow up"]
    });
  });
});

describe("generated data contract", () => {
  test("contains validated, checksummed build artifacts", async () => {
    const provenance = JSON.parse(await readFile(path.join(root, "public/generated/provenance.json"), "utf8")) as {
      schemaVersion: string;
      sources: Array<{ artifact: string; sha256: string; records: number; validation: string }>;
    };
    expect(provenance.schemaVersion).toBe("sgp-klp-mvp-provenance-v1");
    expect(provenance.sources.length).toBeGreaterThanOrEqual(8);
    expect(provenance.sources.every((source) => source.validation === "passed")).toBe(true);
    expect(provenance.sources.every((source) => /^[a-f0-9]{64}$/.test(source.sha256))).toBe(true);
    expect(provenance.sources.find((source) => source.artifact.includes("projects.runtime"))?.records).toBe(30753);
    expect(provenance.sources.find((source) => source.artifact.includes("archive-index"))?.records).toBeGreaterThan(29000);
  });
});

describe("map control styling contract", () => {
  test("keeps map sizing rules from stretching nested control icons", async () => {
    const styles = await readFile(path.join(root, "src/styles.css"), "utf8");
    expect(styles).toContain(".open-grants-map-frame > svg {");
    expect(styles).not.toMatch(/\.open-grants-map-frame svg\s*\{/);
    expect(styles).toContain(".open-grants-map-control-dock button > svg {");
  });
});

describe("open grants test dataset", () => {
  test("covers every portfolio theme with complete, locally illustrated records", async () => {
    expect(OPEN_GRANTS).toHaveLength(10);
    expect(new Set(OPEN_GRANTS.map((grant) => grant.id)).size).toBe(OPEN_GRANTS.length);
    expect(new Set(OPEN_GRANTS.map((grant) => grant.countryIso3)).size).toBe(OPEN_GRANTS.length);
    const representedThemes = new Set(OPEN_GRANTS.flatMap((grant) => grant.themes));
    expect(OPEN_GRANT_THEMES.every((theme) => representedThemes.has(theme))).toBe(true);

    for (const grant of OPEN_GRANTS) {
      expect(grant.prototype).toBe(true);
      expect(grant.fundingMin).toBeGreaterThan(0);
      expect(grant.fundingMax).toBeGreaterThanOrEqual(grant.fundingMin);
      expect(grant.applicantTypes.length).toBeGreaterThanOrEqual(3);
      expect(grant.priorities.length).toBeGreaterThanOrEqual(3);
      expect(grant.expectedOutputs.length).toBeGreaterThanOrEqual(3);
      expect(grant.referenceProject.length).toBeGreaterThan(10);
      expect(grant.imageUrl).toMatch(/^\/media\/grants\/.+\.jpg$/);
      await expect(access(path.join(root, "public", grant.imageUrl))).resolves.toBeUndefined();
    }
  });
});

describe("agency API design contract", () => {
  test("provides complete API documentation copy in every supported locale", () => {
    expect(apiMessageCoverage().filter((message) => !message.complete)).toEqual([]);
    for (const locale of ["pt", "fr", "es", "ru", "zh", "ar"] as const) {
      expect(apiMessage(locale, "hero")).not.toBe(apiMessage("en", "hero"));
      expect(apiMessage(locale, "governance6")).not.toBe(apiMessage("en", "governance6"));
      expect(apiMessage(locale, "contactSupport")).not.toBe(apiMessage("en", "contactSupport"));
    }
  });

  test("marks the external document endpoint as planned", async () => {
    const specification = await readFile(path.join(root, "public/api/openapi-indicative.yaml"), "utf8");
    expect(specification).toContain("/documents/search:");
    expect(specification).toContain("x-sgp-status: planned");
    expect(specification).toContain("/embed/sessions:");
    expect(specification).toContain("Access to a source record never implies publication clearance");
  });
});

describe("consolidated interface localization", () => {
  test("provides complete translations for every newly consolidated interface string", () => {
    expect(interfaceCompletionCoverage().filter((message) => !message.complete)).toEqual([]);
    expect(uiCompletionCoverage().filter((message) => !message.complete)).toEqual([]);
  });

  test("provides 20 translated starter questions in every platform language", () => {
    const english = starterIdeasForLocale("en");
    expect(ASSISTANT_STARTER_IDEAS).toHaveLength(20);
    for (const locale of ["en", "pt", "fr", "es", "ru", "zh", "ar"] as const) {
      const localized = starterIdeasForLocale(locale);
      expect(localized).toHaveLength(20);
      expect(new Set(localized).size).toBe(20);
      expect(localized.every((idea) => /[?？؟]$/u.test(idea.trim()))).toBe(true);
      if (locale !== "en") {
        expect(localized.every((idea, index) => idea !== english[index])).toBe(true);
      }
    }
  });

  test("selects three unique starter questions without replacement", () => {
    const firstSelection = selectStarterIdeas("fr", 3, () => 0);
    const secondSelection = selectStarterIdeas("fr", 3, () => 0.999999);

    expect(firstSelection).toHaveLength(3);
    expect(new Set(firstSelection).size).toBe(3);
    expect(firstSelection.every((idea) => starterIdeasForLocale("fr").includes(idea))).toBe(true);
    expect(secondSelection).not.toEqual(firstSelection);
  });
});
