"use client";

import * as React from "react";
import { Plus, Sparkles } from "lucide-react";
import { EntityList } from "@/components/admin/crud/entity-list";
import { useEntityCrud } from "@/components/admin/crud/use-entity-crud";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/panel";
import {
  createSkill,
  deleteSkill,
  reorderSkills,
  toggleSkill,
  updateSkill,
} from "@/lib/actions/skills";
import { cn } from "@/lib/utils/cn";
import { SKILL_CATEGORY_LABELS, type Skill, type SkillCategory } from "@/types";
import { SkillDrawer, type TechnologyOption } from "./skill-form";

const ALL = "all";

export function SkillManager({
  items,
  technologies,
  initialOpen = false,
}: {
  items: Skill[];
  technologies: TechnologyOption[];
  initialOpen?: boolean;
}) {
  const crud = useEntityCrud<Skill, "is_visible" | "is_featured">(
    {
      create: createSkill,
      update: updateSkill,
      remove: deleteSkill,
      reorder: reorderSkills,
      toggle: toggleSkill,
    },
    { initialOpen },
  );
  const [category, setCategory] = React.useState<string>(ALL);

  const techNames = React.useMemo(
    () => new Map(technologies.map((t) => [t.id, t.name])),
    [technologies],
  );

  const counts = React.useMemo(() => {
    const out: Partial<Record<SkillCategory, number>> = {};
    for (const s of items) out[s.category] = (out[s.category] ?? 0) + 1;
    return out;
  }, [items]);

  const tabs = [
    { value: ALL, label: "All", count: items.length },
    ...(Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[])
      .filter((c) => (counts[c] ?? 0) > 0)
      .map((c) => ({ value: c, label: SKILL_CATEGORY_LABELS[c], count: counts[c] })),
  ];

  const filtered = React.useMemo(
    () => (category === ALL ? items : items.filter((s) => s.category === category)),
    [items, category],
  );

  /**
   * Dragging inside a filtered view only reorders that subset. Merge the new
   * subset order back into the full list so other categories keep their slots.
   */
  const reorderWithinAll = React.useCallback(
    (ids: string[]) => {
      if (category === ALL) return crud.reorder(ids);
      const moved = new Set(ids);
      let cursor = 0;
      const full = items.map((s) => (moved.has(s.id) ? ids[cursor++] : s.id));
      return crud.reorder(full);
    },
    [category, items, crud],
  );

  return (
    <>
      <AdminPageHeader
        title="Skills"
        description="Grouped by category on the public site. Drag to set the order inside each group."
        count={items.length}
        actions={
          <Button onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> Add skill
          </Button>
        }
      />

      {items.length > 0 ? (
        <Tabs tabs={tabs} value={category} onChange={setCategory} className="mb-4" />
      ) : null}

      <EntityList
        items={filtered}
        searchable
        searchPlaceholder="Search skills…"
        renderRow={(s) => ({
          title: s.name,
          subtitle: s.technology_id
            ? `Linked to ${techNames.get(s.technology_id) ?? "a technology"}`
            : null,
          meta: s.years != null ? `${s.years} yr${s.years === 1 ? "" : "s"}` : null,
          badges: (
            <>
              <Badge mono>{SKILL_CATEGORY_LABELS[s.category]}</Badge>
              {s.proficiency != null ? <ProficiencyDots level={s.proficiency} /> : null}
              {s.is_featured ? <Badge tone="ember">Featured</Badge> : null}
            </>
          ),
          leading: s.color ? (
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full border border-line-700"
              style={{ backgroundColor: s.color }}
            />
          ) : (
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-line-700" />
          ),
        })}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        onToggle={crud.toggle}
        onReorder={reorderWithinAll}
        emptyState={{
          icon: Sparkles,
          title: items.length === 0 ? "No skills yet" : "Nothing in this category",
          description:
            items.length === 0
              ? "Add the skills you want on the public grid."
              : "Pick another category or add a skill to this one.",
          action: (
            <Button variant="secondary" size="sm" onClick={crud.openCreate}>
              <Plus className="h-4 w-4" /> Add skill
            </Button>
          ),
        }}
      />

      {crud.open ? (
        <SkillDrawer
          key={crud.editing?.id ?? "new"}
          open={crud.open}
          onOpenChange={crud.setOpen}
          entity={crud.editing}
          nextOrder={items.length + 1}
          technologies={technologies}
          defaultCategory={category === ALL ? undefined : (category as SkillCategory)}
          onSubmit={crud.submit}
          saving={crud.saving}
          fieldErrors={crud.fieldErrors}
        />
      ) : null}
    </>
  );
}

function ProficiencyDots({ level }: { level: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Proficiency ${level} of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1.5 w-1.5 rounded-full", i < level ? "bg-ember-500" : "bg-line-700")}
        />
      ))}
    </span>
  );
}
