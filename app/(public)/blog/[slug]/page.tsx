import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CtaBand } from "@/components/portfolio/cta-band";
import { Section } from "@/components/portfolio/section";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getPost,
  getPosts,
  getRelatedPosts,
  postCoverPath,
  postImagePath,
  tagLabel,
} from "@/lib/blog";
import { getProfile, getSiteSettings } from "@/lib/queries/public";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found", robots: { index: false } };
  const meta = pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    image: postCoverPath(post),
  });
  return {
    ...meta,
    // Post titles stand on their own; the site name is already in the Open Graph site_name.
    title: { absolute: post.title },
    keywords: [...post.tags, ...post.keywords],
    alternates: {
      ...meta.alternates,
      types: { "text/markdown": absoluteUrl(`/blog/${post.slug}.md`) },
    },
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [absoluteUrl("/about")],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const [related, settings, profile] = await Promise.all([
    getRelatedPosts(post),
    getSiteSettings(),
    getProfile(),
  ]);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            url: absoluteUrl(`/blog/${post.slug}`),
            mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            keywords: [...post.tags, ...post.keywords].join(", "),
            wordCount: post.text.split(" ").length,
            inLanguage: "en",
            ...(post.summary ? { abstract: post.summary } : {}),
            articleSection: post.tags.map(tagLabel),
            isAccessibleForFree: true,
            author: {
              "@type": "Person",
              name: "Paresh Suthar",
              url: absoluteUrl("/about"),
              jobTitle: "Full Stack Developer",
            },
            publisher: { "@type": "Person", name: "Paresh Suthar", url: absoluteUrl("/") },
            image: absoluteUrl(postCoverPath(post)),
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          ...(post.faq.length
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: post.faq.map((f) => ({
                    "@type": "Question",
                    name: f.q,
                    acceptedAnswer: { "@type": "Answer", text: f.a },
                  })),
                },
              ]
            : []),
        ]}
      />

      <article>
        <header className="relative overflow-hidden border-b border-line-800">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(60%_60%_at_30%_0%,black,transparent)] opacity-60"
          />
          <div className="relative container-x pt-32 pb-12 sm:pt-40 sm:pb-16 lg:pt-44">
            <div className="max-w-3xl">
              <Link
                href={"/blog" as Route}
                className="inline-flex min-h-11 items-center gap-2 label-mono text-fg-300 transition-colors hover:text-fg-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Blog
              </Link>
              <h1 className="mt-6 font-display text-display-md font-semibold text-balance text-fg-50">
                {post.title}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-fg-300">{post.description}</p>
              <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 label-mono">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className="text-fg-500">{post.readingMinutes} min read</span>
                {post.updated ? (
                  <span className="text-fg-500">Updated {formatDate(post.updated)}</span>
                ) : null}
                <Link
                  href={"/about" as Route}
                  rel="author"
                  className="text-fg-500 transition-colors hover:text-fg-50"
                >
                  By Paresh Suthar
                </Link>
              </p>
            </div>
          </div>
        </header>

        <Section>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="min-w-0 lg:col-span-8">
              <Reveal className="mb-10">
                <figure className="overflow-hidden rounded-md border border-line-800 bg-surface-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={postImagePath(post)}
                    alt={post.image?.alt ?? ""}
                    width={1280}
                    height={720}
                    fetchPriority="high"
                    className="aspect-video w-full object-cover"
                  />
                  {post.image ? (
                    <figcaption className="border-t border-line-800 px-4 py-2 text-xs text-fg-500">
                      Photo: {post.image.credit}
                      {post.image.license ? ` (${post.image.license})` : null}
                      {post.image.creditUrl ? (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            href={post.image.creditUrl}
                            rel="noopener noreferrer license"
                            target="_blank"
                            className="underline decoration-line-700 underline-offset-2 hover:text-fg-300"
                          >
                            source
                          </a>
                        </>
                      ) : null}
                    </figcaption>
                  ) : null}
                </figure>
              </Reveal>
              {post.summary ? (
                <Reveal className="mb-10">
                  <div className="rounded-md border border-line-800 bg-surface-900 p-5 sm:p-6">
                    <p className="label-mono">In short</p>
                    <p className="mt-3 text-base leading-relaxed text-fg-100">{post.summary}</p>
                  </div>
                </Reveal>
              ) : null}
              <Reveal>
                <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.html }} />
              </Reveal>
              {post.faq.length ? (
                <Reveal>
                  <section
                    aria-labelledby="post-faq"
                    className="mt-14 border-t border-line-800 pt-10"
                  >
                    <p className="label-mono">Questions</p>
                    <h2
                      id="post-faq"
                      className="mt-3 font-display text-2xl font-semibold tracking-tight text-fg-50"
                    >
                      Questions people ask
                    </h2>
                    <dl className="mt-6 divide-y divide-line-800 border-b border-line-800">
                      {post.faq.map((f) => (
                        <div key={f.q} className="py-5">
                          <dt className="font-display text-lg font-semibold tracking-tight text-fg-50">
                            {f.q}
                          </dt>
                          <dd className="mt-2 text-base leading-relaxed text-fg-300">{f.a}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </Reveal>
              ) : null}
              <p className="mt-10 label-mono text-fg-500">
                <a href={`/blog/${post.slug}.md`} className="transition-colors hover:text-fg-100">
                  Read as Markdown
                </a>
              </p>
            </div>
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                {post.tags.length ? (
                  <>
                    <p className="label-mono">Topics</p>
                    <p className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((t) => (
                        <Link
                          key={t}
                          href={`/blog/tag/${t}` as Route}
                          className="hover:border-line-500 rounded-sm border border-line-700 px-2.5 py-1 text-xs text-fg-300 transition-colors hover:text-fg-50"
                        >
                          {tagLabel(t)}
                        </Link>
                      ))}
                    </p>
                  </>
                ) : null}
                {post.project ? (
                  <Link
                    href={`/projects/${post.project}` as Route}
                    className="mt-8 flex items-center justify-between gap-3 rounded-md border border-line-800 bg-surface-900 p-4 text-sm text-fg-100 transition-colors hover:border-line-600"
                  >
                    <span>
                      <span className="block label-mono">From the project</span>
                      <span className="mt-1 block font-medium">See the case study</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-ember-400" aria-hidden />
                  </Link>
                ) : null}
                {related.length ? (
                  <div className="mt-10">
                    <p className="label-mono">Related</p>
                    <ul className="mt-4 divide-y divide-line-800 border-y border-line-800">
                      {related.map((r) => (
                        <li key={r.slug}>
                          <Link
                            href={`/blog/${r.slug}` as Route}
                            className="block py-3 text-sm text-fg-100 transition-colors hover:text-ember-300"
                          >
                            {r.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </Section>
      </article>

      <CtaBand
        heading={settings?.cta_heading}
        subheading={settings?.cta_subheading}
        buttonText={settings?.cta_button_text}
        email={profile?.email ?? settings?.contact_email ?? null}
      />
    </>
  );
}
