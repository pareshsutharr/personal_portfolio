"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type RowMenuItem =
  | { type: "separator" }
  | {
      type?: "item";
      label: string;
      icon?: LucideIcon;
      onSelect?: () => void;
      href?: string;
      external?: boolean;
      danger?: boolean;
      disabled?: boolean;
    };

/**
 * Compact "…" menu for table rows. Renders in a portal so it is never clipped
 * by the table's horizontal scroll container.
 */
export function RowMenu({
  items,
  label = "Row actions",
}: {
  items: RowMenuItem[];
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const place = React.useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    place();
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, place]);

  React.useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>(
      "[role=menuitem]:not([aria-disabled=true])",
    );
    first?.focus();
  }, [open, pos]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const nodes = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]:not([aria-disabled=true])") ??
        [],
    );
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown" ? (i + 1) % nodes.length : (i - 1 + nodes.length) % nodes.length;
    nodes[next]?.focus();
  };

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-8 w-8"
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              onKeyDown={onMenuKeyDown}
              style={{ top: pos.top, right: pos.right }}
              className="fixed z-50 min-w-48 rounded-md border border-line-700 bg-surface-900 p-1 shadow-panel"
            >
              {items.map((item, i) =>
                item.type === "separator" ? (
                  <div key={`sep-${i}`} role="separator" className="my-1 h-px bg-line-800" />
                ) : (
                  <MenuEntry key={item.label} item={item} close={() => setOpen(false)} />
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MenuEntry({
  item,
  close,
}: {
  item: Exclude<RowMenuItem, { type: "separator" }>;
  close: () => void;
}) {
  const Icon = item.icon;
  const className = cn(
    "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left text-[13px] outline-none transition-colors",
    item.danger
      ? "text-crimson-400 hover:bg-crimson-500/10 focus:bg-crimson-500/10"
      : "text-fg-100 hover:bg-surface-800 focus:bg-surface-800",
    item.disabled && "pointer-events-none opacity-50",
  );
  const content = (
    <>
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden /> : null}
      <span className="flex-1">{item.label}</span>
    </>
  );
  if (item.href) {
    return (
      <a
        role="menuitem"
        href={item.href}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        aria-disabled={item.disabled || undefined}
        className={className}
        onClick={close}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={item.disabled || undefined}
      disabled={item.disabled}
      className={className}
      onClick={() => {
        close();
        item.onSelect?.();
      }}
    >
      {content}
    </button>
  );
}
