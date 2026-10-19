import type { Route } from "next";
import Link from "next/link";
import { CONTACT_STATUS_LABELS, type ContactStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

export type StatusFilter = "all" | ContactStatus;

const ORDER: StatusFilter[] = [
  "all",
  "new",
  "read",
  "replied",
  "in_discussion",
  "converted",
  "closed",
  "spam",
];

/** Server-rendered tab bar; each tab is a link that keeps the current search. */
export function StatusTabs({
  value,
  counts,
  q,
}: {
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  q: string;
}) {
  return (
    <div
      role="tablist"
      className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line-800"
    >
      {ORDER.map((s) => {
        const active = s === value;
        const params = new URLSearchParams();
        if (s !== "all") params.set("status", s);
        if (q) params.set("q", q);
        const qs = params.toString();
        const href = (qs ? `/admin/messages?${qs}` : "/admin/messages") as Route;
        return (
          <Link
            key={s}
            role="tab"
            aria-selected={active}
            href={href}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
              active
                ? "border-ember-500 text-fg-50"
                : "border-transparent text-fg-500 hover:text-fg-100",
            )}
          >
            {s === "all" ? "All" : CONTACT_STATUS_LABELS[s]}
            <span
              className={cn(
                "rounded-xs px-1.5 py-0.5 font-mono text-[10px]",
                s === "new" && counts.new > 0
                  ? "bg-ember-500/15 text-ember-300"
                  : "bg-surface-700 text-fg-300",
              )}
            >
              {counts[s]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
