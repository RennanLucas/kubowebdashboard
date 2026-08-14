import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />

      <Helmet>
        <title>Página não encontrada — KUBOWEB</title>
        <meta name="description" content="A página que você procura não foi encontrada no KUBOWEB." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/" />
      </Helmet>
      <div className="text-center relative z-10 glass-strong p-16 rounded-3xl max-w-lg mx-auto shadow-2xl animate-fade-up border border-border/50">
        <h1 className="mb-4 text-8xl font-bold text-shimmer tracking-tighter">404</h1>
        <p className="mb-8 text-lg text-muted-foreground font-medium">Ops! Parece que você se perdeu.</p>
        <a href="/" className="inline-flex items-center justify-center h-11 px-8 rounded-md text-sm font-medium transition-all gradient-primary shadow-lg hover:shadow-xl hover:scale-105 text-primary-foreground">
          Voltar para o Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
