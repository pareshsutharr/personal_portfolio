"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Apple, ExternalLink, GitBranch, Play, type LucideIcon } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ProjectFormValues } from "./editor-types";

const LINKS: {
  name: keyof Pick<
    ProjectFormValues,
    "live_url" | "github_url" | "app_store_url" | "play_store_url"
  >;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  hint: string;
}[] = [
  {
    name: "live_url",
    label: "Live URL",
    icon: ExternalLink,
    placeholder: "https://",
    hint: "Production site or app landing page.",
  },
  {
    name: "github_url",
    label: "GitHub",
    icon: GitBranch,
    placeholder: "https://github.com/…",
    hint: "Only for public repositories.",
  },
  {
    name: "app_store_url",
    label: "App Store",
    icon: Apple,
    placeholder: "https://apps.apple.com/…",
    hint: "iOS listing.",
  },
  {
    name: "play_store_url",
    label: "Play Store",
    icon: Play,
    placeholder: "https://play.google.com/…",
    hint: "Android listing.",
  },
];

export function LinksTab() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ProjectFormValues>();
  const ids = React.useId();
  const confidential = watch("confidential");

  return (
    <>
      {confidential ? (
        <p className="rounded-sm border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
          This project is confidential: links are hidden on the public site in summary mode.
        </p>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Field
              key={l.name}
              label={l.label}
              htmlFor={`${ids}-${l.name}`}
              hint={l.hint}
              errors={errors[l.name]?.message}
            >
              <div className="relative">
                <Icon
                  className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-fg-500"
                  aria-hidden
                />
                <Input
                  id={`${ids}-${l.name}`}
                  type="url"
                  inputMode="url"
                  placeholder={l.placeholder}
                  className="pl-9 font-mono text-[13px]"
                  aria-invalid={errors[l.name] ? true : undefined}
                  {...register(l.name)}
                />
              </div>
            </Field>
          );
        })}
      </div>
    </>
  );
}
