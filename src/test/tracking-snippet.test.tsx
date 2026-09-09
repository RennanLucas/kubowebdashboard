import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TrackingSnippet from "@/components/TrackingSnippet";

describe("TrackingSnippet consent mode", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  });

  it("explica o bloqueio e adiciona consent=required quando ativado", () => {
    render(<TrackingSnippet projectId="project-123" />);

    const consentSwitch = screen.getByRole("switch", {
      name: /aguardar autorização do visitante/i,
    });
    const trackingCode = screen.getByText(/tracker-script\?pid=project-123/);

    expect(trackingCode).not.toHaveTextContent("consent=required");
    expect(screen.getByText("DESATIVADO")).toBeInTheDocument();

    fireEvent.click(consentSwitch);

    expect(trackingCode).toHaveTextContent("consent=required");
    expect(screen.getByText("ATIVADO")).toBeInTheDocument();
    expect(screen.getByText(/o Kubo não cria o banner de consentimento/i)).toBeInTheDocument();
    expect(screen.getByText(/nenhuma visita será registrada/i)).toBeInTheDocument();
  });
});
