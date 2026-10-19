import Link from "next/link";
import type { Route } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Post } from "@/lib/blog";
import { formatDate } from "@/lib/utils/format";
import { Section, SectionHeader } from "./section";

/** Three latest blog posts for the landing page. */
export function WritingPreview({ posts, index }: { posts: Post[]; index: number }) {
  const list = posts.slice(0, 3);
  if (!list.length) return null;

  return (
    <Section className="bg-bg-950">
      <SectionHeader
        index={index}
        eyebrow="Blog"
        title="Notes from real projects."
        description="What broke, what I did about it, and where I read up."
        action={
          <ButtonLink href={"/blog" as Route} variant="outline">
            All posts
          </ButtonLink>
        }
      />
      <Stagger className="grid gap-px border border-line-800 bg-line-800 sm:grid-cols-3">
        {list.map((p) => (
          <StaggerItem key={p.slug} className="bg-bg-950">
            <Link
              href={`/blog/${p.slug}` as Route}
              className="group flex h-full flex-col justify-between p-6 transition-colors hover:bg-surface-900 sm:p-8"
            >
              <div>
                <p className="flex items-center gap-4 label-mono">
                  <time dateTime={p.date}>{formatDate(p.date)}</time>
                  <span className="text-fg-500">{p.readingMinutes} min</span>
                </p>
                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-balance text-fg-50 transition-colors group-hover:text-ember-300">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-300">{p.description}</p>
              </div>
              {p.tags.length ? (
                <p className="mt-6 flex flex-wrap gap-x-3 label-mono text-fg-500">
                  {p.tags.slice(0, 3).map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </p>
              ) : null}
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
