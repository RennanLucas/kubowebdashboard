import { useEffect, useMemo, useState } from "react";
import { Target, Save, Users, Zap, DollarSign, Calendar, AlertCircle, History, Pencil } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [baseline, setBaseline] = useState({ visitors: "", leads: "", revenue: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [existingId, setExistingId] = useState<string | null>(null);
  const [pendingMonth, setPendingMonth] = useState<string | null>(null);
  const [recentGoals, setRecentGoals] = useState<Array<{
    id: string;
    month: string;
    visitors_target: number;
    leads_target: number;
    revenue_target: number;
  }>>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const loadRecentGoals = async () => {
    setRecentLoading(true);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const cutoff = toMonthDate(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth());
    const { data, error } = await supabase
      .from("goals")
      .select("id, month, visitors_target, leads_target, revenue_target")
      .eq("project_id", projectId)
      .gte("month", cutoff)
      .order("month", { ascending: false })
      .limit(6);
    if (error) {
      console.error("Erro ao listar metas recentes:", error);
      setRecentGoals([]);
    } else {
      setRecentGoals(data ?? []);
    }
    setRecentLoading(false);
  };

  useEffect(() => {
    loadRecentGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const setField = (key: FieldKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

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
        const loaded = {
          visitors: String(data.visitors_target ?? 0),
          leads: String(data.leads_target ?? 0),
          revenue: String(data.revenue_target ?? 0),
        };
        setForm(loaded);
        setBaseline(loaded);
      } else {
        setExistingId(null);
        const empty = { visitors: "", leads: "", revenue: "" };
        setForm(empty);
        setBaseline(empty);
      }
      setErrors({});
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, selectedMonth]);

  const handleSave = async () => {
    const result = goalsSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as FieldKey | undefined;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Corrija os campos destacados antes de salvar");
      return;
    }

    setErrors({});
    const visitors = Math.floor(Number(result.data.visitors));
    const leads = Math.floor(Number(result.data.leads));
    const revenue = Number(result.data.revenue.replace(",", "."));

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
    setBaseline({
      visitors: String(visitors),
      leads: String(leads),
      revenue: String(revenue),
    });
    loadRecentGoals();
  };

  const isDirty =
    form.visitors !== baseline.visitors ||
    form.leads !== baseline.leads ||
    form.revenue !== baseline.revenue;

  const requestMonthChange = (newMonth: string) => {
    if (newMonth === selectedMonth) return;
    if (isDirty && !loading) {
      setPendingMonth(newMonth);
      return;
    }
    setSelectedMonth(newMonth);
  };

  const confirmDiscard = () => {
    if (pendingMonth) setSelectedMonth(pendingMonth);
    setPendingMonth(null);
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
        <Select value={selectedMonth} onValueChange={requestMonthChange}>
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
                onChange={(e) => setField("visitors", e.target.value)}
                aria-invalid={!!errors.visitors}
                aria-describedby={errors.visitors ? "goal-visitors-error" : undefined}
                className={cn("h-11", errors.visitors && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.visitors && (
                <p id="goal-visitors-error" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.visitors}
                </p>
              )}
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
                onChange={(e) => setField("leads", e.target.value)}
                aria-invalid={!!errors.leads}
                aria-describedby={errors.leads ? "goal-leads-error" : undefined}
                className={cn("h-11", errors.leads && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.leads && (
                <p id="goal-leads-error" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.leads}
                </p>
              )}
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
                onChange={(e) => setField("revenue", e.target.value)}
                aria-invalid={!!errors.revenue}
                aria-describedby={errors.revenue ? "goal-revenue-error" : undefined}
                className={cn("h-11", errors.revenue && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.revenue && (
                <p id="goal-revenue-error" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.revenue}
                </p>
              )}
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

      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Metas dos últimos 6 meses
          </h3>
          {!recentLoading && recentGoals.length > 0 && (
            <span className="text-xs text-muted-foreground">{recentGoals.length} registro(s)</span>
          )}
        </div>

        {recentLoading ? (
          <div className="h-20 animate-pulse rounded-lg bg-muted/40" />
        ) : recentGoals.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma meta salva nos últimos 6 meses. Defina uma acima para começar.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentGoals.map((g) => {
              const [y, m] = g.month.split("-").map(Number);
              const label = formatMonthLabel(y, m - 1);
              const isSelected = g.month === selectedMonth;
              return (
                <li
                  key={g.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm transition-colors",
                    isSelected && "border-primary/50 bg-primary/5",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground capitalize truncate">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {g.visitors_target.toLocaleString("pt-BR")} visitas ·{" "}
                      {g.leads_target.toLocaleString("pt-BR")} leads ·{" "}
                      {g.revenue_target.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => requestMonthChange(g.month)}
                    className="shrink-0"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {isSelected ? "Editando" : "Editar"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MonthlyGoalsCard;
