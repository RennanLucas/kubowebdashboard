const allowedOrigins = [
  "https://kubowebdashboard.vercel.app",
  "https://kubowebdashboard.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000"
];

export const getCorsHeaders = (req?: Request) => {
  const origin = req?.headers.get("origin") || "";
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-organization-id",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE"
  };
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://kubowebdashboard.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-organization-id",
};

export const publicCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-organization-id",
};
