import { forwardRef, useId, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

interface TriggerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  open: boolean;
  contentId: string;
  triggerClassName?: string;
}

const TriggerButton = forwardRef<HTMLButtonElement, TriggerButtonProps>(
  ({ open, contentId, triggerClassName, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="Abrir ajuda contextual"
      aria-describedby={open ? contentId : undefined}
      aria-expanded={open}
      aria-haspopup="dialog"
      className={cn(
        "inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors h-5 w-5 touch-manipulation",
        triggerClassName,
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </button>
  ),
);
TriggerButton.displayName = "InfoTooltipTrigger";

export const InfoTooltip = ({ content, className, side = "top" }: InfoTooltipProps) => {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TriggerButton open={open} contentId={contentId} triggerClassName={className} />
      </PopoverTrigger>
      <PopoverContent
        id={contentId}
        side={side}
        className="w-auto max-w-xs text-xs leading-relaxed p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
};
