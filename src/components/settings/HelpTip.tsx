import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

export const HelpTip = ({ text }: { text: string }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label="Ajuda"
        className="inline-flex text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent side="top" className="max-w-xs text-xs leading-relaxed p-3">
      {text}
    </PopoverContent>
  </Popover>
);
