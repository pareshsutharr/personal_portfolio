import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Profile, SiteSettings, SocialLink } from "@/types";
import { AvailabilityBadge } from "./availability-badge";
import { BackToTop } from "./back-to-top";
import { FOOTER_LINKS } from "./routes";

export function SiteFooter({
  profile,
  settings,
  socialLinks,
}: {
  profile: Profile | null;
  settings: SiteSettings | null;
  socialLinks: SocialLink[];
}) {
  const year = String(new Date().getFullYear());
  const name = profile?.full_name ?? "Paresh Suthar";
  const email = profile?.email ?? settings?.contact_email ?? null;
  const copyright = settings?.copyright_text
    ? settings.copyright_text.replace(/\{year\}/g, year)
    : `© ${year} ${name}`;

  return (
    <footer className="relative overflow-hidden border-t border-line-800 bg-bg-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[0.18em] left-1/2 -translate-x-1/2 font-display text-display-xl font-bold tracking-tighter whitespace-nowrap text-white/[0.04] select-none"
      >
        PARESH
      </div>

      <div className="relative container-x">
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
          <div className="lg:col-span-6">
            <picture>
              <source srcSet="/logo-mark.png" media="(prefers-reduced-motion: reduce)" />
              <img
                src="/logo-animated.gif"
                alt=""
                width={64}
                height={64}
                loading="lazy"
                className="mb-5 h-12 w-12"
              />
            </picture>
            <p className="font-display text-lg font-semibold tracking-tight text-fg-50 uppercase">
              {name}
            </p>
            <p className="mt-1 text-sm text-fg-300">
              {profile?.professional_title ?? "Full Stack Software Engineer"}
            </p>
            {settings?.footer_tagline ? (
              <p className="mt-6 max-w-sm text-base leading-relaxed text-fg-300">
                {settings.footer_tagline}
              </p>
            ) : null}
            {profile ? (
              <div className="mt-8">
                <AvailabilityBadge
                  status={profile.availability_status}
                  text={profile.availability_text}
                />
              </div>
            ) : null}
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <p className="label-mono">Navigate</p>
            <ul className="mt-5 flex flex-col gap-1">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-10 items-center text-sm text-fg-300 transition-colors hover:text-fg-50"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="label-mono">Elsewhere</p>
            <ul className="mt-5 flex flex-col gap-1">
              {socialLinks.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-10 items-center gap-1.5 text-sm text-fg-300 transition-colors hover:text-fg-50"
                  >
                    {s.platform}
                    <ArrowUpRight
                      className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
              {email ? (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex min-h-10 items-center text-sm text-fg-100 transition-colors hover:text-ember-300"
                  >
                    {email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line-800 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-fg-500">{copyright}</p>
          <div className="flex items-center justify-between gap-6 sm:justify-end">
            <p className="label-mono">Built with Next.js + Supabase</p>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
