"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody } from "@/components/ui/panel";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <Panel>
        <PanelBody className="flex flex-col items-center px-6 py-10 text-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-crimson-500/30 bg-crimson-500/10">
            <TriangleAlert className="h-5 w-5 text-crimson-400" aria-hidden />
          </div>
          <h1 className="text-base font-semibold text-fg-50">Something went wrong</h1>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-fg-500">
            {error.message || "The page failed to render."}
          </p>
          {error.digest ? (
            <p className="mt-2 font-mono text-[11px] text-fg-700">ref {error.digest}</p>
          ) : null}
          <div className="mt-6 flex items-center gap-2">
            <Button onClick={() => reset()} size="sm">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Try again
            </Button>
            <Link
              href={"/admin" as Route}
              className="inline-flex h-8 items-center px-3 text-xs text-fg-300 transition-colors hover:text-fg-50"
            >
              Back to dashboard
            </Link>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
