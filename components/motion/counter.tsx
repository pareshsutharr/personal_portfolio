"use client";

import * as React from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/**
 * Animates a numeric value when it scrolls into view. Non-numeric values
 * (e.g. "—" or "15+") render as-is, with the numeric prefix animated.
 */
export function Counter({ value, className }: { value: string; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? Number(match[1]) : null;
  const suffix = match ? match[2] : "";
  const [display, setDisplay] = React.useState(target !== null && !reduce ? 0 : target);

  React.useEffect(() => {
    if (target === null || reduce || !inView) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target, reduce]);

  return (
    <span ref={ref} className={className}>
      {target === null ? value : `${display}${suffix}`}
    </span>
  );
}
