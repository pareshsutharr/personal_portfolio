import type { Metadata } from "next";
import { CtaBand } from "@/components/portfolio/cta-band";
import { DynamicIcon } from "@/components/portfolio/icon";
import { PageHeader } from "@/components/portfolio/page-header";
import { Section } from "@/components/portfolio/section";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { getProfile, getServices, getSiteSettings } from "@/lib/queries/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils/cn";
import { padIndex } from "@/lib/utils/format";

const DESCRIPTION = "The kinds of work I take on, with examples from real projects.";

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description: DESCRIPTION,
  path: "/services",
});

export default async function ServicesPage() {
  const [services, profile, settings] = await Promise.all([
    getServices(),
    getProfile(),
    getSiteSettings(),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />
      <PageHeader
        backdrop={{ src: "/images/sunrise-from-the-edge.webp", position: "50% 36%" }}
        eyebrow="SERVICES"
        title="What I do."
        description={DESCRIPTION}
      />

      <Section className="py-16 sm:py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              {profile?.what_i_build ? (
                <Reveal>
                  <p className="label-mono">What I build</p>
                  <p className="mt-5 font-display text-xl leading-snug font-normal tracking-tight text-balance text-fg-100 sm:text-2xl">
                    {profile.what_i_build}
                  </p>
                </Reveal>
              ) : null}
              {services.length ? (
                <p className="mt-8 label-mono">
                  <span className="text-fg-100 tabular-nums">{padIndex(services.length)}</span>
                  <span className="ml-3">Services</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 lg:col-span-8">
            {services.length ? (
              <ol className="border-t border-line-800">
                {services.map((s, i) => (
                  <li key={s.id} className="border-b border-line-800">
                    <Reveal
                      delay={Math.min(i, 4) * 0.05}
                      className={cn(
                        "grid gap-4 sm:grid-cols-[72px_1fr] sm:gap-8",
                        s.featured ? "py-10 sm:py-12" : "py-7 sm:py-8",
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono tabular-nums",
                          s.featured ? "text-sm text-ember-400" : "text-[11px] text-fg-500",
                        )}
                      >
                        {padIndex(i + 1)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <h2
                            className={cn(
                              "font-display font-semibold tracking-tight text-balance text-fg-50",
                              s.featured ? "text-display-sm" : "text-xl sm:text-2xl",
                            )}
                          >
                            {s.title}
                          </h2>
                          {s.icon ? (
                            <DynamicIcon
                              name={s.icon}
                              className={cn(
                                "mt-1 shrink-0",
                                s.featured ? "h-5 w-5 text-ember-400" : "h-4 w-4 text-fg-500",
                              )}
                            />
                          ) : null}
                        </div>
                        {s.description ? (
                          <p
                            className={cn(
                              "mt-3 max-w-2xl leading-relaxed text-fg-300",
                              s.featured ? "text-base sm:text-lg" : "text-sm sm:text-base",
                            )}
                          >
                            {s.description}
                          </p>
                        ) : null}
                        {s.featured ? (
                          <p className="mt-5 label-mono text-ember-400">Core service</p>
                        ) : null}
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="Services will be published soon." />
            )}
          </div>
        </div>
      </Section>

      <CtaBand
        heading="Have a project? Send me the details."
        subheading={settings?.cta_subheading}
        buttonText={settings?.cta_button_text}
        email={profile?.email ?? settings?.contact_email ?? null}
      />
    </>
  );
}
