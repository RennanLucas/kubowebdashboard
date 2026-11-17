import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

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
    let hashRaf = 0;

    const queryTarget = (hash: string): HTMLElement | null => {
      if (!hash || hash === "#") return null;
      try {
        return document.querySelector<HTMLElement>(hash);
      } catch {
        // Malformed selector (e.g. "#/route") — nothing to scroll to.
        return null;
      }
    };

    // Lenis drives scroll from its own internal animated value and re-applies
    // it every frame. The browser's native fragment jump (`/#pricing` on load,
    // `location.hash = …`) moves scrollTop directly, but Lenis doesn't know
    // that happened — on the very next frame it snaps the page back to 0. So
    // every same-page anchor jump has to be routed through `lenis.scrollTo`
    // instead of letting the browser handle it.
    //
    // On first load the landing chunk has just mounted and fonts/images are
    // still settling, which moves the target around for the first second or
    // so. Keep re-applying the offset until the position holds still, and bail
    // out the moment the person takes over the scroll themselves.
    const settleHash = (hash: string) => {
      cancelAnimationFrame(hashRaf);
      const startedAt = performance.now();
      let lastTop = -1;
      let stable = 0;
      let attempts = 0;

      const stop = () => {
        cancelAnimationFrame(hashRaf);
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchstart", stop);
        window.removeEventListener("keydown", stop);
      };

      const tick = () => {
        attempts += 1;
        const target = queryTarget(hash);

        if (target && lenis) {
          const top = Math.round(target.getBoundingClientRect().top + window.scrollY);
          stable = top === lastTop ? stable + 1 : 0;
          lastTop = top;
          lenis.scrollTo(target, { immediate: true });

          // Five still frames after the first ~900ms means layout is done.
          if (stable >= 5 && performance.now() - startedAt > 900) {
            stop();
            return;
          }
        }

        if (attempts >= 240) {
          stop();
          return;
        }
        hashRaf = requestAnimationFrame(tick);
      };

      window.addEventListener("wheel", stop, { passive: true });
      window.addEventListener("touchstart", stop, { passive: true });
      window.addEventListener("keydown", stop);
      hashRaf = requestAnimationFrame(tick);
    };

    const scrollToHash = (hash: string, smooth: boolean) => {
      const target = queryTarget(hash);
      if (!target) return false;
      cancelAnimationFrame(hashRaf);
      lenis?.scrollTo(target, smooth ? { duration: 1.2 } : { immediate: true });
      return true;
    };

    const handleAnchorClick = (event: MouseEvent) => {
      // Respect modified clicks and non-primary buttons — those are the
      // person asking for a new tab/window, not an in-page jump.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      const href = anchor?.getAttribute("href");
      if (!href || href === "#") return;
      if (!scrollToHash(href, true)) return;

      event.preventDefault();
      // Keep the URL shareable without handing the scroll back to the browser.
      if (location.hash !== href) history.pushState(null, "", href);
    };

    const handleHashChange = () => {
      if (!scrollToHash(location.hash, true)) {
        // Hash pointing at nothing on this page — leave the person where they are.
      }
    };

    // Native key scrolling updates scrollTop directly, and Lenis drops those
    // events while it is mid-animation (`isScrolling === "smooth"`) — press End
    // or PageDown during a wheel glide and the keystroke is swallowed
    // entirely. Keyboard scrolling is how people navigate without a mouse, so
    // it gets routed through Lenis like any other scroll intent.
    const KEY_DELTAS: Record<string, (viewport: number) => number> = {
      ArrowDown: () => 40,
      ArrowUp: () => -40,
      PageDown: (viewport) => viewport * 0.9,
      PageUp: (viewport) => viewport * -0.9,
    };

    const isKeyboardScrollTarget = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      !target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!lenis || event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!isKeyboardScrollTarget(event.target)) return;

      // Anything modal or expanded (the mobile menu, an open FAQ answer) owns
      // these keys while it is open.
      if (document.body.style.overflow === "hidden") return;

      const delta = KEY_DELTAS[event.key];
      if (delta) {
        event.preventDefault();
        const from = lenis.targetScroll;
        lenis.scrollTo(from + delta(window.innerHeight), { duration: 0.55 });
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        lenis.scrollTo(event.key === "Home" ? 0 : document.documentElement.scrollHeight, {
          duration: 0.9,
        });
      }
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
      window.addEventListener("hashchange", handleHashChange);
      window.addEventListener("keydown", handleKeyDown);

      // Deep link on first load: /#pricing, /#faq, …
      if (location.hash) settleHash(location.hash);
    } catch {
      // If Lenis can't initialize (unsupported environment, etc.), just
      // keep native scrolling — nothing to clean up.
      lenis = null;
    }

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(hashRaf);
      document.removeEventListener("click", handleAnchorClick);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("keydown", handleKeyDown);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
