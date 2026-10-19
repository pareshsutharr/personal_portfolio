"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** 1px ember progress line pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-px origin-left bg-ember-500"
    />
  );
}
