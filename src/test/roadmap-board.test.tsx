import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoadmapBoard } from "@/components/admin/RoadmapBoard";

const mock = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn(), insert: vi.fn(), update: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({
  select: () => ({ order: mock.read }),
  insert: (p: unknown) => { mock.insert(p); return { select: () => ({ single: mock.write }) }; },
  update: (p: unknown) => { mock.update(p); return { eq: () => ({ select: () => ({ single: mock.write }) }) }; },
}) } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
function mount() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RoadmapBoard /></QueryClientProvider>); }
beforeEach(() => { cleanup(); vi.clearAllMocks(); mock.read.mockResolvedValue({ data: [], error: null }); mock.write.mockResolvedValue({ data: { id: "one" }, error: null }); });
describe("Roadmap administrativo", () => {
  it("mostra as cinco etapas vazias", async () => { mount(); expect(await screen.findByText("Ideias", { exact: false })).toBeInTheDocument(); expect(screen.getAllByText("Nenhum item nesta etapa.")).toHaveLength(5); });
  it("cria item privado por padrão e não permite título vazio", async () => {
    mount(); fireEvent.click(screen.getByText("Novo item"));
    expect(screen.getByText("Salvar item")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "  Melhorar filtros  " } });
    fireEvent.click(screen.getByText("Salvar item"));
    await waitFor(() => expect(mock.insert).toHaveBeenCalledWith(expect.objectContaining({ title: "Melhorar filtros", public: false, status: "backlog" })));
  });
  it("permite editar a etapa de um item", async () => {
    mock.read.mockResolvedValue({ data: [{ id: "one", title: "Filtros", description: "", category: "", status: "planned", public: false }], error: null });
    mount(); fireEvent.click(await screen.findByLabelText("Editar Filtros"));
    fireEvent.change(screen.getByLabelText("Etapa"), { target: { value: "testing" } });
    fireEvent.click(screen.getByText("Salvar item"));
    await waitFor(() => expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ status: "testing" })));
  });
  it("exibe erro de consulta em vez de esconder como vazio", async () => {
    mock.read.mockResolvedValue({ data: null, error: new Error("denied") }); mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
  });
  it("mantém formulário aberto quando a escrita é negada", async () => {
    mock.write.mockResolvedValue({ error: new Error("denied") }); mount();
    fireEvent.click(screen.getByText("Novo item")); fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Teste" } }); fireEvent.click(screen.getByText("Salvar item"));
    await waitFor(() => expect(mock.write).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
