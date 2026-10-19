"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Plus, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Hint } from "@/components/ui/field";
import { Checkbox, Input, Select } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { createTechnology } from "@/lib/actions/technologies";
import { cn } from "@/lib/utils/cn";
import { slugify } from "@/lib/utils/slug";
import { SKILL_CATEGORIES } from "@/lib/validation/schemas";
import { SKILL_CATEGORY_LABELS, type SkillCategory, type Technology } from "@/types";
import { Chip, SearchInput } from "./editor-fields";
import type { ProjectFormValues } from "./editor-types";

export function TechnologiesTab({ technologies: initial }: { technologies: Technology[] }) {
  const { control } = useFormContext<ProjectFormValues>();
  const [technologies, setTechnologies] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<SkillCategory>("frontend");
  const create = useAction(createTechnology);
  const ids = React.useId();

  const q = query.trim().toLowerCase();
  const grouped = React.useMemo(() => {
    const map = new Map<SkillCategory, Technology[]>();
    for (const cat of SKILL_CATEGORIES) map.set(cat, []);
    for (const t of technologies) {
      if (q && !t.name.toLowerCase().includes(q) && !t.slug.includes(q)) continue;
      map.get(t.category)?.push(t);
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [technologies, q]);

  return (
    <Controller
      control={control}
      name="technology_ids"
      render={({ field }) => {
        const selected = field.value;
        const toggle = (id: string, on: boolean) =>
          field.onChange(on ? [...selected, id] : selected.filter((x) => x !== id));

        const submitNew = async () => {
          const name = newName.trim();
          if (!name) return;
          await create.run([{ name, slug: slugify(name), category: newCategory }], {
            onSuccess: (t) => {
              setTechnologies((prev) => [...prev, t]);
              field.onChange([...selected, t.id]);
              setNewName("");
              setCreating(false);
            },
          });
        };

        return (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-fg-100">
                  Stack{" "}
                  <span className="font-mono text-[11px] text-fg-500">
                    · {selected.length} selected
                  </span>
                </p>
                {selected.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => field.onChange([])}
                    className="text-xs text-fg-500 hover:text-fg-100"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>
              {selected.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((id) => {
                    const t = technologies.find((x) => x.id === id);
                    return (
                      <Chip key={id} onRemove={() => toggle(id, false)}>
                        {t?.color ? <Swatch color={t.color} /> : null}
                        {t?.name ?? "Unknown"}
                      </Chip>
                    );
                  })}
                </div>
              ) : (
                <Hint>
                  Pick the technologies used. They appear in the stack row and power the skills
                  page.
                </Hint>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-56 flex-1">
                <SearchInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search technologies…"
                  aria-label="Search technologies"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant={creating ? "secondary" : "outline"}
                onClick={() => setCreating((v) => !v)}
              >
                <Plus className="h-3.5 w-3.5" /> New technology
              </Button>
            </div>

            {creating ? (
              <div className="grid gap-3 rounded-md border border-line-700 bg-surface-800/60 p-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                <Field
                  label="Name"
                  htmlFor={`${ids}-new-name`}
                  errors={create.fieldErrors.name ?? create.fieldErrors.slug}
                >
                  <Input
                    id={`${ids}-new-name`}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Next.js"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submitNew();
                      }
                    }}
                    autoFocus
                  />
                </Field>
                <Field label="Category" htmlFor={`${ids}-new-cat`}>
                  <Select
                    id={`${ids}-new-cat`}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as SkillCategory)}
                  >
                    {SKILL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {SKILL_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button
                  type="button"
                  size="md"
                  onClick={() => void submitNew()}
                  loading={create.pending}
                  disabled={!newName.trim()}
                >
                  Create &amp; select
                </Button>
              </div>
            ) : null}

            {technologies.length === 0 ? (
              <EmptyState
                icon={Cpu}
                title="No technologies yet"
                description="Create one above or add them from Admin → Technologies."
              />
            ) : grouped.length === 0 ? (
              <p className="py-6 text-center text-sm text-fg-500">
                No technologies match “{query}”.
              </p>
            ) : (
              <div className="space-y-5">
                {grouped.map(([cat, list]) => (
                  <section key={cat}>
                    <h4 className="mb-2 font-mono text-[10px] tracking-wider text-fg-500 uppercase">
                      {SKILL_CATEGORY_LABELS[cat]}{" "}
                      <span className="text-fg-700">· {list.length}</span>
                    </h4>
                    <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((t) => {
                        const checked = selected.includes(t.id);
                        return (
                          <li key={t.id}>
                            <label
                              className={cn(
                                "flex h-10 cursor-pointer items-center gap-2.5 rounded-sm border border-line-800 px-2.5 text-sm transition-colors",
                                checked
                                  ? "border-ember-500/40 bg-ember-500/5 text-fg-50"
                                  : "text-fg-300 hover:border-line-700 hover:bg-surface-800/60 hover:text-fg-100",
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={(e) => toggle(t.id, e.target.checked)}
                              />
                              {t.color ? <Swatch color={t.color} /> : null}
                              <span className="truncate">{t.name}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        );
      }}
    />
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-line-600"
      style={{ backgroundColor: color }}
    />
  );
}
