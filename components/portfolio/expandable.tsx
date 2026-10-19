"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Progressive-disclosure block: a mono toggle that reveals longer content
 * with a height animation. Honors reduced motion.
 */
export function Expandable({
  label = "Read more",
  collapseLabel = "Show less",
  defaultOpen = false,
  children,
  className,
}: {
  label?: string;
  collapseLabel?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const reduce = useReducedMotion();
  const id = React.useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex min-h-11 items-center gap-3 label-mono text-fg-300 transition-colors hover:text-fg-50"
      >
        <span
          className="h-px w-6 bg-ember-500 transition-[width] duration-300 group-hover:w-10"
          aria-hidden
        />
        {open ? collapseLabel : label}
        <ChevronDown
          aria-hidden
          className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            id={id}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-6">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
