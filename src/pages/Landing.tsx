import { Helmet } from "react-helmet-async";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Nav } from "@/components/landing/Nav";
import { Hero, CursorGlow } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { Showcase } from "@/components/landing/Showcase";
import { Features } from "@/components/landing/Features";
import { Comparison } from "@/components/landing/Comparison";
import { Security } from "@/components/landing/Security";
import { GetStarted } from "@/components/landing/GetStarted";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppTester } from "@/components/landing/WhatsAppTester";
import "@/components/landing/landing.css";

const Landing = () => {
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

      <SmoothScroll>
        <div className="lp-root selection:bg-blue-500/30 selection:text-white">
          <CursorGlow />
          <Nav />

          <main>
            <Hero />
            <SocialProof />
            <ProblemSolution />
            <Showcase />
            <Features />
            <Comparison />
            <Security />
            <GetStarted />
            <Pricing />
            <FAQ />
            <CTA />
          </main>

          <Footer />
          <WhatsAppTester />
        </div>
      </SmoothScroll>
    </>
  );
};

export default Landing;
