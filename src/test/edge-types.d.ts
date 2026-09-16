// Node-based helper tests resolve Deno's type-only URL import to the installed
// SDK types. The deployed functions are checked independently with deno check.
declare module "https://esm.sh/@supabase/supabase-js@2.95.0" {
  export type { SupabaseClient } from "@supabase/supabase-js";
}
