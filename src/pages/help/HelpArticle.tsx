import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { HELP_CATEGORIES, HELP_ARTICLES_FLAT } from "@/lib/help-content";
import { ARTICLE_COMPONENTS } from "./articles";

export function HelpArticle() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  const article = HELP_ARTICLES_FLAT.find(a => a.id === articleId);
  const category = article ? HELP_CATEGORIES.find(c => c.id === article.categoryId) : null;

  if (!article || !category) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <HelpCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Conteúdo não encontrado</h1>
          <p className="text-muted-foreground mb-8">
            O artigo que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate("/help")}>
            Voltar para Central de Ajuda
          </Button>
        </div>
      </AppLayout>
    );
  }

  const Content = ARTICLE_COMPONENTS[article.id] || ARTICLE_COMPONENTS["default"];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* BREADCRUMB & BACK */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/help")} className="w-fit -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <nav className="flex text-sm text-muted-foreground items-center gap-2">
            <Link to="/help" className="hover:text-foreground hover:underline transition-colors">
              Central de Ajuda
            </Link>
            <span className="text-muted-foreground/40">{'>'}</span>
            <span className="text-foreground font-medium">{category.title.replace(/[^A-Za-zÀ-ÿ\s]/g, '').trim()}</span>
          </nav>
        </div>

        {/* ARTICLE HEADER */}
        <div className="mb-10 pb-10 border-b border-border">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4 leading-tight">
            {article.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {article.description}
          </p>
        </div>

        {/* ARTICLE CONTENT */}
        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:underline">
          <Content />
        </div>
      </div>
    </AppLayout>
  );
}
