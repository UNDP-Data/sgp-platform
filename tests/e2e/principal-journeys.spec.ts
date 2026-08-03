import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

const sitemap = JSON.parse(readFileSync(new URL("../../src/sitemap.json", import.meta.url), "utf8")) as {
  routes: Array<{ path: string }>;
};

function roleForPath(path: string) {
  if (path.startsWith("/platform-admin")) return "platform-admin";
  if (path.startsWith("/it-admin")) return "it-admin";
  if (path.startsWith("/admin")) return "agency-admin";
  if (path.startsWith("/workspace/reviews")) return "reviewer";
  if (path.startsWith("/workspace/decisions")) return "nsc";
  if (path.startsWith("/workspace/agreements") || path.startsWith("/workspace/finance") || path.startsWith("/workspace/safeguards") || path.startsWith("/workspace/data-exchange")) return "agency-admin";
  if (path.startsWith("/workspace/programmes") || path.startsWith("/workspace/corrections")) return "cpmt";
  return "national-coordinator";
}

test("public journey reaches funding, knowledge and the shared assistant", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Knowledge and Learning Platform" })).toBeVisible();
  await page.getByRole("link", { name: /Find opportunities/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Open grants" })).toBeVisible();
  await page.goto("/knowledge/library");
  await expect(page.getByRole("heading", { level: 1, name: "Innovation Library" })).toBeVisible();
  await expect(page.getByText(/migrated records/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /Open SGP assistant/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ask SGP", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ask SGP knowledge" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("Knowledge Studio and Ask SGP expose the shared assistant at different depths", async ({ page }) => {
  await page.goto("/knowledge/studio");
  await expect(page.getByRole("heading", { level: 1, name: "AI Knowledge Studio" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Ask a question" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Answer evidence" })).toBeVisible();

  await page.getByRole("button", { name: "Open SGP assistant" }).click();
  const dock = page.getByRole("dialog", { name: "SGP knowledge assistant" });
  await expect(dock).toBeVisible();
  await expect(dock.locator(".assistant-tool")).toHaveCount(3);
  await expect(dock.locator('summary[title="Choose knowledge source"]')).toBeVisible();
  await expect(dock.locator('summary[title="View cited resources"]')).toBeVisible();
  await expect(dock.locator('summary[title="View suggested questions"]')).toBeVisible();
});

test("portfolio dashboard is integrated as a native route", async ({ page }, testInfo) => {
  await page.goto("/portfolio");
  await expect(page.locator(".impact-atlas-stage")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("dialog", { name: "How would you like to begin?" })).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  const map = page.locator(".map-svg");
  const transform = page.locator(".map-transform-group");
  if (testInfo.project.name === "mobile") {
    await expect(map).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    return;
  }
  await map.hover();
  const beforeTransform = await transform.getAttribute("transform");
  const beforeScroll = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, -280);
  await expect.poll(() => transform.getAttribute("transform")).not.toBe(beforeTransform);
  expect(await page.evaluate(() => window.scrollY)).toBe(beforeScroll);
});

test("account menu exposes workspace tools and signed-in work dashboard", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "programme-assistant"));
  await page.goto("/");
  await expect(page.locator(".brand-logo")).toBeVisible();
  await page.getByRole("button", { name: "Open account menu" }).click();
  const account = page.locator("#account-menu-panel");
  await expect(account.getByRole("link", { name: /Programme Assistant workspace/ })).toBeVisible();
  await expect(account.locator(".account-primary-area")).toHaveAttribute("data-access-level", "L1");
  const roleSelector = account.getByLabel("Select user type");
  await expect(roleSelector).toHaveValue("programme-assistant");
  await roleSelector.selectOption("reviewer");
  await expect(page.locator(".account-trigger")).toContainText("Reviewer");
  await expect(account.locator(".account-primary-area")).toHaveAttribute("data-access-level", "L2");
  expect(await page.evaluate(() => localStorage.getItem("sgp-klp-preview-role"))).toBe("reviewer");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByText("Priority queue", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /items to review/ })).toBeVisible();

  await account.getByRole("button", { name: /Log out/ }).click();
  await expect(page.locator(".account-trigger")).toContainText("Sign in");
  expect(await page.evaluate(() => localStorage.getItem("sgp-klp-preview-role"))).toBeNull();
  await page.getByRole("button", { name: "Open account menu" }).click();
  const signInSelector = page.locator("#account-menu-panel").getByLabel("Sign in as test user");
  await signInSelector.selectOption("national-coordinator");
  await expect(page.locator(".account-trigger")).toContainText("National Coordinator");
  expect(await page.evaluate(() => localStorage.getItem("sgp-klp-preview-role"))).toBe("national-coordinator");
});

test("signed-out workspace offers every user type and opens its configured workspace", async ({ page }) => {
  const roles = [
    ["programme-assistant", "Programme Assistant", "/workspace", "L1"],
    ["reviewer", "TAG Reviewer", "/workspace", "L2"],
    ["nsc", "NSC Member / Chair", "/workspace", "L3"],
    ["national-coordinator", "National Coordinator", "/workspace", "L4"],
    ["cpmt", "CPMT programme user", "/workspace", "L5"],
    ["agency-admin", "Agency administrator", "/admin", "L6"],
    ["platform-admin", "Platform administrator", "/platform-admin", "L10"],
    ["it-admin", "IT administrator", "/it-admin", "L9"]
  ] as const;

  await page.goto("/workspace");
  await expect(page.getByRole("heading", { name: "Sign in to open your workspace" })).toBeVisible();
  await expect(page.getByText("Persistent temporary backend", { exact: true })).toBeVisible();
  await expect(page.getByText("No credentials required", { exact: true })).toHaveCount(0);
  await expect(page.locator(".workspace-signin__notice")).toHaveCount(0);
  const cards = page.locator(".workspace-signin-card");
  await expect(cards).toHaveCount(roles.length);
  await expect(cards.locator(".workspace-signin-card__icon svg")).toHaveCount(roles.length);
  const agencyGroup = page.locator('.workspace-signin-group[aria-labelledby="workspace-signin-agency"]');
  await expect(agencyGroup.getByRole("heading", { name: "Agency workspaces" })).toBeVisible();
  await expect(agencyGroup.locator(".workspace-signin-card")).toHaveCount(1);
  expect(await agencyGroup.locator(".workspace-signin-card").evaluateAll((items) =>
    items.map((item) => item.getAttribute("data-role"))
  )).toEqual(["agency-admin"]);
  const administrationGroup = page.locator('.workspace-signin-group[aria-labelledby="workspace-signin-administration"]');
  await expect(administrationGroup.locator(".workspace-signin-card")).toHaveCount(2);
  await expect(administrationGroup.locator('[data-role="agency-admin"]')).toHaveCount(0);
  const accents = await cards.evaluateAll((items) => items.map((item) =>
    getComputedStyle(item).getPropertyValue("--signin-accent").trim()
  ));
  expect(new Set(accents).size).toBe(8);

  for (const [role, label, homeHref, accessLevel] of roles) {
    await page.evaluate(() => localStorage.removeItem("sgp-klp-preview-role"));
    await page.goto("/workspace");
    const card = page.locator(`.workspace-signin-card[data-role="${role}"]`);
    await expect(card).toHaveAttribute("data-access-level", accessLevel);
    await card.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("sgp-klp-preview-role"))).toBe(role);
    await expect.poll(() => page.evaluate(() => window.location.pathname)).toBe(homeHref);
    await expect.poll(() => page.evaluate(() => new URLSearchParams(window.location.search).get("role"))).toBe(role);
    await expect(page.locator(".account-trigger")).toContainText(label);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("changing to a role without page access returns to that role's overview", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "national-coordinator"));
  await page.goto("/workspace/grants/KEN-GRT-014");

  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.locator("#account-menu-panel").getByLabel("Select user type").selectOption("reviewer");
  await expect(page).toHaveURL((url) => url.pathname === "/workspace");
  await expect(page).toHaveURL((url) => url.searchParams.get("role") === "reviewer");
  await expect(page.locator(".account-trigger")).toContainText("Reviewer");
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  await expect(page.locator(".role-area")).toHaveAttribute("data-role", "reviewer");

  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.locator("#account-menu-panel").getByLabel("Select user type").selectOption("platform-admin");
  await expect(page).toHaveURL((url) => url.pathname === "/platform-admin");
  await expect(page).toHaveURL((url) => url.searchParams.get("role") === "platform-admin");
  await expect(page.locator(".account-trigger")).toContainText("Platform administrator");
  await expect(page.locator(".role-area")).toHaveAttribute("data-role", "platform-admin");

  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.locator("#account-menu-panel").getByLabel("Select user type").selectOption("programme-assistant");
  await expect(page).toHaveURL((url) => url.pathname === "/workspace");
  await expect(page).toHaveURL((url) => url.searchParams.get("role") === "programme-assistant");
  await expect(page.locator(".account-trigger")).toContainText("Programme Assistant");
  await expect(page.locator(".role-area")).toHaveAttribute("data-role", "programme-assistant");
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
});

test("navigation state, legacy redirects and dismissible menus remain resilient", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one browser covers the navigation foundation");
  await page.addInitScript(() => {
    localStorage.setItem("sgp-klp-preview-role", "corrupted-role");
    localStorage.setItem("sgp-klp-saved-items", "{broken");
  });
  await page.goto("/workspace");
  await expect(page.getByRole("heading", { name: "Sign in to open your workspace" })).toBeVisible();
  await expect(page.locator(".account-trigger")).toContainText("Sign in");

  await page.goto("/stories/voices?theme=water");
  await expect(page).toHaveURL(/\/stories\?theme=water#sgp-voices$/);
  await expect(page.locator("#sgp-voices")).toBeVisible();

  await page.goto("/");
  const languageButton = page.getByRole("button", { name: "Select language" });
  await languageButton.click();
  await expect(page.locator("#language-menu-panel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#language-menu-panel")).toBeHidden();
  await expect(languageButton).toBeFocused();

  const accountButton = page.getByRole("button", { name: "Open account menu" });
  await accountButton.click();
  await expect(page.locator("#account-menu-panel")).toBeVisible();
  await page.locator(".home-hero-content h1").click();
  await expect(page.locator("#account-menu-panel")).toBeHidden();
});

test("shared permissioned links activate and retain their technical-demo user type", async ({ page }) => {
  await page.goto("/workspace/grants/KEN-GRT-014?role=national-coordinator");
  await expect(page.locator(".account-trigger")).toContainText("National Coordinator");
  await expect(page.locator(".role-area")).toHaveAttribute("data-role", "national-coordinator");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("sgp-klp-preview-role"))).toBe("national-coordinator");
  await expect(page.getByRole("navigation", { name: "National Coordinator workspace sections" }).getByRole("link", { name: "Results and AMR" }))
    .toHaveAttribute("href", "/workspace/amr?role=national-coordinator");
  await expect(page.getByRole("link", { name: /Return to grants/ })).toHaveAttribute(
    "href",
    "/workspace/grants?role=national-coordinator"
  );

  await page.goto("/fr/workspace/reviews/KEN-REV-014?view=evidence&role=reviewer#activity");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator(".role-area")).toHaveAttribute("data-role", "reviewer");
  await expect(page).toHaveURL((url) =>
    url.pathname === "/fr/workspace/reviews/KEN-REV-014"
    && url.searchParams.get("view") === "evidence"
    && url.searchParams.get("role") === "reviewer"
    && url.hash === "#activity"
  );
  await expect(page.locator('.workspace-nav a[href="/fr/workspace/reviews?role=reviewer"]')).toHaveCount(1);

  await page.evaluate(() => localStorage.removeItem("sgp-klp-preview-role"));
  const invalidPage = await page.context().newPage();
  await invalidPage.goto("/workspace/reviews?role=not-a-role");
  await expect(invalidPage.getByRole("heading", { name: "Sign in to open your workspace" })).toBeVisible();
  await expect(invalidPage).toHaveURL((url) => !url.searchParams.has("role"));
});

test("every workspace route keeps its navigation and fixed-height context header", async ({ page }, testInfo) => {
  const routes: Array<[string, string, string, string, string, number]> = [
    ["/workspace", "programme-assistant", "L1", "rgb(0, 107, 115)", "Programme Assistant workspace", 10],
    ["/workspace/proposals", "programme-assistant", "L1", "rgb(0, 107, 115)", "Programme Assistant workspace", 10],
    ["/workspace/reviews/KEN-REV-014", "reviewer", "L2", "rgb(26, 112, 109)", "TAG Reviewer workspace", 7],
    ["/workspace/decisions", "nsc", "L3", "rgb(52, 116, 102)", "NSC workspace", 7],
    ["/workspace/grants/KEN-GRT-014", "national-coordinator", "L4", "rgb(78, 118, 93)", "National Coordinator workspace", 14],
    ["/workspace/amr", "national-coordinator", "L4", "rgb(78, 118, 93)", "National Coordinator workspace", 14],
    ["/workspace/programmes", "cpmt", "L5", "rgb(89, 105, 71)", "CPMT workspace", 12],
    ["/workspace/corrections", "cpmt", "L5", "rgb(89, 105, 71)", "CPMT workspace", 12],
    ["/workspace/agreements", "agency-admin", "L6", "rgb(108, 101, 56)", "Agency workspace", 16],
    ["/workspace/data-exchange/UNDP-EXC-001", "agency-admin", "L6", "rgb(108, 101, 56)", "Agency workspace", 16],
    ["/workspace/support", "programme-assistant", "L1", "rgb(0, 107, 115)", "Programme Assistant workspace", 10],
    ["/workspace/saved", "programme-assistant", "L1", "rgb(0, 107, 115)", "Programme Assistant workspace", 10],
    ["/workspace/profile", "programme-assistant", "L1", "rgb(0, 107, 115)", "Programme Assistant workspace", 10]
  ];
  const headerHeights: number[] = [];

  await page.goto("/");
  for (const [path, role, accessLevel, accent, areaLabel, navigationCount] of routes) {
    await page.evaluate((value) => localStorage.setItem("sgp-klp-preview-role", value), role);
    await page.goto(path);
    const navigation = page.getByRole("navigation", { name: `${areaLabel} sections` });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link")).toHaveCount(Number(navigationCount));
    await expect(navigation.locator("a.active")).toHaveCount(1);
    await expect(page.locator(".role-area")).toHaveAttribute("data-access-level", accessLevel);
    await expect(page.locator(".role-area")).toHaveAttribute("data-role", role);
    await expect(page.locator(".workspace-page-hero")).toBeVisible();
    await expect(page.locator(".workspace-page-hero")).toHaveCSS("background-color", accent);
    headerHeights.push(await page.locator(".workspace-page-hero").evaluate((element) => element.getBoundingClientRect().height));
  }

  expect(new Set(headerHeights)).toEqual(new Set([testInfo.project.name === "mobile" ? 256 : 224]));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("every standard role lands on its complete Overview experience", async ({ page }) => {
  const roles = [
    ["programme-assistant", 10],
    ["reviewer", 7],
    ["nsc", 7],
    ["national-coordinator", 14],
    ["cpmt", 12]
  ] as const;

  await page.goto("/");
  for (const [role, navigationCount] of roles) {
    await page.evaluate((value) => localStorage.setItem("sgp-klp-preview-role", value), role);
    await page.goto("/workspace");
    await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
    await expect(page.locator(".workspace-scope-grid > div")).toHaveCount(3);
    await expect(page.locator(".workspace-directory-grid > a")).toHaveCount(navigationCount - 1);
  }
});

test("operational roles expose their full journey without widening assignment scope", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one desktop browser covers the operational role matrix");

  await page.goto("/workspace?role=national-coordinator");
  await expect(page.locator(".workspace-scope-grid")).toContainText("Kenya");
  await expect(page.getByRole("navigation", { name: "National Coordinator workspace sections" }).getByRole("link", { name: "NSC Decisions" })).toBeVisible();
  await page.goto("/workspace/decisions?role=national-coordinator");
  await expect(page.getByRole("button", { name: "Pack prepared" })).toBeVisible();
  await expect(page.getByRole("button", { name: "NSC decision" })).toBeVisible();

  await page.goto("/workspace?role=cpmt");
  await expect(page.locator(".workspace-scope-grid")).toContainText("Regional support");
  await expect(page.locator(".workspace-scope-grid")).toContainText(/other regions/i);
  const cpmtNav = page.getByRole("navigation", { name: "CPMT workspace sections" });
  await expect(cpmtNav.getByRole("link", { name: "Data Quality and Corrections" })).toBeVisible();
  await expect(cpmtNav.getByRole("link", { name: "Finance and Reconciliation" })).toHaveCount(0);

  await page.goto("/workspace/profile?role=agency-admin");
  await expect(page.locator(".workspace-scope-grid")).toContainText("Native KLP grant management");
  const agencyNav = page.getByRole("navigation", { name: "Agency workspace sections" });
  await expect(agencyNav.getByRole("link", { name: "Agreements and Assurance" })).toBeVisible();
  await expect(agencyNav.getByRole("link", { name: "Document Management" })).toBeVisible();
  await expect(agencyNav.getByRole("link", { name: "Data Quality and Corrections" })).toHaveCount(0);
  await page.goto("/workspace/saved?role=agency-admin");
  await expect(page.getByRole("tab", { name: "Saved items" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "AI Chat History" })).toBeVisible();

  await page.goto("/workspace/proposals?role=reviewer");
  await expect(page.getByRole("button", { name: "New grant application" })).toHaveCount(0);
  await page.goto("/workspace/proposals/KEN-PRP-014?role=reviewer");
  await expect(page.getByText("Read-only at this stage", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  await page.goto("/workspace/reviews/KEN-REV-014?role=reviewer");
  await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
});

test("a National Coordinator can edit, evidence, submit and resume a complete grant application", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one desktop browser covers the persisted workflow transaction");

  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("sgp-klp-operational-workflows-v1");
    localStorage.setItem("sgp-klp-preview-role", "national-coordinator");
  });
  await page.goto("/workspace/proposals/KEN-PRP-014?role=national-coordinator");
  await expect(page.getByRole("heading", { name: "Community biodiversity corridors" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Grant application sections" }).getByRole("button")).toHaveCount(10);
  await page.getByLabel(/Overall project objective/).fill("Restore priority coastal habitat and strengthen locally governed, climate-resilient livelihoods through an evidence-led community programme.");
  await page.getByRole("button", { name: "Save section" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.getByPlaceholder("Add a section note").fill("Country validation completed with the latest project objective and evidence package.");
  await page.getByTitle("Add note").click();
  await expect(page.getByText("Country validation completed with the latest project objective and evidence package.")).toBeVisible();

  await page.locator('.grant-application-files input[type="file"]').setInputFiles({
    name: "proposal-evidence.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Evidence package for SGP-KEN-2026-099")
  });
  await expect(page.getByText("proposal-evidence.txt", { exact: true })).toBeVisible();

  const recordUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(recordUrl);
  await expect(page.getByRole("heading", { name: "Community biodiversity corridors" })).toBeVisible();
  await expect(page.getByText("Country validation completed with the latest project objective and evidence package.")).toBeVisible();
  await expect(page.getByText("proposal-evidence.txt", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByTitle("Download proposal-evidence.txt").click();
  expect((await download).suggestedFilename()).toBe("proposal-evidence.txt");

  await page.getByRole("button", { name: /Review and submit/ }).click();
  await page.getByRole("button", { name: "Submit application for review" }).click();
  await page.getByRole("button", { name: "Confirm submission" }).click();
  await expect(page.getByText("Submitted for review", { exact: true })).toBeVisible();
  await expect(page.getByText(/Submission version 1.0 preserved/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Open controlled revision" })).toBeVisible();

  await page.goto("/workspace/support?role=national-coordinator");
  await page.getByLabel("Category").selectOption("Portfolio data correction");
  await page.getByLabel("Subject").fill("Correct proposal country coding");
  await page.getByLabel("Description").fill("The proposal uses a retired district code and needs a recorded correction.");
  await page.getByRole("button", { name: "Create support case" }).click();
  await expect(page).toHaveURL(/\/workspace\/support\/SUP-[A-Z0-9-]+\?role=national-coordinator$/);
  await expect(page.locator(".workflow-stage-badge")).toHaveText("Open");
  await page.getByLabel("Status").selectOption("Resolved");
  await page.getByPlaceholder("Add a case update").fill("Canonical district code applied and verified.");
  await page.getByRole("button", { name: "Save case update" }).click();
  await expect(page.locator(".workflow-stage-badge")).toHaveText("Resolved");
  await page.reload();
  await expect(page.getByText(/Resolved: Canonical district code applied and verified/)).toBeVisible();

  await page.goto("/workspace/profile?role=national-coordinator");
  await page.getByLabel("Interface language").selectOption("Francais");
  await page.getByRole("checkbox", { name: "Show platform service updates" }).uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.locator('.workflow-result[role="status"]')).toContainText("Preferences saved");
  await page.reload();
  await expect(page.getByLabel("Interface language")).toHaveValue("Francais");
  await expect(page.getByRole("checkbox", { name: "Show platform service updates" })).not.toBeChecked();

  const backupEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export workspace" }).click();
  const backup = await backupEvent;
  const backupPath = await backup.path();
  expect(backupPath).toBeTruthy();
  const backupPayload = JSON.parse(readFileSync(backupPath!, "utf8")) as {
    records: Array<{ title: string }>;
    storedFiles: Array<{ id: string; data: string }>;
  };
  expect(backupPayload.records.some((record) => record.title === "Community biodiversity corridors")).toBe(true);
  expect(backupPayload.storedFiles).toHaveLength(1);
  expect(backupPayload.storedFiles[0].data).toMatch(/^data:text\/plain;base64,/);

  await page.evaluate(async () => {
    localStorage.removeItem("sgp-klp-operational-workflows-v1");
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("sgp-klp-operational-files");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("IndexedDB deletion was blocked"));
    });
  });
  await page.reload();
  await page.locator('.profile-settings + .workflow-panel input[type="file"]').setInputFiles(backupPath!);
  await expect(page.locator('.workflow-result[role="status"]')).toContainText("1 evidence files imported");
  await page.goto(recordUrl);
  await expect(page.getByRole("heading", { name: "Community biodiversity corridors" })).toBeVisible();
  await expect(page.getByText("proposal-evidence.txt", { exact: true })).toBeVisible();
  const restoredDownloadEvent = page.waitForEvent("download");
  await page.getByTitle("Download proposal-evidence.txt").click();
  expect((await restoredDownloadEvent).suggestedFilename()).toBe("proposal-evidence.txt");
});

test("one account session unlocks only the selected administration scope", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one desktop browser covers the role boundary matrix");
  const roles: Array<[string, string, string, string, string, number]> = [
    ["agency-admin", "/admin", "L6", "rgb(108, 101, 56)", "Agency workspace", 16],
    ["platform-admin", "/platform-admin", "L10", "rgb(176, 71, 21)", "Platform administration", 16],
    ["it-admin", "/it-admin", "L9", "rgb(162, 78, 25)", "IT administration", 19]
  ];

  await page.goto("/");
  for (const [role, adminPath, accessLevel, accent, areaLabel, navigationCount] of roles) {
    await page.evaluate((value) => localStorage.setItem("sgp-klp-preview-role", value), role);
    await page.goto("/workspace");
    await expect(page).toHaveURL((url) => url.pathname === adminPath);
    await expect(page.locator(".workspace-page-hero")).toContainText(areaLabel);
    await expect(page.locator(".workspace-page-hero")).toHaveCSS("background-color", accent);
    await expect(page.locator(".role-area")).toHaveAttribute("data-access-level", accessLevel);
    await expect(page.locator(".role-area")).toHaveAttribute("data-role", role);
    const navigation = page.getByRole("navigation", { name: `${areaLabel} sections` });
    await expect(navigation.getByRole("link")).toHaveCount(Number(navigationCount));
    await expect(navigation.getByRole("link").first()).toHaveText("Overview");
    await expect(page.locator(".admin-main")).toBeVisible();
    await expect(page.locator(".workspace-directory-grid > a")).toHaveCount(Number(navigationCount) - 1);
    if (role === "it-admin") {
      await expect(navigation.locator(".admin-nav-group--frontend")).toHaveCSS("border-left-color", "rgb(25, 116, 124)");
      await expect(navigation.locator(".admin-nav-group--backend")).toHaveCSS("border-left-color", "rgb(155, 72, 24)");
      await expect(navigation.locator(".admin-nav-group--frontend a")).toHaveCount(8);
      await expect(navigation.locator(".admin-nav-group--backend a")).toHaveCount(8);
    }
  }

  await page.getByRole("button", { name: "Open account menu" }).click();
  const account = page.locator("#account-menu-panel");
  await expect(account.getByRole("link", { name: /IT administration/ })).toHaveCount(1);
  await expect(account.getByRole("link", { name: /^Workspace/ })).toHaveCount(0);

  await page.evaluate(() => localStorage.setItem("sgp-klp-preview-role", "it-frontend"));
  await page.goto("/platform-admin");
  await expect(page).toHaveURL((url) => url.pathname === "/it-admin");
  await expect(page.locator(".workspace-page-hero")).toContainText("IT administration");
});

test("language menu persists translations and supports Arabic RTL", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select language" }).click();
  await page.getByRole("menuitemradio", { name: /Português/ }).click();
  await expect(page).toHaveURL(/\/pt$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#primary-nav a").first()).toHaveText("Subsídios");
  await page.reload();
  await expect(page.getByRole("button", { name: "Selecionar idioma" })).toBeVisible();

  await page.getByRole("button", { name: "Selecionar idioma" }).click();
  await page.getByRole("menuitemradio", { name: /العربية/ }).click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#primary-nav a").first()).toHaveText("المنح");
  await expect(page.getByRole("button", { name: "فتح مساعد برنامج المنح الصغيرة" })).toBeVisible();
  await page.getByRole("button", { name: "اختر اللغة" }).click();
  await expect(page.locator('.language-panel button[lang="ar"] strong')).toHaveCSS("text-align", "left");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("all supported locales translate primary navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the mobile test covers locale switching and RTL responsiveness");
  const locales = [
    ["en", "Grants"], ["pt", "Subsídios"], ["fr", "Subventions"],
    ["es", "Subvenciones"], ["ru", "Гранты"], ["zh", "赠款"], ["ar", "المنح"]
  ];
  for (const [locale, navigationLabel] of locales) {
    await page.goto(locale === "en" ? "/" : `/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("#primary-nav a").first()).toHaveText(navigationLabel);
  }
});

test("editorial archive exposes stories, voices, photos and publications", async ({ page }) => {
  await page.goto("/stories");
  await expect(page.getByRole("heading", { level: 1, name: "Stories & Voices" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Community stories" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "SGP Voices" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Photo stories" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Publications and field resources" })).toBeVisible();
  await expect(page.locator(".archive-story-card")).toHaveCount(8);
  await expect(page.locator(".voice-grid > a")).toHaveCount(8);
  await expect(page.locator(".archive-photo")).toHaveCount(10);
  await expect(page.locator(".publication-card")).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  await page.locator(".archive-story-card").first().click();
  await expect(page.locator(".archive-story-hero h1")).toBeVisible();
  await expect(page.getByRole("link", { name: "Read the full story" })).toBeVisible();
});

test("archive story extraction preserves authors, paragraphs and hero images", async ({ page }) => {
  await page.goto("/stories/story-825");
  await expect(page.locator(".archive-story-hero")).toContainText("Rissa Edoo");
  expect(await page.locator(".archive-story-prose p").count()).toBeGreaterThan(1);

  await page.goto("/stories/story-829");
  await expect(page.locator(".archive-story-hero")).toContainText("Ana Canestrelli");
  await expect(page.locator(".archive-story-hero img")).toHaveAttribute("src", /\/media\/stories\/story-829-\d+\.webp$/);
  expect(await page.locator(".archive-story-prose p").count()).toBeGreaterThan(1);
});

test("mobile navigation exposes all six public primary sections", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only navigation assertion");
  await page.goto("/");
  await page.getByRole("button", { name: /Open navigation/i }).click();
  const navigation = page.getByRole("navigation", { name: /Primary/i });
  await expect(navigation).toBeVisible();
  for (const label of ["Grants", "Dashboard", "Knowledge", "Impact", "Events", "Help"]) {
    await expect(navigation.getByRole("link", { name: label })).toBeVisible();
  }
});

test("agency API documentation distinguishes temporary and production interfaces", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "agency-admin"));
  await page.goto("/admin/integrations");
  await expect(page.getByRole("heading", { level: 1, name: "API & integration" })).toBeVisible();
  await expect(page.getByText("Current service", { exact: true })).toBeVisible();
  await expect(page.getByText("Temporary prepared index", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Production integration", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Download OpenAPI" })).toHaveAttribute("href", "/api/v1/openapi.json");
  await expect(page.getByText("/documents/search", { exact: true })).toBeVisible();
  await expect(page.getByText("/embed/sessions", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("API documentation renders complete locale-owned UI copy", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one browser covers reactive API locale rendering");
  const locales = [
    ["pt", "API e integração", "Adote apenas os serviços compartilhados de que sua agência precisa", "ltr"],
    ["fr", "API et intégration", "Adoptez uniquement les services partagés dont votre agence a besoin", "ltr"],
    ["es", "API e integración", "Adopte solo los servicios compartidos que necesita su agencia", "ltr"],
    ["ru", "API и интеграция", "Подключайте только те общие сервисы, которые нужны вашему агентству", "ltr"],
    ["zh", "API 与集成", "仅采用贵机构所需的共享服务", "ltr"],
    ["ar", "واجهة API والتكامل", "اعتمد فقط الخدمات المشتركة التي تحتاجها وكالتك", "rtl"]
  ];
  for (const [locale, title, overview, direction] of locales) {
    await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "agency-admin"));
    await page.goto(`/${locale}/admin/integrations`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", direction);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: overview })).toBeVisible();
    await expect(page.getByText("The KLP is designed as a federated shared layer.", { exact: false })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test("public support requests receive a durable reference and survive reload", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one browser covers local public support persistence");
  await page.goto("/help/contact");
  await page.evaluate(() => localStorage.removeItem("sgp-klp-public-support-requests-v1"));
  await page.reload();
  await page.getByLabel("Your name").fill("James K.");
  await page.getByLabel("Email address").fill("james@example.org");
  await page.getByLabel("Request type").selectOption("Accessibility");
  await page.getByLabel("How can we help?").fill("Please provide a keyboard-navigation review for the grant map.");
  await page.getByRole("button", { name: "Submit request" }).click();
  const success = page.getByRole("status").filter({ hasText: "Support request recorded" });
  await expect(success).toContainText("Support request recorded");
  await expect(success).toContainText(/SGP-\d{8}-[A-Z0-9]{6}/);
  await page.reload();
  const savedRequest = page.locator(".contact-case-history article").filter({ hasText: "Please provide a keyboard-navigation review for the grant map." });
  await expect(savedRequest).toContainText("Accessibility");
  await expect(savedRequest).toContainText("Please provide a keyboard-navigation review for the grant map.");
});

test("shared public and permissioned pages have no serious or critical accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one browser is sufficient for the automated Axe pass");
  test.setTimeout(150_000);
  const paths = [
    "/", "/funding", "/portfolio", "/knowledge/library", "/stories", "/community",
    "/community/events/learning-session", "/help", "/workspace", "/admin/documents",
    "/admin/data", "/platform-admin/governance", "/platform-admin/audit", "/it-admin/frontend", "/it-admin/backend/access"
  ];
  await page.goto("/");
  for (const path of paths) {
    await page.evaluate((value) => localStorage.setItem("sgp-klp-preview-role", value), roleForPath(path));
    await page.goto(path);
    await page.locator("h1").waitFor();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact || "")), path).toEqual([]);
  }
});

test("new consolidated controls are localized without layout overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one browser covers the expanded locale matrix");
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "agency-admin"));
  const locales = [
    ["pt", "Filtros do portfólio", "Fila", "Todas as regiões"],
    ["fr", "Filtres du portefeuille", "File", "Toutes les régions"],
    ["es", "Filtros de cartera", "Cola", "Todas las regiones"],
    ["ru", "Фильтры портфеля", "Очередь", "Все регионы"],
    ["zh", "项目组合筛选", "队列", "所有区域"],
    ["ar", "مرشحات المحفظة", "القائمة", "كل المناطق"]
  ];
  for (const [locale, portfolioFiltersLabel, queueLabel, regionsLabel] of locales) {
    await page.goto(`/${locale}/portfolio`);
    await expect(page.getByRole("region", { name: portfolioFiltersLabel })).toBeVisible({ timeout: 30_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

    await page.goto(`/${locale}/admin/documents`);
    await expect(page.getByRole("tab", { name: queueLabel, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

    await page.goto(`/${locale}/community`);
    await expect(page.getByRole("option", { name: regionsLabel, exact: true })).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test("every canonical route renders without console errors or horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one desktop browser covers the canonical route contract");
  test.setTimeout(120_000);
  const examples: Record<string, string> = {
    resourceId: "archive%3A42",
    contentId: "story-825",
    eventId: "learning-session",
    applicationId: "demo-application",
    grantId: "demo-grant",
    reviewId: "demo-review",
    visitId: "demo-visit",
    reportId: "demo-report"
  };

  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("sgp-klp-locale", "en"));
  for (const route of sitemap.routes.filter((item) => item.path !== "*")) {
    const path = route.path.replace(/:([A-Za-z]+)/g, (_, key: string) => examples[key] || "demo");
    await page.evaluate((value) => localStorage.setItem("sgp-klp-preview-role", value), roleForPath(path));
    const errors: string[] = [];
    const onConsole = (message: { type(): string; text(): string }) => {
      if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
    };
    page.on("console", onConsole);
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1").first(), path).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), path).toBe(true);
    expect(errors, path).toEqual([]);
    page.off("console", onConsole);
  }
});
