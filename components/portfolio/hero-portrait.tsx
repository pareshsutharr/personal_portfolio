"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils/cn";

/**
 * Editorial hero portrait: slow settle-in scale on load, frameless with a
 * soft bottom fade, mono caption. Renders a typographic/technical placeholder block
 * when no photo has been uploaded yet.
 */
export function HeroPortrait({
  src,
  name,
  location,
  className,
}: {
  src: string | null;
  name: string;
  location?: string | null;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <figure className={cn("relative", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-10 -z-10 opacity-100 [background:radial-gradient(60%_55%_at_60%_40%,rgb(232_82_31_/_0.14),transparent_70%),radial-gradient(45%_45%_at_25%_85%,rgb(215_38_61_/_0.10),transparent_70%)]"
      />
      <motion.div
        initial={reduce ? false : { scale: 1.06, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative w-full overflow-hidden",
          src
            ? "aspect-[4/5] [mask-image:linear-gradient(to_bottom,black_82%,transparent_100%)] lg:aspect-auto lg:h-[min(90svh,66rem)]"
            : "grain aspect-[4/5] border border-line-800 bg-surface-900",
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            fill
            preload
            sizes="(max-width: 1024px) 92vw, 50vw"
            className="object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between grid-lines p-5 sm:p-6">
            <span className="sr-only">Portrait — add from admin</span>
            <div className="flex items-center justify-between label-mono">
              <span>PORTRAIT</span>
              <span className="text-ember-400">{name.toUpperCase()}</span>
            </div>
            <div className="font-display text-[clamp(5rem,18vw,11rem)] leading-none font-bold tracking-tighter text-fg-50">
              {initials}
            </div>
            <div className="flex items-end justify-between gap-4 label-mono">
              <span className="max-w-[60%] leading-relaxed">{location ?? "Surat, Gujarat"}</span>
            </div>
          </div>
        )}

        {!src ? (
          <>
            <span
              aria-hidden
              className="absolute top-3 left-3 h-4 w-4 border-t border-l border-ember-500"
            />
            <span
              aria-hidden
              className="absolute top-3 right-3 h-4 w-4 border-t border-r border-ember-500"
            />
            <span
              aria-hidden
              className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-ember-500"
            />
            <span
              aria-hidden
              className="absolute right-3 bottom-3 h-4 w-4 border-r border-b border-ember-500"
            />
          </>
        ) : null}
      </motion.div>
    </figure>
  );
}
