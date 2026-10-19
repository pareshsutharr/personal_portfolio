"use client";

import * as React from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { padIndex } from "@/lib/utils/format";
import { isOptimizableImage } from "@/lib/utils/image";
import type { ProjectImageType } from "@/types";

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  type: ProjectImageType;
};

const subscribeNoop = () => () => {};
function useIsClient() {
  return React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onStep,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const mounted = useIsClient();
  const current = images[index];

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onStep]);

  if (!mounted || !current) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.alt}
      className="fixed inset-0 z-[70] flex flex-col bg-black/95"
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="label-mono">
          <span className="text-fg-100 tabular-nums">{padIndex(index + 1)}</span>
          <span className="mx-2 text-fg-700">/</span>
          <span className="tabular-nums">{padIndex(images.length)}</span>
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-11 w-11 items-center justify-center rounded-sm text-fg-300 transition-colors hover:text-fg-50"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="relative flex-1" onClick={onClose}>
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt}
          fill
          sizes="100vw"
          unoptimized={!isOptimizableImage(current.url)}
          className="object-contain p-2 sm:p-8"
        />
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <p className="min-w-0 truncate font-mono text-xs text-fg-300">
          {current.caption ?? current.alt}
        </p>
        {images.length > 1 ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label="Previous image"
              className="flex h-11 w-11 items-center justify-center rounded-sm border border-line-700 text-fg-300 transition-colors hover:border-fg-300 hover:text-fg-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label="Next image"
              className="flex h-11 w-11 items-center justify-center rounded-sm border border-line-700 text-fg-300 transition-colors hover:border-fg-300 hover:text-fg-50"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function Frame({
  image,
  index,
  onOpen,
  aspect,
  sizes,
  className,
}: {
  image: GalleryImage;
  index: number;
  onOpen: (i: number) => void;
  aspect: string;
  sizes: string;
  className?: string;
}) {
  return (
    <figure className={cn("group min-w-0", className)}>
      <button
        type="button"
        onClick={() => onOpen(index)}
        data-cursor="view"
        aria-label={`Open ${image.alt}`}
        className={cn(
          "relative block w-full overflow-hidden rounded-sm border border-line-700 bg-surface-900",
          aspect,
        )}
      >
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          unoptimized={!isOptimizableImage(image.url)}
          className="object-cover object-top transition-transform duration-700 ease-out-expo group-hover:scale-[1.02] motion-reduce:transition-none"
        />
        <span className="pointer-events-none absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-xs bg-bg-950/80 text-fg-100 opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
        </span>
      </button>
      <figcaption className="mt-3 flex gap-3 font-mono text-[11px] leading-none">
        <span className="text-ember-400 tabular-nums">{padIndex(index + 1)}</span>
        <span className="min-w-0 truncate text-fg-500">{image.caption ?? image.alt}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Screenshots block: phone-aspect frames in a horizontal row for `mobile`
 * images, everything else in a two-column grid. Click opens a lightbox.
 */
export function ScreenshotGallery({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = React.useState<number | null>(null);
  const mobile = images.filter((i) => i.type === "mobile");
  const wide = images.filter((i) => i.type !== "mobile");
  const ordered = [...wide, ...mobile];
  const count = images.length;

  const close = React.useCallback(() => setOpen(null), []);
  const step = React.useCallback(
    (delta: number) => setOpen((cur) => (cur === null ? cur : (cur + delta + count) % count)),
    [count],
  );

  return (
    <div className="space-y-10">
      {wide.length ? (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
          {wide.map((img, i) => (
            <Frame
              key={img.id}
              image={img}
              index={i}
              onOpen={setOpen}
              aspect="aspect-[16/10]"
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
              className={cn(wide.length % 2 === 1 && i === 0 && "sm:col-span-2")}
            />
          ))}
        </div>
      ) : null}

      {mobile.length ? (
        <div>
          <p className="mb-4 label-mono">Mobile screens</p>
          <div className="-mx-4 no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {mobile.map((img, i) => (
              <Frame
                key={img.id}
                image={img}
                index={wide.length + i}
                onOpen={setOpen}
                aspect="aspect-[9/19.5]"
                sizes="(min-width: 1024px) 220px, 60vw"
                className="w-[58vw] shrink-0 snap-start sm:w-56"
              />
            ))}
          </div>
        </div>
      ) : null}

      {open !== null ? (
        <Lightbox images={ordered} index={open} onClose={close} onStep={step} />
      ) : null}
    </div>
  );
}
