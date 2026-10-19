import { Globe, Link as LinkIcon, Mail, MessageCircle } from "lucide-react";
import { SOCIAL_PLATFORMS } from "@/lib/validation/schemas";

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X (Twitter)",
  youtube: "YouTube",
  portfolio: "Website",
  email: "Email",
  whatsapp: "WhatsApp",
  other: "Other",
};

export const PLATFORM_URL_PLACEHOLDERS: Record<SocialPlatform, string> = {
  github: "https://github.com/username",
  linkedin: "https://linkedin.com/in/username",
  instagram: "https://instagram.com/username",
  x: "https://x.com/username",
  youtube: "https://youtube.com/@channel",
  portfolio: "https://example.com",
  email: "mailto:you@example.com",
  whatsapp: "https://wa.me/91XXXXXXXXXX",
  other: "https://",
};

export function isSocialPlatform(value: string): value is SocialPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

/** Seeded rows that still point at the bare platform root. */
export const PLACEHOLDER_URLS = new Set(["https://github.com/", "https://linkedin.com/"]);

type IconProps = { className?: string };

/*
 * lucide-react no longer ships brand marks, so the five brand glyphs below are
 * minimal inline paths. Everything else uses lucide.
 */
function GithubGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.1c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function LinkedinGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

function InstagramGlyph({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    </svg>
  );
}

function YoutubeGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}

export function PlatformIcon({
  platform,
  className = "h-4 w-4",
}: {
  platform: string;
  className?: string;
}) {
  switch (platform) {
    case "github":
      return <GithubGlyph className={className} />;
    case "linkedin":
      return <LinkedinGlyph className={className} />;
    case "instagram":
      return <InstagramGlyph className={className} />;
    case "x":
      return <XGlyph className={className} />;
    case "youtube":
      return <YoutubeGlyph className={className} />;
    case "portfolio":
      return <Globe className={className} aria-hidden />;
    case "email":
      return <Mail className={className} aria-hidden />;
    case "whatsapp":
      return <MessageCircle className={className} aria-hidden />;
    default:
      return <LinkIcon className={className} aria-hidden />;
  }
}
