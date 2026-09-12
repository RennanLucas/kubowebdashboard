const allowedOrigins = [
  "https://kubowebdashboard.vercel.app",
  "https://kubowebdashboard.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000"
];

const isAllowedOrigin = (origin: string): boolean => {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  // Permite deploys de prévia da Vercel vinculados ao kubowebdashboard
  if (/^https:\/\/([a-z0-9-]+-)?kubowebdashboard([a-z0-9-]+)?\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/.*kubowebdashboard.*\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/kubowebdashboard.*\.lovable\.app$/.test(origin)) return true;
  return false;
};


export const getCorsHeaders = (req?: Request) => {
  const origin = req?.headers.get("origin") || "";
  const configuredOrigins = (Deno.env.get("ALLOWED_ORIGIN") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const acceptedOrigins = [...new Set([...configuredOrigins, ...allowedOrigins])];
  const allowed = (origin && (acceptedOrigins.includes(origin) || isAllowedOrigin(origin)))
    ? origin
    : acceptedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowed,
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
