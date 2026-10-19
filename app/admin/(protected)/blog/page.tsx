import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { getPosts, postImagePath } from "@/lib/blog";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

/**
 * Read-only view of the file-based blog: every post, published or scheduled,
 * with its go-live date. Posts are Markdown files in content/blog, committed
 * to the repository, so editing happens in the code editor, not here.
 */
export default async function AdminBlogPage() {
  const posts = await getPosts({ includeScheduled: true });
  const now = new Date().toISOString();
  const published = posts.filter((p) => p.date <= now);
  const scheduled = posts.filter((p) => p.date > now).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description={`${published.length} published, ${scheduled.length} scheduled. Posts go live on their date automatically; pages refresh within an hour.`}
      />

      <div className="rounded-md border border-line-800 bg-surface-900 p-4 text-sm text-fg-300">
        Posts are Markdown files in <code className="text-fg-100">content/blog/</code>. To add one,
        copy an existing file, set its <code className="text-fg-100">date</code> to a Monday at{" "}
        <code className="text-fg-100">03:30:00Z</code> (09:00 IST), commit and push. The topic plan
        lives in <code className="text-fg-100">content/blog/_CALENDAR.md</code>.
      </div>

      {[
        { label: "Scheduled", list: scheduled, tone: "amber" as const },
        { label: "Published", list: published, tone: "success" as const },
      ].map(({ label, list, tone }) =>
        list.length ? (
          <section key={label} className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold text-fg-50">{label}</h2>
            <div className="overflow-x-auto rounded-md border border-line-800">
              <table className="w-full text-sm">
                <thead className="bg-surface-900 text-left label-mono">
                  <tr>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3">Read</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-800">
                  {list.map((p) => (
                    <tr key={p.slug} className="align-top">
                      <td className="px-4 py-3">
                        <div className="w-40 overflow-hidden rounded-sm border border-line-800 bg-surface-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={postImagePath(p)}
                            alt={p.image?.alt ?? ""}
                            width={1280}
                            height={720}
                            loading="lazy"
                            className="aspect-video w-full object-cover"
                          />
                        </div>
                        <p className="mt-1 w-40 text-[11px] leading-snug text-fg-700">
                          {p.image
                            ? `${p.image.credit}${p.image.license ? ` · ${p.image.license}` : ""}`
                            : "Generated cover"}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-fg-300">
                        {formatDate(p.date)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-fg-50">{p.title}</p>
                        <p className="mt-1 max-w-xl text-xs text-fg-500">{p.description}</p>
                        <p className="mt-1 font-mono text-[11px] text-fg-700">
                          content/blog/{p.slug}.md
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-fg-300">{p.tags.join(", ")}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-fg-300">
                        {p.readingMinutes} min
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={tone} mono>
                          {label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {p.date <= now ? (
                          <Link
                            href={`/blog/${p.slug}` as Route}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-fg-300 hover:text-fg-50"
                          >
                            View <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        ) : (
                          <span className="text-fg-700">Goes live {formatDate(p.date)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null,
      )}
    </>
  );
}
