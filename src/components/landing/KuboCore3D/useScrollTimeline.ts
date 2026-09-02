import { useEffect, useState } from 'react';

export interface ScrollTimelineData {
  scrollProgress: number; // 0 to 1
  section: number; // Current section index (0-7)
}

export function useScrollTimeline(containerRef: React.RefObject<HTMLElement>) {
  const [scrollData, setScrollData] = useState<ScrollTimelineData>({
    scrollProgress: 0,
    section: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight = containerRef.current.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY - (containerRef.current.offsetTop);
      const progress = Math.max(0, Math.min(1, scrolled / scrollHeight));

      // Determine which section we're in based on progress
      let currentSection = 0;
      if (progress < 0.125) currentSection = 0; // INTRO
      else if (progress < 0.25) currentSection = 1; // APPROACH
      else if (progress < 0.375) currentSection = 2; // ROTATION
      else if (progress < 0.5) currentSection = 3; // OPEN
      else if (progress < 0.625) currentSection = 4; // VISITORS
      else if (progress < 0.75) currentSection = 5; // GEO
      else if (progress < 0.875) currentSection = 6; // PAGES/EVENTS
      else currentSection = 7; // DASHBOARD

      setScrollData({
        scrollProgress: progress,
        section: currentSection,
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);

  return scrollData;
}
