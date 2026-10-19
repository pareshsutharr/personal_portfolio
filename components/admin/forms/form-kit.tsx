"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

/**
 * Small building blocks shared by the singleton admin forms (profile,
 * settings, SEO, now page) and the drawer forms (social links, stats).
 * All of them are controlled: the parent owns the values object.
 */

// -----------------------------------------------------------------------------
// Controlled form state with a dirty flag
// -----------------------------------------------------------------------------
export function useFormValues<T extends object>(initial: T) {
  const [baseline, setBaseline] = React.useState<T>(initial);
  const [values, setValues] = React.useState<T>(initial);

  const set = React.useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Replace both the current values and the clean baseline (after a save). */
  const replace = React.useCallback((next: T) => {
    setBaseline(next);
    setValues(next);
  }, []);

  /** Discard edits and go back to the baseline. */
  const reset = React.useCallback(() => setValues(baseline), [baseline]);

  const dirty = React.useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  return { values, set, replace, reset, dirty };
}

/** Warn before leaving the tab with unsaved edits. */
export function useUnsavedWarning(dirty: boolean) {
  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

/** Scrolls the first visible field error into view when errors change. */
export function useScrollToFirstError(fieldErrors: Record<string, string[]>) {
  React.useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) return;
    const el = document.querySelector<HTMLElement>("form [role='alert']");
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [fieldErrors]);
}

// -----------------------------------------------------------------------------
// Sticky save bar
// -----------------------------------------------------------------------------
export function StickySaveBar({
  dirty,
  pending,
  onDiscard,
  saveLabel = "Save changes",
  meta,
}: {
  dirty: boolean;
  pending: boolean;
  onDiscard?: () => void;
  saveLabel?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 flex items-center justify-between gap-4 rounded-b-md border-t border-line-800 bg-surface-900/95 px-5 py-3 backdrop-blur",
      )}
    >
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span
          aria-hidden
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full",
            dirty ? "bg-amber-400" : "bg-fg-700",
          )}
        />
        <span className={cn("truncate", dirty ? "text-fg-100" : "text-fg-500")}>
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        {meta ? <span className="hidden truncate text-fg-500 sm:inline">· {meta}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onDiscard ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            disabled={!dirty || pending}
          >
            Discard
          </Button>
        ) : null}
        <Button type="submit" size="sm" loading={pending} disabled={!dirty}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Character counter
// -----------------------------------------------------------------------------
export function CharCount({ value, max }: { value: string; max?: number }) {
  const n = value.length;
  const over = typeof max === "number" && n > max;
  return (
    <span
      className={cn("font-mono text-[10px] tabular-nums", over ? "text-amber-300" : "text-fg-500")}
      aria-live="polite"
    >
      {n}
      {typeof max === "number" ? ` / ${max}` : " chars"}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Controlled field wrappers
// -----------------------------------------------------------------------------
type BaseFieldProps = {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  errors?: string[] | string | null;
  required?: boolean;
  className?: string;
};

export function TextField({
  id,
  label,
  hint,
  errors,
  required,
  className,
  value,
  onChange,
  mono,
  ...rest
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      errors={errors}
      required={required}
      className={className}
    >
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={errors && errors.length > 0 ? true : undefined}
        className={cn(mono && "font-mono text-[13px]")}
        {...rest}
      />
    </Field>
  );
}

export function TextareaField({
  id,
  label,
  hint,
  errors,
  required,
  className,
  value,
  onChange,
  max,
  rows = 4,
  ...rest
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  /** Soft limit used by the counter only; validation stays in zod. */
  max?: number;
  rows?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "value" | "onChange" | "rows">) {
  return (
    <Field
      label={
        <span className="flex items-center justify-between gap-3">
          <span>{label}</span>
          <CharCount value={value} max={max} />
        </span>
      }
      htmlFor={id}
      hint={hint}
      errors={errors}
      required={required}
      className={className}
    >
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={errors && errors.length > 0 ? true : undefined}
        {...rest}
      />
    </Field>
  );
}

export function SelectField<V extends string>({
  id,
  label,
  hint,
  errors,
  required,
  className,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: BaseFieldProps & {
  value: V;
  onChange: (value: V) => void;
  options: readonly { value: V; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      errors={errors}
      required={required}
      className={className}
    >
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
        disabled={disabled}
        aria-invalid={errors && errors.length > 0 ? true : undefined}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/** Label + description on the left, switch on the right, inside a hairline box. */
export function SwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  errors,
  className,
}: {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  errors?: string[] | string | null;
  className?: string;
}) {
  return (
    <Field errors={errors} className={className}>
      <div className="flex items-center justify-between gap-4 rounded-sm border border-line-800 bg-surface-900 px-3 py-2.5">
        <div className="min-w-0">
          <label htmlFor={id} className="block text-sm font-medium text-fg-100">
            {label}
          </label>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-fg-500">{description}</p>
          ) : null}
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      </div>
    </Field>
  );
}

/** Two-column field grid that collapses on small screens. */
export function FieldGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

/** Small inline notice (info / warning) for forms. */
export function FormNotice({
  tone = "info",
  icon: Icon,
  children,
  className,
}: {
  tone?: "info" | "warning";
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "warning" ? "status" : undefined}
      className={cn(
        "flex items-start gap-2.5 rounded-sm border px-3 py-2.5 text-xs leading-relaxed",
        tone === "warning"
          ? "border-amber-400/30 bg-amber-400/5 text-amber-200"
          : "border-line-700 bg-surface-800/60 text-fg-300",
        className,
      )}
    >
      {Icon ? <Icon className="mt-px h-3.5 w-3.5 shrink-0" /> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
