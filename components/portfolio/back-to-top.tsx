"use client";

import { ArrowUp } from "lucide-react";

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className="inline-flex min-h-11 items-center gap-2 label-mono transition-colors hover:text-fg-50"
    >
      Back to top
      <ArrowUp className="h-3 w-3" aria-hidden />
    </button>
  );
}
