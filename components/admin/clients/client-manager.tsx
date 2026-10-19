"use client";

import Image from "next/image";
import { Handshake, Plus } from "lucide-react";
import { EntityList } from "@/components/admin/crud/entity-list";
import { useEntityCrud } from "@/components/admin/crud/use-entity-crud";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createClientLogo,
  deleteClientLogo,
  reorderClientLogos,
  toggleClientLogo,
  updateClientLogo,
} from "@/lib/actions/clients";
import type { ClientLogo } from "@/types";
import { ClientDrawer } from "./client-form";

export function ClientManager({
  items,
  initialOpen = false,
}: {
  items: ClientLogo[];
  initialOpen?: boolean;
}) {
  const crud = useEntityCrud<ClientLogo, "is_visible">(
    {
      create: createClientLogo,
      update: updateClientLogo,
      remove: deleteClientLogo,
      reorder: reorderClientLogos,
      toggle: toggleClientLogo,
    },
    { initialOpen },
  );

  return (
    <>
      <AdminPageHeader
        title="Clients"
        description="Companies and products you have worked with. Shown as an auto-scrolling logo strip under the hero."
        count={items.length}
        actions={
          <Button onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> Add client
          </Button>
        }
      />

      <EntityList
        items={items}
        searchable
        searchPlaceholder="Search clients…"
        renderRow={(c) => ({
          leading: (
            <span className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-line-800 bg-surface-800">
              {c.logo_url ? (
                <Image
                  src={c.logo_url}
                  alt={c.name}
                  width={56}
                  height={36}
                  className="h-7 w-auto max-w-12 object-contain"
                  unoptimized={c.logo_url.endsWith(".svg")}
                />
              ) : (
                <span className="font-display text-xs font-semibold text-fg-500">
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
          ),
          title: c.name,
          subtitle: c.url ?? "No link",
          badges: (
            <>
              {c.display_mode === "name" ? (
                <Badge>Shown as name</Badge>
              ) : c.logo_url ? (
                <Badge tone="success">Logo</Badge>
              ) : (
                <Badge tone="amber">Name only — upload a logo</Badge>
              )}
            </>
          ),
        })}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        onToggle={crud.toggle}
        onReorder={crud.reorder}
        emptyState={{
          icon: Handshake,
          title: "No clients yet",
          description: "Add the companies you have built for to show their logos on the home page.",
          action: (
            <Button variant="secondary" size="sm" onClick={crud.openCreate}>
              <Plus className="h-4 w-4" /> Add client
            </Button>
          ),
        }}
      />

      {crud.open ? (
        <ClientDrawer
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
