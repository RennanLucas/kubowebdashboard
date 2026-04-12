import { useState } from "react";
import { Copy, Check, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackingSnippetProps {
  projectId: string;
}

const TrackingSnippet = ({ projectId }: TrackingSnippetProps) => {
  const [copied, setCopied] = useState(false);
  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const scriptUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/tracker-script?pid=${projectId}`;
  const snippet = `<script src="${scriptUrl}" defer></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Código de Rastreamento</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Cole este código antes do <code className="bg-background px-1 rounded">&lt;/head&gt;</code> do seu site para começar a rastrear visitantes:
      </p>
      <div className="relative">
        <code className="block text-xs bg-background px-3 py-2 rounded border border-border select-all break-all font-mono">
          {snippet}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-7 w-7 p-0"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        ✅ Leve (~1KB) • Sem cookies • Respeita a privacidade • Dados aparecem em minutos
      </p>
    </div>
  );
};

export default TrackingSnippet;
