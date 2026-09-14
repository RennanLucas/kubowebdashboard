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

for (const width of [375, 390, 430, 768, 1280]) {
  test(`login defaults to light even with a dark operating system at ${width}px`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tema: Claro/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toHaveCSS("opacity", "1");
    await expect(page.locator(".animate-scale-in")).toHaveCSS("opacity", "1");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`login-light-${width}.png`), fullPage: true });
  });
}

test("dark theme is an explicit choice and persists after reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Tema: Claro/ }).click();
  await page.getByRole("menuitem", { name: /Escuro/ }).click();
  await expect(page.getByRole("button", { name: /Tema: Escuro/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Tema: Escuro/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
});

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
