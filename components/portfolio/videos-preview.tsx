import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { isOptimizableImage } from "@/lib/utils/image";
import { parseVideoUrl } from "@/lib/utils/video";
import type { SocialLink, Video } from "@/types";
import { ROUTES } from "./routes";
import { Section, SectionHeader } from "./section";

/**
 * Three recent videos from the YouTube channel, each linking straight to the
 * video, plus a link to the channel. Keeps the landing page short; the full
 * gallery with playlists is on /experience.
 */
export function VideosPreview({
  videos,
  youtube,
  index,
}: {
  videos: Video[];
  youtube: SocialLink | null;
  index: number;
}) {
  const list = [...videos]
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, 3);
  if (!list.length) return null;

  return (
    <Section className="bg-bg-900">
      <SectionHeader
        index={index}
        eyebrow="YouTube"
        title="I also teach on YouTube."
        description={`${videos.length} videos on Java, JavaScript, jQuery and PHP, recorded for beginners.`}
        action={
          youtube ? (
            <ButtonLink
              href={youtube.url}
              variant="outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the channel
            </ButtonLink>
          ) : (
            <ButtonLink href={ROUTES.experience} variant="outline">
              All videos
            </ButtonLink>
          )
        }
      />
      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => {
          const embed = parseVideoUrl(v.video_url);
          const thumb = v.thumbnail_url ?? embed.thumbnail;
          return (
            <StaggerItem key={v.id} className="min-w-0">
              <a
                href={v.video_url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="view"
                className="group block"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-line-800 bg-surface-900">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={v.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={!isOptimizableImage(thumb)}
                      className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 grid-lines" />
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                  />
                  {v.duration ? (
                    <span className="absolute right-3 bottom-3 rounded-xs bg-black/70 px-1.5 py-0.5 font-mono text-[11px] text-fg-100">
                      {v.duration}
                    </span>
                  ) : null}
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-fg-50/30 bg-black/50 text-fg-50 backdrop-blur-[2px] transition-transform duration-300 group-hover:scale-110">
                      <Play className="ml-0.5 h-4 w-4" />
                    </span>
                  </span>
                </div>
                <h3 className="mt-4 line-clamp-2 font-display text-base font-semibold tracking-tight [overflow-wrap:anywhere] text-fg-50 sm:text-lg">
                  {v.title}
                  <ArrowUpRight
                    className="ml-1 inline h-[0.8em] w-[0.8em] text-fg-500 transition-colors group-hover:text-ember-400"
                    aria-hidden
                  />
                </h3>
                {v.playlist ? <p className="mt-1.5 label-mono">{v.playlist}</p> : null}
              </a>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
