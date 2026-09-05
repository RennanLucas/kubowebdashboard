import { useEffect } from "react";

export function useSpatialExperience() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lp-root");
    if (!root) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("main > section"),
    );
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>(
        ".kubo-stage, .lp-insight, .lp-capability, .lp-price-card",
      ),
    );
    const visible = new Set<HTMLElement>();
    let frame = 0;
    const update = () => {
      frame = 0;
      if (motion.matches) return;
      const height = window.innerHeight;
      visible.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const progress = Math.max(
          0,
          Math.min(1, (height - rect.top) / (height + rect.height)),
        );
        section.style.setProperty("--spatial-progress", progress.toFixed(4));
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            visible.add(target);
            target.classList.add("spatial-arrived");
          } else visible.delete(target);
        });
        schedule();
      },
      { threshold: 0, rootMargin: "0px 0px -6% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    const move = (event: PointerEvent) => {
      if (motion.matches || !fine.matches) return;
      const panel = event.currentTarget as HTMLElement;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty(
        "--tilt-x",
        `${((event.clientY - rect.top) / rect.height - 0.5) * -5}deg`,
      );
      panel.style.setProperty(
        "--tilt-y",
        `${((event.clientX - rect.left) / rect.width - 0.5) * 7}deg`,
      );
      panel.style.setProperty(
        "--light-x",
        `${((event.clientX - rect.left) / rect.width) * 100}%`,
      );
      panel.style.setProperty(
        "--light-y",
        `${((event.clientY - rect.top) / rect.height) * 100}%`,
      );
    };
    const resetPanel = (panel: HTMLElement) => {
      ["--tilt-x", "--tilt-y", "--light-x", "--light-y"].forEach((key) =>
        panel.style.removeProperty(key),
      );
    };
    const leave = (event: PointerEvent) =>
      resetPanel(event.currentTarget as HTMLElement);
    const preference = () => {
      panels.forEach(resetPanel);
      if (motion.matches)
        sections.forEach((section) =>
          section.style.removeProperty("--spatial-progress"),
        );
      else schedule();
    };
    panels.forEach((panel) => {
      panel.addEventListener("pointermove", move, { passive: true });
      panel.addEventListener("pointerleave", leave);
    });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    motion.addEventListener("change", preference);
    fine.addEventListener("change", preference);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", preference);
      fine.removeEventListener("change", preference);
      panels.forEach((panel) => {
        panel.removeEventListener("pointermove", move);
        panel.removeEventListener("pointerleave", leave);
        resetPanel(panel);
      });
      sections.forEach((section) =>
        section.style.removeProperty("--spatial-progress"),
      );
    };
  }, []);
}
