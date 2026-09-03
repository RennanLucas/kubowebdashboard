import { useState, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Rocket, BarChart3, Target, Sparkles, Settings, CreditCard, HelpCircle, ArrowLeft, Headphones, PlayCircle, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HELP_CATEGORIES } from "@/lib/help-content";
import { filterHelpCategories } from "@/lib/help-search";
import { QuickStartGuide } from "@/components/help/QuickStartGuide";
import { startProductTour } from "@/lib/product-tour";
import { useAuth } from "@/contexts/AuthContext";

// Map string icons to Lucide components
const ICONS: Record<string, LucideIcon> = {
  Rocket, BarChart3, Target, Sparkles, Settings, CreditCard, HelpCircle
};

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const filteredCategories = useMemo(() => {
    return filterHelpCategories(HELP_CATEGORIES, query);
  }, [query]);

  const hasResults = filteredCategories.length > 0;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="hidden md:flex -ml-3 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <HelpCircle className="h-8 w-8 text-primary" />
              Central de Ajuda
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Estamos aqui para ajudar você. Encontre respostas, guias e informações para aproveitar melhor o Kubo Analytics.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             <Button variant="outline" onClick={() => {
               navigate("/dashboard");
               setTimeout(() => startProductTour({ userId: user?.id, navigate }), 400);
             }}><PlayCircle className="mr-2 h-4 w-4" />Refazer tour</Button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="max-w-2xl mb-16">
          <label htmlFor="help-search" className="text-sm font-medium text-foreground mb-2 block">
            Como podemos ajudar?
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              id="help-search"
              type="text"
              placeholder="Pesquise por instalação, métricas, projetos, assinatura..."
              className="flex h-12 w-full rounded-xl border border-input bg-background px-11 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca" className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>}
          </div>
        </div>

        <QuickStartGuide query={query} />

        {/* CONTENT */}
        {!hasResults ? (
          <div className="text-center py-24 bg-muted/30 rounded-2xl border border-border">
            <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Não encontramos nenhum artigo</h3>
            <p className="text-muted-foreground mb-5">Tente buscar usando termos diferentes.</p>
            <Button variant="outline" onClick={() => setQuery("")}>Limpar busca</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map(category => {
              const IconComp = ICONS[category.icon] || HelpCircle;
              return (
                <div key={category.id} className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <IconComp className="h-5 w-5" />
                    </div>
                    <h2 className="font-semibold text-lg">{category.title}</h2>
                  </div>
                  <ul className="space-y-3">
                    {category.articles.map(article => (
                      <li key={article.id}>
                        <Link 
                          to={`/help/${article.id}`}
                          className="group flex flex-col gap-0.5"
                        >
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {article.title}
                          </span>
                          <span className="text-xs text-muted-foreground leading-relaxed">{article.description}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* SUPPORT / CONTACT */}
        <div className="mt-16 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 md:p-10 text-center flex flex-col items-center">
          <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center border border-border shadow-sm mb-4">
            <Headphones className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Ainda precisa de ajuda?</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Nossa equipe pode ajudar com dúvidas sobre instalação, métricas e configuração.
          </p>
          <Button asChild className="px-8 shadow-sm h-11 text-base"><a href="mailto:contato.kuboweb@gmail.com?subject=Ajuda%20com%20o%20KUBOWEB">Falar com suporte</a></Button>
          <p className="mt-3 text-xs text-muted-foreground">contato.kuboweb@gmail.com</p>
        </div>
      </div>
    </AppLayout>
  );
}
