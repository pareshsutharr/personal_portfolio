"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils/cn";

function Word({
  word,
  range,
  progress,
}: {
  word: string;
  range: [number, number];
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <span className="relative mr-[0.28em] inline-block">
      <motion.span style={{ opacity }}>{word}</motion.span>
    </span>
  );
}

/**
 * Scroll-linked paragraph: each word brightens as the block travels up the
 * viewport, so the reader's eye and the scroll position stay locked together.
 */
export function ScrollText({
  text,
  className,
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "h2" | "h3";
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.45"] });
  const words = React.useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  if (reduce) {
    return <Tag className={cn(className)}>{text}</Tag>;
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLParagraphElement>}
      className={cn("flex flex-wrap", className)}
      aria-label={text}
    >
      {words.map((w, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return <Word key={`${w}-${i}`} word={w} range={[start, end]} progress={scrollYProgress} />;
      })}
    </Tag>
  );
}
