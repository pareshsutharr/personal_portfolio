"use client";

import * as React from "react";
import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { submitContact } from "@/lib/actions/contact";
import { BUDGETS, PROJECT_TYPES } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { ActionResult } from "@/types";

const MESSAGE_MIN = 20;
const MESSAGE_MAX = 4000;

type FormValues = {
  name: string;
  email: string;
  company: string;
  project_type: string;
  budget: string;
  timeline: string;
  phone: string;
  message: string;
};

const EMPTY: FormValues = {
  name: "",
  email: "",
  company: "",
  project_type: "",
  budget: "",
  timeline: "",
  phone: "",
  message: "",
};

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ActionResult<null> | null, FormData>(
    submitContact,
    null,
  );
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [startedAt] = React.useState(() => Date.now());
  const [dismissed, setDismissed] = React.useState<ActionResult<null> | null>(null);

  const success = state?.ok === true && state !== dismissed;
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const rootError = state && !state.ok && !state.fieldErrors ? state.error : null;

  const set =
    (key: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  if (success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[420px] flex-col justify-between rounded-md border border-line-800 bg-surface-900 p-6 sm:p-8"
      >
        <div>
          <p className="flex items-center gap-3 label-mono">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-3.5 w-3.5" aria-hidden />
            </span>
            Message received
          </p>
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-fg-50 sm:text-3xl">
            {state.message ?? "Thanks. I read every message and reply personally."}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-fg-300">
            You will hear back at the email you provided. No newsletters, no follow-up sequences.
          </p>
        </div>
        <div className="mt-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValues(EMPTY);
              setDismissed(state);
            }}
          >
            Send another
          </Button>
        </div>
      </div>
    );
  }

  const messageLength = values.message.trim().length;

  return (
    <form
      action={formAction}
      noValidate
      className="relative rounded-md border border-line-800 bg-surface-900 p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="contact-name" required errors={fieldErrors.name}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            value={values.name}
            onChange={set("name")}
            aria-invalid={fieldErrors.name ? true : undefined}
          />
        </Field>
        <Field label="Email" htmlFor="contact-email" required errors={fieldErrors.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={values.email}
            onChange={set("email")}
            aria-invalid={fieldErrors.email ? true : undefined}
          />
        </Field>
        <Field label="Company" htmlFor="contact-company" errors={fieldErrors.company}>
          <Input
            id="contact-company"
            name="company"
            autoComplete="organization"
            value={values.company}
            onChange={set("company")}
          />
        </Field>
        <Field label="Phone" htmlFor="contact-phone" errors={fieldErrors.phone}>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={set("phone")}
          />
        </Field>
        <Field label="Project type" htmlFor="contact-type" errors={fieldErrors.project_type}>
          <Select
            id="contact-type"
            name="project_type"
            value={values.project_type}
            onChange={set("project_type")}
          >
            <option value="">Select…</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Budget" htmlFor="contact-budget" errors={fieldErrors.budget}>
          <Select id="contact-budget" name="budget" value={values.budget} onChange={set("budget")}>
            <option value="">Select…</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Timeline"
          htmlFor="contact-timeline"
          hint="When do you want to start, or ship?"
          errors={fieldErrors.timeline}
          className="sm:col-span-2"
        >
          <Input
            id="contact-timeline"
            name="timeline"
            placeholder="e.g. Start next month, launch in Q1"
            value={values.timeline}
            onChange={set("timeline")}
          />
        </Field>
        <Field
          label="Message"
          htmlFor="contact-message"
          required
          errors={fieldErrors.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="contact-message"
            name="message"
            rows={6}
            required
            minLength={MESSAGE_MIN}
            maxLength={MESSAGE_MAX}
            placeholder="What are you building, who is it for, and where is it today?"
            value={values.message}
            onChange={set("message")}
            aria-invalid={fieldErrors.message ? true : undefined}
            aria-describedby="contact-message-count"
          />
          <p
            id="contact-message-count"
            className="flex justify-between pt-1 font-mono text-[11px] leading-none text-fg-500"
            aria-live="polite"
          >
            <span>
              {messageLength < MESSAGE_MIN
                ? `${MESSAGE_MIN - messageLength} more characters needed`
                : "Ready to send"}
            </span>
            <span className="tabular-nums">
              {messageLength} / {MESSAGE_MAX}
            </span>
          </p>
        </Field>
      </div>

      {/* Anti-spam: honeypot + fill-time. Both invisible to people. */}
      <div
        aria-hidden="true"
        className="absolute top-auto -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <input type="hidden" name="started_at" value={startedAt} suppressHydrationWarning />

      {rootError ? (
        <p role="alert" className="mt-5 text-sm text-crimson-400">
          {rootError}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-fg-500">
          Your details are used only to reply to this message.
        </p>
        <Button type="submit" size="lg" loading={pending} disabled={pending}>
          {pending ? "Sending" : "Send message"}
          {!pending ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
        </Button>
      </div>
    </form>
  );
}
