import { test, expect } from "@playwright/test";

test("FAQ e CTA continuam acessíveis pelo teclado", async ({ page }) => {
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const cta = page.locator(".kubo-actions a").first();
  await cta.focus();
  await expect(cta).toBeFocused();
  await expect(cta).toHaveCSS("outline-style", "solid");
  const question = page.locator(".lp-faq__accordion button").first();
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByText(
      "Não. O Kubo pode ser instalado como uma camada de leitura própria do seu site, sem exigir que você remova outras ferramentas.",
    ),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "false");
});

for (const width of [375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
  test(`refinamento visual preserva conteúdo e layout em ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    // Exercise the existing error fallback; no production data or payment writes.
    await page.route("**/functions/v1/list-plans*", (route) => route.abort());
    await page.goto("/");
    await expect(page.locator(".kubo-hero h1")).toContainText(
      "Seu tráfego conta uma história.",
    );
    await expect(page.locator(".lp-price-card--loading")).toHaveCount(0);
    const links = await page
      .locator(".lp-root a")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          text: node.textContent,
          href: node.getAttribute("href"),
        })),
      );
    for (const section of await page
      .locator(".lp-root main > section, .lp-footer")
      .all()) {
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await expect(page.locator(".lp-story__steps article")).toHaveCount(4);
    for (const card of await page.locator(".lp-story__steps article").all()) {
      await expect(card).toHaveCSS("opacity", "1");
    }
    // All FAQ answers remain available through the original accordion.
    for (const trigger of await page
      .locator(".lp-faq__accordion button")
      .all()) {
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await trigger.click();
    }
    await expect(page.locator(".lp-price-card").first()).toContainText(
      "R$ 0,00",
    );
    expect(
      await page
        .locator(".lp-root a")
        .evaluateAll((nodes) =>
          nodes.map((node) => ({
            text: node.textContent,
            href: node.getAttribute("href"),
          })),
        ),
    ).toEqual(links);
    if (width <= 768) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await expect(
        page.getByRole("group", { name: "Navegação móvel" }),
      ).toBeVisible();
      await page
        .getByRole("group", { name: "Navegação móvel" })
        .getByRole("link", { name: "Planos", exact: true })
        .click();
      await expect(page.locator("#pricing")).toBeInViewport();
      await expect(
        page.getByRole("button", { name: "Abrir menu" }),
      ).toBeVisible();
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".kubo-float").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath(`landing-${width}.png`),
      fullPage: true,
    });
  });
}
