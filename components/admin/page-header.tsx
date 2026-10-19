import * as React from "react";
import { cn } from "@/lib/utils/cn";

/** Admin page title row with optional count and actions. */
export function AdminPageHeader({
  title,
  description,
  count,
  actions,
  className,
}: {
  title: string;
  description?: string;
  count?: number;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-fg-50">{title}</h1>
          {typeof count === "number" ? (
            <span className="rounded-xs border border-line-700 bg-surface-700 px-1.5 py-0.5 font-mono text-[11px] text-fg-300">
              {count}
            </span>
          ) : null}
        </div>
        {description ? <p className="mt-1 text-sm text-fg-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
