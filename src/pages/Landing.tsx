import { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import logoKubowebWhite from "@/assets/logo-kuboweb-white.png";
import { FEATURES } from "@/lib/feature-flags";

// Component Imports
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { DashboardShowcase } from "@/components/landing/DashboardShowcase";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { KuboAI } from "@/components/landing/KuboAI";
import { WhiteLabel } from "@/components/landing/WhiteLabel";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Integrations } from "@/components/landing/Integrations";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

// Lazy load 3D component for better performance
const KuboCore3D = lazy(() => import("@/components/landing/KuboCore3D").then(m => ({ default: m.KuboCore3D })));

/* ─────────────────────────────────────────────────────────────
   Premium CSS & Animations (Injected dynamically)
   ───────────────────────────────────────────────────────────── */
const PremiumStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .bg-grid-white {
      background-size: 40px 40px;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
      -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
    }
    
    .linear-text-gradient {
      background: linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.5) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }

    .primary-text-gradient {
      background: linear-gradient(90deg, hsl(var(--primary)) 0%, #B28DFF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }

    .glass-panel {
      background: rgba(10, 10, 10, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
    }

    .premium-hover {
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .premium-hover:hover {
      transform: translateY(-5px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 10px 40px -10px rgba(108, 60, 225, 0.3);
      background: rgba(255, 255, 255, 0.03);
    }

    .reveal-scroll {
      opacity: 0;
      transform: translateY(40px);
      transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reveal-scroll.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
  `}} />
);

/* ─────────────────────────────────────────────────────────────
   Intersection Observer Hook 
   ───────────────────────────────────────────────────────────── */
const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -20px 0px" });

    const observeElements = () => {
      document.querySelectorAll('.reveal-scroll:not(.is-observed)').forEach((el) => {
        el.classList.add('is-observed');
        observer.observe(el);
      });
    };

    observeElements();

    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
};

/* ─────────────────────────────────────────────────────────────
   Navbar
   ───────────────────────────────────────────────────────────── */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
      scrolled ? "glass-panel py-3" : "bg-transparent py-6"
    }`}>
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center z-50">
          <img src={logoKubowebWhite} alt="Kubo Web" className="h-6 sm:h-7 w-auto hover:opacity-80 transition-opacity" />
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {["Visão Geral", "Plataforma", "Inteligência", "Integrações", "Preços"].map((label, i) => {
            const anchors = ["hero", "features", "kuboai", "integrations", "pricing"];
            return (
              <a key={label} href={`#${anchors[i]}`} className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                {label}
              </a>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:flex text-sm font-medium text-white/60 hover:text-white hover:bg-white/5">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="h-10 px-6 rounded-full font-bold bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Link to="/login">Começar gratuitamente</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main Landing Component
   ───────────────────────────────────────────────────────────── */
const Landing = () => {
  useScrollReveal();

  return (
    <>
      <Helmet>
        <title>Kubo Web | Analytics Premium Enterprise</title>
        <meta name="description" content="O hub central para agências e clientes. Toda a sua operação de performance em um único lugar. Conecte Google Ads, Meta Ads, CRM e dados de receita em uma plataforma inteligente." />
        <link rel="canonical" href="https://kubowebdashboard.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kubowebdashboard.vercel.app/" />
        <meta property="og:title" content="Kubo Web | Analytics Premium Enterprise" />
        <meta property="og:description" content="O hub central para agências e clientes. Toda a sua operação de performance em um único lugar." />
        <meta property="og:image" content="https://kubowebdashboard.vercel.app/og-image.png" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kubo Web | Analytics Premium Enterprise" />
        <meta name="twitter:description" content="O hub central para agências e clientes. Toda a sua operação de performance em um único lugar." />
        <meta name="twitter:image" content="https://kubowebdashboard.vercel.app/og-image.png" />
      </Helmet>
      
      <PremiumStyles />

      <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-primary/40 selection:text-white">
        <Navbar />
        
        <main>
          {FEATURES.ENABLE_3D_LANDING ? (
            <Suspense fallback={<HeroSection />}>
              <KuboCore3D />
            </Suspense>
          ) : (
            <HeroSection />
          )}
          <TrustBar />
          <ProblemSolution />
          <FeaturesGrid />
          <DashboardShowcase />
          <ComparisonSection />
          <div id="kuboai"><KuboAI /></div>
          <WhiteLabel />
          <BeforeAfter />
          <HowItWorks />
          <Integrations />
          <div id="pricing"><Pricing /></div>
          <FAQ />
          <CTA />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Landing;
