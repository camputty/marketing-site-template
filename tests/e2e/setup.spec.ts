import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("untouched starter is an accessible, noindex setup state", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "The stack is ready. The brand is intentionally not.",
    }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
