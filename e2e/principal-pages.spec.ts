import { expect, test } from "@playwright/test";

const principalPages = [
  { path: "/dashboard", title: /Dashboard/i, marker: /Analytics/i },
  { path: "/live", title: /Visitantes ao vivo/i, marker: /Stream de visitantes/i, feature: "live", inlineLock: true },
  { path: "/goals", title: /Metas e Funis/i, marker: /Definir meta/i, feature: "goals" },
  { path: "/heatmaps", title: /Heatmaps e Gravações/i, marker: /Conectar Microsoft Clarity|Alterar integração/i, feature: "heatmap" },
  { path: "/insights", title: /Insights com IA/i, marker: /Gerar.*insight|Atualizar.*insight|Análise inteligente/i, feature: "ai_insights" },
  { path: "/alerts", title: /Alertas/i, marker: /Alertas e Notificações/i },
  { path: "/compare", title: /Comparar projetos/i, marker: /Comparar Projetos/i, feature: "compare" },
  { path: "/reports", title: /Relatórios profissionais/i, marker: /Documento executivo com dados reais/i, feature: "pdf_report" },
  { path: "/presentation", title: /Apresentação/i, marker: /Modo Apresentação/i, feature: "presentation" },
] as const;

test.describe("Principal pages - real authenticated tenant", () => {
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
    await expect(page.getByTestId("date-range-picker")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("plan-badge")).not.toHaveText("...", { timeout: 15_000 });
  });

  for (const item of principalPages) {
    test(`${item.path} opens without runtime or server errors`, async ({ page }) => {
      const runtimeErrors: string[] = [];
      const serverErrors: string[] = [];
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      page.on("response", (response) => {
        if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
      });

      const tier = ((await page.getByTestId("plan-badge").innerText()).trim().toLowerCase() === "pro")
        ? "pro"
        : "free";
      const hasFeatureGate = "feature" in item;
      const usesInlineLock = "inlineLock" in item && item.inlineLock;

      await page.goto(item.path);

      if (tier === "free" && hasFeatureGate && !usesInlineLock) {
        await expect(page).toHaveURL(/\/pricing$/);
        await expect(page).toHaveTitle(/Planos/i);
        await expect(page.getByText("Plano atual", { exact: true }).first()).toBeVisible();
      } else if (tier === "free" && usesInlineLock) {
        await expect(page).toHaveURL(new RegExp(`${item.path}$`));
        await expect(page).toHaveTitle(item.title);
        await expect(page.getByText(/disponível a partir do plano Pro/i)).toBeVisible();
      } else {
        await expect(page).toHaveURL(new RegExp(`${item.path}$`));
        await expect(page).toHaveTitle(item.title);
        await expect(page.getByText(item.marker).first()).toBeVisible();
      }
      await expect(page.locator("body")).not.toContainText(/Something went wrong|Erro inesperado/i);
      expect(runtimeErrors).toEqual([]);
      expect(serverErrors).toEqual([]);
    });
  }
});
