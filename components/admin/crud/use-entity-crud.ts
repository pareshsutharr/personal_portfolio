"use client";

import * as React from "react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import type { ActionResult } from "@/types";

type EntityActions<T, F extends string> = {
  create: (input: unknown) => Promise<ActionResult<T>>;
  update: (id: string, input: unknown) => Promise<ActionResult<T>>;
  remove: (id: string) => Promise<ActionResult<null>>;
  reorder: (ids: string[]) => Promise<ActionResult<null>>;
  toggle: (id: string, field: F, value: boolean) => Promise<ActionResult<null>>;
};

/**
 * Wires an entity's server actions to drawer state + list callbacks.
 * Every success refreshes the server component tree so the list re-syncs.
 *
 *   const crud = useEntityCrud<Service, "is_visible" | "featured">({ create: createService, … });
 *   <EntityList onEdit={crud.openEdit} onDelete={crud.remove} onToggle={crud.toggle} onReorder={crud.reorder} />
 */
export function useEntityCrud<T extends { id: string }, F extends string = "is_visible">(
  actions: EntityActions<T, F>,
  options?: { initialOpen?: boolean },
) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(Boolean(options?.initialOpen));
  const [editing, setEditing] = React.useState<T | null>(null);
  const openedFromUrl = React.useRef(Boolean(options?.initialOpen));

  const create = useAction(actions.create);
  const update = useAction(actions.update);
  const remove = useAction(actions.remove);
  const reorder = useAction(actions.reorder);
  const toggle = useAction(actions.toggle);
  // `run`/`setFieldErrors` are stable; the wrapper objects are not.
  const { run: runCreate, setFieldErrors: resetCreateErrors } = create;
  const { run: runUpdate, setFieldErrors: resetUpdateErrors } = update;
  const { run: runRemove } = remove;
  const { run: runReorder } = reorder;
  const { run: runToggle } = toggle;

  const refresh = React.useCallback(() => router.refresh(), [router]);

  const close = React.useCallback(() => {
    setOpen(false);
    setEditing(null);
    resetCreateErrors({});
    resetUpdateErrors({});
    // `?new=1` deep link: clean the URL once the drawer is dismissed.
    if (openedFromUrl.current) {
      openedFromUrl.current = false;
      router.replace(pathname as Route);
    }
  }, [resetCreateErrors, resetUpdateErrors, router, pathname]);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setOpen(true);
  }, []);

  const openEdit = React.useCallback((item: T) => {
    setEditing(item);
    setOpen(true);
  }, []);

  const submit = React.useCallback(
    async (values: unknown) => {
      const onSuccess = () => {
        close();
        refresh();
      };
      if (editing) await runUpdate([editing.id, values], { onSuccess });
      else await runCreate([values], { onSuccess });
    },
    [editing, runUpdate, runCreate, close, refresh],
  );

  const removeItem = React.useCallback(
    async (item: T) => {
      const res = await runRemove([item.id], { onSuccess: refresh });
      return res?.ok ?? false;
    },
    [runRemove, refresh],
  );

  const reorderItems = React.useCallback(
    async (ids: string[]) => {
      const res = await runReorder([ids], { onSuccess: refresh });
      return res?.ok ?? false;
    },
    [runReorder, refresh],
  );

  const toggleItem = React.useCallback(
    async (item: T, field: F, value: boolean) => {
      const res = await runToggle([item.id, field, value], { onSuccess: refresh });
      return res?.ok ?? false;
    },
    [runToggle, refresh],
  );

  return {
    open,
    editing,
    openCreate,
    openEdit,
    close,
    /** Pass to the drawer's `onOpenChange`. */
    setOpen: (o: boolean) => (o ? setOpen(true) : close()),
    submit,
    saving: create.pending || update.pending,
    fieldErrors: editing ? update.fieldErrors : create.fieldErrors,
    remove: removeItem,
    reorder: reorderItems,
    toggle: toggleItem,
  };
}
