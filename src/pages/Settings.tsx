import { useClientData } from "@/hooks/useDashboardData";
import Onboarding from "./Onboarding";

const Settings = () => {
  const { data: clientData, isLoading } = useClientData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Onboarding
      editMode
      existingClient={clientData ? {
        id: clientData.id,
        company_name: clientData.company_name,
        domain: clientData.domain,
        analytics_property_id: clientData.analytics_property_id,
        projects: clientData.projects ?? [],
      } : undefined}
    />
  );
};

export default Settings;
