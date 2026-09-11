import { describe, expect, it, vi } from "vitest";
import { createAuthFetch } from "@/lib/auth-fetch";
const origin = "https://gitzmynfamubetgujtmm.supabase.co";
describe("auth transport", () => {
  it("keeps a separately configured staging project direct", async () => {
    const transport = vi.fn(); const staging = "https://staging.supabase.co";
    await createAuthFetch(staging, "preview.vercel.app", transport)(`${staging}/auth/v1/token`);
    expect(transport).toHaveBeenCalledWith(`${staging}/auth/v1/token`, undefined);
  });
  it("keeps method, body and headers while routing hosted auth through Kubo", async () => {
    const transport = vi.fn().mockResolvedValue(new Response("{}"));
    const options = { method: "POST", body: "test-body", headers: { apikey: "test-key" } };
    await createAuthFetch(origin, "kubowebdashboard.vercel.app", transport)(`${origin}/auth/v1/token?grant_type=password`, options);
    expect(transport).toHaveBeenCalledWith(`${window.location.origin}/_kubo/gateway/token?grant_type=password`, options);
  });
  it.each(["localhost", "127.0.0.1", "[::1]"])("keeps local requests direct (%s)", async host => {
    const transport = vi.fn(); const url = `${origin}/auth/v1/token`;
    await createAuthFetch(origin, host, transport)(url);
    expect(transport).toHaveBeenCalledWith(url, undefined);
  });
  it.each([`${origin}/rest/v1/projects`, "https://other.supabase.co/auth/v1/token"])("does not redirect other endpoints (%s)", async url => {
    const transport = vi.fn(); await createAuthFetch(origin, "app.example", transport)(url);
    expect(transport).toHaveBeenCalledWith(url, undefined);
  });
  it("does not retry a failing authentication request", async () => {
    const transport = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(createAuthFetch(origin, "app.example", transport)(`${origin}/auth/v1/otp`)).rejects.toThrow();
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
