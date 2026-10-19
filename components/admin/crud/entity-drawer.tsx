"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";

/**
 * Drawer + form shell for create/edit screens. Children are the entity's
 * fields; the footer submits the form via its id so it can live outside it.
 */
export function EntityDrawer({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  saving = false,
  fieldErrors,
  submitLabel = "Save",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  onSubmit: () => void | Promise<void>;
  saving?: boolean;
  fieldErrors?: Record<string, string[]>;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const formId = React.useId();
  const rootError = fieldErrors?._root?.[0];

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!saving) onOpenChange(o);
      }}
      title={title}
      description={description}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
        className="space-y-5"
      >
        {rootError ? (
          <p
            role="alert"
            className="rounded-sm border border-crimson-500/30 bg-crimson-500/10 px-3 py-2 text-xs text-crimson-400"
          >
            {rootError}
          </p>
        ) : null}
        {children}
      </form>
    </Drawer>
  );
}
