import { test, expect, type Page } from "@playwright/test";

const email = process.env.E2E_OWNER_EMAIL || process.env.E2E_USER_A_EMAIL || "";
const password = process.env.E2E_USER_PASSWORD || process.env.E2E_USER_A_PASSWORD || "";

async function currentTier(page: Page): Promise<"free" | "pro"> {
  const badge = page.getByTestId("plan-badge");
  await expect(badge).toBeVisible({ timeout: 15000 });
  await expect(badge).not.toHaveText("...", { timeout: 15000 });
  const label = (await badge.innerText()).trim().toLocaleLowerCase("pt-BR");
  expect(["gratuito", "pro"]).toContain(label);
  return label === "pro" ? "pro" : "free";
}

test.describe("Plan Gating - tenant real de homologação", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!email || !password, "Credenciais E2E são obrigatórias para validar o plano");

    await page.addInitScript(() => {
      localStorage.setItem('kuboweb_tour_completed_v1', '1');
      localStorage.removeItem('kuboweb:upgrade-banner-dismissed-at');
    });
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 25000 });
    await expect(page.getByTestId('date-range-picker')).toBeVisible({ timeout: 15000 });
  });

  test('exibe um plano reconhecido e totalmente carregado', async ({ page }) => {
    await currentTier(page);
  });

  test('banner de upgrade corresponde ao plano efetivo', async ({ page }) => {
    const tier = await currentTier(page);
    const banner = page.getByText('Você está no plano Gratuito', { exact: true });
    if (tier === 'free') {
      await expect(banner).toBeVisible();
    } else {
      await expect(banner).toHaveCount(0);
    }
  });

  test('recursos Pro mostram o estado de bloqueio correto', async ({ page }) => {
    const tier = await currentTier(page);
    const heatmapsLink = page.locator('a[href="/heatmaps"]');
    await expect(heatmapsLink).toBeVisible();
    const lock = heatmapsLink.locator('svg.lucide-lock');
    await expect(lock).toHaveCount(tier === 'free' ? 1 : 0);
  });

  test('acesso a recurso Pro corresponde ao plano efetivo', async ({ page }) => {
    const tier = await currentTier(page);
    await page.goto('/heatmaps');
    await page.waitForURL(tier === 'free' ? '**/pricing' : '**/heatmaps', { timeout: 15000 });
    await expect(page).toHaveURL(tier === 'free' ? /\/pricing$/ : /\/heatmaps$/);
  });

  test('página de preços corresponde ao plano efetivo', async ({ page }) => {
    const tier = await currentTier(page);
    await page.goto('/pricing');
    if (tier === 'pro') {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      await expect(page.getByTestId('date-range-picker')).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/pricing$/);
      await expect(page.getByText('Plano atual', { exact: true }).first()).toBeVisible();
    }
  });

  test('histórico de 12 meses corresponde ao plano efetivo', async ({ page }) => {
    const tier = await currentTier(page);
    const datePicker = page.getByTestId('date-range-picker');
    await expect(datePicker).toBeVisible({ timeout: 15000 });
    await datePicker.click();

    const twelveMonths = page.getByRole('button', { name: 'Últimos 12 meses' });
    await expect(twelveMonths).toBeVisible();
    await expect(twelveMonths.locator('svg.lucide-lock')).toHaveCount(tier === 'free' ? 1 : 0);
    await twelveMonths.click();
    if (tier === 'pro') {
      await expect(datePicker).toContainText('Últimos 12 meses');
    } else {
      await expect(datePicker).not.toContainText('Últimos 12 meses');
      await expect(page.getByText(/O plano Gratuito mostra até 7 dias/i)).toBeVisible();
    }
  });
});
