import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AIInsightsPanel } from "@/components/insights/AIInsightsPanel";
const state = vi.hoisted(() => ({ pro:true,request:vi.fn(),uuid:vi.fn() }));
vi.mock("@/contexts/AuthContext",() => ({ useAuth:() => ({ user:{ id:"user" },session:{ access_token:"verified-token" } }) }));
vi.mock("@/contexts/OrganizationContext",() => ({ useOrganization:() => ({ activeOrganization:{ id:"org" } }) }));
vi.mock("@/hooks/usePlan",() => ({ usePlan:() => ({ loading:false,can:() => state.pro }) }));
vi.mock("@/lib/edge-functions",() => ({ requestEdgeFunction:(...args:unknown[]) => state.request(...args) }));
const quota = { state:null,request_id:null,limit:10,remaining:10,used:0,configured:true,can_generate:true,
  model:"gemini-3.8-flash",latest:null,resets_at:"2030-02-01T00:00:00Z" };
const pendingKey = "kubo:ai-request:user:org:project:7";
const UUID = "00000000-0000-4000-8000-000000000099";
function mount(onGenerated=vi.fn()) {
  const client = new QueryClient({ defaultOptions:{ queries:{ retry:false,gcTime:0 } } });
  return render(<QueryClientProvider client={client}><AIInsightsPanel projectId="project" periodDays={7} onGenerated={onGenerated} /></QueryClientProvider>);
}
beforeEach(() => {
  cleanup(); sessionStorage.clear(); state.pro=true; state.request.mockReset();
  state.request.mockResolvedValue(quota);
  Object.defineProperty(crypto,"randomUUID",{ configurable:true,value:() => UUID });
});
describe("paid AI panel", () => {
  it("never queries the AI service for Free accounts", async () => {
    state.pro=false; mount();
    expect(screen.queryByText("Análise com IA · Pro")).toBeNull();
    expect(state.request).not.toHaveBeenCalled();
  });
  it("reads quota on mount without starting a generation", async () => {
    mount(); await screen.findByText("10 de 10");
    expect(state.request).toHaveBeenCalledTimes(1);
    expect(state.request.mock.calls[0][2].query.get("action")).toBe("status");
    expect(state.request.mock.calls[0][2].query.get("project_id")).toBe("project");
  });
  it("persists the request before POST and reuses it on retry", async () => {
    state.request.mockImplementation(async (_name,_token,options) => {
      if (options.method==="POST") {
        expect(sessionStorage.getItem(pendingKey)).toBe(UUID);
        throw new Error("Transport failure");
      }
      return quota;
    });
    mount(); await screen.findByText("10 de 10");
    fireEvent.click(screen.getByRole("button",{ name:"Gerar com IA" }));
    await screen.findByText("Transport failure");
    await waitFor(() => expect(screen.getByRole("button",{ name:"Retomar solicitação" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button",{ name:"Retomar solicitação" }));
    await waitFor(() => expect(state.request.mock.calls.filter(call => call[2].method==="POST")).toHaveLength(2));
    expect(state.request.mock.calls.filter(call => call[2].method==="POST").map(call => call[2].body.request_id)).toEqual([UUID,UUID]);
  });
  it("disables generation for an unconfigured provider or read-only role", async () => {
    state.request.mockResolvedValue({ ...quota,configured:false,can_generate:false });
    mount(); await screen.findByText("10 de 10");
    expect(screen.getByRole("button",{ name:"Gerar com IA" })).toBeDisabled();
    expect(state.request).toHaveBeenCalledTimes(1);
  });
  it("consults an in-progress request without issuing another POST", async () => {
    sessionStorage.setItem(pendingKey,UUID);
    state.request.mockResolvedValue({ ...quota,state:"started" });
    mount();
    const button = await screen.findByRole("button",{ name:"Consultar resultado" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await waitFor(() => expect(state.request).toHaveBeenCalledTimes(2));
    expect(state.request.mock.calls.every(call => !call[2].method || call[2].method==="GET")).toBe(true);
  });
  it("restores a completed request once and does not regenerate it automatically", async () => {
    const latest = { id:"insight",content:"Saved report",project_id:"project",period_days:7,model:quota.model,created_at:"2030-01-01" };
    const callback = vi.fn(); sessionStorage.setItem(pendingKey,UUID);
    state.request.mockResolvedValue({ ...quota,state:"succeeded",latest });
    mount(callback);
    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith(latest);
    expect(state.request).toHaveBeenCalledTimes(1);
  });
});
