import Link from "next/link";
import type { Route } from "next";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { postImagePath, tagLabel, type Post } from "@/lib/blog";
import { formatDate } from "@/lib/utils/format";

/** The blog's post rows, shared by the index and the tag hub pages. */
export function PostList({ posts }: { posts: Post[] }) {
  return (
    <Stagger className="divide-y divide-line-800 border-y border-line-800">
      {posts.map((p) => (
        <StaggerItem key={p.slug} as="div">
          <div className="group grid gap-5 py-8 sm:grid-cols-12 sm:gap-8 sm:py-10">
            <div className="sm:col-span-4">
              <Link
                href={`/blog/${p.slug}` as Route}
                className="block overflow-hidden rounded-sm border border-line-800 bg-surface-900"
                tabIndex={-1}
                aria-hidden
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={postImagePath(p)}
                  alt={p.image?.alt ?? ""}
                  width={1280}
                  height={720}
                  loading="lazy"
                  className="aspect-video w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                />
              </Link>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 label-mono">
                <time dateTime={p.date}>{formatDate(p.date)}</time>
                <span className="text-fg-500">{p.readingMinutes} min read</span>
              </p>
            </div>
            <div className="min-w-0 sm:col-span-8">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-balance text-fg-50 sm:text-3xl">
                <Link
                  href={`/blog/${p.slug}` as Route}
                  className="transition-colors group-hover:text-ember-300 hover:text-ember-300"
                >
                  {p.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-fg-300">
                {p.description}
              </p>
              {p.tags.length ? (
                <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 label-mono text-fg-500">
                  {p.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/blog/tag/${t}` as Route}
                      className="transition-colors hover:text-fg-100"
                    >
                      #{tagLabel(t)}
                    </Link>
                  ))}
                </p>
              ) : null}
            </div>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
