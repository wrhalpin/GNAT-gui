import { test, expect } from "@playwright/test";

test.describe("Rules Builder module", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("analyst");
    await page.getByLabel("Password").fill("changeme-please-set-env");
    await page.getByRole("button", { name: "Sign in" }).click();
  });

  test("analyst can navigate to rules module", async ({ page }) => {
    await page.getByRole("link", { name: "Rules" }).click();
    await expect(page).toHaveURL("/rules");
    await expect(page.getByRole("heading", { name: "Rules" })).toBeVisible();
  });

  test("new rule button opens form", async ({ page }) => {
    await page.goto("/rules");
    await page.getByRole("button", { name: "New Rule" }).click();
    await expect(page.getByPlaceholder("Rule name")).toBeVisible();
    await expect(page.getByRole("option", { name: "YAML" })).toBeAttached();
  });
});
