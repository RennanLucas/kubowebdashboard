import { Monitor, Smartphone, Tablet, Globe } from "lucide-react";

interface DeviceItem {
  name: string;
  count: number;
  percentage: number;
}

interface DevicesBrowsersCardProps {
  devices: DeviceItem[];
  browsers: DeviceItem[];
  operatingSystems: DeviceItem[];
}

const deviceIcons: Record<string, React.ReactNode> = {
  Desktop: <Monitor className="h-4 w-4" />,
  Mobile: <Smartphone className="h-4 w-4" />,
  Tablet: <Tablet className="h-4 w-4" />,
};

const barColors = [
  "bg-primary",
  "bg-[hsl(var(--chart-blue))]",
  "bg-[hsl(var(--chart-green))]",
  "bg-[hsl(var(--chart-purple))]",
  "bg-[hsl(var(--chart-orange))]",
];

const DevicesBrowsersCard = ({ devices, browsers, operatingSystems }: DevicesBrowsersCardProps) => {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-card-foreground mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" /> Dispositivos & Navegadores
      </h3>

      {/* Devices */}
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Dispositivos</p>
        <div className="space-y-2">
          {devices.slice(0, 4).map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="text-muted-foreground">{deviceIcons[d.name] || <Monitor className="h-4 w-4" />}</span>
              <span className="text-sm text-card-foreground flex-1">{d.name}</span>
              <span className="text-xs text-muted-foreground">{d.count.toLocaleString("pt-BR")}</span>
              <span className="text-xs font-medium text-card-foreground w-10 text-right">{d.percentage}%</span>
            </div>
          ))}
          {devices.length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
        </div>
      </div>

      {/* Browsers */}
      <div className="mb-4 pt-3 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Navegadores</p>
        <div className="space-y-2">
          {browsers.slice(0, 5).map((b, i) => (
            <div key={b.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-card-foreground">{b.name}</span>
                <span className="text-xs text-muted-foreground">{b.count.toLocaleString("pt-BR")} · {b.percentage}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barColors[i % barColors.length]}`} style={{ width: `${b.percentage}%` }} />
              </div>
            </div>
          ))}
          {browsers.length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
        </div>
      </div>

      {/* OS */}
      <div className="pt-3 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sistemas Operacionais</p>
        <div className="flex flex-wrap gap-2">
          {operatingSystems.slice(0, 5).map((os) => (
            <span key={os.name} className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground">
              {os.name} <span className="ml-1 font-medium text-card-foreground">{os.percentage}%</span>
            </span>
          ))}
          {operatingSystems.length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
        </div>
      </div>
    </div>
  );
};

export default DevicesBrowsersCard;
