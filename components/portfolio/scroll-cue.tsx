"use client";

import { motion, useReducedMotion } from "motion/react";

/** "SCROLL" label with a thin line that slowly travels downward. */
export function ScrollCue() {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex items-center gap-3 label-mono" aria-hidden>
      SCROLL
      <span className="relative block h-px w-10 overflow-hidden bg-line-700">
        <motion.span
          className="absolute inset-y-0 left-0 w-1/3 bg-ember-400"
          initial={{ x: "-100%" }}
          animate={reduce ? { x: 0 } : { x: ["-100%", "300%"] }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 2.2, repeat: Infinity, ease: [0.76, 0, 0.24, 1], repeatDelay: 0.6 }
          }
        />
      </span>
    </span>
  );
}
