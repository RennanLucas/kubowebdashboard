import { test, expect } from '@playwright/test';

test.describe('Help Center', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test - use same credentials as organization tests
    const email = process.env.E2E_OWNER_EMAIL || 'e2e_owner@example.test';
    const password = process.env.E2E_USER_PASSWORD || 'sua_senha_real_aqui_123';

    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should load Help Center and show categories', async ({ page }) => {
    await page.goto('/help');
    await expect(page.getByRole('heading', { name: 'Central de Ajuda' })).toBeVisible();
    await expect(page.getByText('Primeiros passos')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByText('Guia rápido — comece em 5 minutos')).toBeVisible();
  });

  test('search should filter articles', async ({ page }) => {
    await page.goto('/help');
    
    await expect(page.getByText('Como instalar o Kubo Analytics no seu site')).toBeVisible();
    
    const searchInput = page.getByPlaceholder(/Pesquise por instalação/);
    await searchInput.fill('XYZNONSENSE');
    
    await expect(page.getByText('Não encontramos nenhum artigo')).toBeVisible();
    
    await searchInput.fill('configuracao');
    
    await expect(page.getByText('Como criar e gerenciar projetos')).toBeVisible();
    await expect(page.getByText('Não encontramos nenhum artigo')).not.toBeVisible();
  });

  test('every published article has complete content', async ({ page }) => {
    const articleIds = ['tracking-install', 'no-data', 'tracking-issues', 'metrics-explained', 'dashboard-guide', 'goals', 'events', 'ai-insights', 'projects', 'members', 'billing-plans', 'faq'];
    for (const articleId of articleIds) {
      await page.goto(`/help/${articleId}`);
      await expect(page.getByText('Este artigo ainda está sendo elaborado')).toHaveCount(0);
      await expect(page.locator('main, [role="main"], article, .prose').last()).toBeVisible();
    }
  });

  test('support uses the verified address', async ({ page }) => {
    await page.goto('/help');
    await expect(page.getByRole('link', { name: 'Falar com suporte' })).toHaveAttribute('href', /contato\.kuboweb@gmail\.com/);
  });

  test('should navigate to article and back', async ({ page }) => {
    await page.goto('/help');
    
    await page.getByText('Como instalar o Kubo Analytics no seu site').click();
    
    await expect(page).toHaveURL(/\/help\/tracking-install/);
    
    await expect(page.getByRole('heading', { name: 'Como instalar o Kubo Analytics no seu site', exact: true })).toBeVisible();
    
    await expect(page.getByRole('link', { name: 'Central de Ajuda' })).toBeVisible();
    
    await page.getByRole('button', { name: /Voltar/i }).first().click();
    
    await expect(page).toHaveURL(/\/help/);
  });

  test('article not found should show 404 state', async ({ page }) => {
    await page.goto('/help/invalid-article-id-xyz');
    
    await expect(page.getByRole('heading', { name: 'Conteúdo não encontrado' })).toBeVisible();
    
    await page.getByRole('button', { name: 'Voltar para Central de Ajuda' }).click();
    await expect(page).toHaveURL(/\/help/);
  });

  test('mobile layout should not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/help');
    
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalOverflow).toBe(false);
  });
});
