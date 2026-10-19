import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Calendar, Clock, Mail, Phone, Tag, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MessageActions } from "@/components/admin/messages/message-actions";
import { ContactPriorityBadge, ContactStatusBadge } from "@/components/admin/messages/status-badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, relativeTime } from "@/lib/utils/format";
import type { ContactMessage } from "@/types";

export const metadata: Metadata = { title: "Message" };

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("contact_messages").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  let message: ContactMessage = data;
  let autoRead = false;
  if (message.status === "new") {
    // Opening an unread message marks it read before rendering.
    const { data: updated } = await supabase
      .from("contact_messages")
      .update({ status: "read" })
      .eq("id", id)
      .eq("status", "new")
      .select("*")
      .maybeSingle();
    if (updated) {
      message = updated;
      autoRead = true;
    }
  }

  const subject =
    message.subject?.trim() || `${message.project_type ?? "Enquiry"} from ${message.name}`;

  return (
    <div>
      <Link
        href={"/admin/messages" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-fg-500 transition-colors hover:text-fg-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All messages
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-fg-50">{subject}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-fg-500">
            <span className="text-fg-100">{message.name}</span>
            <span aria-hidden>·</span>
            <time dateTime={message.created_at}>{formatDateTime(message.created_at)}</time>
            <span aria-hidden>·</span>
            <span>{relativeTime(message.created_at)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ContactPriorityBadge priority={message.priority} />
          <ContactStatusBadge status={message.status} />
        </div>
      </div>

      {autoRead ? (
        <p className="mb-6 rounded-sm border border-line-800 bg-surface-900 px-3 py-2 font-mono text-[11px] tracking-wider text-fg-500 uppercase">
          Marked as read on open
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel>
            <PanelHeader title="Message" />
            <PanelBody>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-fg-100">
                {message.message}
              </p>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Contact details" />
            <PanelBody className="p-0">
              <dl className="divide-y divide-line-800">
                <Row icon={Mail} label="Email">
                  <a
                    href={`mailto:${message.email}`}
                    className="text-fg-100 underline-offset-4 hover:text-ember-300 hover:underline"
                  >
                    {message.email}
                  </a>
                </Row>
                {message.phone ? (
                  <Row icon={Phone} label="Phone">
                    <a
                      href={`tel:${message.phone.replace(/[^\d+]/g, "")}`}
                      className="text-fg-100 underline-offset-4 hover:text-ember-300 hover:underline"
                    >
                      {message.phone}
                    </a>
                  </Row>
                ) : null}
                {message.company ? (
                  <Row icon={Building2} label="Company">
                    {message.company}
                  </Row>
                ) : null}
                {message.project_type ? (
                  <Row icon={Tag} label="Project type">
                    {message.project_type}
                  </Row>
                ) : null}
                {message.budget ? (
                  <Row icon={Wallet} label="Budget">
                    {message.budget}
                  </Row>
                ) : null}
                {message.timeline ? (
                  <Row icon={Clock} label="Timeline">
                    {message.timeline}
                  </Row>
                ) : null}
              </dl>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Meta" />
            <PanelBody className="p-0">
              <dl className="divide-y divide-line-800">
                <Row icon={Tag} label="Source">
                  <span className="font-mono text-xs">{message.source ?? "contact form"}</span>
                </Row>
                <Row icon={Calendar} label="Received">
                  <time dateTime={message.created_at} className="font-mono text-xs">
                    {formatDateTime(message.created_at)}
                  </time>
                </Row>
                <Row icon={Calendar} label="Updated">
                  <time dateTime={message.updated_at} className="font-mono text-xs">
                    {formatDateTime(message.updated_at)}
                  </time>
                </Row>
              </dl>
            </PanelBody>
          </Panel>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <MessageActions message={message} />
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-3">
      <dt className="flex w-32 shrink-0 items-center gap-2 pt-0.5 label-mono">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm break-words text-fg-100">{children}</dd>
    </div>
  );
}
