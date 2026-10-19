import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CtaBand } from "@/components/portfolio/cta-band";
import { PageHeader } from "@/components/portfolio/page-header";
import { PostList } from "@/components/portfolio/post-list";
import { Section } from "@/components/portfolio/section";
import { JsonLd } from "@/components/seo/json-ld";
import { getPostsByTag, getTags, tagIntro, tagLabel } from "@/lib/blog";
import { getProfile, getSiteSettings } from "@/lib/queries/public";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getTags()).map((t) => ({ tag: t.tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);
  if (!posts.length) return { title: "Topic not found", robots: { index: false } };
  const label = tagLabel(tag);
  return pageMetadata({
    title: `${label}: ${posts.length} ${posts.length === 1 ? "post" : "posts"} from real projects`,
    description: tagIntro(tag, posts.length),
    path: `/blog/tag/${tag}`,
  });
}

/** Topic hub: every post with this tag, with an intro so the page ranks for the topic itself. */
export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const [posts, settings, profile] = await Promise.all([
    getPostsByTag(tag),
    getSiteSettings(),
    getProfile(),
  ]);
  if (!posts.length) notFound();
  const label = tagLabel(tag);
  const intro = tagIntro(tag, posts.length);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${label} posts`,
            description: intro,
            url: absoluteUrl(`/blog/tag/${tag}`),
            isPartOf: { "@type": "Blog", name: "Paresh Suthar's blog", url: absoluteUrl("/blog") },
            hasPart: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: p.date,
            })),
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: label, path: `/blog/tag/${tag}` },
          ]),
        ]}
      />
      <PageHeader
        backdrop={{ src: "/images/old-fort-gate.webp", position: "50% 30%" }}
        eyebrow="TOPIC"
        title={label}
        description={intro}
        aside={
          <Link
            href={"/blog" as Route}
            className="inline-flex min-h-11 items-center gap-1.5 label-mono text-fg-300 transition-colors hover:text-fg-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All posts
          </Link>
        }
      />
      <Section>
        <PostList posts={posts} />
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
