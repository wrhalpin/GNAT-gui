import { test, expect } from "@playwright/test";

test.describe("RBAC enforcement", () => {
  test("viewer does not see admin nav link", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("viewer");
    await page.getByLabel("Password").fill("changeme-please-set-env");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("link", { name: "Admin" })).not.toBeVisible();
  });

  test("admin sees admin nav link", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("changeme-please-set-env");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  });
});
