import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

/**
 * Wraps the landing page in an inertial smooth-scroll experience (Lenis).
 *
 * Falls back to the browser's native scroll silently when the user prefers
 * reduced motion, on touch devices (where native momentum scroll already
 * feels right), or if Lenis fails to initialize for any reason — this must
 * never be the thing that breaks the page.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer = matchMedia("(pointer: coarse)").matches;
    if (prefersReducedMotion || isCoarsePointer) return;

    let lenis: Lenis | null = null;
    let rafId = 0;

    // Lenis drives scroll from its own internal animated value and re-applies
    // it every rAF tick. A plain in-page anchor jump (`<a href="#faq">`) moves
    // the native scrollTop directly, but Lenis doesn't know that happened —
    // on the very next frame it snaps the page back to whatever position it
    // was still tracking. So every same-page anchor click has to be routed
    // through `lenis.scrollTo` instead of letting the browser handle it.
    const handleAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
      const href = anchor?.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      lenis?.scrollTo(target as HTMLElement, { duration: 1.2 });
    };

    try {
      lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
      document.addEventListener("click", handleAnchorClick);
    } catch {
      // If Lenis can't initialize (unsupported environment, etc.), just
      // keep native scrolling — nothing to clean up.
      lenis = null;
    }

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", handleAnchorClick);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
