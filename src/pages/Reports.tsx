import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload, BarChart3, Users, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";

const Reports = () => {
  const { data: clientData, isLoading: loading } = useDashboardAnalytics(30);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        toast.success("Logo atualizada com sucesso para o relatório.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
      <AppLayout>
        <Helmet>
          <title>Relatórios White-label — KUBOWEB</title>
        </Helmet>
        <div className="p-4 sm:p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="page-title flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Relatórios Profissionais
              </h1>
              <p className="page-subtitle">Gere relatórios de desempenho personalizados com a sua marca.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 print:hidden">
                <label className="cursor-pointer flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Sua Logo
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </Button>
              <Button onClick={handlePrint} className="gap-2 print:hidden shadow-md">
                <Printer className="h-4 w-4" />
                Imprimir / PDF
              </Button>
            </div>
          </div>

          <div className="bg-white text-black p-8 rounded-xl border shadow-sm min-h-[600px] print:m-0 print:border-none print:shadow-none" id="report-preview">
            {/* Report Header */}
            <div className="flex justify-between items-center border-b pb-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Relatório de Desempenho</h2>
                <p className="text-gray-500 mt-1">Período: Últimos 30 dias</p>
                {clientData?.client && (
                  <p className="text-gray-600 font-medium mt-2">Cliente: {clientData.client.company_name}</p>
                )}
              </div>
              <div className="h-16 w-48 flex items-center justify-end">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo do Cliente" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="h-full w-full border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-sm">
                    Sua Logo Aqui
                  </div>
                )}
              </div>
            </div>

            {/* Report Content Mockup */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="p-5 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-sm">Total de Visitantes</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">12.450</div>
                <div className="text-green-600 text-sm font-medium mt-1">+15.2% vs mês anterior</div>
              </div>
              <div className="p-5 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium text-sm">Leads Gerados</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">423</div>
                <div className="text-green-600 text-sm font-medium mt-1">+8.4% vs mês anterior</div>
              </div>
              <div className="p-5 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-sm">Taxa de Conversão</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">3.4%</div>
                <div className="text-gray-500 text-sm font-medium mt-1">Estável vs mês anterior</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Origem do Tráfego</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 font-semibold text-gray-700 border-b">Canal</th>
                    <th className="p-3 font-semibold text-gray-700 border-b text-right">Visitantes</th>
                    <th className="p-3 font-semibold text-gray-700 border-b text-right">Conversões</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { channel: "Google (Busca Orgânica)", visits: "5.230", conv: "142" },
                    { channel: "Google Ads", visits: "3.100", conv: "185" },
                    { channel: "Acesso Direto", visits: "2.400", conv: "45" },
                    { channel: "Instagram / Social", visits: "1.720", conv: "51" }
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-gray-800">{row.channel}</td>
                      <td className="p-3 text-right text-gray-600 font-medium">{row.visits}</td>
                      <td className="p-3 text-right text-gray-900 font-semibold">{row.conv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-16 pt-8 border-t text-center text-sm text-gray-400">
              Gerado automaticamente. Dados sujeitos a pequenas variações devido a modelos de atribuição.
            </div>
          </div>
        </div>
      </AppLayout>
  );
};

export default Reports;
