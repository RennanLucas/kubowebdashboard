import type { Transition, Variants } from "framer-motion";

/** Shared easing curve — a soft, confident deceleration used across the page. */
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
};

/** Stagger container — children should use `fadeUp` (or similar) as their own variant. */
export const staggerContainer = (stagger = 0.09, delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

/** Standard viewport config for scroll reveals: animate once, slightly before full entry. */
export const viewportOnce = { once: true, margin: "0px 0px -10% 0px", amount: 0.2 as const };

export const springSoft: Transition = { type: "spring", stiffness: 120, damping: 20, mass: 0.6 };
