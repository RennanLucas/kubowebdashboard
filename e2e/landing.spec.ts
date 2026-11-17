import { test, expect } from '@playwright/test';

test.describe('Landing premium', () => {
  test('apresenta a proposta real do Kubo e CTAs funcionais', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Kubo Analytics/);
    await expect(page.getByRole('heading', { level: 1, name: /Veja o que acontece/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /A mesma tela, em quatro perguntas/i })).toBeAttached();
    await expect(page.locator('.lp-reader')).toBeAttached();

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

  test('interage com o comparador split, os recursos e o guia de instalação', async ({ page }) => {
    await page.goto('/');

    // 1. Comparador split: cada preset deve revelar 100% do seu lado.
    const splitSection = page.locator('.lp-split-section');
    await expect(splitSection).toBeAttached();

    const beforePane = page.locator('.lp-split-pane--before');
    const afterPane = page.locator('.lp-split-pane--after');

    await page.getByRole('button', { name: /Ver 100% GA4/i }).click();
    await expect(beforePane).toHaveAttribute('style', /width:\s*100%/);
    await expect(page.getByText(/Google Analytics \(GA4\)/i).first()).toBeVisible();

    await page.getByRole('button', { name: /Ver 100% Kubo/i }).click();
    await expect(afterPane).toHaveAttribute('style', /width:\s*100%/);

    await page.getByRole('button', { name: /Dividido/i }).click();
    await expect(beforePane).toHaveAttribute('style', /width:\s*50%/);

    // 2. Grade de recursos
    await expect(page.locator('.lp-capability')).toHaveCount(6);
    await expect(page.getByRole('heading', { name: /Motor de conversão de WhatsApp/i })).toBeAttached();

    // 3. Guia de instalação em quatro passos + snippet copiável
    await expect(page.locator('.lp-deck-card')).toHaveCount(4);
    await expect(page.getByRole('button', { name: /Copiar código de instalação/i })).toBeAttached();
  });

  test('rolagem por âncora mantém a seção alvo no topo', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lp-nav__link[href="#pricing"]').click();

    // Assert the target's real offset, not just "in viewport" — Lenis reverts
    // programmatic scrolls it doesn't own, and the section would still count as
    // in-viewport for a moment before snapping back to the top of the page.
    await expect
      .poll(() => page.evaluate(() => Math.round(document.getElementById('pricing')!.getBoundingClientRect().top)), { timeout: 5000 })
      .toBeLessThanOrEqual(8);

    const y = await page.evaluate(() => Math.round(window.scrollY));
    expect(y).toBeGreaterThan(100);
  });

  test('deep link abre a página já na seção pedida', async ({ page }) => {
    await page.goto('/#pricing');

    // The landing route is lazy-loaded, so the section only exists once that
    // chunk has rendered.
    await expect(page.locator('#pricing')).toBeAttached();

    // Layout keeps settling after mount (fonts, plan fetch), so this keeps
    // polling until the retry-on-settle loop in SmoothScroll has landed.
    await expect
      .poll(() => page.evaluate(() => Math.round(document.getElementById('pricing')!.getBoundingClientRect().top)), { timeout: 8000 })
      .toBeLessThanOrEqual(8);

    const y = await page.evaluate(() => Math.round(window.scrollY));
    expect(y).toBeGreaterThan(100);
  });

  test('o scroll nativo continua funcionando sob o smooth scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(800);

    // Regression guard: the app sets `html { scroll-behavior: smooth }`, which
    // fights Lenis's frame-by-frame scrollTop writes and can freeze the page.
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 1600);
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5000 }).toBeGreaterThan(200);

    await page.keyboard.press('End');
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Math.round(document.documentElement.scrollHeight - window.innerHeight - window.scrollY),
          ),
        { timeout: 8000 },
      )
      .toBeLessThanOrEqual(4);
  });
});
