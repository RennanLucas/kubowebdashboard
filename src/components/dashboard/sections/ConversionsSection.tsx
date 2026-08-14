import { ConversionFunnel } from "@/components/dashboard/ConversionFunnel";
import ConversionsCard from "@/components/dashboard/ConversionsCard";
import { WidgetBoundary } from "@/components/dashboard/WidgetBoundary";

interface Props {
  totalVisitors: number;
  engagedVisitors: number;
  totalButtons: number;
  totalWhatsapp: number;
  totalForms: number;
  totalLeads: number;
  totalConversionsAll: number;
  conversions?: {
    whatsapp_clicks?: number;
    form_submissions?: number;
    button_clicks?: number;
    changes: { whatsapp?: number; forms?: number; buttons?: number };
    recent?: any[];
  };
}

export const ConversionsSection = ({
  totalVisitors,
  engagedVisitors,
  totalButtons,
  totalWhatsapp,
  totalForms,
  totalLeads,
  totalConversionsAll,
  conversions,
}: Props) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 stagger-children">
    <WidgetBoundary title="Funil indisponível">
      <ConversionFunnel
        visitors={totalVisitors}
        engaged={engagedVisitors}
        clicks={totalButtons + totalWhatsapp}
        conversions={totalConversionsAll || totalLeads}
      />
    </WidgetBoundary>
    <WidgetBoundary title="Não foi possível carregar conversões">
      <ConversionsCard
        data={{
          whatsappClicks: { value: conversions?.whatsapp_clicks ?? totalWhatsapp, change: conversions?.changes.whatsapp ?? 0 },
          formSubmissions: { value: conversions?.form_submissions ?? totalForms, change: conversions?.changes.forms ?? 0 },
          buttonClicks: { value: conversions?.button_clicks ?? totalButtons, change: conversions?.changes.buttons ?? 0 },
          recentEvents: conversions?.recent ?? [],
        }}
      />
    </WidgetBoundary>
  </div>
);
