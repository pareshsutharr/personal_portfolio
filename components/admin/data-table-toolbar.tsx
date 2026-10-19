"use client";

import * as React from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export type ToolbarFilter = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Value that means "no filter" and is removed from the URL. Defaults to "all". */
  allValue?: string;
};

/**
 * Search + select filters synced to the URL (`?q=`, `?<key>=`) via
 * router.replace. Drop it above any admin table that filters server-side.
 *
 *   <DataTableToolbar searchPlaceholder="Search…" filters={[{ key: "status", label: "Status", options }]} />
 */
export function DataTableToolbar({
  searchPlaceholder = "Search…",
  searchKey = "q",
  filters = [],
  debounceMs = 300,
  className,
  children,
}: {
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: ToolbarFilter[];
  debounceMs?: number;
  className?: string;
  /** Extra controls rendered at the end (e.g. a primary button). */
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get(searchKey) ?? "";
  const [query, setQuery] = React.useState(urlQuery);
  const [, startTransition] = React.useTransition();

  // Keep local state in sync when the URL changes from elsewhere (tabs, back button).
  const [prevUrlQuery, setPrevUrlQuery] = React.useState(urlQuery);
  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  const replace = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.replace((qs ? `${pathname}?${qs}` : pathname) as Route, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  // Debounced search sync.
  React.useEffect(() => {
    if (query === urlQuery) return;
    const t = window.setTimeout(() => {
      replace((p) => {
        if (query.trim()) p.set(searchKey, query.trim());
        else p.delete(searchKey);
      });
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [query, urlQuery, replace, searchKey, debounceMs]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-fg-500"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-9 pr-8 pl-8 text-[13px]"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-xs p-0.5 text-fg-500 hover:text-fg-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {filters.map((f) => {
        const all = f.allValue ?? "all";
        const current = searchParams.get(f.key) ?? all;
        return (
          <label key={f.key} className="flex items-center gap-2">
            <span className="hidden label-mono sm:inline">{f.label}</span>
            <Select
              aria-label={f.label}
              value={current}
              onChange={(e) =>
                replace((p) => {
                  if (e.target.value === all) p.delete(f.key);
                  else p.set(f.key, e.target.value);
                })
              }
              className="h-9 w-auto min-w-[140px] text-[13px]"
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </label>
        );
      })}

      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
