import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import type { Media } from "@/types";
import { Eyebrow, Section } from "./section";

/**
 * Travel photos in a masonry of their own aspect ratios, as the last thing before the closing CTA.
 * Images come from the media library's "travel" folder, so new ones can be
 * added from admin without a deploy.
 */
export function TravelGallery({ photos, index }: { photos: Media[]; index: number }) {
  if (!photos.length) return null;

  return (
    <Section className="bg-bg-900">
      <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow index={index}>Off the clock</Eyebrow>
          <h2 className="mt-5 font-display text-display-md font-semibold text-balance text-fg-50">
            Where I go when the laptop is closed.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-fg-300">
          Forts and ridges in the Sahyadris, the White Rann, and whichever trail is next.
        </p>
      </div>
      <div className="columns-2 gap-4 sm:gap-5 lg:columns-3">
        {photos.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.08} className="mb-4 break-inside-avoid sm:mb-5">
            <figure className="group relative overflow-hidden rounded-sm border border-line-800 bg-surface-900">
              <Image
                src={p.url}
                alt={p.alt_text ?? ""}
                width={p.width ?? 1600}
                height={p.height ?? 1200}
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="h-auto w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
              />
              {p.alt_text ? (
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-3 label-mono text-fg-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {p.alt_text}
                </figcaption>
              ) : null}
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
