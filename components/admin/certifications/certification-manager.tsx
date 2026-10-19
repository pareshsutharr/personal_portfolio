"use client";

import { Award, Plus } from "lucide-react";
import { EntityList, EntityThumb } from "@/components/admin/crud/entity-list";
import { useEntityCrud } from "@/components/admin/crud/use-entity-crud";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createCertification,
  deleteCertification,
  reorderCertifications,
  toggleCertification,
  updateCertification,
} from "@/lib/actions/certifications";
import { formatMonthYear } from "@/lib/utils/format";
import type { Certification } from "@/types";
import { CertificationDrawer } from "./certification-form";

export function CertificationManager({
  items,
  initialOpen = false,
}: {
  items: Certification[];
  initialOpen?: boolean;
}) {
  const crud = useEntityCrud<Certification>(
    {
      create: createCertification,
      update: updateCertification,
      remove: deleteCertification,
      reorder: reorderCertifications,
      toggle: toggleCertification,
    },
    { initialOpen },
  );

  return (
    <>
      <AdminPageHeader
        title="Certifications"
        description="Certificates and course completions, in display order."
        count={items.length}
        actions={
          <Button onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> Add certification
          </Button>
        }
      />

      <EntityList
        items={items}
        searchable
        searchPlaceholder="Search by title or issuer…"
        renderRow={(c) => ({
          title: c.title,
          subtitle: c.issuer ?? "Issuer not set",
          meta: formatMonthYear(c.issue_date) ?? "No issue date",
          badges: c.credential_url ? <Badge mono>Verified link</Badge> : null,
          leading: (
            <EntityThumb
              src={c.certificate_image}
              alt={c.title}
              shape="video"
              fallback={<Award className="h-4 w-4" />}
            />
          ),
        })}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        onToggle={crud.toggle}
        onReorder={crud.reorder}
        emptyState={{
          icon: Award,
          title: "No certifications yet",
          description:
            "Add certificates you actually hold. Leave credential fields empty otherwise.",
          action: (
            <Button variant="secondary" size="sm" onClick={crud.openCreate}>
              <Plus className="h-4 w-4" /> Add certification
            </Button>
          ),
        }}
      />

      {crud.open ? (
        <CertificationDrawer
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
