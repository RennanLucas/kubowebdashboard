import { test, expect } from '@playwright/test';

test.describe('Help Center', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    const emailInput = page.getByPlaceholder('nome@exemplo.com');
    await emailInput.fill('teste@kuboanalytics.com');
    const passwordInput = page.getByPlaceholder('••••••••');
    await passwordInput.fill('teste123');
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should load Help Center and show categories', async ({ page }) => {
    await page.goto('/help');
    await expect(page.getByRole('heading', { name: 'Central de Ajuda' })).toBeVisible();
    await expect(page.getByText('Primeiros passos')).toBeVisible();
    await expect(page.getByText('Analytics')).toBeVisible();
  });

  test('search should filter articles', async ({ page }) => {
    await page.goto('/help');
    
    await expect(page.getByText('Como instalar o Kubo Analytics no seu site')).toBeVisible();
    
    const searchInput = page.getByPlaceholder(/Pesquise por instalação/);
    await searchInput.fill('XYZNONSENSE');
    
    await expect(page.getByText('Não encontramos nenhum artigo')).toBeVisible();
    
    await searchInput.fill('tracking');
    
    await expect(page.getByText('O tracking não está funcionando')).toBeVisible();
    await expect(page.getByText('Não encontramos nenhum artigo')).not.toBeVisible();
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
