import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Work" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Root 404. Lives outside the public layout on purpose, so it renders its own
 * minimal dark shell without nav or footer.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-bg-950 text-fg-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)] opacity-60"
      />
      <div className="relative container-x flex flex-1 flex-col justify-center py-24">
        <p className="label-mono">
          <span className="text-ember-400">ERR</span>
          <span className="mx-3 text-fg-700">/</span>
          ROUTE NOT FOUND
        </p>
        <p className="mt-8 font-mono text-[clamp(6rem,22vw,16rem)] leading-none font-medium tracking-[-0.06em] text-fg-50 tabular-nums">
          404
        </p>
        <h1 className="mt-6 font-display text-display-sm font-semibold text-fg-100">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-fg-300">
          The link may be out of date, or the page was moved. Everything that is live is reachable
          from these routes.
        </p>
        <nav aria-label="Recovery links" className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-fg-100 transition-colors hover:text-ember-300"
            >
              <span className="label-mono text-fg-500 transition-colors group-hover:text-ember-400">
                →
              </span>
              {l.label}
              <ArrowUpRight
                className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </Link>
          ))}
        </nav>
      </div>
      <div className="relative container-x pb-8">
        <div className="hairline" />
        <p className="mt-6 label-mono">PARESH SUTHAR — FULL STACK SOFTWARE ENGINEER</p>
      </div>
    </main>
  );
}
