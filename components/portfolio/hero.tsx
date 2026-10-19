import { ArrowDownToLine } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CursorSpotlight } from "@/components/motion/cursor-spotlight";
import { Magnetic } from "@/components/motion/magnetic";
import { Parallax, ScrollFade } from "@/components/motion/parallax";
import { Reveal, SplitWords } from "@/components/motion/reveal";
import type { ClientLogo, Profile } from "@/types";
import { AvailabilityBadge } from "./availability-badge";
import { HeroPortrait } from "./hero-portrait";
import { LogoMarquee } from "./logo-marquee";
import { ROUTES } from "./routes";
import { ScrollCue } from "./scroll-cue";

const FALLBACK_NAME = "Paresh Suthar";
const FALLBACK_TITLE = "Full Stack Software Engineer";

function Tagline({ text }: { text: string }) {
  if (!text.includes("→")) return <>{text}</>;
  const parts = text.split("→");
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part.trim()}
          {i < parts.length - 1 ? (
            <span aria-hidden className="mx-3 text-ember-400">
              →
            </span>
          ) : null}
        </span>
      ))}
    </>
  );
}

export function Hero({
  profile,
  clientLogos = [],
}: {
  profile: Profile | null;
  clientLogos?: ClientLogo[];
}) {
  const name = profile?.full_name ?? FALLBACK_NAME;
  const title = profile?.professional_title ?? FALLBACK_TITLE;
  const line1 = profile?.hero_line_1 ?? name;
  const line2 = profile?.hero_line_2 ?? (profile?.hero_line_1 ? null : title);
  const keywords = profile?.hero_keywords?.filter(Boolean) ?? [];
  const kicker = [profile?.hero_kicker, profile?.location].filter(Boolean) as string[];
  const primary = profile?.cta_primary_text || "View work";
  const secondary = profile?.cta_secondary_text || "Get in touch";

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] flex-col overflow-hidden border-b border-line-800"
    >
      {/* Atmosphere: fine grid masked to the top-left, hairlines, grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(70%_60%_at_15%_10%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-20 h-px bg-line-800/70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full opacity-100 [background:radial-gradient(closest-side,rgb(232_82_31_/_0.10),transparent)]"
      />
      <CursorSpotlight />

      <ScrollFade className="relative container-x flex flex-1 flex-col pt-24 pb-10 sm:pt-28 lg:pt-32">
        <div className="grid flex-1 grid-cols-12 gap-x-8 gap-y-10 lg:items-center">
          {/* Portrait */}
          <Parallax
            speed={-0.12}
            className="order-1 col-span-12 lg:order-2 lg:col-span-5 lg:-mr-16 xl:-mr-24 2xl:-mr-32"
          >
            <HeroPortrait
              src={profile?.hero_photo ?? null}
              name={name}
              location={profile?.location}
              className="mx-auto w-full max-w-[min(100%,58svh)] sm:max-w-[min(100%,62svh)] lg:max-w-none"
            />
          </Parallax>

          {/* Type */}
          <Parallax speed={0.05} className="order-2 col-span-12 lg:order-1 lg:col-span-7">
            {kicker.length ? (
              <Reveal y={10} className="flex flex-wrap items-center gap-x-3 gap-y-1 label-mono">
                <span className="text-ember-400">{"//"}</span>
                <span className="text-fg-300">{kicker.join("  —  ")}</span>
              </Reveal>
            ) : null}

            <h1
              id="hero-heading"
              className="mt-6 font-display text-display-xl font-semibold text-balance text-fg-50"
            >
              <span className="block">
                <SplitWords text={line1} />
              </span>
              {line2 ? (
                <span className="block text-fg-300">
                  <SplitWords text={line2} delay={0.25} />
                </span>
              ) : null}
            </h1>

            {profile?.hero_tagline ? (
              <Reveal delay={0.5} y={14}>
                <p className="mt-7 max-w-2xl font-display text-display-sm font-normal text-fg-300">
                  <Tagline text={profile.hero_tagline} />
                </p>
              </Reveal>
            ) : null}

            {keywords.length ? (
              <Reveal delay={0.6} y={10}>
                <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 label-mono">
                  {keywords.map((k, i) => (
                    <span key={k} className="inline-flex items-center gap-2">
                      {i > 0 ? (
                        <span aria-hidden className="text-ember-500">
                          •
                        </span>
                      ) : null}
                      <span>{k}</span>
                    </span>
                  ))}
                </p>
              </Reveal>
            ) : null}

            <Reveal delay={0.7} y={12}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Magnetic className="w-full sm:w-auto">
                  <ButtonLink href={ROUTES.projects} size="lg" className="w-full sm:w-auto">
                    {primary}
                  </ButtonLink>
                </Magnetic>
                <ButtonLink
                  href={ROUTES.contact}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {secondary}
                </ButtonLink>
                {profile?.resume_url ? (
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-fg-300 underline-offset-4 transition-colors hover:text-fg-50 hover:underline sm:ml-2"
                  >
                    <ArrowDownToLine className="h-4 w-4" aria-hidden />
                    Download resume
                  </a>
                ) : null}
              </div>
            </Reveal>
          </Parallax>
        </div>
      </ScrollFade>

      {/* Bottom strip: client logos when available, otherwise the status bar */}
      {clientLogos.length ? (
        <LogoMarquee logos={clientLogos} />
      ) : (
        <div className="relative border-t border-line-800">
          <div className="container-x flex min-h-12 flex-wrap items-center justify-between gap-x-8 gap-y-2 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="flex items-center gap-3 label-mono">
                <span>STATUS</span>
                <span aria-hidden className="h-3 w-px bg-line-700" />
              </span>
              {profile ? (
                <AvailabilityBadge
                  status={profile.availability_status}
                  text={profile.availability_text}
                />
              ) : null}
            </div>
            <div className="hidden sm:block">
              <ScrollCue />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
