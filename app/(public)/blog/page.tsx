import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { CtaBand } from "@/components/portfolio/cta-band";
import { PageHeader } from "@/components/portfolio/page-header";
import { Section } from "@/components/portfolio/section";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { PostList } from "@/components/portfolio/post-list";
import { getPosts, getTags } from "@/lib/blog";
import { getProfile, getSiteSettings } from "@/lib/queries/public";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const DESCRIPTION =
  "Notes from real projects by Paresh Suthar, full stack developer in Surat: Node.js on a VPS, MongoDB, JWT and RBAC, Next.js, Supabase, Capacitor apps and the bugs in between.";

export const metadata: Metadata = pageMetadata({
  title: "Blog: Notes From Real Projects",
  description: DESCRIPTION,
  path: "/blog",
});

export default async function BlogPage() {
  const [posts, tags, settings, profile] = await Promise.all([
    getPosts(),
    getTags(),
    getSiteSettings(),
    getProfile(),
  ]);
  const topics = tags.filter((t) => t.count >= 2).slice(0, 14);

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
        {topics.length ? (
          <nav aria-label="Browse by topic" className="mb-10">
            <p className="label-mono">Browse by topic</p>
            <p className="mt-4 flex flex-wrap gap-2">
              {topics.map((t) => (
                <Link
                  key={t.tag}
                  href={`/blog/tag/${t.tag}` as Route}
                  className="hover:border-line-500 inline-flex min-h-9 items-center gap-2 rounded-sm border border-line-700 px-3 text-xs text-fg-300 transition-colors hover:text-fg-50"
                >
                  {t.label}
                  <span className="text-fg-600 tabular-nums">{t.count}</span>
                </Link>
              ))}
            </p>
          </nav>
        ) : null}
        {posts.length ? (
          <PostList posts={posts} />
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
