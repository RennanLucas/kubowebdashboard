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
    const switcher = page.locator('[data-testid="org-switcher"]');
    await expect(switcher).toBeVisible();
    await switcher.click();
    
    // Check if dropdown items are visible
    const orgItems = page.locator('[data-testid="org-item"]');
    await expect(orgItems.first()).toBeVisible();
  });

  test('should not leak data when switching organization', async ({ page }) => {
    // Select first org
    await page.click('[data-testid="org-switcher"]');
    await page.locator('[data-testid="org-item"]').nth(0).click();
    
    // Wait for dashboard header to load
    await page.waitForSelector('h1.tracking-tight');
    const org1Text = await page.locator('h1.tracking-tight').first().innerText();
    
    // Switch to second org
    await page.click('[data-testid="org-switcher"]');
    await page.locator('[data-testid="org-item"]').nth(1).click();
    
    // Data should be different and queries invalidated
    // Use toHaveText which has auto-retry so it waits for the React state change
    const titleLocator = page.locator('h1.tracking-tight').first();
    await expect(titleLocator).not.toHaveText(org1Text, { timeout: 10000 });
    
    const org2Text = await titleLocator.innerText();
    expect(org1Text).not.toEqual(org2Text);
  });
});

test.describe('Settings RBAC Enforcement', () => {
  test('Viewer should not be able to edit organization name or invite members', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE VIEWER:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR VIEWER:', err.message));

    const viewerEmail = process.env.E2E_VIEWER_EMAIL || 'e2e_viewer@example.test';
    const password = process.env.E2E_USER_PASSWORD || 'sua_senha_real_aqui_123';

    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('kuboweb_tour_completed_v1', '1'));
    await page.fill('input[type="email"]', viewerEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    try {
      await page.waitForURL('**/dashboard', { timeout: 8000 });
    } catch (e) {
      console.log('Login timeout Viewer. Current URL:', page.url());
      const toastText = await page.locator('[role="alert"], [data-sonner-toast], li').allTextContents();
      console.log('TOASTS VISÍVEIS VIEWER:', toastText);
      throw e;
    }
    
    await page.goto('/settings');
    
    // Geral Tab
    await page.click('text="Geral"');
    const nameInput = page.locator('input#orgName');
    await expect(nameInput).toBeDisabled();
    
    // Membros Tab
    await page.click('text="Membros"');
    await expect(page.locator('button:has-text("Editar")')).not.toBeVisible();
    
    // Convites Tab
    await page.click('text="Convites"');
    await expect(page.locator('button:has-text("Convidar Membro")')).not.toBeVisible();
  });

  test('Owner should be able to manage everything', async ({ page }) => {
    const ownerEmail = process.env.E2E_OWNER_EMAIL || 'e2e_owner@example.test';
    const password = process.env.E2E_USER_PASSWORD || 'sua_senha_real_aqui_123';

    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('kuboweb_tour_completed_v1', '1'));
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

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

test.describe('Billing Fallback (Scenario C)', () => {
  test('Should display pending reconciliation warning for ambiguous subscription', async ({ page }) => {
    // Cenário C: Assinatura legada pertence ao user_a, que possui organization_id NULL
    const ownerEmail = process.env.E2E_OWNER_EMAIL || 'e2e_owner@example.test';
    const password = process.env.E2E_USER_PASSWORD || 'sua_senha_real_aqui_123';

    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('kuboweb_tour_completed_v1', '1'));
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await page.goto('/settings');
    // Click the Settings tab for Assinatura, not the sidebar link
    await page.click('button[role="tab"]:has-text("Assinatura")');
    
    // If ambiguous sub exists
    const alert = page.locator('text="Assinatura pendente de reconciliação"');
    await expect(alert).toBeVisible();
  });
});
