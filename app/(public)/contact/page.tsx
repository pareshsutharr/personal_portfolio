import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { AvailabilityBadge } from "@/components/portfolio/availability-badge";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { getProfile, getSiteSettings, getSocialLinks } from "@/lib/queries/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { titleCase } from "@/lib/utils/format";

const DESCRIPTION = "Tell me what you are building. I read every message and reply personally.";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: DESCRIPTION,
  path: "/contact",
});

const PLATFORM_LABELS: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  portfolio: "Portfolio",
  email: "Email",
  whatsapp: "WhatsApp",
};

export default async function ContactPage() {
  const [profile, settings, socialLinks] = await Promise.all([
    getProfile(),
    getSiteSettings(),
    getSocialLinks(),
  ]);

  const email = profile?.email ?? settings?.contact_email ?? null;
  const phone = profile?.phone ?? settings?.contact_phone ?? null;
  const location = profile?.location ?? settings?.location ?? null;
  const social = socialLinks.filter((s) => s.platform !== "email");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <section className="relative overflow-hidden border-b border-line-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(60%_60%_at_30%_0%,black,transparent)] opacity-60"
        />
        <div className="relative container-x pt-32 pb-16 sm:pt-40 sm:pb-20 lg:pt-44 lg:pb-28">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            {/* Left: intro + channels */}
            <div className="lg:col-span-5">
              <p className="label-mono">Contact</p>
              <h1 className="mt-6 font-display text-display-lg font-semibold text-balance text-fg-50">
                Let&apos;s build something.
              </h1>
              {settings?.cta_subheading ? (
                <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-300">
                  {settings.cta_subheading}
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

              <dl className="mt-12 divide-y divide-line-800 border-y border-line-800">
                {email ? (
                  <div className="grid grid-cols-[96px_1fr] items-center gap-4 py-4">
                    <dt className="flex items-center gap-2 label-mono">
                      <Mail className="h-3.5 w-3.5" aria-hidden />
                      Email
                    </dt>
                    <dd>
                      <a
                        href={`mailto:${email}`}
                        className="inline-flex min-h-11 items-center text-sm break-all text-fg-100 transition-colors hover:text-ember-300"
                      >
                        {email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {phone ? (
                  <div className="grid grid-cols-[96px_1fr] items-center gap-4 py-4">
                    <dt className="flex items-center gap-2 label-mono">
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      Phone
                    </dt>
                    <dd>
                      <a
                        href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                        className="inline-flex min-h-11 items-center text-sm text-fg-100 transition-colors hover:text-ember-300"
                      >
                        {phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {location ? (
                  <div className="grid grid-cols-[96px_1fr] items-center gap-4 py-4">
                    <dt className="flex items-center gap-2 label-mono">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      Location
                    </dt>
                    <dd className="text-sm text-fg-100">{location}</dd>
                  </div>
                ) : null}
              </dl>

              {social.length ? (
                <div className="mt-10">
                  <p className="label-mono">Elsewhere</p>
                  <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                    {social.map((s) => (
                      <li key={s.id}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex min-h-11 items-center gap-1.5 text-sm text-fg-300 transition-colors hover:text-fg-50"
                        >
                          {PLATFORM_LABELS[s.platform] ?? titleCase(s.platform)}
                          {s.username ? (
                            <span className="font-mono text-xs text-fg-500">
                              @{s.username.replace(/^@/, "")}
                            </span>
                          ) : null}
                          <ArrowUpRight
                            className="h-3.5 w-3.5 text-fg-500 transition-colors group-hover:text-ember-400"
                            aria-hidden
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Right: form */}
            <div className="lg:col-span-7">
              <Reveal y={16}>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
