"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

interface OverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const subscribeNoop = () => () => {};

/** True after hydration (safe for portals), false during SSR. */
function useIsClient() {
  return React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

function useOverlay(open: boolean, onOpenChange: (o: boolean) => void) {
  const mounted = useIsClient();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  return mounted;
}

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      aria-hidden
      onClick={onClick}
      className="animate-in fade-in fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]"
    />
  );
}

/** Centered modal dialog. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: OverlayProps) {
  const mounted = useOverlay(open, onOpenChange);
  const titleId = React.useId();
  if (!mounted || !open) return null;

  return createPortal(
    <>
      <Backdrop onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={cn(
            "w-full max-w-lg rounded-lg border border-line-700 bg-surface-900 shadow-panel",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line-800 px-5 py-4">
            <div>
              {title ? (
                <h2 id={titleId} className="text-base font-semibold text-fg-50">
                  {title}
                </h2>
              ) : null}
              {description ? <p className="mt-1 text-sm text-fg-500">{description}</p> : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
          {footer ? (
            <div className="flex justify-end gap-2 border-t border-line-800 px-5 py-3">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>,
    document.body,
  );
}

/** Right-side drawer, used for admin create/edit forms. */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: OverlayProps) {
  const mounted = useOverlay(open, onOpenChange);
  const titleId = React.useId();
  if (!mounted || !open) return null;

  return createPortal(
    <>
      <Backdrop onClick={() => onOpenChange(false)} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line-700 bg-surface-900 shadow-2xl",
          "animate-in slide-in-from-right duration-300",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-800 px-6 py-4">
          <div>
            {title ? (
              <h2 id={titleId} className="text-base font-semibold text-fg-50">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-1 text-sm text-fg-500">{description}</p> : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 scrollbar-thin overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-line-800 bg-surface-900 px-6 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </>,
    document.body,
  );
}

/** Destructive confirmation. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void onConfirm()} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-300">This action cannot be undone.</p>
    </Dialog>
  );
}
