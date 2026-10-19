import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ChartLine, ExternalLink, Settings } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("ga_measurement_id,vercel_analytics_enabled")
    .limit(1)
    .maybeSingle();

  const gaId = data?.ga_measurement_id?.trim() || null;
  const vercel = data?.vercel_analytics_enabled ?? false;

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Traffic reports live in the provider dashboards. Nothing here is estimated."
      />

      {!gaId ? (
        <EmptyState
          icon={ChartLine}
          title="Analytics not connected."
          description="Add a Google Analytics measurement ID (G-XXXXXXX) in Site Settings and the public site will start sending page views. This page will then show the configured ID and a link to your reports."
          action={
            <ButtonLink href="/admin/settings" size="sm" variant="secondary">
              <Settings className="h-3.5 w-3.5" aria-hidden /> Open Site Settings
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              title="Google Analytics"
              actions={
                <Badge tone="success" mono>
                  Connected
                </Badge>
              }
            />
            <PanelBody className="space-y-4">
              <div>
                <span className="label-mono">Measurement ID</span>
                <p className="mt-1 font-display text-xl font-semibold tracking-tight text-fg-50">
                  {gaId}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-fg-300">
                Page views, sessions and sources are reported inside Google Analytics. This
                dashboard does not pull or fabricate numbers.
              </p>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="https://analytics.google.com/" external size="sm">
                  Open Google Analytics <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </ButtonLink>
                <Link
                  href={"/admin/settings" as Route}
                  className="inline-flex h-8 items-center px-3 text-xs text-fg-300 transition-colors hover:text-fg-50"
                >
                  Change ID
                </Link>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Vercel Analytics"
              actions={
                <Badge tone={vercel ? "success" : "neutral"} mono>
                  {vercel ? "Enabled" : "Disabled"}
                </Badge>
              }
            />
            <PanelBody className="space-y-4">
              <p className="text-sm leading-relaxed text-fg-300">
                {vercel
                  ? "The Vercel Analytics script is injected on the public site. Reports are available in the Vercel project dashboard under Analytics."
                  : "Turn this on in Site Settings to collect privacy-friendly page views through Vercel. Requires the project to be deployed on Vercel."}
              </p>
              <div className="flex flex-wrap gap-2">
                {vercel ? (
                  <ButtonLink
                    href="https://vercel.com/dashboard"
                    external
                    size="sm"
                    variant="secondary"
                  >
                    Open Vercel <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </ButtonLink>
                ) : null}
                <Link
                  href={"/admin/settings" as Route}
                  className="inline-flex h-8 items-center px-3 text-xs text-fg-300 transition-colors hover:text-fg-50"
                >
                  {vercel ? "Manage" : "Enable in Site Settings"}
                </Link>
              </div>
            </PanelBody>
          </Panel>
        </div>
      )}
    </div>
  );
}
