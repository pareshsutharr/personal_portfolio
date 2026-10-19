import { StatusDot } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { AVAILABILITY_LABELS, type AvailabilityStatus } from "@/types";

export function availabilityTone(status: AvailabilityStatus): "success" | "amber" | "neutral" {
  if (status === "available" || status === "selected_projects") return "success";
  if (status === "open_to_opportunities") return "amber";
  return "neutral";
}

/** StatusDot + mono availability label. Reused by the hero, footer and inner pages. */
export function AvailabilityBadge({
  status,
  text,
  pulse = true,
  className,
}: {
  status: AvailabilityStatus;
  text?: string | null;
  pulse?: boolean;
  className?: string;
}) {
  const tone = availabilityTone(status);
  return (
    <span className={cn("inline-flex items-center gap-2.5 label-mono", className)}>
      <StatusDot tone={tone} pulse={pulse && tone !== "neutral"} />
      <span className={cn(tone === "neutral" ? "text-fg-500" : "text-fg-300")}>
        {text || AVAILABILITY_LABELS[status]}
      </span>
    </span>
  );
}
