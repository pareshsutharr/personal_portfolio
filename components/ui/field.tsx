import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium tracking-wide text-fg-300", className)}
      {...props}
    />
  );
}

export function Hint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs leading-relaxed text-fg-500", className)} {...props} />;
}

export function FieldError({ errors }: { errors?: string[] | string | null }) {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) return null;
  const list = Array.isArray(errors) ? errors : [errors];
  return (
    <p role="alert" className="text-xs text-crimson-400">
      {list[0]}
    </p>
  );
}

export interface FieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  errors?: string[] | string | null;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint + error, vertically stacked. */
export function Field({ label, htmlFor, hint, errors, required, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-1 text-ember-400">*</span> : null}
        </Label>
      ) : null}
      {children}
      {hint && !errors ? <Hint>{hint}</Hint> : null}
      <FieldError errors={errors} />
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-6 lg:grid-cols-[220px_1fr]", className)}>
      <div>
        <h3 className="text-sm font-medium text-fg-50">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-fg-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
