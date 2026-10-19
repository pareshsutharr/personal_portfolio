import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { getProfile, getSiteSettings } from "@/lib/queries/public";
import { ROUTES } from "./routes";

/**
 * Closing call-to-action band. Presentational; inner pages import this
 * directly and pass their own copy, the home page uses `CtaSection`.
 */
export function CtaBand(props: {
  heading?: string | null;
  subheading?: string | null;
  buttonText?: string | null;
  email?: string | null;
}) {
  const heading = props.heading || "Have a project in mind?";
  const buttonText = props.buttonText || "Let's talk";

  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden border-t border-line-800 bg-bg-950"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(60%_80%_at_100%_100%,black,transparent)] opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 left-1/2 h-[28rem] w-[60rem] -translate-x-1/2 [background:radial-gradient(closest-side,rgb(232_82_31_/_0.12),transparent)]"
      />
      <div className="relative container-x py-24 sm:py-32 lg:py-40">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Reveal>
              <p className="flex items-center gap-3 label-mono">
                <span className="text-ember-400">{"//"}</span>
                <span>Contact</span>
              </p>
              <h2
                id="cta-heading"
                className="mt-6 font-display text-display-lg font-semibold text-balance text-fg-50"
              >
                {heading}
              </h2>
              {props.subheading ? (
                <p className="mt-6 max-w-xl text-base leading-relaxed text-fg-300 sm:text-lg">
                  {props.subheading}
                </p>
              ) : null}
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:col-span-4 lg:justify-self-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <Magnetic className="w-full sm:w-auto">
                <ButtonLink href={ROUTES.contact} size="lg" className="w-full sm:w-auto">
                  {buttonText}
                </ButtonLink>
              </Magnetic>
              {props.email ? (
                <a
                  href={`mailto:${props.email}`}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm text-fg-300 transition-colors hover:text-fg-50"
                >
                  {props.email}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Server wrapper: reads CTA copy + contact email from settings/profile. */
export default async function CtaSection() {
  const [settings, profile] = await Promise.all([getSiteSettings(), getProfile()]);
  return (
    <CtaBand
      heading={settings?.cta_heading}
      subheading={settings?.cta_subheading}
      buttonText={settings?.cta_button_text}
      email={profile?.email ?? settings?.contact_email ?? null}
    />
  );
}
