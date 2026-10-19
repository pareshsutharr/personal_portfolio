"use client";

import * as React from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useReducedMotion } from "motion/react";

/**
 * Inertia scrolling (Lenis) on top of native scroll, so IntersectionObserver,
 * Motion's useScroll and anchor links keep working. Off for reduced motion.
 */
export function SmoothScroll() {
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      wheelMultiplier: 1,
      touchMultiplier: 1.3,
      anchors: { offset: -96 },
    });
    return () => lenis.destroy();
  }, [reduce]);

  return null;
}
