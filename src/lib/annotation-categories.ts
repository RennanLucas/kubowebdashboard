export type AnnotationCategory = "campaign" | "launch" | "event" | "other";

export interface CategoryMeta {
  key: AnnotationCategory;
  label: string;
  color: string; // HSL var or chart color token
  emoji: string;
}

export const ANNOTATION_CATEGORIES: CategoryMeta[] = [
  { key: "campaign", label: "Campanha", color: "hsl(var(--chart-orange))", emoji: "📣" },
  { key: "launch", label: "Lançamento", color: "hsl(var(--chart-purple))", emoji: "🚀" },
  { key: "event", label: "Evento", color: "hsl(var(--chart-blue))", emoji: "📅" },
  { key: "other", label: "Outro", color: "hsl(var(--muted-foreground))", emoji: "📌" },
];

export const getCategoryMeta = (key: AnnotationCategory): CategoryMeta =>
  ANNOTATION_CATEGORIES.find((c) => c.key === key) ?? ANNOTATION_CATEGORIES[3];
