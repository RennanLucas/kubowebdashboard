import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ items: vi.fn(), votes: vi.fn(), insert: vi.fn(), toast: vi.fn() }));
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => ({ activeOrganization: { id: "org" } }) }));
vi.mock("sonner", () => ({ toast: { error: mock.toast } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: "user" } }, error: null }) },
  from: (table: string) => {
    const chain = {
      select: () => chain,
      eq: () => table === "roadmap_items" ? chain : mock.votes(),
      order: () => mock.items(),
      insert: mock.insert,
    };
    return chain;
  },
} }));
import { PublicRoadmap } from "@/pages/feedback/PublicRoadmap";
const renderRoadmap = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><PublicRoadmap /></QueryClientProvider>);
beforeEach(() => {
  mock.items.mockReset().mockResolvedValue({ data: [], error: null });
  mock.votes.mockReset().mockResolvedValue({ data: [], error: null });
  mock.insert.mockReset(); mock.toast.mockReset();
});
afterEach(cleanup);
describe("roadmap does not invent data or report failed votes as success", () => {
  it("shows an actual empty state instead of sample items", async () => {
    renderRoadmap();
    expect(await screen.findByText("Roadmap vazio")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Votar nesta melhoria" })).toBeNull();
  });
  it("shows query failure and retries the real query", async () => {
    mock.items.mockResolvedValueOnce({ data: null, error: new Error("network") });
    renderRoadmap();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o roadmap");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Roadmap vazio")).toBeVisible();
    expect(mock.items).toHaveBeenCalledTimes(2);
  });
  it("keeps the real count unchanged when the database rejects voting", async () => {
    mock.items.mockResolvedValue({ data: [{ id: "item", title: "Real item", description: "Real description", status: "planned", category: "Analytics", roadmap_item_votes: [{ vote_count: 3 }] }], error: null });
    mock.insert.mockResolvedValue({ error: { message: "permission denied" } });
    renderRoadmap();
    const button = await screen.findByRole("button", { name: "Votar nesta melhoria" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await waitFor(() => expect(mock.toast).toHaveBeenCalledWith("Não foi possível registrar o voto. Tente novamente."));
    expect(button).toHaveTextContent("3");
    expect(mock.items).toHaveBeenCalledTimes(1);
  });
});
