"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const THRESHOLD = 480;

/**
 * Mobile-only sticky CTA that appears after the visitor scrolls past the
 * page header. Mounted on /projects and /projects/[slug].
 */
export function MobileCta({ label = "Let's talk" }: { label?: string }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        setVisible(window.scrollY > THRESHOLD);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-500 ease-out-expo lg:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <div className="flex items-center justify-between gap-4 rounded-md border border-line-700 bg-surface-900/95 px-4 py-3 shadow-panel backdrop-blur-sm">
        <div className="min-w-0">
          <p className="label-mono">Have a project?</p>
          <p className="mt-1 truncate text-sm font-medium text-fg-100">{label}</p>
        </div>
        <Link
          href="/contact"
          tabIndex={visible ? 0 : -1}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-sm bg-fg-50 px-4 text-sm font-medium text-bg-950 transition-colors hover:bg-ember-400"
        >
          Contact
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
