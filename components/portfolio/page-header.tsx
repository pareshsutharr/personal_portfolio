import * as React from "react";
import { Eyebrow } from "./section";
import { cn } from "@/lib/utils/cn";

/** Hero-style header for inner public pages. */
export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative overflow-hidden border-b border-line-800", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(60%_60%_at_30%_0%,black,transparent)] opacity-60"
      />
      <div className="relative container-x pt-32 pb-16 sm:pt-40 sm:pb-20 lg:pt-44 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-6 font-display text-display-lg font-semibold text-balance text-fg-50">
              {title}
            </h1>
            {description ? (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-300">{description}</p>
            ) : null}
          </div>
          {aside ? <div className="lg:col-span-4 lg:justify-self-end">{aside}</div> : null}
        </div>
      </div>
    </header>
  );
}
