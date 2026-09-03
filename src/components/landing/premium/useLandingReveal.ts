import { useEffect } from "react";

export function useLandingReveal() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8%" });

    document.querySelectorAll(".lp-reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}
