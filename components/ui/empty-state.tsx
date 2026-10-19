import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-line-700 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-line-700 bg-surface-800">
          <Icon className="h-5 w-5 text-fg-500" aria-hidden />
        </div>
      ) : null}
      <h3 className="text-sm font-medium text-fg-100">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-fg-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
