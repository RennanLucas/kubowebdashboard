import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getEdgeFunctionErrorMessage } from "@/lib/edge-function-error";

const source = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");

describe("organization-scoped billing checkout", () => {
  it("sends the active organization from both checkout entry points", () => {
    for (const file of ["src/pages/Pricing.tsx", "src/pages/Subscription.tsx"]) {
      const page = source(file);
      expect(page).toContain("organizationId: activeOrganization.id");
      expect(page).toContain("currentRole");
    }
  });

  it("extracts the safe backend message from a failed Edge Function response", async () => {
    const error = {
      message: "Edge Function returned a non-2xx status code",
      context: {
        json: async () => ({ error: "Acesso negado para gerenciar faturamento desta organização" }),
      },
    };

    await expect(
      getEdgeFunctionErrorMessage(error, null, "Falha segura"),
    ).resolves.toBe("Acesso negado para gerenciar faturamento desta organização");
  });

  it("never exposes Supabase's technical non-2xx message", async () => {
    await expect(
      getEdgeFunctionErrorMessage(
        { message: "Edge Function returned a non-2xx status code" },
        null,
        "Não foi possível abrir o pagamento agora.",
      ),
    ).resolves.toBe("Não foi possível abrir o pagamento agora.");
  });
});

describe("goals and report production safeguards", () => {
  it("uses atomic monthly saves and explicit tenant-aware database permissions", () => {
    const card = source("src/components/settings/MonthlyGoalsCard.tsx");
    const migration = source("supabase/migrations/20260903223000_fix_goals_permissions.sql");

    expect(card).toContain('.upsert(payload, { onConflict: "project_id,month" })');
    expect(migration).toContain("can_manage_project_goals");
    expect(migration).toContain("GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated");
  });

  it("prints only the report document in A4 portrait", () => {
    const reports = source("src/pages/Reports.tsx");
    const css = source("src/index.css");

    expect(reports).toContain('id="report-preview"');
    expect(css).toContain("@media print");
    expect(css).toContain("size: A4 portrait");
    expect(css).toContain("#report-preview");
    expect(css).toContain("visibility: hidden !important");
  });
});
