import { useEffect, useMemo, useState } from "react";
import { Target, Save, Users, Zap, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

const toMonthDate = (year: number, monthIndex: number) =>
  new Date(year, monthIndex, 1).toISOString().slice(0, 10);

const formatMonthLabel = (year: number, monthIndex: number) => {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

interface MonthOption {
  value: string; // YYYY-MM-DD (first day)
  label: string;
  hint: string;
}

const buildMonthOptions = (): MonthOption[] => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const offsets = [-1, 0, 1, 2, 3];
  return offsets.map((offset) => {
    const d = new Date(y, m + offset, 1);
    const value = toMonthDate(d.getFullYear(), d.getMonth());
    const label = formatMonthLabel(d.getFullYear(), d.getMonth());
    let hint = "";
    if (offset === -1) hint = "Mês passado";
    else if (offset === 0) hint = "Este mês";
    else if (offset === 1) hint = "Próximo mês";
    else hint = `Em ${offset} meses`;
    return { value, label, hint };
  });
};

type FieldKey = "visitors" | "leads" | "revenue";
type FormErrors = Partial<Record<FieldKey, string>>;

const positiveIntField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `Informe a meta de ${label}` })
    .refine((v) => !Number.isNaN(Number(v)), { message: "Use apenas números" })
    .refine((v) => Number(v) >= 0, { message: "Não é permitido valor negativo" })
    .refine((v) => Number.isInteger(Number(v)), { message: "Use um número inteiro" })
    .refine((v) => Number(v) <= 10_000_000, { message: "Valor muito alto" });

const goalsSchema = z.object({
  visitors: positiveIntField("visitas"),
  leads: positiveIntField("leads"),
  revenue: z
    .string()
    .trim()
    .min(1, { message: "Informe a meta de receita" })
    .refine((v) => !Number.isNaN(Number(v.replace(",", ".")))
      , { message: "Use apenas números" })
    .refine((v) => Number(v.replace(",", ".")) >= 0, { message: "Não é permitido valor negativo" })
    .refine((v) => Number(v.replace(",", ".")) <= 1_000_000_000, { message: "Valor muito alto" }),
});

const MonthlyGoalsCard = ({ projectId }: Props) => {
  const monthOptions = useMemo(buildMonthOptions, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthOptions.find((o) => o.hint === "Este mês")?.value ?? monthOptions[0].value,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ visitors: "", leads: "", revenue: "" });
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("goals")
        .select("id, visitors_target, leads_target, revenue_target")
        .eq("project_id", projectId)
        .eq("month", selectedMonth)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Erro ao carregar metas:", error);
      }
      if (data) {
        setExistingId(data.id);
        setForm({
          visitors: String(data.visitors_target ?? 0),
          leads: String(data.leads_target ?? 0),
          revenue: String(data.revenue_target ?? 0),
        });
      } else {
        setExistingId(null);
        setForm({ visitors: "", leads: "", revenue: "" });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, selectedMonth]);

  const handleSave = async () => {
    const visitors = Math.max(0, Math.floor(Number(form.visitors) || 0));
    const leads = Math.max(0, Math.floor(Number(form.leads) || 0));
    const revenue = Math.max(0, Number(form.revenue) || 0);

    if (
      !Number.isFinite(visitors) ||
      !Number.isFinite(leads) ||
      !Number.isFinite(revenue)
    ) {
      toast.error("Valores inválidos");
      return;
    }

    setSaving(true);
    const payload = {
      project_id: projectId,
      month: selectedMonth,
      visitors_target: visitors,
      leads_target: leads,
      revenue_target: revenue,
    };

    const { error } = existingId
      ? await supabase.from("goals").update(payload).eq("id", existingId)
      : await supabase.from("goals").insert(payload);

    setSaving(false);

    if (error) {
      console.error("Erro ao salvar metas:", error);
      toast.error("Não foi possível salvar as metas");
      return;
    }
    toast.success("Metas salvas com sucesso!");
  };

  const selectedOption = monthOptions.find((o) => o.value === selectedMonth);

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Metas mensais
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina objetivos por mês. Eles serão exibidos no card "Progresso das metas" do dashboard quando o mês estiver vigente.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-month" className="flex items-center gap-2 text-xs">
          <Calendar className="h-3.5 w-3.5 text-primary" /> Mês de referência
        </Label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger id="goal-month" className="h-11">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="capitalize">{opt.label}</span>
                <span className="text-muted-foreground ml-2 text-xs">· {opt.hint}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedOption && (
          <p className="text-xs text-muted-foreground">
            Editando metas de <span className="capitalize font-medium text-foreground">{selectedOption.label}</span>
            {existingId ? " (registro existente)" : " (novo registro)"}.
          </p>
        )}
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="goal-visitors" className="flex items-center gap-2 text-xs">
                <Users className="h-3.5 w-3.5 text-primary" /> Visitas
              </Label>
              <Input
                id="goal-visitors"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="ex.: 5000"
                value={form.visitors}
                onChange={(e) => setForm((f) => ({ ...f, visitors: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-leads" className="flex items-center gap-2 text-xs">
                <Zap className="h-3.5 w-3.5 text-primary" /> Leads
              </Label>
              <Input
                id="goal-leads"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="ex.: 100"
                value={form.leads}
                onChange={(e) => setForm((f) => ({ ...f, leads: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-revenue" className="flex items-center gap-2 text-xs">
                <DollarSign className="h-3.5 w-3.5 text-primary" /> Receita (R$)
              </Label>
              <Input
                id="goal-revenue"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="ex.: 10000"
                value={form.revenue}
                onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
                className="h-11"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-11 sm:w-auto">
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {existingId ? "Atualizar metas" : "Salvar metas"}
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default MonthlyGoalsCard;
