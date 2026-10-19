"use client";

import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useIsFinePointer } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils/cn";

/**
 * Pointer-driven 3D tilt with a moving glare. Children are rendered as-is on
 * touch devices and for reduced motion; the wrapper stays in the layout so
 * cards keep identical sizing either way.
 */
export function Tilt({
  className,
  max = 7,
  children,
}: {
  className?: string;
  /** Max tilt in degrees. */
  max?: number;
  children: React.ReactNode;
}) {
  const fine = useIsFinePointer();
  const reduce = useReducedMotion();
  const active = fine && !reduce;

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 22, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 220, damping: 22, mass: 0.4 });
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const glareX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glareOpacity = useMotionValue(0);
  const glare = useMotionTemplate`radial-gradient(520px circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.10), transparent 60%)`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    glareOpacity.set(1);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  };

  if (!active) return <div className={className}>{children}</div>;

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1100, transformStyle: "preserve-3d" }}
      className={cn("relative will-change-transform", className)}
    >
      {children}
      <motion.div
        aria-hidden
        style={{ background: glare, opacity: glareOpacity }}
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
      />
    </motion.div>
  );
}
