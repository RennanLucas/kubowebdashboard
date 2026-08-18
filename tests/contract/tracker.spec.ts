import { test, expect } from '@playwright/test';

// OPÇÃO C ESCOLHIDA: Teste contratual isolado do frontend E2E.
// Deve ser executado em uma esteira de CI própria ou localmente contra o ambiente
// em que a Edge Function do Supabase de fato está em execução (Local ou Staging).
test.describe('Contract Test - Tracker Script Edge Function', () => {
  test('Serves the tracker script via Edge Function', async ({ request }) => {
    // Utiliza variável injetada, caso contrário assume que é o Staging
    const baseUrl = process.env.VITE_SUPABASE_URL || 'https://azboavoyuawfqutsfpse.supabase.co';
    const trackerUrl = `${baseUrl}/functions/v1/tracker-script?pid=contract-test-pid`;
    
    const response = await request.get(trackerUrl);
    
    // Asserções contratuais rigorosas
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/javascript');
    
    const body = await response.text();
    expect(body).toContain('navigator.sendBeacon');
  });
});
