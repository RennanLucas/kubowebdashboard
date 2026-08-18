import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { forwardRef } from "react";

interface InsightsMarkdownProps {
  analysis: string;
  readingMode: boolean;
}

export const InsightsMarkdown = forwardRef<HTMLElement, InsightsMarkdownProps>(
  ({ analysis, readingMode }, ref) => {
    return (
      <article
        ref={ref}
        className={`text-foreground bg-card transition-all duration-200 ${
          readingMode
            ? "leading-loose space-y-6 [&_h1]:text-[1.7rem] [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-base [&_p]:leading-loose [&_p]:my-3 [&_ul]:space-y-3 [&_ul]:my-4 [&_ul>li]:text-base [&_ul>li]:leading-relaxed [&_ol]:space-y-3 [&_ol>li]:text-base [&_ol>li]:leading-relaxed [&_table]:text-sm"
            : "leading-relaxed space-y-4 [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:mt-6 sm:[&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-sm [&_p]:leading-relaxed [&_ul]:space-y-2 [&_ul]:my-3 [&_ul>li]:text-sm [&_ol]:space-y-2 [&_ol]:my-3 [&_ol>li]:text-sm [&_table]:text-xs sm:[&_table]:text-sm"
        } [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mb-2 [&_h1]:mt-0 [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-border [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-foreground/90 [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:pl-0 [&_ul]:list-none [&_ul>li]:text-foreground/90 [&_ul>li]:pl-5 [&_ul>li]:relative [&_ul>li]:before:content-[''] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.55rem] [&_ul>li]:before:w-2 [&_ul>li]:before:h-2 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-primary/70 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol>li]:text-foreground/90 [&_ol>li]:pl-1 [&_code]:bg-muted [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_table]:w-full [&_table]:my-4 [&_table]:border [&_table]:border-border [&_table]:rounded-lg [&_table]:block [&_table]:overflow-x-auto sm:[&_table]:table [&_thead]:bg-muted/50 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2 [&_td]:border-t [&_td]:border-border [&_td]:text-foreground/90 [&_td]:whitespace-nowrap [&_tr:hover]:bg-muted/30 [&_hr]:my-6 [&_hr]:border-border [&_em]:text-muted-foreground [&_em]:text-xs [&_em]:not-italic [&_em]:block`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
      </article>
    );
  }
);
InsightsMarkdown.displayName = "InsightsMarkdown";
