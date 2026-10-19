import * as React from "react";
import Image from "next/image";
import { Eyebrow } from "./section";
import { cn } from "@/lib/utils/cn";

/** Hero-style header for inner public pages. */
export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
  className,
  backdrop,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  /** Full-bleed photo behind the header, dimmed so the type stays readable. */
  backdrop?: { src: string; position?: string };
}) {
  return (
    <header className={cn("relative overflow-hidden border-b border-line-800", className)}>
      {backdrop ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src={backdrop.src}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectPosition: backdrop.position ?? "50% 45%" }}
            className="object-cover opacity-45 saturate-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-950/90 via-bg-950/55 to-bg-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-950/85 via-bg-950/35 to-transparent" />
        </div>
      ) : null}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(60%_60%_at_30%_0%,black,transparent)]",
          backdrop ? "opacity-30" : "opacity-60",
        )}
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
