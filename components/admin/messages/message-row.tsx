"use client";

import * as React from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { TR } from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";

/**
 * Table row that navigates on click while keeping real links inside it
 * reachable by keyboard. Clicks on nested interactive elements are ignored.
 */
export function LinkRow({
  href,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { href: string }) {
  const router = useRouter();
  return (
    <TR
      {...props}
      className={cn("cursor-pointer", className)}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("a, button, input, select, textarea, label")) return;
        router.push(href as Route);
      }}
      onMouseEnter={() => router.prefetch(href as Route)}
    >
      {children}
    </TR>
  );
}
