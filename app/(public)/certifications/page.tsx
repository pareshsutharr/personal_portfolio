import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import CtaSection from "@/components/portfolio/cta-band";
import { PageHeader } from "@/components/portfolio/page-header";
import { Section } from "@/components/portfolio/section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { getCertifications } from "@/lib/queries/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { formatMonthYear, padIndex } from "@/lib/utils/format";
import { isOptimizableImage } from "@/lib/utils/image";

const DESCRIPTION =
  "Credentials and certificates, with issuer and verification links where available.";

export const metadata: Metadata = pageMetadata({
  title: "Certifications",
  description: DESCRIPTION,
  path: "/certifications",
});

export default async function CertificationsPage() {
  const certifications = await getCertifications();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Certifications", path: "/certifications" },
        ])}
      />
      <PageHeader
        eyebrow="CERTIFICATIONS"
        title="Certifications"
        description={DESCRIPTION}
        aside={
          certifications.length ? (
            <p className="label-mono">
              <span className="font-display text-3xl font-semibold text-fg-50 tabular-nums">
                {padIndex(certifications.length)}
              </span>
              <span className="ml-3">Credentials</span>
            </p>
          ) : null
        }
      />

      <Section className="py-16 sm:py-20 lg:py-28">
        {certifications.length ? (
          <ol className="border-t border-line-800">
            {certifications.map((c, i) => {
              const issued = formatMonthYear(c.issue_date);
              const expires = formatMonthYear(c.expiry_date);
              return (
                <li key={c.id} className="border-b border-line-800">
                  <Reveal className="grid gap-6 py-8 lg:grid-cols-12 lg:items-start lg:gap-8">
                    <div className="flex items-start gap-5 lg:col-span-7">
                      <span className="pt-1 font-mono text-[11px] text-ember-400 tabular-nums">
                        {padIndex(i + 1)}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-display text-xl font-semibold tracking-tight text-fg-50 sm:text-2xl">
                          {c.title}
                        </h2>
                        {c.issuer ? <p className="mt-1.5 text-sm text-fg-300">{c.issuer}</p> : null}
                        {c.description ? (
                          <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-300">
                            {c.description}
                          </p>
                        ) : null}
                        {c.skills.length ? (
                          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">
                            {c.skills.map((s) => (
                              <li key={s}>
                                <Badge tone="outline">{s}</Badge>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 pl-10 lg:col-span-3 lg:pl-0">
                      {issued ? (
                        <div>
                          <dt className="label-mono">Issued</dt>
                          <dd className="mt-2 text-sm text-fg-100">{issued}</dd>
                        </div>
                      ) : null}
                      {expires ? (
                        <div>
                          <dt className="label-mono">Expires</dt>
                          <dd className="mt-2 text-sm text-fg-100">{expires}</dd>
                        </div>
                      ) : null}
                      {c.credential_id ? (
                        <div className="col-span-2">
                          <dt className="label-mono">Credential ID</dt>
                          <dd className="mt-2 font-mono text-xs break-all text-fg-100">
                            {c.credential_id}
                          </dd>
                        </div>
                      ) : null}
                      {c.credential_url ? (
                        <div className="col-span-2">
                          <a
                            href={c.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-2 label-mono text-fg-100 transition-colors hover:text-ember-300"
                          >
                            Verify credential
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        </div>
                      ) : null}
                    </dl>

                    {c.certificate_image ? (
                      <div className="pl-10 lg:col-span-2 lg:pl-0">
                        <a
                          href={c.credential_url ?? c.certificate_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block aspect-[4/3] w-40 overflow-hidden rounded-sm border border-line-700 bg-surface-900 lg:w-full"
                          aria-label={`${c.title} certificate`}
                        >
                          <Image
                            src={c.certificate_image}
                            alt={`${c.title} certificate`}
                            fill
                            sizes="(min-width: 1024px) 15vw, 160px"
                            unoptimized={!isOptimizableImage(c.certificate_image)}
                            className="object-cover"
                          />
                        </a>
                      </div>
                    ) : null}
                  </Reveal>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState
            title="No certifications published yet."
            description="Credentials will appear here once they are added."
          />
        )}
      </Section>

      <CtaSection />
    </>
  );
}
