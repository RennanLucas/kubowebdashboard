import { expect, test } from "@playwright/test";

const principalPages = [
  { path: "/dashboard", title: /Dashboard/i },
  { path: "/live", title: /Visitantes ao vivo/i },
  { path: "/goals", title: /Metas e Funis/i },
  { path: "/heatmaps", title: /Heatmaps e Gravações/i },
  { path: "/insights", title: /Insights com IA/i },
  { path: "/alerts", title: /Alertas/i },
  { path: "/compare", title: /Comparar projetos/i },
  { path: "/reports", title: /Relatórios White-label/i },
  { path: "/presentation", title: /Apresentação/i },
];

test.describe("Principal pages - real authenticated Pro tenant", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.E2E_OWNER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "Requires real E2E credentials");
    await page.addInitScript(() => localStorage.setItem("kuboweb_tour_completed_v1", "1"));
    await page.goto("/login");
    await page.fill('input[type="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
  });

  for (const item of principalPages) {
    test(`${item.path} opens without runtime or server errors`, async ({ page }) => {
      const runtimeErrors: string[] = [];
      const serverErrors: string[] = [];
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      page.on("response", (response) => {
        if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
      });

      await page.goto(item.path);
      await expect(page).toHaveURL(new RegExp(`${item.path}$`));
      await expect(page).toHaveTitle(item.title);
      await expect(page.locator("body")).not.toContainText(/Something went wrong|Erro inesperado/i);
      expect(runtimeErrors).toEqual([]);
      expect(serverErrors).toEqual([]);
    });
  }
});
