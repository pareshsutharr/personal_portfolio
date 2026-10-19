import * as React from "react";
import { cn } from "@/lib/utils/cn";

/** Flat admin/content panel. No glow, restrained radius. */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-md border border-line-800 bg-surface-900", className)} {...props} />
  );
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line-800 px-5 py-4",
        className,
      )}
    >
      <div>
        <h3 className="text-sm font-semibold text-fg-50">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-fg-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line-700 bg-surface-800 px-1 font-mono text-[10px] text-fg-500">
      {children}
    </kbd>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 overflow-x-auto border-b border-line-800", className)}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
              active
                ? "border-ember-500 text-fg-50"
                : "border-transparent text-fg-500 hover:text-fg-100",
            )}
          >
            {t.label}
            {typeof t.count === "number" ? (
              <span className="rounded-xs bg-surface-700 px-1.5 py-0.5 font-mono text-[10px] text-fg-300">
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
