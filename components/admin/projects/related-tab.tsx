"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { Chip, SearchInput } from "./editor-fields";
import type { ProjectFormValues, RelatedOption } from "./editor-types";

export const RELATED_MAX = 3;

export function RelatedTab({ options }: { options: RelatedOption[] }) {
  const { control } = useFormContext<ProjectFormValues>();
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const visible = q
    ? options.filter(
        (o) => o.title.toLowerCase().includes(q) || (o.category ?? "").toLowerCase().includes(q),
      )
    : options;

  return (
    <Controller
      control={control}
      name="related_project_ids"
      render={({ field }) => {
        const selected = field.value;
        const full = selected.length >= RELATED_MAX;
        const toggle = (id: string, on: boolean) =>
          field.onChange(
            on ? [...selected, id].slice(0, RELATED_MAX) : selected.filter((x) => x !== id),
          );
        return (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-fg-100">Related projects</p>
                <Hint>Shown at the end of the case study. Up to {RELATED_MAX}.</Hint>
              </div>
              <span
                className={cn("font-mono text-[11px]", full ? "text-amber-300" : "text-fg-500")}
              >
                {selected.length} / {RELATED_MAX}
              </span>
            </div>

            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((id) => {
                  const o = options.find((x) => x.id === id);
                  return (
                    <Chip key={id} onRemove={() => toggle(id, false)}>
                      {o?.title ?? "Unknown project"}
                    </Chip>
                  );
                })}
              </div>
            ) : null}

            {options.length === 0 ? (
              <EmptyState
                icon={Link2}
                title="No other projects yet"
                description="Related projects appear here once you have more than one project."
              />
            ) : (
              <>
                <SearchInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter projects…"
                  aria-label="Filter projects"
                />
                <ul className="max-h-[420px] divide-y divide-line-800 overflow-y-auto rounded-md border border-line-800">
                  {visible.map((o) => {
                    const checked = selected.includes(o.id);
                    const disabled = !checked && full;
                    return (
                      <li key={o.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                            checked ? "bg-surface-800/70" : "hover:bg-surface-800/50",
                            disabled && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) => toggle(o.id, e.target.checked)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-fg-50">{o.title}</span>
                            <span className="block truncate font-mono text-[11px] text-fg-500">
                              /{o.slug}
                              {o.category ? ` · ${o.category}` : ""}
                            </span>
                          </span>
                          {o.status !== "published" ? (
                            <Badge tone={o.status === "archived" ? "outline" : "neutral"} mono>
                              {o.status}
                            </Badge>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                  {visible.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-fg-500">
                      No projects match “{query}”.
                    </li>
                  ) : null}
                </ul>
                <Hint>
                  Unpublished projects can be linked now; they only render publicly once published.
                </Hint>
              </>
            )}
          </>
        );
      }}
    />
  );
}
