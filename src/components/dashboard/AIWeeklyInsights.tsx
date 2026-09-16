import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureLock } from "@/components/FeatureLock";

// Generation is centralized in Insights: never launch a paid request on mount.
export const AIWeeklyInsights = () => (
  <FeatureLock feature="ai_insights">
    <Card className="space-y-3 p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" />Insights com IA</h2>
      <p className="text-sm text-muted-foreground">Gere uma análise do seu projeto na página de Insights e acompanhe a quota mensal da organização.</p>
      <Button asChild variant="outline" className="gap-2"><Link to="/insights">Abrir Insights<ArrowRight className="h-4 w-4" /></Link></Button>
    </Card>
  </FeatureLock>
);
