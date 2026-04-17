import { useState } from "react";
import { Target, Pencil, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useGoals } from "@/hooks/useGoals";

interface GoalsCardProps {
  projectId?: string;
  visitors: number;
  leads: number;
  estimatedValue: number;
}

const GoalRow = ({
  label,
  current,
  goal,
  format,
}: {
  label: string;
  current: number;
  goal: number;
  format: (n: number) => string;
}) => {
  if (!goal) return null;
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const reached = current >= goal;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={reached ? "text-[hsl(var(--success))] font-medium" : "text-foreground font-medium"}>
          {format(current)} / {format(goal)} ({pct}%)
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
};

export const GoalsCard = ({ projectId, visitors, leads, estimatedValue }: GoalsCardProps) => {
  const { goals, updateGoals } = useGoals(projectId);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(goals);

  const hasGoals = goals.visitors > 0 || goals.leads > 0 || goals.estimatedValue > 0;

  const startEdit = () => {
    setForm(goals);
    setEditing(true);
  };

  const save = () => {
    updateGoals({
      visitors: Math.max(0, Number(form.visitors) || 0),
      leads: Math.max(0, Number(form.leads) || 0),
      estimatedValue: Math.max(0, Number(form.estimatedValue) || 0),
    });
    setEditing(false);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-card-foreground">Metas do período</h3>
          <InfoTooltip content="Defina metas de visitantes, leads e valor estimado. As barras mostram o progresso em tempo real comparado ao período selecionado." />
        </div>
        {!editing ? (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={startEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            {hasGoals ? "Editar" : "Definir metas"}
          </Button>
        ) : (
          <Button variant="default" size="sm" className="h-7 px-2 text-xs" onClick={save}>
            <Check className="h-3 w-3 mr-1" />
            Salvar
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Meta de visitantes</Label>
            <Input
              type="number"
              min={0}
              value={form.visitors || ""}
              onChange={(e) => setForm({ ...form, visitors: Number(e.target.value) })}
              className="h-8 text-sm mt-1"
              placeholder="Ex: 10000"
            />
          </div>
          <div>
            <Label className="text-xs">Meta de leads</Label>
            <Input
              type="number"
              min={0}
              value={form.leads || ""}
              onChange={(e) => setForm({ ...form, leads: Number(e.target.value) })}
              className="h-8 text-sm mt-1"
              placeholder="Ex: 100"
            />
          </div>
          <div>
            <Label className="text-xs">Meta de valor estimado (R$)</Label>
            <Input
              type="number"
              min={0}
              value={form.estimatedValue || ""}
              onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })}
              className="h-8 text-sm mt-1"
              placeholder="Ex: 5000"
            />
          </div>
        </div>
      ) : !hasGoals ? (
        <p className="text-xs text-muted-foreground py-3">
          Nenhuma meta definida. Clique em "Definir metas" para acompanhar seu progresso.
        </p>
      ) : (
        <div className="space-y-3">
          <GoalRow label="Visitantes" current={visitors} goal={goals.visitors} format={(n) => n.toLocaleString("pt-BR")} />
          <GoalRow label="Leads" current={leads} goal={goals.leads} format={(n) => n.toLocaleString("pt-BR")} />
          <GoalRow
            label="Valor estimado"
            current={estimatedValue}
            goal={goals.estimatedValue}
            format={(n) => `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
          />
        </div>
      )}
    </Card>
  );
};
