"use client";

import { RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container-x flex min-h-[70vh] flex-col justify-center py-32">
      <p className="label-mono">
        <span className="text-crimson-400">ERR</span>
        <span className="mx-3 text-fg-700">/</span>
        RENDER FAILED
      </p>
      <h1 className="mt-6 font-display text-display-md font-semibold text-fg-50">
        Something broke.
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-fg-300">
        This section failed to render. Trying again usually fixes it; if it does not, the rest of
        the site still works.
      </p>
      {error.digest ? <p className="mt-4 label-mono">REF {error.digest}</p> : null}
      <div className="mt-10 flex flex-wrap gap-3">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
        <ButtonLink href="/" variant="outline">
          Back home
        </ButtonLink>
      </div>
    </main>
  );
}
