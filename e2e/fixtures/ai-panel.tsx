// Test-only isolated UI harness. No live credentials, users or provider calls.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AIInsightsPanel } from "../../src/components/insights/AIInsightsPanel";
import "../../src/index.css";
export function Fixture() {
  const [report,setReport] = useState("");
  return <main style={{ maxWidth:896,margin:"0 auto",padding:"32px 16px" }}>
    <AIInsightsPanel projectId="00000000-0000-4000-8000-000000000005" periodDays={7} onGenerated={insight => setReport(insight.content)} />
    {report && <section aria-label="Resultado da IA"><h2>Relatório salvo</h2><p>{report}</p></section>}
  </main>;
}
const client = new QueryClient({ defaultOptions:{ queries:{ retry:false } } });
createRoot(document.getElementById("root")!).render(<QueryClientProvider client={client}><Fixture /></QueryClientProvider>);
