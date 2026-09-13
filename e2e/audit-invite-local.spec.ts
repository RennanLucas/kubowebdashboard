import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Fail closed: these tests never contact Supabase, payment or email services.
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1" ? route.continue() : route.abort();
  });
});

for (const width of [375, 1280]) {
  test(`invalid invitation is readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/auth/invite");
    await expect(page.getByRole("heading", { name: "Convite para a equipe" })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("inválido");
    await expect(page.getByRole("button", { name: "Aceitar convite" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("invitation survives login navigation without sending its token to a server", async ({ page }) => {
  const token = "a".repeat(64);
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/auth/invite#token=" + token);
  await page.getByRole("link", { name: "Entrar para continuar" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("kuboweb:pending-invite"))).toBe(token);
  expect(requests.some(url => url.split("#")[0].includes(token))).toBe(false);
});
