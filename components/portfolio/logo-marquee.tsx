import Image from "next/image";
import type { ClientLogo } from "@/types";
import { cn } from "@/lib/utils/cn";

/**
 * Auto-scrolling strip of client logos. Pure CSS animation (no JS), pauses
 * on hover, and falls back to a static wrapped row under reduced motion.
 * Logos without an image render as a display-font wordmark.
 */
export function LogoMarquee({
  logos,
  label = "Worked with",
  className,
}: {
  logos: ClientLogo[];
  label?: string;
  className?: string;
}) {
  if (!logos.length) return null;
  // Duplicate the track so the loop is seamless.
  const track = [...logos, ...logos];

  return (
    <div className={cn("relative border-t border-line-800", className)}>
      <div className="container-x flex min-h-16 items-center gap-6 py-4 sm:gap-10">
        <span className="shrink-0 label-mono whitespace-nowrap">{label}</span>
        <span aria-hidden className="hidden h-3 w-px shrink-0 bg-line-700 sm:block" />
        <div
          className="group relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
          role="list"
          aria-label="Clients and companies"
        >
          <ul
            className="flex w-max animate-marquee items-center gap-12 will-change-transform group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap sm:gap-16"
            style={{ animationDuration: `${Math.max(24, logos.length * 6)}s` }}
          >
            {track.map((logo, i) => {
              const duplicate = i >= logos.length;
              const showLogo =
                Boolean(logo.logo_url) &&
                (logo.display_mode === "logo" || logo.display_mode === "auto");
              const content =
                showLogo && logo.logo_url ? (
                  <Image
                    src={logo.logo_url}
                    alt={duplicate ? "" : logo.name}
                    width={160}
                    height={40}
                    className="h-6 w-auto max-w-[9rem] object-contain opacity-70 brightness-0 invert transition-opacity duration-300 group-hover:opacity-100 sm:h-7"
                    unoptimized={logo.logo_url.endsWith(".svg")}
                  />
                ) : (
                  <span className="font-display text-base font-semibold tracking-tight whitespace-nowrap text-fg-300 sm:text-lg">
                    {logo.name}
                  </span>
                );
              return (
                <li
                  key={`${logo.id}-${i}`}
                  role={duplicate ? "presentation" : "listitem"}
                  aria-hidden={duplicate || undefined}
                  className="flex shrink-0 items-center"
                >
                  {logo.url ? (
                    <a
                      href={logo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={duplicate ? -1 : 0}
                      className="flex items-center transition-opacity hover:opacity-100"
                    >
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
