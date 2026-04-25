import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProjectOption {
  id: string;
  name: string;
  url: string | null;
  clientId: string;
  clientName: string;
}

/**
 * Loads every project the current user owns across ALL of their clients,
 * so the project selector in the dashboard can disambiguate duplicates
 * (e.g. two clients each with a "Loja Digital" project).
 */
export const useAllUserProjects = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["all-user-projects", userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserProjectOption[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, projects(id, name, url)")
        .eq("user_id", userId!);

      if (error) throw error;

      const out: UserProjectOption[] = [];
      (data ?? []).forEach((c: any) => {
        (c.projects ?? []).forEach((p: any) => {
          out.push({
            id: p.id,
            name: p.name,
            url: p.url,
            clientId: c.id,
            clientName: c.company_name,
          });
        });
      });
      // Sort: same client grouped, then by project name
      out.sort((a, b) =>
        a.clientName.localeCompare(b.clientName) || a.name.localeCompare(b.name),
      );
      return out;
    },
  });
};
