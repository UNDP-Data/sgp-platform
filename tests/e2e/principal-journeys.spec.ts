import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

const sitemap = JSON.parse(readFileSync(new URL("../../src/sitemap.json", import.meta.url), "utf8")) as {
  routes: Array<{ path: string }>;
};

function roleForPath(path: string) {
  if (path.startsWith("/admin/undp")) return "undp-admin";
  if (path.startsWith("/platform-admin")) return "platform-admin";
  if (path.startsWith("/it-admin/backend")) return "it-backend";
  if (path.startsWith("/it-admin")) return "it-frontend";
  if (path.startsWith("/super-admin")) return "super-admin";
  if (path.startsWith("/admin")) return "fao-admin";
  if (path.startsWith("/workspace/reviews")) return "reviewer";
  if (path.startsWith("/workspace/grants") || path.startsWith("/workspace/visits") || path.startsWith("/workspace/reports")) return "grantee";
  return "applicant";
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
  await expect(page.getByRole("heading", { name: "Ask SGP" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ask the SGP Innovation Library" })).toBeVisible();
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
  await expect(dock.locator(".assistant-tool")).toHaveCount(2);
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
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "applicant"));
  await page.goto("/");
  await expect(page.locator(".brand-logo")).toBeVisible();
  await page.getByRole("button", { name: "Open account menu" }).click();
  const account = page.locator("#account-menu-panel");
  await expect(account.getByRole("link", { name: /Applicant workspace/ })).toBeVisible();
  await expect(account.locator(".account-primary-area")).toHaveAttribute("data-access-level", "L1");
  const roleSelector = account.getByLabel("Select user type");
  await expect(roleSelector).toHaveValue("applicant");
  await roleSelector.selectOption("reviewer");
  await expect(page.locator(".account-trigger")).toContainText("Reviewer");
  await expect(account.locator(".account-primary-area")).toHaveAttribute("data-access-level", "L2");
  expect(await page.evaluate(() => localStorage.getItem("sgp-klp-preview-role"))).toBe("reviewer");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /items to review/ })).toBeVisible();

  await account.getByRole("button", { name: /Log out/ }).click();
  await expect(page.locator(".account-trigger")).toContainText("Sign in");
  expect(await page.evaluate(() => localStorage.getItem("sgp-klp-preview-role"))).toBeNull();
  await page.getByRole("button", { name: "Open account menu" }).click();
  const signInSelector = page.locator("#account-menu-panel").getByLabel("Sign in as test user");
  await signInSelector.selectOption("grantee");
  await expect(page.locator(".account-trigger")).toContainText("Grantee partner");
  expect(await page.evaluate(() => localStorage.getItem("sgp-klp-preview-role"))).toBe("grantee");
});

test("signed-out workspace offers every user type and opens its configured workspace", async ({ page }) => {
  const roles = [
    ["applicant", "Grant applicant", "/workspace", "L1"],
    ["grantee", "Grantee partner", "/workspace", "L3"],
    ["reviewer", "Reviewer", "/workspace", "L2"],
    ["national", "National programme user", "/workspace", "L4"],
    ["undp-admin", "UNDP administrator", "/admin/undp", "L6"],
    ["fao-admin", "FAO administrator", "/admin", "L5"],
    ["ci-admin", "Conservation International administrator", "/admin", "L5"],
    ["platform-admin", "Platform administrator", "/platform-admin", "L7"],
    ["it-frontend", "IT frontend operator", "/it-admin/frontend", "L8"],
    ["it-backend", "IT backend operator", "/it-admin/backend", "L9"],
    ["super-admin", "Super administrator", "/super-admin", "L10"]
  ] as const;

  await page.goto("/workspace");
  await expect(page.getByRole("heading", { name: "Sign in to open your workspace" })).toBeVisible();
  await expect(page.getByText("Technical demo version", { exact: true })).toBeVisible();
  await expect(page.getByText("No credentials required", { exact: true })).toHaveCount(0);
  await expect(page.locator(".workspace-signin__notice")).toHaveCount(0);
  const cards = page.locator(".workspace-signin-card");
  await expect(cards).toHaveCount(roles.length);
  await expect(cards.locator(".workspace-signin-card__icon svg")).toHaveCount(roles.length);
  const agencyGroup = page.locator('.workspace-signin-group[aria-labelledby="workspace-signin-agency"]');
  await expect(agencyGroup.getByRole("heading", { name: "Agency workspaces" })).toBeVisible();
  await expect(agencyGroup.locator(".workspace-signin-card")).toHaveCount(3);
  expect(await agencyGroup.locator(".workspace-signin-card").evaluateAll((items) =>
    items.map((item) => item.getAttribute("data-role"))
  )).toEqual(["undp-admin", "fao-admin", "ci-admin"]);
  const administrationGroup = page.locator('.workspace-signin-group[aria-labelledby="workspace-signin-administration"]');
  await expect(administrationGroup.locator(".workspace-signin-card")).toHaveCount(4);
  await expect(administrationGroup.locator('[data-role="undp-admin"], [data-role="fao-admin"], [data-role="ci-admin"]')).toHaveCount(0);
  const accents = await cards.evaluateAll((items) => items.map((item) =>
    getComputedStyle(item).getPropertyValue("--signin-accent").trim()
  ));
  expect(new Set(accents).size).toBe(roles.length);

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
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "grantee"));
  await page.goto("/workspace/grants/demo-grant");

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
  await page.locator("#account-menu-panel").getByLabel("Select user type").selectOption("applicant");
  await expect(page).toHaveURL((url) => url.pathname === "/workspace");
  await expect(page).toHaveURL((url) => url.searchParams.get("role") === "applicant");
  await expect(page.locator(".account-trigger")).toContainText("Grant applicant");
  await expect(page.locator(".role-area")).toHaveAttribute("data-role", "applicant");
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
  await page.goto("/workspace/grants/demo-grant?role=grantee");
  await expect(page.locator(".account-trigger")).toContainText("Grantee partner");
  await expect(page.locator(".role-area")).toHaveAttribute("data-role", "grantee");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("sgp-klp-preview-role"))).toBe("grantee");
  await expect(page.getByRole("navigation", { name: "Grantee workspace sections" }).getByRole("link", { name: "Reports" }))
    .toHaveAttribute("href", "/workspace/reports?role=grantee");
  await expect(page.getByRole("link", { name: /Return to grants/ })).toHaveAttribute(
    "href",
    "/workspace/grants?role=grantee"
  );

  await page.goto("/fr/workspace/reviews/demo-review?view=evidence&role=reviewer#activity");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator(".role-area")).toHaveAttribute("data-role", "reviewer");
  await expect(page).toHaveURL((url) =>
    url.pathname === "/fr/workspace/reviews/demo-review"
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
    ["/workspace", "applicant", "L1", "rgb(0, 107, 115)", "Applicant workspace", 8],
    ["/workspace/applications", "applicant", "L1", "rgb(0, 107, 115)", "Applicant workspace", 8],
    ["/workspace/applications/demo-undp-application", "applicant", "L1", "rgb(0, 107, 115)", "Applicant workspace", 8],
    ["/workspace/grants", "grantee", "L3", "rgb(52, 116, 102)", "Grantee workspace", 10],
    ["/workspace/grants/demo-grant", "grantee", "L3", "rgb(52, 116, 102)", "Grantee workspace", 10],
    ["/workspace/reviews", "reviewer", "L2", "rgb(26, 112, 109)", "Reviewer workspace", 8],
    ["/workspace/visits", "national", "L4", "rgb(78, 118, 93)", "National programme workspace", 11],
    ["/workspace/reports", "national", "L4", "rgb(78, 118, 93)", "National programme workspace", 11],
    ["/workspace/support", "applicant", "L1", "rgb(0, 107, 115)", "Applicant workspace", 8],
    ["/workspace/notifications", "applicant", "L1", "rgb(0, 107, 115)", "Applicant workspace", 8],
    ["/workspace/saved", "applicant", "L1", "rgb(0, 107, 115)", "Applicant workspace", 8],
    ["/workspace/ai-chat-history", "applicant", "L1", "rgb(0, 107, 115)", "Applicant workspace", 8],
    ["/workspace/profile", "applicant", "L1", "rgb(0, 107, 115)", "Applicant workspace", 8]
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
    ["applicant", 8, "community"],
    ["reviewer", 8, "directory"],
    ["grantee", 10, "community"],
    ["national", 11, "directory"]
  ] as const;

  await page.goto("/");
  for (const [role, navigationCount, overviewType] of roles) {
    await page.evaluate((value) => localStorage.setItem("sgp-klp-preview-role", value), role);
    await page.goto("/workspace");
    await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
    if (overviewType === "community") {
      await expect(page.locator(".community-overview")).toBeVisible();
      await expect(page.locator(".workspace-directory-grid > a")).toHaveCount(0);
    } else {
      await expect(page.locator(".workspace-directory-grid > a")).toHaveCount(navigationCount - 1);
    }
  }
});

test("applicant records and progressive navigation stay scoped to the active organization", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("sgp-community-workspace-v3");
    localStorage.setItem("sgp-klp-preview-role", "applicant");
  });
  await page.goto("/workspace/applications");

  await expect(page.locator(".community-record-card")).toHaveCount(2);
  await expect(page.getByRole("navigation", { name: "Applicant workspace sections" }).getByRole("link", { name: "Grants" })).toBeVisible();
  await page.locator(".community-filter-row").getByRole("button", { name: "Submitted" }).click();
  await expect(page.locator(".community-record-card")).toHaveCount(1);
  await page.getByPlaceholder("Applications").fill("no matching record");
  await expect(page.locator(".community-record-card")).toHaveCount(0);
  await page.getByPlaceholder("Applications").fill("");
  await page.locator(".community-filter-row").getByRole("button", { name: "All applications" }).click();
  await expect(page.locator(".community-record-card")).toHaveCount(2);

  await page.getByLabel("Switch organization").selectOption("org-forest-action");
  await expect(page.locator(".community-record-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Community forest and food systems concept" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Community mangrove restoration and resilient livelihoods" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Applicant workspace sections" }).getByRole("link", { name: "Grants" })).toHaveCount(0);

  await page.goto("/workspace/applications/demo-undp-application");
  await expect(page.getByRole("heading", { name: "Applications unavailable" })).toBeVisible();
  await expect(page.getByText("No other organization’s data has been shown.")).toBeVisible();
});

test("applicant can start, complete and submit a scoped UNDP application", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("sgp-community-workspace-v3");
    localStorage.setItem("sgp-klp-preview-role", "applicant");
  });
  await page.goto("/funding/grants/test-kenya-biodiversity-2026");
  await page.getByRole("button", { name: "Start application" }).click();

  await expect(page).toHaveURL((url) =>
    url.pathname === "/workspace/applications/application-org-forest-action-test-kenya-biodiversity-2026"
    && url.searchParams.get("role") === "applicant"
  );
  await expect(page.getByLabel("Switch organization")).toHaveValue("org-forest-action");

  const completeText = "Community-verified information with clear responsibilities, evidence sources, realistic timing, and measurable results for this proposed project.";
  for (const section of [
    "Project summary",
    "Results framework",
    "Workplan",
    "Budget and cofinancing",
    "Safeguards and risk",
    "Monitoring and learning"
  ]) {
    await page.locator(".community-section-nav").getByRole("button", { name: new RegExp(section) }).click();
    await page.locator(".community-editor textarea").fill(completeText);
    if (section === "Results framework") {
      await page.getByLabel("Result statement").fill("Community stewardship improves across priority sites");
      await page.getByLabel("Result indicator").fill("Hectares under community management");
      await page.getByLabel("Result baseline").fill("0");
      await page.getByLabel("Result target").fill("100 ha");
    }
    if (section === "Budget and cofinancing") {
      await page.getByLabel("Budget category").fill("Community implementation");
      await page.getByLabel("Requested amount").fill("25000");
      await page.getByLabel("Cofinancing amount").fill("5000");
      await page.getByLabel("Contribution status").selectOption("Confirmed");
    }
  }

  await page.locator(".community-section-nav").getByRole("button", { name: /Review and submit/ }).click();
  const submit = page.locator(".community-submission-review").getByRole("button", { name: "Submit application" });
  await expect(submit).toBeEnabled();
  await submit.click();

  const dialog = page.getByRole("dialog", { name: "Confirm submission" });
  await expect(dialog.getByRole("button", { name: "Submit application" })).toBeDisabled();
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Submit application" }).click();

  await expect(page.getByText(/Submission confirmed · version 1\.0/)).toBeVisible();
  await expect(page.getByText("Submitted snapshot · editing locked")).toBeVisible();
  await expect(page.locator(".community-attachments").getByRole("button", { name: "Upload file" })).toBeDisabled();
  await page.reload();
  await expect(page.getByText(/Submission confirmed · version 1\.0/)).toBeVisible();
  await expect(page.getByText("Submitted snapshot · editing locked")).toBeVisible();
});

test("applicant collaboration, attachments and requested-change revisions persist", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one desktop browser covers the durable revision workflow");
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("sgp-community-workspace-v3");
    localStorage.setItem("sgp-klp-preview-role", "applicant");
  });
  await page.goto("/workspace/applications/demo-undp-application");
  await expect(page.getByText("Working revision 2.0")).toBeVisible();

  await page.getByLabel("Assign Budget and cofinancing").selectOption("Amina Bello");
  await page.getByPlaceholder("Comments").fill("Please confirm the revised transport assumptions.");
  await page.locator(".community-collaboration").getByRole("button", { name: "Add" }).click();
  await page.locator(".community-file-input").first().setInputFiles({
    name: "revised-budget.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("prototype file metadata")
  });
  await page.getByPlaceholder("Describe what changed and where the reviewer can verify it.").fill(
    "Transport assumptions were recalculated and the corrected evidence is attached in this section."
  );
  await page.locator(".community-feedback-banner").getByRole("button", { name: "Resolve issue" }).click();

  await page.reload();
  await page.locator(".community-section-nav").getByRole("button", { name: /Budget and cofinancing/ }).click();
  await expect(page.getByLabel("Assign Budget and cofinancing")).toHaveValue("Amina Bello");
  await expect(page.getByText("Please confirm the revised transport assumptions.")).toBeVisible();
  await expect(page.getByText("revised-budget.pdf")).toBeVisible();
  await expect(page.getByText("Reviewer request resolved")).toBeVisible();

  const completeText = "Community-verified information with clear responsibilities, evidence sources, realistic timing, and measurable results for this revised project submission.";
  for (const section of [
    "Project summary",
    "Results framework",
    "Workplan",
    "Budget and cofinancing",
    "Safeguards and risk",
    "Monitoring and learning"
  ]) {
    await page.locator(".community-section-nav").getByRole("button", { name: new RegExp(section) }).click();
    await page.locator(".community-editor textarea").fill(completeText);
  }
  await page.locator(".community-section-nav").getByRole("button", { name: /Review and submit/ }).click();
  await page.locator(".community-submission-review").getByRole("button", { name: "Submit application" }).click();
  const dialog = page.getByRole("dialog", { name: "Confirm submission" });
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText(/Submission confirmed · version 2\.0/)).toBeVisible();
  await expect(page.getByText("Resubmitted")).toBeVisible();
});

test("support requests, replies and request files survive reloads", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one desktop browser covers the durable support workflow");
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("sgp-community-workspace-v3");
    localStorage.setItem("sgp-klp-preview-role", "applicant");
  });
  await page.goto("/workspace/support");
  await page.getByRole("button", { name: "New support request" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New support request" });
  await dialog.getByLabel("Subject").fill("Question about the revision deadline");
  await dialog.getByLabel("Message").fill("Please confirm whether the revised budget must be submitted before the programme review meeting.");
  await dialog.getByRole("button", { name: "Send request" }).click();
  await dialog.getByRole("link", { name: "Open request" }).click();

  await expect(page.getByRole("heading", { name: "Question about the revision deadline" })).toBeVisible();
  await page.getByLabel("Reply").fill("Adding the requested evidence now for the programme team.");
  await page.locator(".community-support-thread").getByRole("button", { name: "Reply" }).click();
  await page.locator(".community-support-thread .community-file-input").setInputFiles({
    name: "deadline-note.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("prototype support attachment")
  });
  await page.reload();
  await expect(page.getByText("Adding the requested evidence now for the programme team.")).toBeVisible();
  await expect(page.getByText("deadline-note.pdf")).toBeVisible();
  await expect(page.locator(".community-record-header .community-status")).toHaveText("Waiting for programme reply");
});

test("one account session unlocks only the selected administration scope", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one desktop browser covers the role boundary matrix");
  const roles: Array<[string, string, string, string, string, number]> = [
    ["fao-admin", "/admin", "L5", "rgb(89, 105, 71)", "FAO administration", 11],
    ["ci-admin", "/admin", "L5", "rgb(63, 103, 86)", "Conservation International administration", 11],
    ["undp-admin", "/admin/undp", "L6", "rgb(108, 101, 56)", "UNDP administration", 11],
    ["platform-admin", "/platform-admin", "L7", "rgb(124, 94, 46)", "Platform administration", 13],
    ["it-frontend", "/it-admin/frontend", "L8", "rgb(142, 86, 35)", "IT frontend administration", 12],
    ["it-backend", "/it-admin/backend", "L9", "rgb(162, 78, 25)", "IT backend administration", 12],
    ["super-admin", "/super-admin", "L10", "rgb(176, 71, 21)", "Super administration", 10]
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
  }

  await page.getByRole("button", { name: "Open account menu" }).click();
  const account = page.locator("#account-menu-panel");
  await expect(account.getByRole("link", { name: /Super administration/ })).toHaveCount(1);
  await expect(account.getByRole("link", { name: /^Workspace/ })).toHaveCount(0);

  await page.evaluate(() => localStorage.setItem("sgp-klp-preview-role", "it-frontend"));
  await page.goto("/platform-admin");
  await expect(page).toHaveURL((url) => url.pathname === "/it-admin/frontend");
  await expect(page.locator(".workspace-page-hero")).toContainText("IT frontend administration");
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

test("agency API documentation distinguishes live and planned interfaces", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "fao-admin"));
  await page.goto("/admin/integrations");
  await expect(page.getByRole("heading", { level: 1, name: "API & integration" })).toBeVisible();
  await expect(page.getByText("Current service", { exact: true })).toBeVisible();
  await expect(page.getByText("Database not deployed", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download OpenAPI" })).toHaveAttribute("href", "/api/openapi-indicative.yaml");
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
    await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "fao-admin"));
    await page.goto(`/${locale}/admin/integrations`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", direction);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: overview })).toBeVisible();
    await expect(page.getByText("The KLP is designed as a federated shared layer.", { exact: false })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test("shared public and permissioned pages have no serious or critical accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one browser is sufficient for the automated Axe pass");
  test.setTimeout(150_000);
  const paths = [
    "/", "/funding", "/portfolio", "/knowledge/library", "/stories", "/community",
    "/community/events/learning-session", "/help", "/workspace", "/admin/documents",
    "/admin/undp/data", "/platform-admin/governance", "/it-admin/frontend", "/it-admin/backend/access", "/super-admin/audit"
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
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "fao-admin"));
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
