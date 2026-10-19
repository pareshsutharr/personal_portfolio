"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown, ExternalLink, ListVideo, Play, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils/cn";
import { isOptimizableImage } from "@/lib/utils/image";
import { parseVideoUrl } from "@/lib/utils/video";
import type { Video } from "@/types";

type Group = { name: string; url: string | null; videos: Video[] };

const PAGE_SIZE = 6;

function groupByPlaylist(videos: Video[]): Group[] {
  const map = new Map<string, Group>();
  for (const v of videos) {
    const name = v.playlist?.trim() || "Other videos";
    const g = map.get(name) ?? { name, url: v.playlist_url ?? null, videos: [] };
    g.url ??= v.playlist_url ?? null;
    g.videos.push(v);
    map.set(name, g);
  }
  // Keep "Other videos" last.
  return [...map.values()].sort((a, b) =>
    a.name === "Other videos" ? 1 : b.name === "Other videos" ? -1 : 0,
  );
}

/**
 * Videos grouped by playlist. A filter row switches between "All" and each
 * playlist; YouTube and Vimeo play in a dialog, files with <video>, other
 * links open in a new tab.
 */
export function VideoGallery({ videos, className }: { videos: Video[]; className?: string }) {
  const [active, setActive] = React.useState<Video | null>(null);
  const groups = React.useMemo(() => groupByPlaylist(videos), [videos]);
  const [selected, setSelected] = React.useState<string>("all");
  const multi = groups.length > 1;
  const visible = selected === "all" ? groups : groups.filter((g) => g.name === selected);
  // Per-playlist visible count; long playlists reveal in pages so the page stays scannable on phones.
  const [shown, setShown] = React.useState<Record<string, number>>({});
  const limitFor = (g: Group) => shown[g.name] ?? PAGE_SIZE;

  return (
    <div className={className}>
      {multi ? (
        <div
          role="tablist"
          aria-label="Playlists"
          className="-mx-4 mb-10 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <FilterChip active={selected === "all"} onClick={() => setSelected("all")}>
            All <span className="ml-1.5 text-fg-500">{videos.length}</span>
          </FilterChip>
          {groups.map((g) => (
            <FilterChip
              key={g.name}
              active={selected === g.name}
              onClick={() => setSelected(g.name)}
            >
              {g.name} <span className="ml-1.5 text-fg-500">{g.videos.length}</span>
            </FilterChip>
          ))}
        </div>
      ) : null}

      <div className="space-y-16">
        {visible.map((g) => (
          <section key={g.name} aria-label={g.name}>
            {multi ? (
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line-800 pb-4">
                <div className="flex items-center gap-3">
                  <ListVideo className="h-4 w-4 text-ember-400" aria-hidden />
                  <h3 className="font-display text-xl font-semibold tracking-tight text-fg-50">
                    {g.name}
                  </h3>
                  <span className="label-mono">{g.videos.length} videos</span>
                </div>
                {g.url ? (
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-fg-300 underline-offset-4 hover:text-fg-50 hover:underline"
                  >
                    Open playlist <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            ) : null}
            <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.videos.slice(0, limitFor(g)).map((v, i) => (
                <StaggerItem key={v.id} as="div" className="min-w-0">
                  <VideoCard video={v} index={i} onOpen={() => setActive(v)} />
                </StaggerItem>
              ))}
            </Stagger>
            {g.videos.length > limitFor(g) ? (
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-line-800 pt-6">
                <span className="label-mono">
                  {Math.min(limitFor(g), g.videos.length)} / {g.videos.length} videos
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setShown((prev) => ({ ...prev, [g.name]: limitFor(g) + PAGE_SIZE }))
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-sm border border-line-700 px-4 text-sm text-fg-100 transition-colors hover:border-line-600 hover:text-fg-50"
                >
                  Show more <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : null}
          </section>
        ))}
      </div>
      <Player video={active} onClose={() => setActive(null)} />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-sm border px-3 text-sm whitespace-nowrap transition-colors",
        active
          ? "border-fg-50 bg-fg-50 text-bg-950"
          : "border-line-700 text-fg-300 hover:border-line-600 hover:text-fg-50",
      )}
    >
      {children}
    </button>
  );
}

function VideoCard({ video, index, onOpen }: { video: Video; index: number; onOpen: () => void }) {
  const embed = parseVideoUrl(video.video_url);
  const thumb = video.thumbnail_url ?? embed.thumbnail;
  const playable = embed.kind !== "link";

  const surfaceClass =
    "relative block aspect-video w-full overflow-hidden rounded-sm border border-line-800 bg-surface-900 text-left focus-visible:outline-offset-4";
  const inner = (
    <>
      {thumb ? (
        <Image
          src={thumb}
          alt={video.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized={!isOptimizableImage(thumb)}
          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      ) : (
        <div className="absolute inset-0 grid-lines" />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
      />
      <span className="absolute top-3 left-3 label-mono text-fg-100">
        {String(index + 1).padStart(2, "0")}
      </span>
      {video.duration ? (
        <span className="absolute right-3 bottom-3 rounded-xs bg-black/70 px-1.5 py-0.5 font-mono text-[11px] text-fg-100">
          {video.duration}
        </span>
      ) : null}
      <span aria-hidden className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-fg-50/30 bg-black/50 text-fg-50 backdrop-blur-[2px] transition-transform duration-300 group-hover:scale-110">
          {playable ? <Play className="ml-0.5 h-5 w-5" /> : <ExternalLink className="h-5 w-5" />}
        </span>
      </span>
    </>
  );

  return (
    <article className="group flex min-w-0 flex-col">
      {playable ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Play ${video.title}`}
          data-cursor="view"
          className={surfaceClass}
        >
          {inner}
        </button>
      ) : (
        <a
          href={video.video_url}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="view"
          className={surfaceClass}
        >
          {inner}
        </a>
      )}
      <div className="mt-4">
        <h3 className="font-display text-lg font-semibold tracking-tight [overflow-wrap:anywhere] text-fg-50">
          {video.title}
        </h3>
        {video.playlist || video.company ? (
          <p className="mt-1 label-mono">{video.playlist ?? video.company}</p>
        ) : null}
        {video.description ? (
          <p className="mt-2 text-sm leading-relaxed [overflow-wrap:anywhere] text-fg-300">
            {video.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function Player({ video, onClose }: { video: Video | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  React.useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [video, onClose]);

  const embed = video ? parseVideoUrl(video.video_url) : null;

  return (
    <AnimatePresence>
      {video && embed && embed.kind !== "link" ? (
        <motion.div
          key={video.id}
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 sm:p-8"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-line-600 bg-surface-900 text-fg-100 hover:text-fg-50"
          >
            <X className="h-5 w-5" />
          </button>
          <motion.div
            className="w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? false : { scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-md border border-line-700 bg-black">
              {embed.kind === "file" ? (
                <video
                  src={embed.embedUrl}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full"
                />
              ) : (
                <iframe
                  src={embed.embedUrl}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              )}
            </div>
            <div className="mt-4 flex items-start justify-between gap-6">
              <div>
                <p className="font-display text-lg font-semibold text-fg-50">{video.title}</p>
                {video.company ? <p className="mt-1 label-mono">{video.company}</p> : null}
              </div>
              <a
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm text-fg-300 underline-offset-4 hover:text-fg-50 hover:underline"
              >
                Open original <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
