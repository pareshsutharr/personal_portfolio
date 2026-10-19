import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { isOptimizableImage } from "@/lib/utils/image";

export type CoverFrame = "none" | "browser" | "laptop" | "phone";

export const COVER_FRAME_LABELS: Record<CoverFrame, string> = {
  none: "None (show the image as uploaded)",
  browser: "Browser window",
  laptop: "Laptop",
  phone: "Phone",
};

export function asCoverFrame(value: string | null | undefined): CoverFrame {
  return value === "browser" || value === "laptop" || value === "phone" ? value : "none";
}

/**
 * Wraps a plain screenshot in a CSS device frame so the admin can upload raw
 * page captures. The image is top-aligned and cropped to the screen, so full
 * page screenshots still look right (the fold is the cut-off point).
 *
 * The component sizes itself to its parent's width; wrap it in a box with the
 * aspect ratio you want and `flex items-center justify-center`.
 */
export function DeviceFrame({
  frame,
  src,
  alt,
  sizes,
  priority = false,
  className,
  imageClassName,
}: {
  frame: CoverFrame;
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  // Screen content that keeps the screenshot's own proportions (nothing cropped).
  const natural = (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={1000}
      sizes={sizes}
      priority={priority}
      unoptimized={!isOptimizableImage(src)}
      className={cn("block h-auto w-full", imageClassName)}
    />
  );

  const img = (cls: string) => (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!isOptimizableImage(src)}
      className={cn(cls, imageClassName)}
    />
  );

  if (frame === "browser") {
    return (
      <div
        className={cn(
          "w-full overflow-hidden rounded-md border border-line-600 bg-surface-800 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]",
          className,
        )}
      >
        <div className="flex h-7 items-center gap-1.5 border-b border-line-700 bg-surface-700 px-3">
          <span className="h-2 w-2 rounded-full bg-fg-700" />
          <span className="h-2 w-2 rounded-full bg-fg-700" />
          <span className="h-2 w-2 rounded-full bg-fg-700" />
          <span className="mx-auto h-3.5 w-1/2 rounded-xs bg-surface-800" />
        </div>
        <div className="relative w-full bg-surface-900">{natural}</div>
      </div>
    );
  }

  if (frame === "laptop") {
    // Simple space-grey laptop, straight on. Sized a little under its container.
    return (
      <div className={cn("mx-auto w-[86%]", className)}>
        {/* Lid */}
        <div className="mx-auto w-[90%] rounded-t-xl border border-[#3a3a3a] bg-[#1a1a1a] p-[5px] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)] sm:rounded-t-2xl sm:p-[7px]">
          <div className="relative w-full overflow-hidden rounded-t-md bg-surface-900">
            {natural}
          </div>
        </div>
        {/* Base */}
        <div className="relative mx-auto h-2.5 w-full rounded-b-lg border border-[#3a3a3a] bg-[linear-gradient(180deg,#2b2b2b,#181818)] sm:h-3">
          <span className="absolute top-0 left-1/2 h-[4px] w-[14%] -translate-x-1/2 rounded-b-sm bg-[#101010]" />
        </div>
      </div>
    );
  }

  if (frame === "phone") {
    return (
      <div
        className={cn(
          "relative aspect-[9/19] h-full max-h-full overflow-hidden rounded-[2rem] border-[6px] border-[#1c1c1c] bg-[#0b0b0b] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]",
          className,
        )}
      >
        <span className="absolute top-2 left-1/2 z-10 h-1.5 w-1/3 -translate-x-1/2 rounded-full bg-[#0b0b0b]" />
        <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-surface-900">
          {img("object-cover object-top")}
        </div>
      </div>
    );
  }

  return <div className={cn("relative h-full w-full", className)}>{img("object-contain")}</div>;
}
