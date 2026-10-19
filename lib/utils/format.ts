const monthYear = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });
const full = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatMonthYear(value: string | Date | null | undefined) {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : monthYear.format(d);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : full.format(d);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : dateTime.format(d);
}

export function yearOf(value: string | Date | null | undefined) {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
}

/**
 * Period label for timelines. Prefers an explicit override, then dates,
 * then nothing (never invents a date).
 */
export function formatPeriod(opts: {
  periodLabel?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean | null;
}) {
  if (opts.periodLabel) return opts.periodLabel;
  const start = formatMonthYear(opts.startDate);
  const end = opts.isCurrent ? "Present" : formatMonthYear(opts.endDate);
  if (start && end) return `${start} — ${end}`;
  if (start) return start;
  if (end && end !== "Present") return end;
  if (opts.isCurrent) return "Present";
  return null;
}

export function relativeTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = (Date.now() - d.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (diff < 60) return "just now";
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), "hour");
  if (diff < 86400 * 30) return rtf.format(-Math.floor(diff / 86400), "day");
  return formatDate(d) ?? "";
}

export function padIndex(index: number) {
  return String(index).padStart(2, "0");
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
