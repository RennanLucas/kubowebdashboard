import { test, expect } from "@playwright/test";

test("landing 3D mantém navegação, demonstração e layout móvel acessíveis", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Seu tráfego conta uma história",
  );
  await expect(
    page.getByRole("img", { name: /Painel ilustrativo/ }),
  ).toBeVisible();
  await expect(page.locator(".kubo-toolbar")).toContainText("DEMONSTRAÇÃO");
  await expect(page.locator(".kubo-actions a").first()).toHaveAttribute(
    "href",
    "/login",
  );
  await page
    .locator(".kubo-actions")
    .getByRole("link", { name: "Como funciona" })
    .click();
  await expect(page.locator("#how-it-works")).toBeInViewport();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(page.locator(".kubo-float").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});
