import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { padIndex } from "@/lib/utils/format";

/**
 * Standard public section wrapper: consistent vertical rhythm + container.
 */
export function Section({
  id,
  className,
  children,
  bleed = false,
  as: Tag = "section",
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  /** Skip the horizontal container (for full-bleed showcases). */
  bleed?: boolean;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag id={id} className={cn("relative py-20 sm:py-28 lg:py-36", className)}>
      {bleed ? children : <div className="container-x">{children}</div>}
    </Tag>
  );
}

/** Mono eyebrow: "01 — SELECTED WORK" */
export function Eyebrow({
  index,
  children,
  className,
}: {
  index?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("flex items-center gap-3 label-mono", className)}>
      {typeof index === "number" ? (
        <>
          <span className="text-ember-400">{padIndex(index)}</span>
          <span aria-hidden className="h-px w-6 bg-line-600" />
        </>
      ) : null}
      <span>{children}</span>
    </p>
  );
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  action,
  className,
  align = "left",
}: {
  index?: number;
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-6 sm:mb-16 lg:flex-row lg:items-end lg:justify-between",
        align === "center" && "items-center text-center lg:flex-col lg:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        <Eyebrow index={index} className={cn(align === "center" && "justify-center")}>
          {eyebrow}
        </Eyebrow>
        <h2 className="mt-5 font-display text-display-md font-semibold text-balance text-fg-50">
          {title}
        </h2>
        {description ? (
          <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-300 sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Key/value technical metadata row: BUILD STATUS → PRODUCTION */
export function MetaRow({
  items,
  className,
}: {
  items: { label: string; value: React.ReactNode }[];
  className?: string;
}) {
  const visible = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== "");
  if (!visible.length) return null;
  return (
    <dl className={cn("grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4", className)}>
      {visible.map((item) => (
        <div key={item.label}>
          <dt className="label-mono">{item.label}</dt>
          <dd className="mt-2 text-sm text-fg-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
