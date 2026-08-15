import { useEffect, useState, useCallback } from "react";
import { Bell, Save, AlertCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";

type AlertTypesMap = Record<string, boolean>;

const ALERT_TYPES: { key: string; label: string; description: string }[] = [
  { key: "traffic_drop", label: "Queda de tráfego", description: "Quedas significativas em relação ao período anterior." },
  { key: "traffic_up", label: "Crescimento de tráfego", description: "Picos positivos de visitantes." },
  { key: "low_conversion", label: "Conversão baixa", description: "Quando a taxa de conversão cai abaixo do esperado." },
  { key: "high_conversion", label: "Conversão alta", description: "Quando a conversão supera a média do mercado." },
  { key: "high_bounce", label: "Alta rejeição", description: "Visitantes saindo sem interagir." },
  { key: "no_data", label: "Sem dados coletados", description: "Quando o site não envia dados há muito tempo." },
  { key: "single_channel", label: "Dependência de canal único", description: "Concentração excessiva em uma única fonte de tráfego." },
  { key: "goal_reached", label: "Metas atingidas", description: "Visitantes, leads ou valor estimado batendo a meta." },
  { key: "peak_hour", label: "Horário de pico", description: "Identificação de melhor horário para publicar." },
];

const DEFAULT_TYPES: AlertTypesMap = Object.fromEntries(ALERT_TYPES.map((t) => [t.key, true]));

interface Prefs {
  enabled: boolean;
  frequency: "realtime" | "daily" | "weekly";
  traffic_threshold_pct: number;
  leads_goal_daily: number | null;
  alert_types: AlertTypesMap;
  notify_email: boolean;
  notify_in_app: boolean;
}

interface Errors {
  traffic_threshold_pct?: string;
  leads_goal_daily?: string;
  channels?: string;
  alert_types?: string;
}

export default function AlertPreferencesCard({ projectId }: { projectId: string }) {
  const plan = usePlan();
  const emailAllowed = plan.can("email_alerts");
  const [prefs, setPrefs] = useState<Prefs>({
    enabled: true,
    frequency: "realtime",
    traffic_threshold_pct: 20,
    leads_goal_daily: null,
    alert_types: DEFAULT_TYPES,
    notify_email: true,
    notify_in_app: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("alert_preferences")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (data) {
        setPrefs({
          enabled: data.enabled,
          frequency: (data.frequency as Prefs["frequency"]) ?? "realtime",
          traffic_threshold_pct: data.traffic_threshold_pct ?? 20,
          leads_goal_daily: data.leads_goal_daily,
          alert_types: { ...DEFAULT_TYPES, ...((data.alert_types as AlertTypesMap) ?? {}) },
          notify_email: data.notify_email ?? true,
          notify_in_app: data.notify_in_app ?? true,
        });
      }
      setLoading(false);
    })();
  }, [projectId]);

  const validate = useCallback((): Errors => {
    const newErrors: Errors = {};

    if (prefs.enabled) {
      if (prefs.traffic_threshold_pct < 5 || prefs.traffic_threshold_pct > 100) {
        newErrors.traffic_threshold_pct = "Deve estar entre 5% e 100%.";
      }

      if (prefs.leads_goal_daily !== null && prefs.leads_goal_daily !== undefined) {
        if (prefs.leads_goal_daily < 1) {
          newErrors.leads_goal_daily = "A meta diária deve ser pelo menos 1.";
        }
      }

      if (!(prefs.notify_email && emailAllowed) && !prefs.notify_in_app) {
        newErrors.channels = "Selecione pelo menos um canal de notificação.";
      }

      const anyTypeActive = Object.values(prefs.alert_types).some((v) => v);
      if (!anyTypeActive) {
        newErrors.alert_types = "Selecione pelo menos um tipo de alerta.";
      }
    }

    return newErrors;
  }, [prefs]);

  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    setErrors(validate());
  }, [prefs, validate]);

  const save = async () => {
    const validationErrors = validate();
    setTouched({
      traffic_threshold_pct: true,
      leads_goal_daily: true,
      channels: true,
      alert_types: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Corrija os campos destacados antes de salvar.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("alert_preferences")
      .upsert(
        {
          project_id: projectId,
          enabled: prefs.enabled,
          frequency: prefs.frequency,
          traffic_threshold_pct: prefs.traffic_threshold_pct,
          leads_goal_daily: prefs.leads_goal_daily,
          alert_types: prefs.alert_types,
          notify_email: prefs.notify_email && emailAllowed,
          notify_in_app: prefs.notify_in_app,
        },
        { onConflict: "project_id" },
      );
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar as preferências. Tente novamente.");
    } else {
      toast.success("Preferências de alertas atualizadas com sucesso!");
    }
  };

  const toggleType = (key: string, value: boolean) =>
    setPrefs((p) => ({ ...p, alert_types: { ...p.alert_types, [key]: value } }));

  const showError = (field: keyof Errors) => touched[field] && errors[field];

  return (
    <div className="glass-card rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Alertas e notificações
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Escolha quais alertas você quer receber e com qual frequência.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="alerts-enabled"
            checked={prefs.enabled}
            onCheckedChange={(v) => {
              setPrefs((p) => ({ ...p, enabled: v }));
              setErrors({});
              setTouched({});
            }}
            disabled={loading}
          />
          <Label htmlFor="alerts-enabled" className="text-sm">
            {prefs.enabled ? "Ativos" : "Pausados"}
          </Label>
        </div>
      </div>

      {prefs.enabled && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Frequência de envio</Label>
              <Select
                value={prefs.frequency}
                onValueChange={(v) => setPrefs((p) => ({ ...p, frequency: v as Prefs["frequency"] }))}
                disabled={loading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Em tempo real</SelectItem>
                  <SelectItem value="daily">Resumo diário</SelectItem>
                  <SelectItem value="weekly">Resumo semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold" className="text-xs">
                Sensibilidade de variação de tráfego (%)
              </Label>
              <Input
                id="threshold"
                type="number"
                min={5}
                max={100}
                value={prefs.traffic_threshold_pct}
                onChange={(e) => {
                  setPrefs((p) => ({ ...p, traffic_threshold_pct: Number(e.target.value) || 20 }));
                  setTouched((t) => ({ ...t, traffic_threshold_pct: true }));
                }}
                disabled={loading}
                className={`h-10 ${showError("traffic_threshold_pct") ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {showError("traffic_threshold_pct") && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.traffic_threshold_pct}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leads-goal" className="text-xs">
              Meta diária de leads (opcional)
            </Label>
            <Input
              id="leads-goal"
              type="number"
              min={1}
              placeholder="Ex: 10"
              value={prefs.leads_goal_daily ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setPrefs((p) => ({
                  ...p,
                  leads_goal_daily: val === "" ? null : Number(val),
                }));
                setTouched((t) => ({ ...t, leads_goal_daily: true }));
              }}
              disabled={loading}
              className={`h-10 ${showError("leads_goal_daily") ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {showError("leads_goal_daily") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.leads_goal_daily}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Canais
            </Label>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="notify-in-app"
                  checked={prefs.notify_in_app}
                  onCheckedChange={(v) => {
                    setPrefs((p) => ({ ...p, notify_in_app: v }));
                    setTouched((t) => ({ ...t, channels: true }));
                  }}
                  disabled={loading}
                />
                <Label htmlFor="notify-in-app" className="text-sm">No painel</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="notify-email"
                  checked={prefs.notify_email && emailAllowed}
                  onCheckedChange={(v) => {
                    if (v && !emailAllowed) {
                      toast.error("Alertas por e-mail estão disponíveis no plano Pro.");
                      return;
                    }
                    setPrefs((p) => ({ ...p, notify_email: v }));
                    setTouched((t) => ({ ...t, channels: true }));
                  }}
                  disabled={loading || !emailAllowed}
                />
                <Label htmlFor="notify-email" className="text-sm">
                  Por e-mail{!emailAllowed && <span className="ml-1 text-xs text-muted-foreground">(Pro)</span>}
                </Label>
              </div>
            </div>
            {showError("channels") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.channels}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Tipos de alerta
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALERT_TYPES.map((t) => (
                <label
                  key={t.key}
                  htmlFor={`type-${t.key}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Switch
                    id={`type-${t.key}`}
                    checked={!!prefs.alert_types[t.key]}
                    onCheckedChange={(v) => {
                      toggleType(t.key, v);
                      setTouched((prev) => ({ ...prev, alert_types: true }));
                    }}
                    disabled={loading}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {showError("alert_types") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.alert_types}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || loading || (prefs.enabled && hasErrors)} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar preferências"}
          {!hasErrors && !saving && <Check className="h-3 w-3 text-green-500" />}
        </Button>
      </div>
    </div>
  );
}
