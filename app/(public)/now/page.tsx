import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import CtaSection from "@/components/portfolio/cta-band";
import { PageHeader } from "@/components/portfolio/page-header";
import { Eyebrow, Section } from "@/components/portfolio/section";
import { Reveal } from "@/components/motion/reveal";
import { Prose } from "@/components/projects/prose";
import { getNowPage, getSiteSettings } from "@/lib/queries/public";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = pageMetadata({
  title: "Now: What I Am Building and Learning",
  description:
    "What Paresh Suthar is building and learning right now in Surat: the Growth Avenues platform, Docker and CI/CD, and what work he is open to.",
  path: "/now",
});

function clean(value: string | null | undefined) {
  if (!value) return null;
  const v = value.trim();
  if (!v || v.toUpperCase().startsWith("[PLACEHOLDER]")) return null;
  return v;
}

export default async function NowPage() {
  const [now, settings] = await Promise.all([getNowPage(), getSiteSettings()]);
  if (!now || !settings?.show_now_page) notFound();

  const blocks = [
    { label: "Currently building", text: clean(now.currently_building) },
    { label: "Currently learning", text: clean(now.currently_learning) },
    { label: "Current focus", text: clean(now.current_focus) },
    { label: "Open to", text: clean(now.open_to) },
  ].filter((b): b is { label: string; text: string } => Boolean(b.text));
  const updated = formatDate(now.updated_at);
  const latest = now.latest_project;

  return (
    <>
      <PageHeader
        backdrop={{ src: "/images/white-rann.webp", position: "50% 70%" }}
        eyebrow="NOW"
        title="What I'm doing now"
        aside={updated ? <p className="label-mono lg:text-right">Updated {updated}</p> : null}
      />
      <Section className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-3xl">
          {blocks.length ? (
            <div className="border-t border-line-800">
              {blocks.map((b, i) => (
                <Reveal
                  key={b.label}
                  delay={i * 0.05}
                  className="grid gap-4 border-b border-line-800 py-10 sm:grid-cols-[200px_1fr] sm:gap-8"
                >
                  <Eyebrow>{b.label}</Eyebrow>
                  <Prose text={b.text} />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="text-base leading-relaxed text-fg-300">
              This page is between updates. Check back soon.
            </p>
          )}

          {latest ? (
            <Reveal className="mt-12">
              <Eyebrow>Latest project</Eyebrow>
              <Link
                href={`/projects/${latest.slug}` as Route}
                className="group mt-5 inline-flex min-h-11 items-center gap-3"
              >
                <span className="font-display text-2xl font-semibold tracking-tight text-fg-50 transition-colors group-hover:text-ember-300 sm:text-3xl">
                  {latest.title}
                </span>
                <ArrowUpRight
                  className="h-5 w-5 text-fg-500 transition-colors group-hover:text-ember-400"
                  aria-hidden
                />
              </Link>
            </Reveal>
          ) : null}

          {updated ? <p className="mt-16 label-mono">Updated {updated}</p> : null}
        </div>
      </Section>
      <CtaSection />
    </>
  );
}
