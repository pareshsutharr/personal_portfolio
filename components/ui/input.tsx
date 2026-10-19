import * as React from "react";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-sm border border-line-700 bg-surface-900 px-3 text-sm text-fg-100 placeholder:text-fg-500 transition-colors duration-200 hover:border-line-600 focus:border-ember-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-crimson-500";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = "text", ...props }, ref) {
  return <input ref={ref} type={type} className={cn(fieldBase, "h-10", className)} {...props} />;
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(fieldBase, "min-h-[2.5rem] resize-y py-2 leading-relaxed", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(fieldBase, "h-10 appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-fg-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

export interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  name?: string;
}

/** Accessible switch. Renders a hidden input so it works inside plain forms. */
export function Switch({
  checked,
  onCheckedChange,
  name,
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <>
      {name ? <input type="hidden" name={name} value={checked ? "true" : "false"} /> : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200",
          checked ? "border-ember-500 bg-ember-500" : "border-line-600 bg-surface-700",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-fg-50 transition-transform duration-200",
            checked && "translate-x-[18px]",
          )}
        />
      </button>
    </>
  );
}

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded-xs border border-line-600 bg-surface-900 accent-ember-500",
        className,
      )}
      {...props}
    />
  );
});
