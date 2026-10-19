"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Re-mounts on every navigation: a short rise-and-fade so route changes feel
 * like a page turn instead of a flash.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
