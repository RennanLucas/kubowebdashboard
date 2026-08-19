import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  lead_value?: number;
}

export interface OrgMembership {
  role: OrgRole;
  organization: Organization;
}

interface OrganizationContextType {
  activeOrganization: Organization | null;
  organizations: OrgMembership[];
  currentRole: OrgRole | null;
  loading: boolean;
  error: Error | null;
  setOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType>({
  activeOrganization: null,
  organizations: [],
  currentRole: null,
  loading: true,
  error: null,
  setOrganization: () => {},
});

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    return window.localStorage.getItem("kuboweb:active-organization-id");
  });

  const { data: memberships = [], isLoading, error } = useQuery({
    queryKey: ["organizations", userId],
    enabled: !!userId,
    queryFn: async (): Promise<OrgMembership[]> => {
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          role,
          organization:organizations(id, name, slug, domain, lead_value)
        `)
        .eq("user_id", userId!);

      if (error) throw error;
      
      return (data as any[]).map(d => ({
        role: d.role as OrgRole,
        organization: Array.isArray(d.organization) ? d.organization[0] : d.organization
      })) as OrgMembership[];
    },
  });

  useEffect(() => {
    if (isLoading || !memberships.length) return;

    const validMembership = memberships.find((m) => m.organization.id === activeOrgId);
    
    if (!validMembership) {
      const defaultOrgId = memberships[0].organization.id;
      setActiveOrgId(defaultOrgId);
      window.localStorage.setItem("kuboweb:active-organization-id", defaultOrgId);
    }
  }, [memberships, activeOrgId, isLoading]);

  const setOrganization = (orgId: string) => {
    if (orgId === activeOrgId) return;

    // Remove tenant-specific queries without wiping generic system state
    queryClient.removeQueries({ queryKey: ["dashboard-overview", userId, activeOrgId] });
    queryClient.removeQueries({ queryKey: ["dashboard-pages", userId, activeOrgId] });
    queryClient.removeQueries({ queryKey: ["dashboard-sources", userId, activeOrgId] });
    queryClient.removeQueries({ queryKey: ["dashboard-devices", userId, activeOrgId] });
    queryClient.removeQueries({ queryKey: ["dashboard-geo", userId, activeOrgId] });
    queryClient.removeQueries({ queryKey: ["projects", activeOrgId] });
    queryClient.removeQueries({ queryKey: ["members", activeOrgId] });
    queryClient.removeQueries({ queryKey: ["subscription", activeOrgId] });

    window.dispatchEvent(new CustomEvent("organization-changed", { detail: { previous: activeOrgId, current: orgId } }));

    setActiveOrgId(orgId);
    window.localStorage.setItem("kuboweb:active-organization-id", orgId);
  };

  const activeMembership = memberships.find((m) => m.organization.id === activeOrgId);

  // If we have memberships but haven't resolved the active one yet, we are still conceptually loading
  // because the useEffect is about to set the default organization.
  const isResolvingDefaultOrg = !isLoading && memberships.length > 0 && !activeMembership;
  const contextLoading = isLoading || isResolvingDefaultOrg;

  return (
    <OrganizationContext.Provider
      value={{
        activeOrganization: activeMembership?.organization ?? null,
        organizations: memberships,
        currentRole: activeMembership?.role ?? null,
        loading: contextLoading,
        error: error as Error | null,
        setOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
