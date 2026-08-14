import EngagementCard from "@/components/dashboard/EngagementCard";
import DevicesBrowsersCard from "@/components/dashboard/DevicesBrowsersCard";
import GeoCard from "@/components/dashboard/GeoCard";
import LegacyInsightsSection from "@/components/dashboard/InsightsSection";

interface Insight {
  type: "growth" | "drop" | "info" | "warning";
  title: string;
  message: string;
}

interface Props {
  engagement?: {
    bounceRate: number;
    avgSessionDuration: number;
    totalSessions: number;
    pagesPerSession: number;
  };
  devices: Array<{ name: string; count: number; percentage: number }>;
  browsers: Array<{ name: string; count: number; percentage: number }>;
  operatingSystems: Array<{ name: string; count: number; percentage: number }>;
  countries: Array<{ name: string; count: number; percentage: number }>;
  cities: Array<{ name: string; count: number; percentage: number }>;
  insights: Insight[];
}

export const InsightsSection = ({
  engagement,
  devices,
  browsers,
  operatingSystems,
  countries,
  cities,
  insights,
}: Props) => (
  <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 stagger-children">
      {engagement && <EngagementCard data={engagement} />}
      <DevicesBrowsersCard
        devices={devices ?? []}
        browsers={browsers ?? []}
        operatingSystems={operatingSystems ?? []}
      />
      <GeoCard countries={countries ?? []} cities={cities ?? []} />
    </div>
    {insights.length > 0 && <LegacyInsightsSection insights={insights as any} />}
  </>
);
