"use client";

import * as React from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/types";

type RunOptions<T> = { onSuccess?: (data: T) => void; silent?: boolean };

/**
 * Runs a server action with loading state, toasts and field errors.
 *
 *   const { run, pending, fieldErrors } = useAction(updateService);
 *   await run([id, values], { onSuccess: () => close() });
 */
export function useAction<Args extends unknown[], T>(
  action: (...args: Args) => Promise<ActionResult<T>>,
) {
  const [pending, startTransition] = React.useTransition();
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const run = React.useCallback(
    (args: Args, opts?: RunOptions<T>): Promise<ActionResult<T> | undefined> => {
      const execute = (): Promise<ActionResult<T> | undefined> =>
        new Promise((resolve) => {
          startTransition(async () => {
            try {
              const result = await action(...args);
              if (result.ok) {
                setFieldErrors({});
                if (!opts?.silent && result.message) toast.success(result.message);
                opts?.onSuccess?.(result.data);
              } else {
                setFieldErrors(result.fieldErrors ?? {});
                toast.error(result.error);
              }
              resolve(result);
            } catch (e) {
              const message = e instanceof Error ? e.message : "Something went wrong.";
              toast.error(message, { action: { label: "Retry", onClick: () => void execute() } });
              resolve(undefined);
            }
          });
        });
      return execute();
    },
    [action],
  );

  return { run, pending, fieldErrors, setFieldErrors };
}
