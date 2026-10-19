import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ChartLine } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { getAnalytics, type Analytics, type Bucket } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;

const num = new Intl.NumberFormat("en-IN");
const dayLabel = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});
const fmtDay = (d: string) => dayLabel.format(new Date(`${d}T12:00:00Z`));

function delta(now: number, before: number) {
  if (!before) return now ? "new" : "—";
  const pct = Math.round(((now - before) / before) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Panel className="p-5">
      <p className="label-mono">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-fg-50">{value}</p>
      {hint ? <p className="mt-1 text-xs text-fg-500">{hint}</p> : null}
    </Panel>
  );
}

function BucketTable({
  title,
  rows,
  labelHeader,
  showExtra,
}: {
  title: string;
  rows: Bucket[];
  labelHeader: string;
  showExtra?: string;
}) {
  const max = rows[0]?.views ?? 0;
  return (
    <Panel>
      <PanelHeader title={title} />
      <PanelBody className="p-0">
        {rows.length ? (
          <table className="w-full text-sm">
            <thead className="text-left label-mono">
              <tr className="border-b border-line-800">
                <th className="px-4 py-2 font-normal">{labelHeader}</th>
                {showExtra ? <th className="px-4 py-2 font-normal">{showExtra}</th> : null}
                <th className="px-4 py-2 text-right font-normal">Views</th>
                <th className="px-4 py-2 text-right font-normal">Visitors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-800">
              {rows.map((r) => (
                <tr key={r.key} className="relative">
                  <td className="relative px-4 py-2 text-fg-100">
                    <span
                      aria-hidden
                      className="absolute inset-y-1 left-0 rounded-r-sm bg-ember-500/10"
                      style={{ width: `${max ? Math.max(2, (r.views / max) * 100) : 0}%` }}
                    />
                    <span className="relative break-all">{r.label || "(none)"}</span>
                  </td>
                  {showExtra ? <td className="px-4 py-2 text-xs text-fg-500">{r.extra}</td> : null}
                  <td className="px-4 py-2 text-right text-fg-100 tabular-nums">
                    {num.format(r.views)}
                  </td>
                  <td className="px-4 py-2 text-right text-fg-300 tabular-nums">
                    {num.format(r.visitors)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-6 text-sm text-fg-500">Nothing yet for this range.</p>
        )}
      </PanelBody>
    </Panel>
  );
}

function DailyChart({ daily }: { daily: Analytics["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.views));
  return (
    <Panel>
      <PanelHeader
        title="Views per day"
        description="Bars are page views; the brighter part is unique visitors."
      />
      <PanelBody>
        <div className="flex h-40 items-end gap-[3px]">
          {daily.map((d) => (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`${fmtDay(d.day)}: ${d.views} views, ${d.visitors} visitors`}
            >
              <div
                className="w-full rounded-t-sm bg-ember-500/25"
                style={{ height: `${(d.views / max) * 100}%` }}
              >
                <div
                  className="w-full rounded-t-sm bg-ember-500/70"
                  style={{ height: `${d.views ? (d.visitors / d.views) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="text-fg-600 mt-2 flex justify-between label-mono">
          <span>{fmtDay(daily[0]?.day ?? "")}</span>
          <span>{fmtDay(daily.at(-1)?.day ?? "")}</span>
        </div>
      </PanelBody>
    </Panel>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const rangeDays = (RANGES as readonly number[]).includes(Number(range)) ? Number(range) : 30;

  let data: Analytics | null = null;
  let missingTable = false;
  let errorMessage: string | null = null;
  try {
    data = await getAnalytics(rangeDays);
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e?.code === "42P01" || /page_views/.test(e?.message ?? "")) missingTable = true;
    else errorMessage = e?.message ?? "Unknown error";
  }

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="First-party page views, visitors, sources and UTM campaigns. No cookies, no third-party script, no personal data."
        actions={
          <div className="flex gap-1 rounded-md border border-line-800 p-1">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/analytics?range=${r}` as Route}
                className={cn(
                  "rounded-sm px-3 py-1 text-xs transition-colors",
                  r === rangeDays ? "bg-surface-800 text-fg-50" : "text-fg-400 hover:text-fg-100",
                )}
              >
                {r} days
              </Link>
            ))}
          </div>
        }
      />

      {missingTable ? (
        <EmptyState
          icon={ChartLine}
          title="One migration to run."
          description="The page_views table does not exist yet. Run supabase/migrations/20261019150000_page_views.sql in the Supabase SQL editor (or pnpm db:apply with an access token). Views start recording the moment it exists; nothing else needs a deploy."
        />
      ) : errorMessage ? (
        <EmptyState icon={ChartLine} title="Could not load analytics." description={errorMessage} />
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Page views"
              value={num.format(data.totals.views)}
              hint={`${delta(data.totals.views, data.totals.previousViews)} vs previous ${data.rangeDays} days`}
            />
            <Stat
              label="Visitors"
              value={num.format(data.totals.visitors)}
              hint={`${delta(data.totals.visitors, data.totals.previousVisitors)} vs previous ${data.rangeDays} days`}
            />
            <Stat
              label="Top source"
              value={data.sources[0]?.label ?? "—"}
              hint={
                data.sources[0]
                  ? `${data.sources[0].extra} · ${num.format(data.sources[0].views)} views`
                  : undefined
              }
            />
            <Stat
              label="Top page"
              value={data.pages[0]?.label ?? "—"}
              hint={data.pages[0] ? `${num.format(data.pages[0].views)} views` : undefined}
            />
          </div>

          <DailyChart daily={data.daily} />

          <div className="grid gap-6 lg:grid-cols-2">
            <BucketTable
              title="Sources"
              rows={data.sources}
              labelHeader="Source"
              showExtra="Medium"
            />
            <BucketTable
              title="UTM campaigns"
              rows={data.campaigns}
              labelHeader="Campaign"
              showExtra="Source / medium"
            />
            <BucketTable title="Top pages" rows={data.pages} labelHeader="Path" />
            <BucketTable title="Referrers" rows={data.referrers} labelHeader="Site" />
            <BucketTable title="Countries" rows={data.countries} labelHeader="Country" />
            <BucketTable title="Devices" rows={data.devices} labelHeader="Device" />
          </div>

          <p className="flex flex-wrap items-center gap-3 text-xs text-fg-500">
            <Badge tone="neutral" mono>
              {data.from} → {data.to}
            </Badge>
            <span>
              Tag links you share with{" "}
              <code className="text-fg-300">
                ?utm_source=linkedin&amp;utm_medium=social&amp;utm_campaign=launch
              </code>{" "}
              and they appear under UTM campaigns. Raw rows are kept 180 days.
            </span>
            {data.truncated ? (
              <span className="text-amber-400">Range capped at 100k rows; totals are partial.</span>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
