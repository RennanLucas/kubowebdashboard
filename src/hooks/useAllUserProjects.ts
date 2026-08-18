import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface UserProjectOption {
  id: string;
  name: string;
  url: string | null;
  organizationId: string;
  organizationName: string;
}

export const useAllUserProjects = () => {
  const { activeOrganization } = useOrganization();
  const organizationId = activeOrganization?.id;

  return useQuery({
    queryKey: ["projects", organizationId],
    enabled: !!organizationId,
    queryFn: async (): Promise<UserProjectOption[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, url")
        .eq("organization_id", organizationId!)
        .order("name");

      if (error) throw error;

      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        url: p.url,
        organizationId: activeOrganization!.id,
        organizationName: activeOrganization!.name,
      }));
    },
  });
};
