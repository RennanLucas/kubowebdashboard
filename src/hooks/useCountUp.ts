import { useEffect, useRef, useState } from "react";

interface UseCountUpOptions {
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Easing function */
  easing?: "easeOut" | "easeInOut" | "linear";
  /** Prefix (e.g., "R$") */
  prefix?: string;
  /** Suffix (e.g., "%") */
  suffix?: string;
  /** Separator for thousands */
  separator?: string;
  /** Decimal separator */
  decimalSeparator?: string;
  /** Whether to animate on value change */
  animateOnChange?: boolean;
}

const easingFunctions = {
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  linear: (t: number) => t,
};

export function useCountUp(
  end: number,
  options: UseCountUpOptions = {}
) {
  const {
    duration = 800,
    decimals = 0,
    easing = "easeOut",
    prefix = "",
    suffix = "",
    separator = ".",
    decimalSeparator = ",",
    animateOnChange = true,
  } = options;

  const [displayValue, setDisplayValue] = useState(end);
  const previousValue = useRef(end);
  const animationFrame = useRef<number>();
  const startTime = useRef<number>();

  useEffect(() => {
    if (!animateOnChange || previousValue.current === end) {
      setDisplayValue(end);
      previousValue.current = end;
      return;
    }

    const startValue = previousValue.current;
    const easingFn = easingFunctions[easing];

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);

      const currentValue = startValue + (end - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
        previousValue.current = end;
      }
    };

    startTime.current = undefined;
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [end, duration, easing, animateOnChange]);

  // Format the display value
  const formatted = (() => {
    const fixed = displayValue.toFixed(decimals);
    const [intPart, decPart] = fixed.split(".");
    const withSeparator = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    const result = decPart
      ? `${withSeparator}${decimalSeparator}${decPart}`
      : withSeparator;
    return `${prefix}${result}${suffix}`;
  })();

  return { value: displayValue, formatted };
}
