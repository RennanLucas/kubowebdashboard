import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");

describe("principal pages production safeguards", () => {
  it("does not restore simulated business results on Goals or Heatmaps", () => {
    const goals = source("src/pages/Goals.tsx");
    const heatmaps = source("src/pages/Heatmaps.tsx");

    expect(goals).not.toMatch(/Em Breve|totalLeads\s*\*\s*0\.[14]/);
    expect(heatmaps).not.toMatch(/Math\.random|views\s*\*\s*0\.45|FAKE HEATMAP|Mocked clicks/i);
  });

  it("keeps project selection centralized on tenant-sensitive pages", () => {
    for (const file of ["src/pages/Live.tsx", "src/pages/Alerts.tsx", "src/pages/Heatmaps.tsx"]) {
      const page = source(file);
      expect(page).toContain("useSelectedProject");
      expect(page).not.toContain('localStorage.getItem("selectedProjectId")');
    }
  });

  it("ships tenant-aware goals policies and project-scoped Clarity configuration", () => {
    const migration = source("supabase/migrations/20260903150000_goals_and_clarity_production.sql");
    expect(migration).toContain("clarity_project_id");
    expect(migration).toContain("organization_members");
    expect(migration).toContain("Organization editors can manage goals");
  });
});
