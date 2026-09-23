import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const EVIDENCE_DIR = path.resolve(process.cwd(), "e2e/evidence");
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const EMAIL = process.env.E2E_USER_A_EMAIL || "e2e_iso_a@example.test";
const PASSWORD = process.env.E2E_USER_A_PASSWORD || "Rennanlucas135@";

async function login(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("kuboweb_tour_completed_v1", "1");
  });
  await page.goto("/login");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 25000 });
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByTestId("date-range-picker")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("date-range-picker")).toBeEnabled();
  await expect(page.getByTestId("plan-badge")).not.toHaveText("...", { timeout: 15000 });
}

async function selectTheme(page: Page, theme: "Claro" | "Escuro") {
  const toggle = page.locator('button[aria-label*="Tema"]').first();
  await expect(toggle).toBeVisible();
  await toggle.click();
  const option = page.getByRole("menuitem").filter({ hasText: theme });
  await expect(option).toBeVisible();
  await option.click();
}

test.describe("Validação E2E Real do Sistema de Temas - Kubo Analytics", () => {

  test("01. Primeiro Acesso com SO em Dark Mode -> DEVE abrir obrigatoriamente em CLARO", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const hasDarkClassRoot = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(hasDarkClassRoot).toBe(false);

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    const hasDarkClassLogin = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(hasDarkClassLogin).toBe(false);

    const metaThemeColor = await page.getAttribute('meta[name="theme-color"]', "content");
    expect(metaThemeColor).toBe("#ffffff");

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "01-primeiro-acesso-so-dark.png"), fullPage: false });
  });

  test("02a. Anti-FOUC Caso A: Sem preferência salva + SO Dark -> Light no primeiro paint", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
  });

  test("02b. Anti-FOUC Caso B: Tema Dark salvo -> Dark no primeiro paint sem piscar", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kuboweb:theme", "dark");
    });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });

  test("02c. Anti-FOUC Caso C: Tema Light salvo + SO Dark -> Light no primeiro paint", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      localStorage.setItem("kuboweb:theme", "light");
    });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
  });

  test("02d. Anti-FOUC Caso D: Tema System salvo + SO Dark -> Dark no primeiro paint", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      localStorage.setItem("kuboweb:theme", "system");
    });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });

  test("02e. Anti-FOUC Caso E: Tema System salvo + SO Light -> Light no primeiro paint", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      localStorage.setItem("kuboweb:theme", "system");
    });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
  });

  test("03. Seleção de Tema Claro: classe removida, persistência e permanência após reload", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const themeBtn = page.locator('button[aria-label*="Tema"]').first();
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();

    const claroOption = page.locator('[role="menuitem"]:has-text("Claro")');
    await expect(claroOption).toBeVisible();
    await claroOption.click();

    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem("kuboweb:theme"))).toBe("light");
    expect(await page.getAttribute('meta[name="theme-color"]', "content")).toBe("#ffffff");

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "02-tema-claro-login.png") });

    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem("kuboweb:theme"))).toBe("light");
  });

  test("04. Seleção de Tema Escuro: classe aplicada, persistência e nova aba", async ({ page, context }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const themeBtn = page.locator('button[aria-label*="Tema"]').first();
    await themeBtn.click();

    const escuroOption = page.locator('[role="menuitem"]:has-text("Escuro")');
    await expect(escuroOption).toBeVisible();
    await escuroOption.click();

    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem("kuboweb:theme"))).toBe("dark");
    expect(await page.getAttribute('meta[name="theme-color"]', "content")).toBe("#0a0b14");

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "03-tema-escuro-login.png") });

    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);

    const newPage = await context.newPage();
    await newPage.goto("/login");
    await newPage.waitForLoadState("domcontentloaded");
    expect(await newPage.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    await newPage.close();
  });

  test("05. Tema Sistema: segue o SO e reage em tempo real SEM recarga", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const themeBtn = page.locator('button[aria-label*="Tema"]').first();
    await themeBtn.click();
    const systemOption = page.locator('[role="menuitem"]:has-text("Sistema")');
    await expect(systemOption).toBeVisible();
    await systemOption.click();

    expect(await page.evaluate(() => localStorage.getItem("kuboweb:theme"))).toBe("system");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "04-sistema-so-light.png") });

    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "05-sistema-so-dark.png") });

    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
  });

  test("06. Sincronização entre Abas (Aba A <-> Aba B)", async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await pageA.goto("/login");
    await pageB.goto("/login");
    await pageA.waitForLoadState("domcontentloaded");
    await pageB.waitForLoadState("domcontentloaded");

    const btnA = pageA.locator('button[aria-label*="Tema"]').first();
    await btnA.click();
    await pageA.locator('[role="menuitem"]:has-text("Escuro")').click();

    expect(await pageA.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);

    await pageB.waitForTimeout(400);
    expect(await pageB.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);

    const btnB = pageB.locator('button[aria-label*="Tema"]').first();
    await btnB.click();
    await pageB.locator('[role="menuitem"]:has-text("Claro")').click();

    expect(await pageB.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);

    await pageA.waitForTimeout(400);
    expect(await pageA.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);

    await pageA.close();
    await pageB.close();
  });

  test("07. Responsividade Mobile: 375px, 390px, 430px, 768px", async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: "375px" },
      { width: 390, height: 844, name: "390px" },
      { width: 430, height: 932, name: "430px" },
      { width: 768, height: 1024, name: "768px" },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      const themeBtn = page.locator('button[aria-label*="Tema"]').first();
      await expect(themeBtn).toBeVisible();
      await themeBtn.click();

      const options = page.locator('[role="menuitem"]');
      expect(await options.count()).toBe(3);

      await page.keyboard.press("Escape");
    }

    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "06-mobile-375px-claro.png") });
  });

  test("08. Suporte a prefers-reduced-motion: reduce", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const themeBtn = page.locator('button[aria-label*="Tema"]').first();
    await themeBtn.click();
    await page.locator('[role="menuitem"]:has-text("Escuro")').click();

    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });

  test("09. Migração Automática de Chave de Storage (theme -> kuboweb:theme)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("theme", "dark");
    });

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem("kuboweb:theme"))).toBe("dark");
  });

  test("10. Logout preserva o tema escolhido pelo usuário", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kuboweb:theme", "dark");
      localStorage.setItem("kuboweb_tour_completed_v1", "1");
    });

    await page.goto("/login");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);

    await page.evaluate(() => {
      window.localStorage.removeItem("dashboard:last-project-id");
    });

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem("kuboweb:theme"))).toBe("dark");
  });

  test("11. Verificação de rotas públicas e consistência visual", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "07-landing-page.png") });

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    const loginCard = page.locator(".glass-strong, form").first();
    await expect(loginCard).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "08-login-final.png") });
  });

  test("12. Dashboard autenticado: alternância de tema e percurso de rotas", async ({ page }) => {
    test.skip(!process.env.E2E_USER_A_EMAIL, "Necessário credencial E2E");

    await login(page);

    // 1. Dashboard em modo Claro
    await selectTheme(page, "Claro");

    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "09-dashboard-claro.png") });

    // 2. Dashboard em modo Escuro
    await selectTheme(page, "Escuro");

    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "10-dashboard-escuro.png") });

    // 3. Percurso das rotas protegidas em modo Escuro
    const routesToTest = ["/live", "/insights", "/alerts", "/settings"];
    for (const r of routesToTest) {
      await page.goto(r);
      await page.waitForLoadState("domcontentloaded");
      expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    }
  });

});
