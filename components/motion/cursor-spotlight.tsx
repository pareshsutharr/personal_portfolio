"use client";

import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useIsFinePointer } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils/cn";

/**
 * Ember glow that follows the pointer across its parent (which must be
 * `position: relative`). Desktop pointers only; invisible until the first move.
 */
export function CursorSpotlight({ className, size = 640 }: { className?: string; size?: number }) {
  const fine = useIsFinePointer();
  const reduce = useReducedMotion();
  const active = fine && !reduce;

  const x = useMotionValue(-size);
  const y = useMotionValue(-size);
  const sx = useSpring(x, { stiffness: 120, damping: 24, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 24, mass: 0.6 });
  const opacity = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(${size}px circle at ${sx}px ${sy}px, rgb(232 82 31 / 0.16), rgb(215 38 61 / 0.05) 40%, transparent 70%)`;

  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!active) return;
    const el = ref.current?.parentElement;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      x.set(e.clientX - r.left);
      y.set(e.clientY - r.top);
      opacity.set(1);
    };
    const onLeave = () => opacity.set(0);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [active, x, y, opacity]);

  if (!active) return null;
  return (
    <motion.div
      ref={ref}
      aria-hidden
      style={{ background, opacity }}
      className={cn(
        "pointer-events-none absolute inset-0 z-0 transition-opacity duration-700",
        className,
      )}
    />
  );
}
