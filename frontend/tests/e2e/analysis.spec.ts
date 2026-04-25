import { test, expect } from "@playwright/test";

test.describe("Analysis module", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("analyst");
    await page.getByLabel("Password").fill("changeme-please-set-env");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");
  });

  test("analyst can navigate to analysis module", async ({ page }) => {
    await page.getByRole("link", { name: "Analysis" }).click();
    await expect(page).toHaveURL("/analysis");
    await expect(page.getByRole("heading", { name: "Investigations" })).toBeVisible();
  });

  test("analyst can open new investigation form", async ({ page }) => {
    await page.goto("/analysis");
    await page.getByRole("button", { name: "New" }).click();
    await expect(page.getByPlaceholder("Investigation title")).toBeVisible();
  });
});
