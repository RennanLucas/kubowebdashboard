import { subDays, format } from "date-fns";

export const generateDailyMetrics = (days: number) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const visitors = Math.floor(Math.random() * 400) + 200;
    const leads = Math.floor(visitors * (Math.random() * 0.08 + 0.02));
    data.push({
      date: format(date, "MMM dd"),
      fullDate: format(date, "yyyy-MM-dd"),
      visitors,
      leads,
      conversion_rate: Number(((leads / visitors) * 100).toFixed(2)),
    });
  }
  return data;
};

export const getKPIs = (days: number) => {
  const metrics = generateDailyMetrics(days);
  const totalVisitors = metrics.reduce((s, m) => s + m.visitors, 0);
  const totalLeads = metrics.reduce((s, m) => s + m.leads, 0);
  const avgConversion = Number(((totalLeads / totalVisitors) * 100).toFixed(2));
  const estimatedValue = totalLeads * 85;

  // Previous period comparison
  const prevMetrics = generateDailyMetrics(days);
  const prevVisitors = prevMetrics.reduce((s, m) => s + m.visitors, 0);
  const prevLeads = prevMetrics.reduce((s, m) => s + m.leads, 0);

  return {
    visitors: { value: totalVisitors, change: Number((((totalVisitors - prevVisitors) / prevVisitors) * 100).toFixed(1)) },
    leads: { value: totalLeads, change: Number((((totalLeads - prevLeads) / prevLeads) * 100).toFixed(1)) },
    conversionRate: { value: avgConversion, change: Number((avgConversion - ((prevLeads / prevVisitors) * 100)).toFixed(1)) },
    estimatedValue: { value: estimatedValue, change: Number((((estimatedValue - prevLeads * 85) / (prevLeads * 85)) * 100).toFixed(1)) },
  };
};

export const getTrafficSources = () => [
  { source: "Google", visitors: 4250, percentage: 45, color: "hsl(var(--chart-blue))" },
  { source: "Social", visitors: 1890, percentage: 20, color: "hsl(var(--chart-purple))" },
  { source: "Direct", visitors: 2360, percentage: 25, color: "hsl(var(--chart-green))" },
  { source: "Ads", visitors: 940, percentage: 10, color: "hsl(var(--chart-orange))" },
];

export const getConversions = () => ({
  whatsappClicks: { value: 234, change: 12.5 },
  formSubmissions: { value: 89, change: -3.2 },
  buttonClicks: { value: 567, change: 8.7 },
});

export const getTopPages = () => [
  { path: "/", name: "Homepage", views: 3420, avgTime: "2:34", bounceRate: 38.2 },
  { path: "/services", name: "Services", views: 1890, avgTime: "3:12", bounceRate: 25.1 },
  { path: "/contact", name: "Contact", views: 1245, avgTime: "1:45", bounceRate: 42.8 },
  { path: "/about", name: "About Us", views: 890, avgTime: "2:08", bounceRate: 35.6 },
  { path: "/portfolio", name: "Portfolio", views: 756, avgTime: "4:22", bounceRate: 18.3 },
];

export const getInsights = (days: number) => {
  const kpis = getKPIs(days);
  const insights = [];

  if (kpis.visitors.change > 0) {
    insights.push({ type: "growth" as const, title: "Traffic Growth", message: `Visitors increased by ${kpis.visitors.change}% compared to the previous period.` });
  } else {
    insights.push({ type: "drop" as const, title: "Traffic Decline", message: `Visitors decreased by ${Math.abs(kpis.visitors.change)}%. Consider reviewing your SEO strategy.` });
  }

  if (kpis.conversionRate.value > 3) {
    insights.push({ type: "growth" as const, title: "Strong Conversion", message: `Your conversion rate of ${kpis.conversionRate.value}% is above the industry average of 2.5%.` });
  }

  insights.push({ type: "info" as const, title: "Top Performer", message: "Google organic search remains your highest-performing channel at 45% of total traffic." });

  return insights;
};
