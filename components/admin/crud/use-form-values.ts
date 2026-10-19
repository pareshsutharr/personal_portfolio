"use client";

import * as React from "react";

/**
 * Minimal controlled-form state for drawer forms. Values stay as plain
 * strings/booleans; the zod schema on the server does the coercion.
 */
export function useFormValues<V extends object>(initial: V) {
  const [values, setValues] = React.useState<V>(initial);
  const set = React.useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);
  return { values, set, setValues };
}
