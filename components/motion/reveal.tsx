"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils/cn";

type RevealProps = HTMLMotionProps<"div"> & {
  /** Delay in seconds. */
  delay?: number;
  /** Vertical offset in px. */
  y?: number;
  /** Trigger once (default) or every time. */
  once?: boolean;
  as?: "div" | "section" | "li" | "span" | "p" | "h1" | "h2" | "h3";
};

/**
 * Scroll-reveal wrapper: fade + translate. Respects prefers-reduced-motion.
 */
export function Reveal({
  delay = 0,
  y = 24,
  once = true,
  className,
  children,
  as = "div",
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

/** Staggers direct children that are <Reveal> or motion elements. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp variants={staggerItem} className={className}>
      {children}
    </Comp>
  );
}

/** Word-by-word line reveal for display headlines. */
export function SplitWords({
  text,
  className,
  delay = 0,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "span" | "h1" | "h2" | "p";
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <Tag className={cn("inline-block", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            aria-hidden
            className="inline-block"
            initial={reduce ? false : { y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: delay + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
