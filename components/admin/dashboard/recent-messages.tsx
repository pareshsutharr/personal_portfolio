import type { Route } from "next";
import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils/format";
import type { RecentMessage } from "@/lib/queries/admin";
import { ContactStatusBadge } from "@/components/admin/messages/status-badge";
import { cn } from "@/lib/utils/cn";

export function RecentMessages({ messages }: { messages: RecentMessage[] }) {
  return (
    <Panel>
      <PanelHeader
        title="Recent messages"
        description="Latest five contact leads"
        actions={
          <Link
            href={"/admin/messages" as Route}
            className="inline-flex items-center gap-1 text-xs text-fg-300 transition-colors hover:text-fg-50"
          >
            View all <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      />
      {messages.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Inbox}
            title="No messages yet"
            description="Leads from the public contact form will appear here."
            className="py-10"
          />
        </div>
      ) : (
        <ul className="divide-y divide-line-800">
          {messages.map((m) => {
            const unread = m.status === "new";
            return (
              <li key={m.id}>
                <Link
                  href={`/admin/messages/${m.id}` as Route}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-800/60"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      unread ? "bg-ember-500" : "bg-transparent",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          unread ? "font-semibold text-fg-50" : "text-fg-100",
                        )}
                      >
                        {m.name}
                      </span>
                      {m.company ? (
                        <span className="truncate text-xs text-fg-500">· {m.company}</span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-fg-500">
                      {m.email}
                      {m.project_type ? ` · ${m.project_type}` : ""}
                    </p>
                  </div>
                  <ContactStatusBadge status={m.status} />
                  <span className="hidden shrink-0 font-mono text-[11px] text-fg-500 sm:inline">
                    {relativeTime(m.created_at)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
