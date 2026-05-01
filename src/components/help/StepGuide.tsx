import { ReactNode } from "react";
import { Highlight } from "./Highlight";

export interface StepItem {
  title: string;
  description?: ReactNode;
  content?: ReactNode;
  /** Lowercase tags used by Help search/filter. */
  keywords?: string[];
  /** Plain-text version of description used for search matching. */
  searchText?: string;
}

interface StepGuideProps {
  steps: StepItem[];
  /** Free-text query to visually highlight inside step titles. */
  highlightQuery?: string;
}

/**
 * Numbered vertical step guide. Pure presentational — no routing or auth.
 * Reusable wherever an inline how-to is needed.
 */
export function StepGuide({ steps, highlightQuery }: StepGuideProps) {
  return (
    <ol className="space-y-4">
      {steps.map((step, idx) => (
        <li key={idx} className="flex gap-3">
          <div className="shrink-0">
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
              {idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className="w-px h-full bg-border mx-auto mt-1" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <h3 className="text-sm font-medium text-foreground">
              <Highlight text={step.title} query={highlightQuery} />
            </h3>
            {step.description && (
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {step.description}
              </div>
            )}
            {step.content && <div className="mt-3">{step.content}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
