"use client";

import { Layers, Plus } from "lucide-react";
import { EntityList } from "@/components/admin/crud/entity-list";
import { useEntityCrud } from "@/components/admin/crud/use-entity-crud";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createService,
  deleteService,
  reorderServices,
  toggleService,
  updateService,
} from "@/lib/actions/services";
import type { Service } from "@/types";
import { ServiceDrawer } from "./service-form";

function excerpt(text: string | null, max = 110) {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function ServiceManager({
  items,
  initialOpen = false,
}: {
  items: Service[];
  initialOpen?: boolean;
}) {
  const crud = useEntityCrud<Service, "is_visible" | "featured">(
    {
      create: createService,
      update: updateService,
      remove: deleteService,
      reorder: reorderServices,
      toggle: toggleService,
    },
    { initialOpen },
  );

  return (
    <>
      <AdminPageHeader
        title="Services"
        description="What you offer, in the order shown on the services page."
        count={items.length}
        actions={
          <Button onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> Add service
          </Button>
        }
      />

      <EntityList
        items={items}
        searchable
        searchPlaceholder="Search services…"
        renderRow={(s) => ({
          title: s.title,
          subtitle: excerpt(s.description) ?? "No description yet",
          meta: s.icon ? <span>{s.icon}</span> : null,
          badges: s.featured ? <Badge tone="ember">Featured</Badge> : null,
        })}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        onToggle={crud.toggle}
        onReorder={crud.reorder}
        emptyState={{
          icon: Layers,
          title: "No services yet",
          description: "Add the services you offer to show them publicly.",
          action: (
            <Button variant="secondary" size="sm" onClick={crud.openCreate}>
              <Plus className="h-4 w-4" /> Add service
            </Button>
          ),
        }}
      />

      {crud.open ? (
        <ServiceDrawer
          key={crud.editing?.id ?? "new"}
          open={crud.open}
          onOpenChange={crud.setOpen}
          entity={crud.editing}
          nextOrder={items.length + 1}
          onSubmit={crud.submit}
          saving={crud.saving}
          fieldErrors={crud.fieldErrors}
        />
      ) : null}
    </>
  );
}
