export interface TrackerPayloadEvent {
  type?: 'event' | 'pageview';
  pid: string;
  path?: string;
  ref?: string;
  sid?: string;
  event_type?: string;
  event_label?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackerPayload {
  events: TrackerPayloadEvent[];
}

export interface ChartDataPoint {
  date: string;
  views: number;
  visitors: number;
  conversions: number;
  conversion_rate?: number;
}

export interface ClientData {
  id: string;
  user_id: string;
  company_name?: string;
  lead_value?: number;
  projects?: { id: string }[];
  project?: { id: string };
}

export interface DashboardOverview {
  totalViews: number;
  totalVisitors: number;
  totalConversions: number;
  conversionRate: number;
  viewsTrend: number;
  visitorsTrend: number;
  conversionsTrend: number;
  metrics: ChartDataPoint[];
  client?: ClientData | null;
}

export interface PageStat {
  path: string;
  views: number;
  visitors: number;
}

export interface DashboardPages {
  topPages: PageStat[];
}

export interface SourceStat {
  source: string;
  visits: number;
  conversions: number;
  rate: number;
}

export interface DashboardSources {
  trafficSources: SourceStat[];
}

export interface DeviceStat {
  name: string;
  visits: number;
  percentage: number;
}

export interface DashboardDevices {
  devices: DeviceStat[];
  browsers: DeviceStat[];
  operatingSystems: DeviceStat[];
}

export interface GeoStat {
  name: string;
  visits: number;
  percentage: number;
}

export interface DashboardGeo {
  countries: GeoStat[];
  cities: GeoStat[];
}

export interface AnalyticsResponse extends 
  DashboardOverview, 
  DashboardPages, 
  DashboardSources, 
  DashboardDevices, 
  DashboardGeo {}
