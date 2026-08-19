import { useState } from "react";
import { Copy, Check, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackingSnippetProps {
  projectId: string;
}

const TrackingSnippet = ({ projectId }: TrackingSnippetProps) => {
  const [copied, setCopied] = useState(false);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const scriptUrl = `${supabaseUrl}/functions/v1/tracker-script?pid=${projectId}`;
  const snippet = `<script src="${scriptUrl}" defer></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Código de Rastreamento</h3>
        </div>
        <Button
          type="button"
          variant={copied ? "default" : "secondary"}
          size="sm"
          className={`gap-2 h-8 transition-all ${copied ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
          onClick={handleCopy}
          aria-label="Copiar código de rastreamento"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copiar código
            </>
          )}
        </Button>
      </div>
      <div className="relative group">
        <code className="block text-xs sm:text-sm bg-background p-4 rounded-md border border-border select-all break-all font-mono text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-thin">
          {snippet}
        </code>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
        <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Leve (~1KB)</span>
        <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Sem uso de cookies</span>
        <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Privacidade garantida</span>
      </div>
    </div>
  );
};

export default TrackingSnippet;
