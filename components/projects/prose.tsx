import * as React from "react";
import { cn } from "@/lib/utils/cn";

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;

type Block = { kind: "p"; text: string } | { kind: "ul"; items: string[]; ordered: boolean };

/** Splits plain text with newlines into paragraphs and simple lists. */
export function parseProse(text: string): Block[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .flatMap<Block>((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const allBullets = lines.length > 0 && lines.every((l) => BULLET.test(l));
      if (allBullets) {
        return [
          {
            kind: "ul",
            ordered: /^\s*\d+[.)]/.test(lines[0]),
            items: lines.map((l) => l.replace(BULLET, "")),
          },
        ];
      }
      // A paragraph followed by bullets inside the same block ("Intro:\n- a\n- b").
      const firstBullet = lines.findIndex((l) => BULLET.test(l));
      if (firstBullet > 0 && lines.slice(firstBullet).every((l) => BULLET.test(l))) {
        return [
          { kind: "p", text: lines.slice(0, firstBullet).join("\n") },
          {
            kind: "ul",
            ordered: /^\s*\d+[.)]/.test(lines[firstBullet]),
            items: lines.slice(firstBullet).map((l) => l.replace(BULLET, "")),
          },
        ];
      }
      return [{ kind: "p", text: lines.join("\n") }];
    });
}

/**
 * Renders CMS plain text. Blank lines separate paragraphs; lines starting
 * with "- ", "* " or "1. " become lists. No markdown library.
 */
export function Prose({
  text,
  className,
  size = "md",
}: {
  text: string | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (!text) return null;
  const blocks = parseProse(text);
  if (blocks.length === 0) return null;
  const body = {
    sm: "text-sm leading-relaxed",
    md: "text-base leading-relaxed sm:text-[1.0625rem] sm:leading-[1.75]",
    lg: "text-lg leading-relaxed",
  }[size];
  return (
    <div className={cn("space-y-5 text-fg-300", body, className)}>
      {blocks.map((b, i) =>
        b.kind === "p" ? (
          <p key={i} className="whitespace-pre-line">
            {b.text}
          </p>
        ) : b.ordered ? (
          <ol key={i} className="space-y-2.5 pl-1">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-4">
                <span className="mt-[0.45em] shrink-0 label-mono text-ember-400 tabular-nums">
                  {String(j + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        ) : (
          <ul key={i} className="space-y-2.5 pl-1">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-4">
                <span aria-hidden className="mt-[0.7em] h-px w-4 shrink-0 bg-ember-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
