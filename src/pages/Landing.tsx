import { Helmet } from "react-helmet-async";
import { LandingHero, LandingNav } from "@/components/landing/premium/LandingHero";
import {
  CapabilitiesSection, CompatibilitySection, ComparisonSection, FinalCTA,
  FloatingWhatsAppTester, InsightsSection, LandingFAQ, PremiumFooter,
  PremiumPricing, ProblemSolutionBridge, ProductStory, RealtimeSection,
  RoiCalculatorSection, SecurityInfrastructureSection, SetupSection, SignalRail,
  TestimonialsSection, TrustProofSection,
} from "@/components/landing/premium/LandingExperience";
import { useLandingReveal } from "@/components/landing/premium/useLandingReveal";
import "@/components/landing/premium/landing-premium.css";

/* ─────────────────────────────────────────────────────────────
   Main Landing Component
   ───────────────────────────────────────────────────────────── */
const Landing = () => {
  useLandingReveal();

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
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Kubo Analytics",
            "operatingSystem": "Web",
            "applicationCategory": "BusinessApplication",
            "description": "Analytics claro para acompanhar visitantes, conversões de WhatsApp e fontes de tráfego sem a complexidade do GA4.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "BRL"
            }
          })}
        </script>
      </Helmet>
      
      <div className="lp-root selection:bg-blue-500/30 selection:text-white">
        <LandingNav />
        
        <main>
          <LandingHero />
          <SignalRail />
          <TrustProofSection />
          <ProblemSolutionBridge />
          <ProductStory />
          <RealtimeSection />
          <CapabilitiesSection />
          <CompatibilitySection />
          <ComparisonSection />
          <SecurityInfrastructureSection />
          <InsightsSection />
          <TestimonialsSection />
          <SetupSection />
          <RoiCalculatorSection />
          <PremiumPricing />
          <LandingFAQ />
          <FinalCTA />
        </main>

        <PremiumFooter />
        <FloatingWhatsAppTester />
      </div>
    </>
  );
};

export default Landing;

