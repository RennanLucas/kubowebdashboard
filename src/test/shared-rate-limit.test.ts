// @vitest-environment node
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { checkSharedRateLimit } from "../../supabase/functions/_shared/shared-rate-limit";
import { errorResponse } from "../../supabase/functions/_shared/plan-gate";

const reset = "2030-01-01T00:01:00Z";
const client = (rpc: ReturnType<typeof vi.fn>) => ({ rpc }) as unknown as SupabaseClient;
describe("shared request limit client", () => {
  it("uses a stable hashed user identifier, endpoint namespace and no JWT", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ allowed:true, remaining:19, reset_at:reset }], error:null });
    const admin = client(rpc);
    expect(await checkSharedRateLimit(admin,"get-dashboard-overview","user-id",20)).toEqual({ allowed:true, remaining:19, resetAt:Date.parse(reset) });
    await checkSharedRateLimit(admin,"get-dashboard-overview","user-id",20);
    const args = rpc.mock.calls[0][1];
    expect(rpc.mock.calls[0][0]).toBe("consume_request_limit");
    expect(args).toMatchObject({ p_scope:"get-dashboard-overview", p_limit:20, p_window_seconds:60 });
    expect(args.p_subject_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(args.p_subject_hash).not.toContain("user-id");
    expect(rpc.mock.calls[1][1].p_subject_hash).toBe(args.p_subject_hash);
  });
  it("preserves a denial returned by the shared store", async () => {
    const rpc = vi.fn().mockResolvedValue({ data:[{ allowed:false, remaining:0, reset_at:reset }], error:null });
    expect((await checkSharedRateLimit(client(rpc),"generate-report","actor",5)).allowed).toBe(false);
  });
  it("supports a UTC-aligned daily provider allowance", async () => {
    const rpc = vi.fn().mockResolvedValue({ data:[{ allowed:true, remaining:14, reset_at:reset }], error:null });
    await checkSharedRateLimit(client(rpc),"ai-provider-daily","gemini-free-project",15,86_400);
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_limit:15,p_window_seconds:86_400 });
  });
  it("rejects an empty identity before accessing the store", async () => {
    const rpc = vi.fn();
    await expect(checkSharedRateLimit(client(rpc),"reports","",5)).rejects.toThrow("RATE_LIMIT_UNAVAILABLE");
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([
    { data:null, error:null },
    { data:[], error:null },
    { data:[{ allowed:true, remaining:1, reset_at:reset }], error:{ message:"secret DB details" } },
    { data:[{ allowed:"true", remaining:1, reset_at:reset }], error:null },
    { data:[{ allowed:true, remaining:"1", reset_at:reset }], error:null },
    { data:[{ allowed:true, remaining:1, reset_at:"invalid" }], error:null },
  ])("fails closed for a malformed or failing store (%#)", async result => {
    const rpc = vi.fn().mockResolvedValue(result);
    await expect(checkSharedRateLimit(client(rpc),"reports","actor",5)).rejects.toThrow("RATE_LIMIT_UNAVAILABLE");
  });
  it("handles transport failures without allowing requests locally", async () => {
    const rpc = vi.fn().mockRejectedValue(new Error("fetch failed"));
    await expect(checkSharedRateLimit(client(rpc),"reports","actor",5)).rejects.toThrow("RATE_LIMIT_UNAVAILABLE");
  });
  it("returns retryable 503 with no internal details when the store is unavailable", async () => {
    const spy = vi.spyOn(console,"error").mockImplementation(() => {});
    try {
      const response = errorResponse(new Error("RATE_LIMIT_UNAVAILABLE"),{},"test");
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain("RATE_LIMIT_UNAVAILABLE");
    } finally { spy.mockRestore(); }
  });
});
