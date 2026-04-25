import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ANNOTATION_CATEGORIES,
  type AnnotationCategory,
} from "@/lib/annotation-categories";
import type { Annotation } from "@/hooks/useAnnotations";

interface Props {
  annotation: Annotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    input: { date: string; label: string; category: AnnotationCategory; notes?: string },
  ) => Promise<void> | void;
}

export const AnnotationEditDialog = ({ annotation, open, onOpenChange, onSave }: Props) => {
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<AnnotationCategory>("event");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (annotation) {
      setDate(annotation.date);
      setLabel(annotation.label);
      setCategory(annotation.category);
      setNotes(annotation.notes ?? "");
    }
  }, [annotation]);

  const handleSave = async () => {
    if (!annotation || !label.trim() || !date) return;
    setSaving(true);
    await onSave(annotation.id, { date, label, category, notes });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar anotação</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ann-date" className="text-xs">Data</Label>
            <Input
              id="ann-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-label" className="text-xs">Rótulo</Label>
            <Input
              id="ann-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={80}
              placeholder="Ex: Lançamento campanha de verão"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AnnotationCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANNOTATION_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    <span className="inline-flex items-center gap-2">
                      <span>{c.emoji}</span>
                      <span>{c.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-notes" className="text-xs">Notas (opcional)</Label>
            <Textarea
              id="ann-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Detalhes adicionais sobre o evento"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !label.trim() || !date}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
