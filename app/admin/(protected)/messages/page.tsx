import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Inbox, SearchX } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { LinkRow } from "@/components/admin/messages/message-row";
import { ContactPriorityBadge, ContactStatusBadge } from "@/components/admin/messages/status-badge";
import { StatusTabs, type StatusFilter } from "@/components/admin/messages/status-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CONTACT_STATUS_LABELS, type ContactStatus } from "@/types";

export const metadata: Metadata = { title: "Messages" };

const STATUS_VALUES = Object.keys(CONTACT_STATUS_LABELS) as ContactStatus[];

function parseStatus(value: string | string[] | undefined): StatusFilter {
  if (typeof value !== "string") return "all";
  return (STATUS_VALUES as string[]).includes(value) ? (value as ContactStatus) : "all";
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";

  const supabase = await createClient();

  let query = supabase
    .from("contact_messages")
    .select("id,name,email,company,project_type,budget,status,priority,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query.eq("status", status);
  if (q) {
    const term = q.replace(/[%_\\,()]/g, " ").trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        `name.ilike.${like},email.ilike.${like},company.ilike.${like},message.ilike.${like}`,
      );
    }
  }

  const [{ data: rows, error }, { data: statusRows }] = await Promise.all([
    query,
    supabase.from("contact_messages").select("status"),
  ]);

  const counts: Record<StatusFilter, number> = {
    all: statusRows?.length ?? 0,
    new: 0,
    read: 0,
    replied: 0,
    in_discussion: 0,
    converted: 0,
    closed: 0,
    spam: 0,
  };
  for (const r of statusRows ?? []) counts[r.status] += 1;

  const messages = rows ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Messages"
        count={counts.all}
        description="Leads from the public contact form. Opening a message marks it as read."
      />

      <div className="space-y-4">
        <StatusTabs value={status} counts={counts} q={q} />
        <DataTableToolbar searchPlaceholder="Search name, email, company, message…" />

        {error ? (
          <EmptyState title="Could not load messages" description={error.message} />
        ) : messages.length === 0 ? (
          q || status !== "all" ? (
            <EmptyState
              icon={SearchX}
              title="No messages match"
              description="Try a different search term or status."
              action={
                <Link
                  href={"/admin/messages" as Route}
                  className="text-sm text-ember-400 underline-offset-4 hover:underline"
                >
                  Clear filters
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No messages yet"
              description="When someone submits the contact form, it lands here."
            />
          )
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH className="w-[28%]">Contact</TH>
                <TH>Company</TH>
                <TH>Project type</TH>
                <TH>Budget</TH>
                <TH>Status</TH>
                <TH>Priority</TH>
                <TH className="text-right">Received</TH>
              </TR>
            </THead>
            <TBody>
              {messages.map((m) => {
                const unread = m.status === "new";
                const href = `/admin/messages/${m.id}`;
                return (
                  <LinkRow key={m.id} href={href}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            unread ? "bg-ember-500" : "bg-transparent",
                          )}
                        />
                        <div className="min-w-0">
                          <Link
                            href={href as Route}
                            className={cn(
                              "block truncate text-sm hover:underline hover:underline-offset-4",
                              unread ? "font-semibold text-fg-50" : "text-fg-100",
                            )}
                          >
                            {m.name}
                            {unread ? <span className="sr-only"> (unread)</span> : null}
                          </Link>
                          <span className="block truncate text-xs text-fg-500">{m.email}</span>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-[13px] text-fg-300">{m.company ?? <Dash />}</TD>
                    <TD className="text-[13px] text-fg-300">{m.project_type ?? <Dash />}</TD>
                    <TD className="font-mono text-[12px] text-fg-300">{m.budget ?? <Dash />}</TD>
                    <TD>
                      <ContactStatusBadge status={m.status} />
                    </TD>
                    <TD>
                      <ContactPriorityBadge priority={m.priority} />
                    </TD>
                    <TD className="text-right font-mono text-[11px] whitespace-nowrap text-fg-500">
                      <time dateTime={m.created_at}>{relativeTime(m.created_at)}</time>
                    </TD>
                  </LinkRow>
                );
              })}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function Dash() {
  return <span className="text-fg-700">—</span>;
}
