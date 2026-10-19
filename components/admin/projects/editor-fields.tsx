"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Tab panels: every tab stays mounted (form state persists); hidden ones are
// display:none. A context tells children when they become visible so
// auto-sizing textareas can re-measure.
// -----------------------------------------------------------------------------
const TabActiveContext = React.createContext(true);

export function TabPanel({
  active,
  children,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabActiveContext.Provider value={active}>
      <div role="tabpanel" hidden={!active} className={cn(active && "space-y-6", className)}>
        {children}
      </div>
    </TabActiveContext.Provider>
  );
}

/** Textarea that grows with its content. Works with react-hook-form `register`. */
export const AutoTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function AutoTextarea({ onInput, className, rows = 3, ...props }, ref) {
  const inner = React.useRef<HTMLTextAreaElement | null>(null);
  const active = React.useContext(TabActiveContext);

  const resize = React.useCallback(() => {
    const el = inner.current;
    if (!el || el.offsetParent === null) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, []);

  React.useEffect(() => {
    if (active) resize();
  }, [active, resize]);

  return (
    <Textarea
      ref={(el) => {
        inner.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      rows={rows}
      onInput={(e) => {
        resize();
        onInput?.(e);
      }}
      className={cn("resize-none overflow-hidden", className)}
      {...props}
    />
  );
});

/** "42 / 160" counter that turns amber near the limit and red over it. */
export function CharCounter({ value, max }: { value: string | undefined; max: number }) {
  const n = value?.length ?? 0;
  const ratio = n / max;
  return (
    <span
      className={cn(
        "font-mono text-[10px] tabular-nums",
        n > max ? "text-crimson-400" : ratio > 0.9 ? "text-amber-300" : "text-fg-500",
      )}
      aria-live="polite"
    >
      {n} / {max}
    </span>
  );
}

/** Label row with a trailing counter, used above inputs that have a soft limit. */
export function LabelWithCounter({
  htmlFor,
  label,
  value,
  max,
  required,
}: {
  htmlFor: string;
  label: string;
  value: string | undefined;
  max: number;
  required?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-fg-300">
        {label}
        {required ? <span className="ml-1 text-ember-400">*</span> : null}
      </label>
      <CharCounter value={value} max={max} />
    </div>
  );
}

/** Removable chip. */
export function Chip({
  children,
  onRemove,
  className,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-sm border border-line-700 bg-surface-700 pr-1 pl-2.5 text-xs text-fg-100",
        !onRemove && "pr-2.5",
        className,
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="flex h-5 w-5 items-center justify-center rounded-xs text-fg-500 hover:bg-surface-600 hover:text-fg-50"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}

/**
 * Chips input with suggestions. Enter or comma adds the typed value; Backspace
 * on an empty input removes the last chip.
 */
export function ChipsInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  id,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  id?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (value.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  };
  const remaining = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-sm border border-line-700 bg-surface-900 px-2 py-1.5 transition-colors focus-within:border-ember-500 hover:border-line-600">
        {value.map((v) => (
          <Chip key={v} onRemove={() => onChange(value.filter((x) => x !== v))}>
            {v}
          </Chip>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="h-7 min-w-24 flex-1 bg-transparent text-sm text-fg-100 outline-none placeholder:text-fg-500"
        />
      </div>
      {remaining.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] tracking-wider text-fg-500 uppercase">Add</span>
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-sm border border-dashed border-line-700 px-2 py-0.5 text-xs text-fg-300 transition-colors hover:border-line-600 hover:text-fg-50"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Two-column row for the side panel: label left, control right. */
export function SideRow({
  label,
  htmlFor,
  children,
  hint,
  stacked = false,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn("space-y-1.5", !stacked && "flex items-center justify-between gap-3 space-y-0")}
    >
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-fg-300">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-[11px] leading-snug text-fg-500">{hint}</p> : null}
      </div>
      <div className={cn(stacked ? "w-full" : "shrink-0")}>{children}</div>
    </div>
  );
}

/** Small inline search box. */
export function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="search" className="h-9 text-[13px]" {...props} />;
}
