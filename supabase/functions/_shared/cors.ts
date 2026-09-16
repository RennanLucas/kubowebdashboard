import { isTrustedOrigin } from "./origins.ts";

export const getCorsHeaders = (req?: Request) => {
  const origin = req?.headers.get("origin") || "";
  const configured = Deno.env.get("ALLOWED_ORIGIN") || "";
  return {
    "Access-Control-Allow-Origin": isTrustedOrigin(origin, configured)
      ? origin : "https://kubowebdashboard.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-organization-id",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
    "Vary": "Origin",
  };
};
export const corsHeaders = getCorsHeaders();
export const publicCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-organization-id",
};
