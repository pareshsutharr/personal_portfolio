"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useIsFinePointer } from "@/hooks/use-media-query";

const INTERACTIVE = "a, button, [role=button], input, textarea, select, label, [data-cursor]";
const DOT = 6;
const RING = 32;
const RING_HOVER = 48;
const RING_VIEW = 72;

/**
 * Desktop-only custom cursor: a 6px dot plus a spring-following ring.
 * Sets `html[data-cursor="custom"]` (globals.css hides the system cursor).
 */
export function CustomCursor() {
  const fine = useIsFinePointer();
  const reduce = useReducedMotion();
  const active = fine && !reduce;

  const [visible, setVisible] = React.useState(false);
  const [mode, setMode] = React.useState<"idle" | "hover" | "view">("idle");

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.5 });

  React.useEffect(() => {
    if (!active) return;
    document.documentElement.dataset.cursor = "custom";

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null;
      if (!target) {
        setMode("idle");
      } else if (target.closest('[data-cursor="view"]')) {
        setMode("view");
      } else {
        setMode("hover");
      }
    };
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget === null) setVisible(false);
    };
    const onBlur = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("blur", onBlur);
    return () => {
      delete document.documentElement.dataset.cursor;
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("blur", onBlur);
    };
  }, [active, x, y]);

  if (!active) return null;

  const size = mode === "view" ? RING_VIEW : mode === "hover" ? RING_HOVER : RING;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] mix-blend-difference">
      <motion.div
        style={{ x, y, width: DOT, height: DOT, marginLeft: -DOT / 2, marginTop: -DOT / 2 }}
        animate={{ opacity: visible && mode !== "view" ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="absolute top-0 left-0 rounded-full bg-fg-50"
      />
      <motion.div
        style={{ x: ringX, y: ringY }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute top-0 left-0"
      >
        <motion.div
          animate={{
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            backgroundColor: mode === "view" ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="flex items-center justify-center rounded-full border border-fg-50"
        >
          {mode === "view" ? (
            <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-black">
              VIEW
            </span>
          ) : null}
        </motion.div>
      </motion.div>
    </div>
  );
}
