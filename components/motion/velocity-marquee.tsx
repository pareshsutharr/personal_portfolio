"use client";

import * as React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { cn } from "@/lib/utils/cn";

function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

/**
 * Full-bleed display-type marquee whose speed and direction follow scroll
 * velocity. Base drift is slow; a fast scroll whips it along and a scroll
 * back up reverses it.
 */
export function VelocityMarquee({
  items,
  baseVelocity = 2,
  className,
}: {
  items: string[];
  baseVelocity?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1200], [0, 6], { clamp: false });
  const skew = useTransform(smoothVelocity, [-1500, 1500], [8, -8]);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const direction = React.useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) direction.current = -1;
    else if (vf > 0) direction.current = 1;
    moveBy += direction.current * moveBy * Math.abs(vf);
    baseX.set(baseX.get() + moveBy);
  });

  const row = items.map((t, i) => (
    <span key={`${t}-${i}`} className="flex items-center">
      <span
        className={cn(
          i % 2 === 0
            ? "text-transparent [-webkit-text-stroke:1px_rgb(231_231_231_/_0.55)]"
            : "text-ember-500",
        )}
      >
        {t}
      </span>
      <span aria-hidden className="mx-[0.35em] inline-block h-[0.14em] w-[0.14em] bg-ember-500" />
    </span>
  ));

  return (
    <div
      aria-hidden
      className={cn(
        "relative w-full overflow-hidden border-y border-line-800 py-6 whitespace-nowrap select-none sm:py-8",
        className,
      )}
    >
      <motion.div
        style={reduce ? undefined : { x, skewX: skew }}
        className="flex w-max font-display text-[clamp(3rem,9vw,8rem)] leading-none font-bold tracking-tighter uppercase"
      >
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className="flex shrink-0 items-center pr-[0.35em]">
            {row}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
