import { test, expect } from "@playwright/test";

test("landing page renders and auth route opens", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Ask better questions. Ship fixes faster.")).toBeVisible();

  await page.getByRole("link", { name: "Join CyLink" }).click();
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});
