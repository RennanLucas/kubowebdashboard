import { test, expect } from "@playwright/test";

test("3D responde ao cursor e scroll, e respeita redução de movimento", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const stage = page.locator(".kubo-stage");
  await expect(stage).toBeVisible();
  await stage.hover({ position: { x: 100, y: 130 } });
  await expect
    .poll(() =>
      stage.evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue("--tilt-y"),
      ),
    )
    .not.toBe("");
  const hero = page.locator(".kubo-hero");
  const before = await hero.evaluate((el) =>
    (el as HTMLElement).style.getPropertyValue("--spatial-progress"),
  );
  await page.evaluate(() => window.scrollTo(0, 250));
  await expect
    .poll(() =>
      hero.evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue("--spatial-progress"),
      ),
    )
    .not.toBe(before);
  await expect(page.locator(".spatial-backdrop")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  const rail = page.locator(".spatial-rail");
  await expect(rail).toBeVisible();
  await expect(rail.locator("a.is-active")).toHaveAttribute(
    "data-spatial-target",
    "product-story",
  );
  await page.locator("#capabilities").scrollIntoViewIfNeeded();
  await expect
    .poll(() => rail.locator("a.is-active").getAttribute("data-spatial-target"))
    .toBe("capabilities");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      stage.evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue("--tilt-y"),
      ),
    )
    .toBe("");
  await expect(page.locator(".kubo-board")).toHaveCSS("transform", "none");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(rail).toBeHidden();
});
