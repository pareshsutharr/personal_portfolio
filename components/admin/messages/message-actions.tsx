"use client";

import * as React from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Ban, Reply, Trash2 } from "lucide-react";
import { useAction } from "@/hooks/use-action";
import { deleteContactMessage, updateContactMessage } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/input";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  CONTACT_STATUS_LABELS,
  type ContactMessage,
  type ContactPriority,
  type ContactStatus,
} from "@/types";
import { CONTACT_PRIORITY_LABELS } from "./status-badge";

const STATUSES = Object.keys(CONTACT_STATUS_LABELS) as ContactStatus[];
const PRIORITIES = Object.keys(CONTACT_PRIORITY_LABELS) as ContactPriority[];

export function MessageActions({ message }: { message: ContactMessage }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<ContactStatus>(message.status);
  const [priority, setPriority] = React.useState<ContactPriority>(message.priority);
  const [notes, setNotes] = React.useState(message.notes ?? "");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const update = useAction(updateContactMessage);
  const remove = useAction(deleteContactMessage);

  const dirty =
    status !== message.status || priority !== message.priority || notes !== (message.notes ?? "");

  const save = (overrides?: Partial<{ status: ContactStatus; priority: ContactPriority }>) => {
    const next = { status, priority, notes, ...overrides };
    return update.run([message.id, next], {
      onSuccess: () => {
        if (overrides?.status) setStatus(overrides.status);
        router.refresh();
      },
    });
  };

  return (
    <>
      <Panel>
        <PanelHeader title="Triage" description="Status, priority and private notes." />
        <PanelBody className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void save({ status: "replied" })}
              disabled={update.pending || status === "replied"}
            >
              <Reply className="h-3.5 w-3.5" aria-hidden /> Mark replied
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void save({ status: "spam" })}
              disabled={update.pending || status === "spam"}
            >
              <Ban className="h-3.5 w-3.5" aria-hidden /> Mark spam
            </Button>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Field label="Status" htmlFor="msg-status" errors={update.fieldErrors.status}>
              <Select
                id="msg-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ContactStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {CONTACT_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority" htmlFor="msg-priority" errors={update.fieldErrors.priority}>
              <Select
                id="msg-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ContactPriority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {CONTACT_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Internal notes"
              htmlFor="msg-notes"
              hint="Only visible here."
              errors={update.fieldErrors.notes}
            >
              <Textarea
                id="msg-notes"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Call scheduled, scope, follow-up date…"
              />
            </Field>
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-crimson-400 hover:text-crimson-400"
                onClick={() => setConfirmOpen(true)}
                disabled={remove.pending}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
              </Button>
              <Button type="submit" size="sm" loading={update.pending} disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </form>
        </PanelBody>
      </Panel>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this message?"
        description={`From ${message.name} (${message.email}).`}
        loading={remove.pending}
        onConfirm={async () => {
          await remove.run([message.id], {
            onSuccess: () => {
              setConfirmOpen(false);
              router.push("/admin/messages" as Route);
              router.refresh();
            },
          });
        }}
      />
    </>
  );
}
