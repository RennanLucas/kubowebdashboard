import { describe, expect, it } from "vitest";
import { getEdgeFunctionUrl, shouldUseSameOriginEdgeProxy } from "@/lib/edge-functions";

describe("Edge Function same-origin proxy", () => {
  it("uses the Kubo domain when running on Vercel or a future custom domain", () => {
    expect(shouldUseSameOriginEdgeProxy("kubowebdashboard.vercel.app")).toBe(true);
    expect(getEdgeFunctionUrl("get-dashboard-overview", "days=30", "kubowebdashboard.vercel.app"))
      .toBe("/api/edge/get-dashboard-overview?days=30");
  });

  it("keeps direct Supabase calls during local development", () => {
    expect(shouldUseSameOriginEdgeProxy("localhost")).toBe(false);
    expect(getEdgeFunctionUrl("get-subscription-status", "", "localhost"))
      .toContain("/functions/v1/get-subscription-status");
  });
});
