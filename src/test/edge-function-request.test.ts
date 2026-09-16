import { afterEach, describe, expect, it, vi } from "vitest";
import { EdgeFunctionError, requestEdgeFunction } from "@/lib/edge-functions";
afterEach(() => { vi.unstubAllGlobals(); });
describe("authenticated Edge Function requests", () => {
  it("sends a non-cacheable GET with token, query and cancellation signal", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ used:2 })));
    vi.stubGlobal("fetch",fetcher);
    const controller = new AbortController();
    const result = await requestEdgeFunction("ai-weekly-insights","token",{
      query:new URLSearchParams({ action:"status" }),signal:controller.signal,
    });
    expect(result).toEqual({ used:2 });
    expect(fetcher.mock.calls[0][0]).toContain("action=status");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache:"no-store",method:"GET",signal:controller.signal,
      headers:{ Authorization:"Bearer token" } });
  });
  it("preserves idempotent JSON request bodies", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("{}")); vi.stubGlobal("fetch",fetcher);
    await requestEdgeFunction("ai-weekly-insights","token",{ method:"POST",body:{ request_id:"same-id" } });
    expect(fetcher.mock.calls[0][1].body).toBe('{"request_id":"same-id"}');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("keeps the error code/status but displays the user-readable server message", async () => {
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error:"AI_LIMIT_REACHED",message:"Limite mensal atingido.",
    }),{ status:429 })));
    try { await requestEdgeFunction("ai-weekly-insights","token"); throw new Error("Expected rejection"); }
    catch (error) {
      expect(error).toBeInstanceOf(EdgeFunctionError);
      expect(error).toMatchObject({ message:"Limite mensal atingido.",code:"AI_LIMIT_REACHED",status:429 });
    }
  });
  it("rejects a malformed successful response", async () => {
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response("<html>Not API</html>")));
    await expect(requestEdgeFunction("ai-weekly-insights","token")).rejects.toThrow("resposta inválida");
  });
  it("provides a generic error for non-JSON failures", async () => {
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response("upstream details",{ status:502 })));
    await expect(requestEdgeFunction("ai-weekly-insights","token")).rejects.toThrow("Erro ao buscar dados (502)");
  });
  it("never automatically retries a potentially billable request after network failure", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network")); vi.stubGlobal("fetch",fetcher);
    await expect(requestEdgeFunction("ai-weekly-insights","token",{ method:"POST" })).rejects.toThrow("network");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
