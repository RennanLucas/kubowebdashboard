import { test, expect } from '@playwright/test';

test.describe('Landing premium', () => {
  test('apresenta a proposta real do Kubo e CTAs funcionais', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Kubo Analytics/);
    await expect(page.getByRole('heading', { level: 1, name: /Veja o que acontece/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Entenda o que acontece/i })).toBeAttached();
    await expect(page.getByText('Dados demonstrativos').first()).toBeAttached();

    const primaryCta = page.getByRole('link', { name: /Começar 7 dias grátis/i }).first();
    await expect(primaryCta).toHaveAttribute('href', '/login');
    await expect(page.getByText(/Google Ads|Meta Ads|CRM e dados de receita/i)).toHaveCount(0);
  });

  test('abre uma resposta do FAQ por teclado', async ({ page }) => {
    await page.goto('/#faq');
    const question = page.getByRole('button', { name: /O Kubo respeita consentimento e LGPD/i });
    await question.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/não cria identificadores nem envia requisições/i)).toBeVisible();
  });

  test('menu móvel expõe a navegação', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: /Abrir menu/i }).click();
    const navigation = page.getByRole('group', { name: /Navegação móvel/i });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'Recursos' })).toHaveAttribute('href', '#capabilities');
  });

  test('não cria rolagem lateral nos tamanhos suportados', async ({ page }) => {
    const widths = [375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560];

    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.goto('/');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `overflow horizontal em ${width}px`).toBeLessThanOrEqual(1);
    }
  });
});
