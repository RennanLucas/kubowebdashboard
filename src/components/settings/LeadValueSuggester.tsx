import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const LeadValueSuggester = ({ onApply }: { onApply: (value: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [ticket, setTicket] = useState("");
  const [closeRate, setCloseRate] = useState("");

  const ticketNum = parseFloat(ticket.replace(",", "."));
  const rateNum = parseFloat(closeRate.replace(",", "."));
  const valid = !isNaN(ticketNum) && ticketNum > 0 && !isNaN(rateNum) && rateNum > 0 && rateNum <= 100;
  const suggested = valid ? (ticketNum * (rateNum / 100)) : 0;

  const handleApply = () => {
    if (!valid) return;
    onApply(suggested.toFixed(2));
    toast.success(`Valor sugerido aplicado: R$ ${suggested.toFixed(2)}`);
    setOpen(false);
    setTicket("");
    setCloseRate("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Sugerir valor
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-80 p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Calculator className="h-4 w-4 text-primary" /> Calcular valor recomendado
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Informe seu ticket médio e a taxa de fechamento para descobrir quanto vale, em média, cada lead.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="suggest-ticket" className="text-xs">Ticket médio (R$)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
            <Input
              id="suggest-ticket"
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="suggest-rate" className="text-xs">Taxa de fechamento (%)</Label>
          <div className="relative">
            <Input
              id="suggest-rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="5"
              value={closeRate}
              onChange={(e) => setCloseRate(e.target.value)}
              className="h-9 pr-8 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Ex.: fecha 1 a cada 20 leads = 5%
          </p>
        </div>
        <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Valor recomendado por lead:</p>
          <p className="text-lg font-semibold text-foreground">
            {valid ? `R$ ${suggested.toFixed(2)}` : "—"}
          </p>
          {valid && (
            <p className="text-[11px] text-muted-foreground">
              {ticketNum.toFixed(2)} × {rateNum}% = {suggested.toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" size="sm" className="flex-1" disabled={!valid} onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
