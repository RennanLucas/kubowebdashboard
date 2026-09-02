import { useState } from "react";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface QuickFeedbackProps {
  feature: string;
}

export function QuickFeedback({ feature }: QuickFeedbackProps) {
  const [status, setStatus] = useState<"idle" | "asking_more" | "submitted">("idle");
  const [loading, setLoading] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [text, setText] = useState("");
  
  const { activeOrganization } = useOrganization();
  const { user } = useAuth();

  const handleVote = async (isPositive: boolean) => {
    if (!user || !activeOrganization) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.from("feedback").insert({
        organization_id: activeOrganization.id,
        user_id: user.id,
        type: "quick_feedback",
        category: feature,
        title: `Feedback rápido: ${feature}`,
        description: isPositive ? "Positivo (👍)" : "Negativo (👎)",
        status: "archived", // Auto-archive quick feedbacks unless they add text
        origin: window.location.pathname
      }).select("id").single();

      if (error) throw error;

      setFeedbackId(data.id);
      
      if (!isPositive) {
        setStatus("asking_more");
      } else {
        setStatus("submitted");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch (err: any) {
      toast.error("Erro ao registrar feedback", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!feedbackId || !text.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("feedback")
        .update({
          description: `Negativo (👎) - ${text}`,
          status: "received" // Un-archive so it goes to admin triage
        })
        .eq("id", feedbackId);

      if (error) throw error;
      
      setStatus("submitted");
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err: any) {
      toast.error("Erro ao registrar feedback", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (status === "submitted") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 py-2 px-4 rounded-full w-fit">
        <span className="text-green-500">✓</span> Obrigado pelo seu feedback!
      </div>
    );
  }

  if (status === "asking_more") {
    return (
      <div className="bg-card border rounded-xl p-4 shadow-sm max-w-md animate-in fade-in slide-in-from-bottom-2">
        <p className="text-sm font-medium mb-3">O que podemos melhorar?</p>
        <Textarea 
          placeholder="Conte rapidamente o que deu errado..."
          className="text-sm min-h-[80px] mb-3"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStatus("submitted")}>Pular</Button>
          <Button size="sm" onClick={handleTextSubmit} disabled={loading || !text.trim()}>
            <Send className="h-3 w-3 mr-1.5" /> Enviar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground bg-card border rounded-full py-1.5 px-4 w-fit shadow-sm">
      <span>Esta área foi útil?</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-green-100 hover:text-green-600" onClick={() => handleVote(true)} disabled={loading}>
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-red-100 hover:text-red-600" onClick={() => handleVote(false)} disabled={loading}>
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
