import { expect, test } from "@playwright/test";

test("connected workflow persists through the backend and survives reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "national-coordinator"));
  const hydrated = page.waitForResponse((response) => response.url().includes("/api/workspace/snapshot") && response.status() === 200);
  await page.goto("/workspace/proposals/KEN-PRP-014?role=national-coordinator");
  await hydrated;
  const recordId = new URL(page.url()).pathname.split("/").at(-1)!;

  await page.getByLabel(/Project title/).fill("Connected backend validation proposal");
  await page.getByLabel(/Queue summary/).fill("Created and retained through the temporary backend.");
  await page.getByLabel(/Overall project objective/).fill("A complete connected workflow acceptance record with measurable environmental and community outcomes.");
  await page.getByRole("button", { name: "Save section" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.locator('.grant-application-files input[type="file"]').setInputFiles({
    name: "connected-evidence.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Temporary backend E2E evidence")
  });
  await expect(page.getByText("connected-evidence.txt", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Connected backend validation proposal" })).toBeVisible();
  await expect(page.getByText("connected-evidence.txt", { exact: true })).toBeVisible();

  const backendRecord = await page.evaluate(async (id) => {
    const sessions = JSON.parse(localStorage.getItem("sgp-klp-backend-sessions-v1") || "{}");
    const response = await fetch("/api/workspace/snapshot", { headers: { Authorization: `Bearer ${sessions["national-coordinator"].token}` } });
    const payload = await response.json();
    return payload.snapshot.records.find((record: { id: string }) => record.id === id);
  }, recordId);
  expect(backendRecord.title).toBe("Connected backend validation proposal");
  expect(backendRecord.stageIndex).toBe(1);
  expect(backendRecord.attachments).toHaveLength(1);
});

test("project-only assistant and administration use live temporary APIs", async ({ page }) => {
  await page.goto("/knowledge/studio");
  await expect(page.locator(".service-status")).toContainText(/ready/i);
  await page.getByRole("radio", { name: "Projects" }).check();
  await page.getByRole("textbox", { name: "Ask a question" }).fill("Turkey biodiversity projects");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".message--assistant .message-content")).toContainText("temporary local retrieval service", { timeout: 30_000 });
  await expect(page.locator(".source-row").first()).toContainText("projects");

  await page.evaluate(() => localStorage.setItem("sgp-klp-preview-role", "platform-admin"));
  await page.goto("/platform-admin?role=platform-admin");
  await expect(page.locator(".admin-status")).toContainText("30,753");
  await page.goto("/platform-admin/knowledge?role=platform-admin");
  await expect(page.locator(".admin-table")).toContainText("Prepared knowledge records");
  await page.locator(".admin-table button").first().click();
  await expect(page.locator(".admin-selection-status")).toContainText("retained in the audit log");
  await page.getByRole("tab", { name: "History" }).click();
  await expect(page.getByText(/requested from Knowledge & Content/).first()).toBeVisible();
});

test("one agency account reaches programme workflows and administration", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sgp-klp-preview-role", "agency-admin"));
  const hydrated = page.waitForResponse((response) => response.url().includes("/api/workspace/snapshot") && response.status() === 200);
  await page.goto("/workspace/agreements?role=agency-admin");
  await hydrated;
  const navigation = page.getByRole("navigation", { name: "Agency workspace sections" });
  await expect(navigation.getByRole("link", { name: "Agreements and Assurance" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Document Management" })).toBeVisible();
  await expect(page.getByText("Kenya coastal MoA", { exact: true })).toBeVisible();

  await navigation.getByRole("link", { name: "Document Management" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/admin/documents" && url.searchParams.get("role") === "agency-admin");
  await expect(page.locator(".admin-table")).toContainText("Documents awaiting review");
});
