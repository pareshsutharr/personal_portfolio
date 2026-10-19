"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatMonthYear, formatPeriod } from "@/lib/utils/format";
import { initials, isOptimizableImage } from "@/lib/utils/image";
import { EMPLOYMENT_TYPE_LABELS, type Experience } from "@/types";

/* -------------------------------------------------------------------------- */
/* Grouping                                                                    */
/* -------------------------------------------------------------------------- */

type CompanyGroup = {
  key: string;
  company: string;
  companyUrl: string | null;
  logo: string | null;
  location: string | null;
  roles: Experience[];
};

function groupByCompany(experiences: Experience[]): CompanyGroup[] {
  const groups: CompanyGroup[] = [];
  for (const exp of experiences) {
    const key = exp.company.trim().toLowerCase();
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.roles.push(exp);
      last.logo ??= exp.logo;
      last.companyUrl ??= exp.company_url;
      last.location ??= exp.location;
    } else {
      groups.push({
        key,
        company: exp.company.trim(),
        companyUrl: exp.company_url,
        logo: exp.logo,
        location: exp.location,
        roles: [exp],
      });
    }
  }
  return groups;
}

/** Overall span for a company: earliest start → latest end / Present. Never invents dates. */
function companySpan(roles: Experience[]) {
  const starts = roles
    .map((r) => r.start_date)
    .filter((d): d is string => Boolean(d))
    .sort();
  const isCurrent = roles.some((r) => r.is_current);
  const ends = roles
    .map((r) => r.end_date)
    .filter((d): d is string => Boolean(d))
    .sort();
  const start = starts[0] ? formatMonthYear(starts[0]) : null;
  const end = isCurrent ? "Present" : ends.length ? formatMonthYear(ends[ends.length - 1]) : null;
  if (start && end) return `${start} — ${end}`;
  if (start) return start;
  if (isCurrent) return "Present";
  return null;
}

function durationLabel(start: string | null, end: string | null, isCurrent: boolean) {
  if (!start) return null;
  const s = new Date(start);
  const e = isCurrent ? new Date() : end ? new Date(end) : null;
  if (!e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const months = Math.max(
    1,
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1,
  );
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} yr${y > 1 ? "s" : ""}`);
  if (m) parts.push(`${m} mo${m > 1 ? "s" : ""}`);
  return parts.join(" ");
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

function CompanyLogo({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = React.useState(false);
  if (src && !failed) {
    return (
      <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-line-700 bg-fg-50 sm:h-14 sm:w-14">
        <Image
          src={src}
          alt={`${name} logo`}
          fill
          sizes="56px"
          unoptimized={!isOptimizableImage(src)}
          onError={() => setFailed(true)}
          className="object-contain p-1.5"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-line-700 bg-surface-800 font-mono text-sm font-medium tracking-wider text-fg-300 sm:h-14 sm:w-14"
    >
      {initials(name)}
    </span>
  );
}

function RoleDot({ current }: { current: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative flex h-3 w-3 items-center justify-center" aria-hidden>
      <motion.span
        className={cn(
          "absolute inset-0 rounded-full",
          current ? "bg-ember-500/30" : "bg-line-600/40",
        )}
        initial={reduce ? false : { scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.span
        className={cn("h-1.5 w-1.5 rounded-full", current ? "bg-ember-400" : "bg-fg-300")}
        initial={reduce ? false : { scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  );
}

function List({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="label-mono">{label}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-fg-300">
            <span aria-hidden className="mt-[0.65em] h-px w-3 shrink-0 bg-line-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Role({
  experience,
  compact,
  isLast,
}: {
  experience: Experience;
  compact: boolean;
  isLast: boolean;
}) {
  const period = formatPeriod({
    periodLabel: experience.period_label,
    startDate: experience.start_date,
    endDate: experience.end_date,
    isCurrent: experience.is_current,
  });
  const duration = experience.period_label
    ? null
    : durationLabel(experience.start_date, experience.end_date, experience.is_current);

  return (
    <li className="relative grid grid-cols-[1.5rem_1fr] gap-x-4 sm:grid-cols-[1.5rem_1fr] sm:gap-x-6">
      {/* rail */}
      <div className="relative flex justify-center">
        <span className="mt-2">
          <RoleDot current={experience.is_current} />
        </span>
        {!isLast ? (
          <span
            aria-hidden
            className="absolute top-7 bottom-[-1.75rem] left-1/2 w-px -translate-x-1/2 bg-line-700"
          />
        ) : null}
      </div>

      <Reveal y={14} className={cn("min-w-0", !isLast && "pb-10")}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-display text-xl font-semibold tracking-tight text-fg-50 sm:text-2xl">
            {experience.position}
          </h3>
          {experience.is_current ? (
            <Badge tone="success" mono>
              Current
            </Badge>
          ) : null}
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-300">
          <span>{EMPLOYMENT_TYPE_LABELS[experience.employment_type]}</span>
          {period ? (
            <>
              <span className="text-fg-700">·</span>
              <span className="font-mono text-xs tracking-wide text-fg-300 uppercase">
                {period}
              </span>
            </>
          ) : null}
          {duration ? (
            <>
              <span className="text-fg-700">·</span>
              <span className="text-fg-500">{duration}</span>
            </>
          ) : null}
        </p>

        {experience.description ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-300 sm:text-[0.9375rem]">
            {experience.description}
          </p>
        ) : null}

        {!compact ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <List label="Responsibilities" items={experience.responsibilities} />
            <List label="Achievements" items={experience.achievements} />
          </div>
        ) : null}

        {experience.technologies.length ? (
          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Technologies">
            {experience.technologies.map((t) => (
              <li key={t}>
                <Badge tone="outline">{t}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </Reveal>
    </li>
  );
}

function Company({
  group,
  compact,
  index,
}: {
  group: CompanyGroup;
  compact: boolean;
  index: number;
}) {
  const span = companySpan(group.roles);
  const current = group.roles.some((r) => r.is_current);
  const name = group.companyUrl ? (
    <a
      href={group.companyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 transition-colors hover:text-ember-300"
    >
      {group.company}
      <ArrowUpRight className="h-4 w-4" aria-hidden />
    </a>
  ) : (
    group.company
  );

  return (
    <li className="relative">
      <Reveal className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Company header (sticky on desktop) */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="flex items-center gap-3 label-mono">
              <span className="text-ember-400">{String(index + 1).padStart(2, "0")}</span>
              <span aria-hidden className="h-px w-6 bg-line-600" />
              <span>{group.roles.length > 1 ? `${group.roles.length} roles` : "1 role"}</span>
            </p>
            <div className="mt-5 flex items-start gap-4">
              <CompanyLogo src={group.logo} name={group.company} />
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-fg-50 sm:text-[1.75rem]">
                  {name}
                </h2>
                {span ? (
                  <p className="mt-1.5 font-mono text-xs tracking-wide text-ember-400 uppercase">
                    {span}
                  </p>
                ) : null}
                {group.location ? (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-fg-500">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {group.location}
                  </p>
                ) : null}
                {current ? (
                  <p className="mt-3">
                    <Badge tone="success" mono>
                      Currently here
                    </Badge>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Roles, newest first like LinkedIn */}
        <div className="lg:col-span-8">
          <ol className="rounded-md border border-line-800 bg-surface-900 p-5 sm:p-7 lg:p-8">
            {[...group.roles].reverse().map((role, i, arr) => (
              <Role
                key={role.id}
                experience={role}
                compact={compact}
                isLast={i === arr.length - 1}
              />
            ))}
          </ol>
        </div>
      </Reveal>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Public component                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Career journey grouped by company, LinkedIn style: company header on the
 * left, roles stacked on a vertical rail on the right (latest role first).
 */
export function ExperienceTimeline({
  experiences,
  compact = false,
}: {
  experiences: Experience[];
  compact?: boolean;
}) {
  if (!experiences.length) return null;
  const groups = groupByCompany(experiences);

  return (
    <ol className="space-y-16 lg:space-y-24">
      {groups.map((g, i) => (
        <Company key={g.key} group={g} compact={compact} index={i} />
      ))}
    </ol>
  );
}
