import { MessageCircle, FileText, MousePointerClick, TrendingUp, TrendingDown } from "lucide-react";

interface ConversionItem {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
}

const ConversionsCard = ({ data }: { data: { whatsappClicks: { value: number; change: number }; formSubmissions: { value: number; change: number }; buttonClicks: { value: number; change: number } } }) => {
  const items: ConversionItem[] = [
    { label: "WhatsApp Clicks", value: data.whatsappClicks.value, change: data.whatsappClicks.change, icon: <MessageCircle className="h-4 w-4" /> },
    { label: "Form Submissions", value: data.formSubmissions.value, change: data.formSubmissions.change, icon: <FileText className="h-4 w-4" /> },
    { label: "Button Clicks", value: data.buttonClicks.value, change: data.buttonClicks.change, icon: <MousePointerClick className="h-4 w-4" /> },
  ];

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Conversions</h3>
      <div className="space-y-4">
        {items.map((item) => {
          const isPositive = item.change >= 0;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">{item.icon}</div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                  <p className={`text-xs flex items-center gap-1 ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isPositive ? "+" : ""}{item.change}%
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold text-card-foreground">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversionsCard;
