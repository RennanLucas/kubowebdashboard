import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { installationExamples } from "@/lib/installation-examples";
import { InteractiveSnippet, PremiumPricing } from "@/components/landing/premium/LandingExperience";

const plansState = vi.hoisted(() => ({ plans: [] as Array<Record<string, unknown>>, loading: false, error: null as string | null }));
vi.mock("@/hooks/usePlans", () => ({ usePlans: () => plansState }));

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); plansState.plans = []; plansState.error = null; });

describe("installation examples", () => {
  it("uses the configured tracker with a replaceable identifier and consent", () => {
    const examples = installationExamples("https://example.supabase.co/")!;
    for (const code of Object.values(examples)) {
      expect(code).toContain("https://example.supabase.co/functions/v1/tracker-script?pid=SEU_PROJECT_ID");
      expect(code).toContain("consent=required");
      expect(code).not.toContain("kw_live_");
    }
    expect(examples.html).toContain("&amp;consent=required");
    expect(examples.nextjs).toContain('src={"https://');
  });

  it.each([undefined, "", "not a URL", "javascript:alert(1)", "https://user:password@example.com"])("does not produce a broken snippet for %s", value => {
    expect(installationExamples(value)).toBeNull();
  });

  it("reports clipboard failure instead of claiming success", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<MemoryRouter><InteractiveSnippet /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Copiar código de instalação" }));
    expect(await screen.findByText(/Não foi possível copiar/)).toBeVisible();
    expect(screen.queryByText("Copiado!")).not.toBeInTheDocument();
  });

  it("copies the selected platform only after a successful write", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<MemoryRouter><InteractiveSnippet /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Next.js / React" }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar código de instalação" }));
    await waitFor(() => expect(screen.getByText("Copiado!")).toBeVisible());
    expect(writeText).toHaveBeenCalledWith(installationExamples("https://example.supabase.co")!.nextjs);
    fireEvent.click(screen.getByRole("button", { name: "WordPress" }));
    expect(screen.queryByText("Copiado!")).not.toBeInTheDocument();
  });

  it("disables copying if the deployment lacks its tracker configuration", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    render(<MemoryRouter><InteractiveSnippet /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Copiar código de instalação" })).toBeDisabled();
  });
});

describe("published pricing", () => {
  it("preserves the API price and benefits without inventing an annual offer", () => {
    plansState.plans = [{ id: "pro", name: "Pro", price: "R$ 59,90", cadence: "/mês", features: ["Benefício retornado pela API"], enabled: true }];
    render(<MemoryRouter><PremiumPricing /></MemoryRouter>);
    expect(screen.getByText("R$ 59,90")).toBeVisible();
    expect(screen.getByText("Benefício retornado pela API")).toBeVisible();
    expect(screen.queryByText(/20% OFF|R\$ 39,90/)).not.toBeInTheDocument();
  });

  it("does not offer an invented price when plans cannot be loaded", () => {
    plansState.error = "offline";
    render(<MemoryRouter><PremiumPricing /></MemoryRouter>);
    expect(screen.getByText("Indisponível no momento")).toBeVisible();
    expect(screen.queryByText("R$ 49,90")).not.toBeInTheDocument();
  });
});
