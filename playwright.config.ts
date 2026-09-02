import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prioriza .env.e2e se existir (testes de isolamento), senão .env.staging
const envPath = fs.existsSync(path.resolve(__dirname, '.env.e2e'))
  ? path.resolve(__dirname, '.env.e2e')
  : fs.existsSync(path.resolve(__dirname, '.env.staging'))
  ? path.resolve(__dirname, '.env.staging')
  : path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  webServer: {
    // --mode staging força o Vite a carregar .env.staging em vez de .env de produção
    command: 'npm run dev -- --mode staging --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
