import { ReactNode } from "react";

interface HighlightProps {
  text: string;
  query?: string;
}

/**
 * Wraps occurrences of `query` inside `text` with a <mark> element styled
 * via design tokens. Case-insensitive. Returns plain text when query is empty.
 */
export function Highlight({ text, query }: HighlightProps): ReactNode {
  const q = (query ?? "").trim();
  if (!q) return text;

  try {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) && part.toLowerCase() === q.toLowerCase() ? (
            <mark
              key={i}
              className="bg-primary/20 text-foreground rounded px-0.5"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  } catch {
    return text;
  }
}
