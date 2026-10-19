"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useAnimate, type AnimationSequence } from "motion/react";
import { cn } from "@/lib/utils/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The PS mark drawn from five layers that assemble on mount: the stem slides
 * in from the left, the bowl drops from above, the flag flies in from the
 * bottom-right, the corner dot pops in, then the white bracket rises and blinks
 * twice like a cursor. Replays on every route change and on hover. Runs as a
 * real animation (not a GIF) so it works on phones, including with Reduce
 * Motion enabled, and stays crisp at any size.
 */
export function BrandMark({
  className,
  replayOnHover = true,
}: {
  className?: string;
  replayOnHover?: boolean;
}) {
  const pathname = usePathname();
  const [scope, animate] = useAnimate();
  const playing = React.useRef(false);

  const play = React.useCallback(async () => {
    if (playing.current) return;
    playing.current = true;
    const sequence: AnimationSequence = [
      [".stem", { x: "-55%", opacity: 0 }, { duration: 0 }],
      [".bowl", { y: "-55%", opacity: 0 }, { duration: 0, at: "<" }],
      [".flag", { x: "45%", y: "45%", opacity: 0 }, { duration: 0, at: "<" }],
      [".dot", { scale: 0, opacity: 0 }, { duration: 0, at: "<" }],
      [".bracket", { y: "40%", opacity: 0 }, { duration: 0, at: "<" }],
      [".stem", { x: 0, opacity: 1 }, { duration: 0.6, ease: EASE, at: 0.05 }],
      [".bowl", { y: 0, opacity: 1 }, { duration: 0.6, ease: EASE, at: 0.15 }],
      [".flag", { x: 0, y: 0, opacity: 1 }, { duration: 0.6, ease: EASE, at: 0.25 }],
      [".dot", { scale: 1, opacity: 1 }, { type: "spring", stiffness: 420, damping: 18, at: 0.55 }],
      [".bracket", { y: 0, opacity: 1 }, { duration: 0.5, ease: EASE, at: 0.6 }],
      [".bracket", { opacity: [1, 0, 1, 0, 1] }, { duration: 0.7, ease: "linear", at: 1.15 }],
    ];
    try {
      await animate(sequence);
    } finally {
      playing.current = false;
    }
  }, [animate]);

  React.useEffect(() => {
    void play();
  }, [play, pathname]);

  const layer = (name: string, src: string) => (
    <motion.img
      key={name}
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={cn("absolute inset-0 h-full w-full select-none", name)}
      style={{ willChange: "transform, opacity" }}
    />
  );

  return (
    <span
      ref={scope}
      onPointerEnter={replayOnHover ? () => void play() : undefined}
      className={cn("relative block aspect-square shrink-0", className)}
    >
      {layer("stem", "/brand/mark-stem.png")}
      {layer("bowl", "/brand/mark-bowl.png")}
      {layer("flag", "/brand/mark-flag.png")}
      {layer("dot", "/brand/mark-dot.png")}
      {layer("bracket", "/brand/mark-bracket.png")}
    </span>
  );
}
