import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
  ariaLabel?: string;
}

/**
 * Reusable code block with copy-to-clipboard. No route or auth dependencies.
 */
export function CodeBlock({ code, language = "html", ariaLabel = "Código" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors silently
    }
  };

  return (
    <div className="relative">
      <pre
        className="text-xs bg-background border border-border rounded-md px-3 py-2 pr-10 overflow-x-auto font-mono text-foreground whitespace-pre-wrap break-all"
        aria-label={ariaLabel}
        data-language={language}
      >
        <code>{code}</code>
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute top-1 right-1 h-7 w-7 p-0"
        onClick={handleCopy}
        aria-label={copied ? "Copiado" : "Copiar código"}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
