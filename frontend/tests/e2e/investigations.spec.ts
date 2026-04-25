import { test, expect } from "@playwright/test";

test.describe("Investigations module", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("analyst");
    await page.getByLabel("Password").fill("changeme-please-set-env");
    await page.getByRole("button", { name: "Sign in" }).click();
  });

  test("analyst can navigate to investigations", async ({ page }) => {
    await page.getByRole("link", { name: "Investigations" }).click();
    await expect(page).toHaveURL("/investigations");
    await expect(page.getByRole("heading", { name: "Investigations" })).toBeVisible();
  });

  test("new investigation link leads to seed picker", async ({ page }) => {
    await page.goto("/investigations");
    await page.getByRole("link", { name: "New Investigation" }).click();
    await expect(page).toHaveURL("/investigations/new");
    await expect(page.getByRole("heading", { name: "New Investigation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Build Investigation" })).toBeVisible();
  });
});
