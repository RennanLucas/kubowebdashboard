import { useEffect, useState } from "react";
import { Target, Save, Users, Zap, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

const currentMonthDate = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const monthLabel = () => {
  const d = new Date();
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

const MonthlyGoalsCard = ({ projectId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ visitors: "", leads: "", revenue: "" });
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const month = currentMonthDate();
      const { data, error } = await supabase
        .from("goals")
        .select("id, visitors_target, leads_target, revenue_target")
        .eq("project_id", projectId)
        .eq("month", month)
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
  }, [projectId]);

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
    const month = currentMonthDate();
    const payload = {
      project_id: projectId,
      month,
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

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Metas mensais
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina os objetivos para <span className="font-medium capitalize text-foreground">{monthLabel()}</span>. Eles serão exibidos no card "Progresso das metas" do dashboard.
        </p>
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
                <Save className="mr-2 h-4 w-4" /> Salvar metas do mês
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default MonthlyGoalsCard;
