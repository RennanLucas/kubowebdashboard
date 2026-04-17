import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export const InfoTooltip = ({ content, className, side = "top" }: InfoTooltipProps) => {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Ajuda"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors h-4 w-4",
              className,
            )}
            onClick={(e) => e.preventDefault()}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs leading-relaxed">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
