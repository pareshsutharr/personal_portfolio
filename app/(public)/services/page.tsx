import type { Metadata } from "next";
import { CtaBand } from "@/components/portfolio/cta-band";
import { DynamicIcon } from "@/components/portfolio/icon";
import { PageHeader } from "@/components/portfolio/page-header";
import { Section } from "@/components/portfolio/section";
import { ServiceEnquiry } from "@/components/contact/service-enquiry";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { getProfile, getServices, getSiteSettings } from "@/lib/queries/public";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, siteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils/cn";
import { padIndex } from "@/lib/utils/format";

const FAQ = [
  {
    q: "Do you work with clients outside Surat?",
    a: "Yes. Most of my freelance work is remote. I am based in Surat, Gujarat, and work with clients across India, with calls on WhatsApp or Google Meet.",
  },
  {
    q: "What do you build?",
    a: "Websites and web apps in React and Next.js, REST APIs in Node.js and Express, admin back offices, HR and CRM tools, Android and iOS apps, and the Linux servers they run on.",
  },
  {
    q: "Can you take over an existing project?",
    a: "Yes. I have taken over PHP, React and Node.js codebases, fixed what was slow or broken, and kept them running. Send me the repo or a description and I will tell you what I think.",
  },
  {
    q: "Do you handle hosting and deployment?",
    a: "Yes. I set up Linux VPS servers with Nginx, PM2 and SSL, or deploy to Vercel when it fits, and I handle domains and monitoring afterwards.",
  },
  {
    q: "How do you charge?",
    a: "Fixed price for well-defined builds, otherwise by the week. The contact form asks for a rough budget so I can tell you quickly whether the fit is right.",
  },
  {
    q: "Are you open to full-time roles?",
    a: "Yes. I currently work on the Growth Avenues broking platform in Surat and am open to full-time full stack roles, remote, in Surat or with relocation.",
  },
];

const DESCRIPTION =
  "Full stack developer in Surat, India for web apps, mobile apps, admin systems, REST APIs and deployment. React, Node.js, MongoDB and Postgres, real examples.";

export const metadata: Metadata = pageMetadata({
  title: "Full Stack Development Services in Surat",
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
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Services",
            itemListElement: services.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Service",
                name: s.title,
                description: s.description ?? undefined,
                url: absoluteUrl(`/services#${s.slug}`),
                serviceType: s.title,
                areaServed: ["Surat", "Gujarat", "India", "Remote"],
                provider: { "@type": "Person", name: "Paresh Suthar", url: siteUrl() },
              },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />
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
                  <li key={s.id} id={s.slug} className="scroll-mt-28 border-b border-line-800">
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
                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                          <ServiceEnquiry title={s.title} slug={s.slug} />
                          {s.featured ? (
                            <p className="label-mono text-ember-400">Core service</p>
                          ) : null}
                        </div>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="Services will be published soon." />
            )}

            <section aria-labelledby="faq-heading" className="mt-20 border-t border-line-800 pt-12">
              <p className="label-mono">Questions</p>
              <h2
                id="faq-heading"
                className="mt-4 font-display text-display-sm font-semibold tracking-tight text-fg-50"
              >
                Things people ask before they write.
              </h2>
              <dl className="mt-8 divide-y divide-line-800 border-b border-line-800">
                {FAQ.map((f) => (
                  <div key={f.q} className="grid gap-3 py-6 sm:grid-cols-12 sm:gap-8">
                    <dt className="font-display text-lg font-semibold tracking-tight text-fg-50 sm:col-span-5">
                      {f.q}
                    </dt>
                    <dd className="text-base leading-relaxed text-fg-300 sm:col-span-7">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
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
