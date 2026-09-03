import { test, expect } from "@playwright/test";

test.describe("Plan Gating - isolated Pro tenant", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.E2E_OWNER_EMAIL || 'e2e_owner@example.test';
    const password = process.env.E2E_USER_PASSWORD || 'sua_senha_real_aqui_123';

    await page.addInitScript(() => {
      localStorage.setItem('kuboweb_tour_completed_v1', '1');
    });
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Pro user should see the Pro badge in the sidebar', async ({ page }) => {
    // Wait for sidebar to load
    await page.waitForSelector('img[alt="KUBOWEB"]', { timeout: 5000 });

    // Check for plan badge - it's in the header, only visible when sidebar is expanded
    const badge = page.locator('span.rounded-full').filter({ hasText: /^pro$/i });
    await expect(badge).toBeVisible({ timeout: 10000 });
  });

  test('Pro user should not see the Free upgrade banner', async ({ page }) => {
    const banner = page.locator('text=Você está no plano Gratuito');
    await expect(banner).toHaveCount(0);
  });

  test('Pro user should not see locked features in the sidebar', async ({ page }) => {
    // Wait for sidebar
    await page.waitForSelector('img[alt="KUBOWEB"]', { timeout: 5000 });

    // Check for lock icons on Pro features
    const lockedItems = page.locator('svg.lucide-lock').filter({ has: page.locator('..') });

    await expect(lockedItems).toHaveCount(0);
  });

  test('Pro user should access a Pro feature without a pricing redirect', async ({ page }) => {
    await page.goto('/heatmaps');
    await page.waitForURL('**/heatmaps', { timeout: 15000 });
    await expect(page).toHaveURL(/\/heatmaps$/);
  });

  test('Active Pro user should be redirected away from pricing', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.getByTestId('date-range-picker')).toBeVisible();
  });

  test('Pro user should have the full 12-month date range', async ({ page }) => {
    await page.goto('/dashboard');
    const datePicker = page.getByTestId('date-range-picker');
    await expect(datePicker).toBeVisible({ timeout: 15000 });
    await datePicker.click();

    const twelveMonths = page.getByRole('button', { name: 'Últimos 12 meses' });
    await expect(twelveMonths).toBeVisible();
    await expect(twelveMonths.locator('svg.lucide-lock')).toHaveCount(0);
    await twelveMonths.click();
    await expect(datePicker).toContainText('Últimos 12 meses');
  });
});
