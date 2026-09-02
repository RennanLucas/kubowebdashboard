import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ScrollTextProps {
  scrollProgress: number;
  section: number;
}

export function ScrollText({ scrollProgress, section }: ScrollTextProps) {
  // Calculate opacity for each section
  const getOpacity = (sectionIndex: number) => {
    if (section === sectionIndex) return 1;
    if (Math.abs(section - sectionIndex) === 1) return 0.3;
    return 0;
  };

  return (
    <div className="relative h-full w-full pointer-events-none">
      {/* INTRO (0-10%) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-opacity duration-500"
        style={{ opacity: getOpacity(0) }}
      >
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
          Entenda tudo o que acontece
          <br />
          <span className="primary-text-gradient">no seu site.</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-8">
          Analytics visual e inteligente. Veja visitantes, comportamento e conversões em tempo real.
        </p>
        <div className="flex gap-4 pointer-events-auto">
          <Button asChild size="lg" className="h-14 px-10 rounded-full">
            <Link to="/login">Começar gratuitamente</Link>
          </Button>
        </div>
        <div className="absolute bottom-12 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/40 text-sm">Role para explorar</span>
          <svg
            className="w-6 h-6 text-white/40"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>

      {/* APPROACH (10-20%) - text fades out */}
      {/* No text during camera approach */}

      {/* ROTATION (20-30%) - núcleo revela detalhes */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
        style={{ opacity: getOpacity(2) }}
      >
        <h2 className="text-4xl md:text-6xl font-black text-white text-center">
          Dados conectados.
          <br />
          <span className="primary-text-gradient">Insights centralizados.</span>
        </h2>
      </div>

      {/* VISITORS (40-50%) */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-12 md:pr-24 transition-opacity duration-500"
        style={{ opacity: getOpacity(4) }}
      >
        <div className="max-w-md">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Veja quem está chegando.
          </h2>
          <p className="text-lg text-white/60">
            Acompanhe visitantes em tempo real. Fontes, dispositivos e páginas mais acessadas.
          </p>
        </div>
      </div>

      {/* GEO (50-60%) */}
      <div
        className="absolute inset-0 flex items-center justify-start pl-12 md:pl-24 transition-opacity duration-500"
        style={{ opacity: getOpacity(5) }}
      >
        <div className="max-w-md">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Descubra de onde eles vêm.
          </h2>
          <p className="text-lg text-white/60">
            Geolocalização precisa. Entenda sua audiência por país, região e cidade.
          </p>
        </div>
      </div>

      {/* PAGES (60-70%) */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
        style={{ opacity: getOpacity(6) }}
      >
        <div className="max-w-xl text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Descubra o que prende a atenção.
          </h2>
          <p className="text-lg text-white/60">
            Páginas mais visitadas, tempo de permanência e taxa de rejeição.
          </p>
        </div>
      </div>

      {/* JOURNEY (75-85%) - minimal text during camera journey */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
        style={{ opacity: section === 7 ? 1 : 0 }}
      >
        <h2 className="text-3xl md:text-5xl font-black text-white text-center animate-pulse">
          Cada interação conta.
        </h2>
      </div>

      {/* DASHBOARD (95-100%) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000"
        style={{ opacity: scrollProgress >= 0.95 ? 1 : 0 }}
      >
        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 text-center">
          Tudo o que você precisa.
          <br />
          <span className="primary-text-gradient">Em uma única visão.</span>
        </h2>
        <div className="pointer-events-auto">
          <Button asChild size="lg" className="h-14 px-10 rounded-full">
            <Link to="/login">Começar gratuitamente</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
