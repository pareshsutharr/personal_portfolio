import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/** True for files served from the whitelisted Supabase storage host. */
export function isOptimizableUrl(url: string) {
  return url.includes("/storage/v1/object/public/") && !url.toLowerCase().endsWith(".svg");
}

export function initialsOf(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || "–";
}

/** 40px square thumbnail with a mono initials fallback. */
export function ProjectThumb({
  src,
  title,
  size = 40,
  className,
}: {
  src: string | null | undefined;
  title: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-sm border border-line-700 bg-surface-800",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized={!isOptimizableUrl(src)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-mono text-[10px] tracking-wider text-fg-500">
          {initialsOf(title)}
        </span>
      )}
    </div>
  );
}
