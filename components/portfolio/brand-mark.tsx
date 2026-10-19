"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, type Transition } from "motion/react";
import { cn } from "@/lib/utils/cn";

const EASE = [0.16, 1, 0.3, 1] as const;
const slide = (delay: number): Transition => ({ duration: 0.6, ease: EASE, delay });

/**
 * The PS mark drawn from five layers that assemble on mount: the stem slides
 * in from the left, the bowl drops from above, the flag flies in from the
 * bottom-right, the corner dot pops in, then the white bracket rises and blinks
 * twice like a cursor.
 *
 * Declarative Motion animations keyed on the route (and a hover counter), so a
 * remount simply replays from the start. That makes it safe under React Strict
 * Mode in `next dev`, on client-side navigation, and on phones with Reduce
 * Motion enabled, where it still plays by design.
 */
export function BrandMark({
  className,
  replayOnHover = true,
}: {
  className?: string;
  replayOnHover?: boolean;
}) {
  const pathname = usePathname();
  const [run, setRun] = React.useState(0);

  const img = (name: string, props: React.ComponentProps<typeof motion.img>) => (
    <motion.img
      key={name}
      src={`/brand/mark-${name}.png`}
      alt=""
      aria-hidden
      draggable={false}
      className="absolute inset-0 h-full w-full select-none"
      {...props}
    />
  );

  return (
    <span
      key={`${pathname}#${run}`}
      onPointerEnter={replayOnHover ? () => setRun((r) => r + 1) : undefined}
      className={cn("relative block aspect-square shrink-0", className)}
    >
      {img("stem", {
        initial: { x: "-55%", opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: slide(0.05),
      })}
      {img("bowl", {
        initial: { y: "-55%", opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: slide(0.15),
      })}
      {img("flag", {
        initial: { x: "45%", y: "45%", opacity: 0 },
        animate: { x: 0, y: 0, opacity: 1 },
        transition: slide(0.25),
      })}
      {img("dot", {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring", stiffness: 420, damping: 18, delay: 0.55 },
      })}
      {img("bracket", {
        initial: { y: "40%", opacity: 0 },
        animate: { y: 0, opacity: [0, 1, 1, 0, 1, 0, 1] },
        transition: {
          y: { duration: 0.5, ease: EASE, delay: 0.6 },
          opacity: {
            duration: 1.3,
            delay: 0.6,
            ease: "linear",
            times: [0, 0.3, 0.5, 0.6, 0.72, 0.82, 1],
          },
        },
      })}
    </span>
  );
}
