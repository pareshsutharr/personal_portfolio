"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils/cn";

/**
 * Scroll-linked vertical drift. `speed` is the fraction of the element's
 * scroll travel it lags by: negative floats up slower than the page,
 * positive sinks. Measured against the element's own viewport journey.
 */
export function Parallax({
  speed = -0.15,
  className,
  children,
}: {
  speed?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const range = 320 * speed;
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <motion.div ref={ref} style={reduce ? undefined : { y }} className={cn(className)}>
      {children}
    </motion.div>
  );
}

/**
 * Fades and sinks its content as the user scrolls past it. Meant for the hero:
 * the type recedes while the next section slides over.
 */
export function ScrollFade({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  return (
    <motion.div
      ref={ref}
      style={reduce ? undefined : { opacity, y, scale }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
