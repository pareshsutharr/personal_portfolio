"use client";

import * as React from "react";
import { useActionState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquareHeart, Send, Star, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { submitFeedback } from "@/lib/actions/feedback";
import { cn } from "@/lib/utils/cn";
import type { ActionResult } from "@/types";

const EASE = [0.16, 1, 0.3, 1] as const;
const LABELS = ["", "Not for me", "Could be better", "It's fine", "Liked it", "Loved it"];

/**
 * Floating feedback button, bottom-right on every public page. Opens a small
 * card: a 1–5 rating, an optional note, optional name and email. Submissions
 * go to the admin inbox tagged "Feedback" and to the owner's email.
 */
export function FeedbackWidget() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [state, formAction, pending] = useActionState<ActionResult<null> | null, FormData>(
    submitFeedback,
    null,
  );
  const sent = state?.ok === true;

  // Close on Escape.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname.startsWith("/admin")) return null;
  const shown = hover || rating;

  return (
    <div className="fixed right-4 bottom-4 z-[45] sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Leave feedback"
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            data-lenis-prevent
            className="mb-3 w-[min(92vw,22rem)] overflow-hidden rounded-md border border-line-700 bg-surface-900 shadow-panel"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line-800 px-5 py-4">
              <div>
                <p className="label-mono text-ember-400">Quick feedback</p>
                <h2 className="mt-1.5 font-display text-lg font-semibold tracking-tight text-fg-50">
                  How was this portfolio?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mt-1 -mr-2 flex h-9 w-9 items-center justify-center rounded-sm text-fg-300 transition-colors hover:bg-surface-800 hover:text-fg-50"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {sent ? (
              <div className="px-5 py-8 text-center">
                <MessageSquareHeart className="mx-auto h-8 w-8 text-ember-400" aria-hidden />
                <p className="mt-4 font-display text-lg font-semibold text-fg-50">Thank you.</p>
                <p className="mt-2 text-sm leading-relaxed text-fg-300">{state?.message}</p>
              </div>
            ) : (
              <form action={formAction} className="px-5 py-4">
                <input type="hidden" name="rating" value={rating} />
                <input type="hidden" name="page" value={pathname} />
                <div className="sr-only" aria-hidden>
                  <label htmlFor="fb-website">Website</label>
                  <input id="fb-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} out of 5, ${LABELS[n]}`}
                      onClick={() => setRating(n)}
                      onPointerEnter={() => setHover(n)}
                      onPointerLeave={() => setHover(0)}
                      className="flex h-10 w-10 items-center justify-center rounded-sm transition-colors hover:bg-surface-800"
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition-colors",
                          n <= shown ? "fill-ember-500 text-ember-500" : "text-fg-700",
                        )}
                        aria-hidden
                      />
                    </button>
                  ))}
                  <span className="ml-2 min-w-[6rem] label-mono text-fg-300">
                    {shown ? LABELS[shown] : "Tap a star"}
                  </span>
                </div>
                {state?.fieldErrors?.rating ? (
                  <p className="mt-2 text-xs text-danger">Pick a rating first.</p>
                ) : null}

                <textarea
                  name="message"
                  rows={3}
                  maxLength={1000}
                  placeholder="Anything you'd like to tell me? Optional."
                  className="mt-4 w-full resize-none rounded-sm border border-line-700 bg-bg-900 px-3 py-2.5 text-sm text-fg-100 placeholder:text-fg-500 focus:border-fg-300 focus:outline-none"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    name="name"
                    maxLength={80}
                    placeholder="Name (optional)"
                    className="w-full rounded-sm border border-line-700 bg-bg-900 px-3 py-2 text-sm text-fg-100 placeholder:text-fg-500 focus:border-fg-300 focus:outline-none"
                  />
                  <input
                    name="email"
                    type="email"
                    maxLength={160}
                    placeholder="Email (optional)"
                    className="w-full rounded-sm border border-line-700 bg-bg-900 px-3 py-2 text-sm text-fg-100 placeholder:text-fg-500 focus:border-fg-300 focus:outline-none"
                  />
                </div>
                {state && !state.ok && !state.fieldErrors ? (
                  <p className="mt-3 text-xs text-danger">{state.error}</p>
                ) : null}
                {state?.fieldErrors?.email ? (
                  <p className="mt-2 text-xs text-danger">That email does not look right.</p>
                ) : null}

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-[11px] leading-snug text-fg-500">
                    Goes straight to me. No account needed.
                  </p>
                  <button
                    type="submit"
                    disabled={pending || rating === 0}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-sm bg-fg-50 px-4 text-sm font-medium text-bg-950 transition-colors hover:bg-white disabled:opacity-50"
                  >
                    {pending ? "Sending…" : "Send"}
                    <Send className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close feedback" : "Leave feedback"}
        data-cursor
        whileHover={reduce ? undefined : { scale: 1.06 }}
        whileTap={reduce ? undefined : { scale: 0.96 }}
        className={cn(
          "group relative ml-auto flex h-12 w-12 items-center justify-center rounded-full border border-ember-400/40 bg-ember-500 text-white shadow-[0_10px_30px_-10px_rgb(232_82_31_/_0.7)] transition-colors hover:bg-ember-400",
          open && "bg-surface-800 text-fg-50 hover:bg-surface-700",
        )}
      >
        {!open && !reduce ? (
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-ember-500/40 [animation-duration:2.4s] [animation-iteration-count:3]"
          />
        ) : null}
        {open ? (
          <X className="relative h-5 w-5" aria-hidden />
        ) : (
          <MessageSquareHeart className="relative h-5 w-5" aria-hidden />
        )}
      </motion.button>
    </div>
  );
}
