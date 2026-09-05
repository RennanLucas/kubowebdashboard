import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/premium/LandingHero";
import { ProfessionalHero } from "@/components/landing/ProfessionalHero";
import {
  CapabilitiesSection, FinalCTA, InsightsSection, LandingFAQ, PremiumFooter,
  PremiumPricing, ProductStory, RealtimeSection, SetupSection, SignalRail,
} from "@/components/landing/premium/LandingExperience";
import { useLandingReveal } from "@/components/landing/premium/useLandingReveal";
import "@/components/landing/premium/landing-premium.css";
import "@/components/landing/premium/landing-refinement.css";
import "@/components/landing/premium/landing-spatial.css";
import { useSpatialExperience } from '@/components/landing/premium/useSpatialExperience';

/* ─────────────────────────────────────────────────────────────
   Main Landing Component
   ───────────────────────────────────────────────────────────── */
const Landing = () => {
  useLandingReveal();
  useSpatialExperience();
  return (
    <>
      <Helmet>
        <title>Kubo Analytics | Entenda seu site. Decida melhor.</title>
        <meta name="description" content="Analytics próprio para acompanhar visitantes, páginas, fontes, conversões, alertas e insights do seu site em uma leitura clara." />
        <link rel="canonical" href="https://kubowebdashboard.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kubowebdashboard.vercel.app/" />
        <meta property="og:title" content="Kubo Analytics | Entenda seu site. Decida melhor." />
        <meta property="og:description" content="Visitantes, páginas, fontes, conversões, alertas e insights em uma leitura clara." />
        <meta property="og:image" content="https://kubowebdashboard.vercel.app/og-image.png" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kubo Analytics | Entenda seu site. Decida melhor." />
        <meta name="twitter:description" content="Visitantes, páginas, fontes, conversões, alertas e insights em uma leitura clara." />
        <meta name="twitter:image" content="https://kubowebdashboard.vercel.app/og-image.png" />
      </Helmet>
      
      <div className="lp-root selection:bg-blue-500/30 selection:text-white">
        <LandingNav />
        
        <main>
          <ProfessionalHero />
          <SignalRail />
          <ProductStory />
          <RealtimeSection />
          <InsightsSection />
          <CapabilitiesSection />
          <SetupSection />
          <PremiumPricing />
          <LandingFAQ />
          <FinalCTA />
        </main>
        <PremiumFooter />
      </div>
    </>
  );
};

export default Landing;
