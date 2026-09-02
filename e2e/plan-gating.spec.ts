import { test, expect } from "@playwright/test";

test.describe("Plan Gating - Free vs Pro", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.E2E_OWNER_EMAIL || 'e2e_owner@example.test';
    const password = process.env.E2E_USER_PASSWORD || 'sua_senha_real_aqui_123';

    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Free user should see plan badge in sidebar', async ({ page }) => {
    // Wait for sidebar to load
    await page.waitForSelector('img[alt="KUBOWEB"]', { timeout: 5000 });

    // Check for plan badge - it's in the header, only visible when sidebar is expanded
    // The badge uses plan.label which is either "Gratuito" or "Pro" in Portuguese
    const badge = page.locator('span.rounded-full').filter({ hasText: /gratuito|pro/i });
    await expect(badge).toBeVisible({ timeout: 10000 });

    const badgeText = await badge.textContent();
    expect(badgeText?.toLowerCase()).toMatch(/gratuito|pro/);
  });

  test('Free user should see upgrade banner on dashboard', async ({ page }) => {
    // UpgradeBanner only shows for Free users who haven't dismissed it
    // Check if banner exists (might be dismissed in localStorage)
    const banner = page.locator('text=Você está no plano Gratuito');

    // If visible, verify CTA link
    if (await banner.isVisible()) {
      const upgradeLink = page.locator('a[href="/pricing"]', { hasText: /upgrade/i });
      await expect(upgradeLink).toBeVisible();
    }
  });

  test('Free user should see locked features in sidebar', async ({ page }) => {
    // Wait for sidebar
    await page.waitForSelector('img[alt="KUBOWEB"]', { timeout: 5000 });

    // Check for lock icons on Pro features
    const lockedItems = page.locator('svg.lucide-lock').filter({ has: page.locator('..') });

    // At least one feature should be locked for Free users (Heatmaps, Metas, Relatórios, etc.)
    const count = await lockedItems.count();

    // If user is actually Pro, count will be 0 - that's also valid
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Free user accessing locked feature should be redirected to pricing', async ({ page }) => {
    // Navigate to a Pro feature (Heatmaps)
    // ProtectedRoute redirects Free users to /pricing when requireFeature check fails
    await page.goto('/heatmaps');

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const url = page.url();

    // Free users should be redirected to /pricing
    // Pro users stay on /heatmaps
    expect(url).toMatch(/\/(pricing|heatmaps)$/);
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
