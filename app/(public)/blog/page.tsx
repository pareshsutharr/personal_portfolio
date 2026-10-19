import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { CtaBand } from "@/components/portfolio/cta-band";
import { PageHeader } from "@/components/portfolio/page-header";
import { Section } from "@/components/portfolio/section";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { getPosts, postImagePath } from "@/lib/blog";
import { getProfile, getSiteSettings } from "@/lib/queries/public";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 3600;

const DESCRIPTION =
  "Notes from real projects by Paresh Suthar, full stack developer in Surat: Node.js on a VPS, MongoDB, JWT and RBAC, Next.js, Supabase, Capacitor apps and the bugs in between.";

export const metadata: Metadata = pageMetadata({
  title: "Blog: Notes From Real Projects",
  description: DESCRIPTION,
  path: "/blog",
});

export default async function BlogPage() {
  const [posts, settings, profile] = await Promise.all([
    getPosts(),
    getSiteSettings(),
    getProfile(),
  ]);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Paresh Suthar's blog",
            url: absoluteUrl("/blog"),
            description: DESCRIPTION,
            author: { "@type": "Person", name: "Paresh Suthar", url: absoluteUrl("/") },
            blogPost: posts.slice(0, 20).map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: p.date,
              keywords: [...p.tags, ...p.keywords],
            })),
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />
      <PageHeader
        backdrop={{ src: "/images/old-fort-gate.webp", position: "50% 30%" }}
        eyebrow="BLOG"
        title="Notes from real projects."
        description="What broke, what I did about it, and where I read up. Each post comes from something I shipped."
        aside={
          <a
            href="/feed.xml"
            className="inline-flex min-h-11 items-center gap-1.5 label-mono text-fg-300 transition-colors hover:text-fg-50"
          >
            RSS feed <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        }
      />

      <Section>
        {posts.length ? (
          <Stagger className="divide-y divide-line-800 border-y border-line-800">
            {posts.map((p) => (
              <StaggerItem key={p.slug} as="div">
                <Link
                  href={`/blog/${p.slug}` as Route}
                  className="group grid gap-5 py-8 sm:grid-cols-12 sm:gap-8 sm:py-10"
                >
                  <div className="sm:col-span-4">
                    <div className="overflow-hidden rounded-sm border border-line-800 bg-surface-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={postImagePath(p)}
                        alt={p.image?.alt ?? ""}
                        width={1280}
                        height={720}
                        loading="lazy"
                        className="aspect-video w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 label-mono">
                      <time dateTime={p.date}>{formatDate(p.date)}</time>
                      <span className="text-fg-500">{p.readingMinutes} min read</span>
                    </p>
                  </div>
                  <div className="min-w-0 sm:col-span-8">
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-balance text-fg-50 transition-colors group-hover:text-ember-300 sm:text-3xl">
                      {p.title}
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-fg-300">
                      {p.description}
                    </p>
                    {p.tags.length ? (
                      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 label-mono text-fg-500">
                        {p.tags.map((t) => (
                          <span key={t}>#{t}</span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState title="The first post is on its way." />
        )}
      </Section>

      <CtaBand
        heading={settings?.cta_heading}
        subheading={settings?.cta_subheading}
        buttonText={settings?.cta_button_text}
        email={profile?.email ?? settings?.contact_email ?? null}
      />
    </>
  );
}
