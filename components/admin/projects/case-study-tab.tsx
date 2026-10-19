"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Field } from "@/components/ui/field";
import { AutoTextarea } from "./editor-fields";
import type { ProjectFormValues } from "./editor-types";

type CaseStudyField = {
  name: keyof Pick<
    ProjectFormValues,
    | "overview"
    | "problem"
    | "objective"
    | "responsibilities"
    | "architecture"
    | "challenge"
    | "solution"
    | "outcome"
    | "impact"
    | "results"
  >;
  label: string;
  helper: string;
  rows?: number;
  mono?: boolean;
};

const FIELDS: CaseStudyField[] = [
  {
    name: "overview",
    label: "Overview",
    helper: "What the product is and who it serves. Two to four sentences.",
    rows: 4,
  },
  {
    name: "problem",
    label: "Problem",
    helper: "The situation before the work started. Concrete, not dramatic.",
  },
  { name: "objective", label: "Objective", helper: "What the engagement set out to deliver." },
  {
    name: "responsibilities",
    label: "Responsibilities",
    helper: "One per line. Start with a verb: Built, Designed, Integrated, Deployed…",
    rows: 5,
    mono: true,
  },
  {
    name: "architecture",
    label: "Architecture",
    helper: "Stack, services, data flow. Diagrams go in Images → type “Architecture”.",
    rows: 4,
  },
  { name: "challenge", label: "Challenge", helper: "The hardest technical or product constraint." },
  {
    name: "solution",
    label: "Solution",
    helper: "How the challenge was solved. Name the technique, not the buzzword.",
    rows: 4,
  },
  { name: "outcome", label: "Outcome", helper: "What shipped. Features, platforms, releases." },
  {
    name: "impact",
    label: "Impact",
    helper: "Effect on users or the business. Only what you can stand behind.",
  },
  {
    name: "results",
    label: "Results",
    helper: "Only verified, real outcomes. Leave empty if unknown.",
  },
];

export function CaseStudyTab() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProjectFormValues>();
  const ids = React.useId();

  return (
    <>
      <p className="text-xs leading-relaxed text-fg-500">
        Every section is optional. Empty sections are hidden on the public page — never fill a block
        just to fill it.
      </p>
      <div className="space-y-6">
        {FIELDS.map((f) => (
          <Field
            key={f.name}
            label={f.label}
            htmlFor={`${ids}-${f.name}`}
            hint={f.helper}
            errors={errors[f.name]?.message}
          >
            <AutoTextarea
              id={`${ids}-${f.name}`}
              rows={f.rows ?? 3}
              className={f.mono ? "font-mono text-[13px]" : undefined}
              aria-invalid={errors[f.name] ? true : undefined}
              {...register(f.name)}
            />
          </Field>
        ))}
      </div>
    </>
  );
}
