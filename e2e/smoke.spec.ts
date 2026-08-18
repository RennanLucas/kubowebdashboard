import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Flows', () => {
  
  test('Login Page Loads and Renders Form', async ({ page }) => {
    await page.goto('/login');
    
    // Expect the title or main heading to exist
    await expect(page.locator('text="Entrar"').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Dashboard Redirects to Login when Unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // The ProtectedRoute component should catch missing auth and redirect
    await expect(page).toHaveURL(/.*\/login/);
  });

  // NOTA (OPÇÃO C): O teste contratual da Edge Function `tracker-script` foi movido
  // para `tests/contract/tracker.spec.ts`. Um Smoke Test E2E focado no frontend 
  // não deve falhar devido à infraestrutura independente de backend (404 de funções 
  // não publicadas no STAGING). A responsabilidade do frontend aqui é apenas garantir
  // rotas e renderizações críticas da interface.
});
