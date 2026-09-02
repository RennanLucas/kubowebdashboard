import { test, expect } from '@playwright/test';

test.describe('Organization Context and RBAC', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept 400 errors
    page.on('response', async (response) => {
      if (response.status() === 400) {
        try {
          const body = await response.text();
          console.log(`400 Error on ${response.url()}:`, body);
        } catch (e) {}
      }
    });

    // Cenário E2E: Owner (admin geral)
    const email = process.env.E2E_OWNER_EMAIL || 'e2e_owner@example.test';
    const password = process.env.E2E_USER_PASSWORD || 'sua_senha_real_aqui_123';
    
    // Escutar erros de console e network
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('kuboweb_tour_completed_v1', '1'));
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/dashboard', { timeout: 8000 });
    } catch (e) {
      console.log('Login timeout. Current URL:', page.url());
      const toastText = await page.locator('[role="alert"], [data-sonner-toast], li').allTextContents();
      console.log('TOASTS VISÍVEIS:', toastText);
      throw e;
    }
  });

  test('should display active organization in switcher', async ({ page }) => {
    // Wait for dashboard to fully load - the switcher only appears after OrganizationContext loads
    await page.waitForSelector('h1.tracking-tight', { timeout: 10000 });

    // Click relies on Playwright's auto-retry until the element is actionable
    const switcher = page.locator('[data-testid="org-switcher"]');
    await switcher.click({ timeout: 15000 });

    // Check if dropdown items are visible
    const orgItems = page.locator('[data-testid="org-item"]');
    await expect(orgItems.first()).toBeVisible();
  });

  test('isolated owner does not see the other organization in switcher', async ({ page }) => {
    await page.click('[data-testid="org-switcher"]');
    const orgItems = page.locator('[data-testid="org-item"]');
    await expect(orgItems).toHaveCount(1);
    await expect(page.getByText('ISO Org B', { exact: true })).toHaveCount(0);
  });
});

test.describe('Settings RBAC Enforcement', () => {
  test('Owner should be able to manage everything', async ({ page }) => {
    const ownerEmail = process.env.E2E_OWNER_EMAIL || 'e2e_owner@example.test';
    const password = process.env.E2E_USER_PASSWORD || 'sua_senha_real_aqui_123';

    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('kuboweb_tour_completed_v1', '1'));
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    await page.goto('/settings');

    // Geral Tab
    await page.click('text="Geral"');
    const nameInput = page.locator('input#orgName');
    await expect(nameInput).toBeEnabled();

    // Convites Tab
    await page.click('text="Convites"');
    const inviteBtn = page.locator('button:has-text("Convidar Membro")');
    await expect(inviteBtn).toBeVisible();
  });
});
