import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { ScrollText } from './ScrollText';
import { useScrollTimeline } from './useScrollTimeline';

export function KuboCore3D() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollProgress, section } = useScrollTimeline(containerRef);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for interactive nucleus
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1; // -1 to 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1; // -1 to 1
      setMousePosition({ x, y });
    };

    // Throttle for performance
    let rafId: number;
    const throttledMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        handleMouseMove(e);
        rafId = 0;
      });
    };

    window.addEventListener('mousemove', throttledMouseMove);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Fallback to static hero for accessibility
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-black">
        <div className="text-center px-6">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
            Entenda tudo o que acontece
            <br />
            <span className="primary-text-gradient">no seu site.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8">
            Analytics visual e inteligente. Veja visitantes, comportamento e conversões em tempo real.
          </p>
        </div>
      </section>
    );
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const scrollHeight = isMobile ? '400vh' : '600vh';

  return (
    <section
      ref={containerRef}
      className="relative bg-black"
      style={{ height: scrollHeight }}
    >
      {/* Sticky container for 3D canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Three.js Canvas */}
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Canvas
            camera={{ position: [0, 0, 10], fov: 50 }}
            dpr={isMobile ? [1, 1.5] : [1, 2]} // Limit pixel ratio on mobile
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
            }}
          >
            <color attach="background" args={['#000000']} />
            <Scene
              scrollProgress={scrollProgress}
              mousePosition={mousePosition}
            />
          </Canvas>
        </Suspense>

        {/* Overlay text content */}
        <div className="absolute inset-0 pointer-events-none">
          <ScrollText scrollProgress={scrollProgress} section={section} />
        </div>
      </div>
    </section>
  );
}
