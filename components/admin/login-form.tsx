"use client";

import * as React from "react";
import { signInWithPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = React.useActionState(signInWithPassword, null);
  const errors = !state || state.ok ? undefined : state.fieldErrors;
  const formError = state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="login-email" errors={errors?.email}>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          required
          autoFocus
          aria-invalid={errors?.email ? true : undefined}
        />
      </Field>
      <Field label="Password" htmlFor="login-password" errors={errors?.password}>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          aria-invalid={errors?.password ? true : undefined}
        />
      </Field>
      {formError ? (
        <p
          role="alert"
          className="rounded-sm border border-crimson-500/30 bg-crimson-500/10 px-3 py-2 text-xs text-crimson-400"
        >
          {formError}
        </p>
      ) : null}
      <Button type="submit" className="w-full" loading={pending}>
        Continue
      </Button>
    </form>
  );
}
