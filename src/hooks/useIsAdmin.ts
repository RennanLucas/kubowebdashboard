import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsAdmin(enabled = true) {
  const { user, loading: authLoading } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: enabled && !authLoading && !!user?.id,
    staleTime: 1000 * 60 * 30, // 30 mins cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
        
      if (error) {
        console.error("Failed to fetch admin role:", error);
        return false;
      }
      
      return !!data;
    }
  });

  // Se no estiver habilitado ou no houver usurio, garantimos admin = false
  const loading = enabled && (authLoading || isLoading);

  return { isAdmin: enabled && !!user ? isAdmin : false, loading };
}
