import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "ember" | "crimson" | "amber" | "success" | "info" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-700 text-fg-300 border-line-700",
  ember: "bg-ember-500/10 text-ember-300 border-ember-500/30",
  crimson: "bg-crimson-500/10 text-crimson-400 border-crimson-500/30",
  amber: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  success: "bg-success/10 text-success border-success/30",
  info: "bg-info/10 text-info border-info/30",
  outline: "bg-transparent text-fg-300 border-line-600",
};

export function Badge({
  tone = "neutral",
  mono = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; mono?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-[11px] leading-none font-medium",
        mono && "font-mono tracking-wider uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Small status dot used for availability / build status indicators. */
export function StatusDot({
  tone = "success",
  pulse = false,
  className,
}: {
  tone?: "success" | "ember" | "amber" | "neutral" | "crimson";
  pulse?: boolean;
  className?: string;
}) {
  const color = {
    success: "bg-success",
    ember: "bg-ember-500",
    amber: "bg-amber-400",
    neutral: "bg-fg-500",
    crimson: "bg-crimson-500",
  }[tone];
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden>
      {pulse ? (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden",
            color,
          )}
        />
      ) : null}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
    </span>
  );
}
