"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { SocialLink } from "@/types";
import { BrandMark } from "./brand-mark";
import { NAV_LINKS, ROUTES } from "./routes";

const EASE = [0.16, 1, 0.3, 1] as const;

export function SiteNav({
  email,
  socialLinks = [],
}: {
  email?: string | null;
  socialLinks?: SocialLink[];
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [lastPath, setLastPath] = React.useState(pathname);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  // Close on navigation (state adjusted during render, no effect needed).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Scroll lock + Escape + focus management while the overlay is open.
  React.useEffect(() => {
    if (!open) return;
    const toggle = toggleRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = overlayRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !overlayRef.current) return;
      const focusables = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      );
      if (!focusables.length) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const solid = scrolled || open;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
          solid
            ? "border-b border-line-800 bg-bg-950/80 backdrop-blur-sm"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className="container-x flex h-16 items-center justify-between gap-6 lg:h-20"
        >
          <Link
            href={ROUTES.home}
            aria-label="Paresh Suthar — Home"
            className="flex min-h-11 items-center gap-3 font-display text-sm font-semibold tracking-tight text-fg-50 uppercase"
          >
            <BrandMark className="h-8 w-8 lg:h-9 lg:w-9" />
            <span>Paresh Suthar</span>
          </Link>

          <ul className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-11 items-center text-sm transition-colors",
                      active ? "text-fg-50" : "text-fg-300 hover:text-fg-50",
                    )}
                  >
                    {link.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -bottom-0.5 left-0 h-px bg-ember-500 transition-[width] duration-300 ease-out-expo",
                        active ? "w-full" : "w-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <ButtonLink href={ROUTES.contact} size="sm" className="hidden sm:inline-flex">
              Let&apos;s Talk
            </ButtonLink>
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
              className="relative flex h-11 w-11 items-center justify-center md:hidden"
            >
              <span className="relative block h-3 w-6">
                <motion.span
                  aria-hidden
                  animate={open ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                  className="absolute top-0 left-0 block h-px w-6 bg-fg-50"
                />
                <motion.span
                  aria-hidden
                  animate={open ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                  className="absolute bottom-0 left-0 block h-px w-6 bg-fg-50"
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-nav"
            id="mobile-nav"
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-40 bg-bg-950 md:hidden"
          >
            <div className="grain relative flex h-full flex-col overflow-y-auto pt-20">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(70%_60%_at_80%_100%,black,transparent)] opacity-60"
              />
              <div className="relative container-x flex flex-1 flex-col justify-between pb-8">
                <ul className="mt-6 flex flex-col">
                  {[{ href: ROUTES.home, label: "Home" }, ...NAV_LINKS].map((link, i) => {
                    const active = isActive(link.href);
                    return (
                      <motion.li
                        key={link.href}
                        initial={reduce ? false : { opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.08 + i * 0.06, ease: EASE }}
                        className="border-b border-line-800"
                      >
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          className="flex items-baseline gap-4 py-4 font-display text-display-md font-semibold"
                        >
                          <span className="w-6 shrink-0 label-mono text-ember-400">
                            {String(i).padStart(2, "0")}
                          </span>
                          <span className={active ? "text-fg-50" : "text-fg-300"}>
                            {link.label}
                          </span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>

                <motion.div
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex flex-col gap-5"
                >
                  <ButtonLink href={ROUTES.contact} size="lg" className="w-full">
                    Let&apos;s Talk
                  </ButtonLink>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {email ? (
                      <a
                        href={`mailto:${email}`}
                        className="flex min-h-11 items-center text-sm text-fg-300 transition-colors hover:text-fg-50"
                      >
                        {email}
                      </a>
                    ) : null}
                    {socialLinks.length ? (
                      <ul className="flex flex-wrap items-center gap-4">
                        {socialLinks.map((s) => (
                          <li key={s.id}>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex min-h-11 items-center label-mono transition-colors hover:text-fg-50"
                            >
                              {s.platform}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
