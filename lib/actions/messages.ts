"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contactUpdateSchema } from "@/lib/validation/schemas";
import { uuid } from "@/lib/validation/common";
import type { ActionResult, ContactMessage, ContactStatus } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin } from "./helpers";

const statusSchema = z.enum([
  "new",
  "read",
  "replied",
  "in_discussion",
  "converted",
  "closed",
  "spam",
]);

const bulkSchema = z.object({
  ids: z.array(uuid).min(1, "Select at least one message"),
  status: statusSchema,
});

function revalidateMessages(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/messages");
  if (id) revalidatePath(`/admin/messages/${id}`);
}

export async function updateContactMessage(
  id: string,
  input: unknown,
): Promise<ActionResult<ContactMessage>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(contactUpdateSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("contact_messages")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update message."));
  revalidateMessages(id);
  return ok(data, "Message updated.");
}

export async function deleteContactMessage(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete message."));
  revalidateMessages(id);
  return ok(null, "Message deleted.");
}

/** Marks a message as read only if it is still unread. */
export async function markMessageRead(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("contact_messages")
    .update({ status: "read" })
    .eq("id", id)
    .eq("status", "new");
  if (error) return fail(dbError(error, "Could not mark as read."));
  revalidateMessages(id);
  return ok(null);
}

export async function bulkUpdateStatus(
  ids: string[],
  status: ContactStatus,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(bulkSchema, { ids, status });
  if (!parsed.ok) return parsed.result;
  const { error } = await supabase
    .from("contact_messages")
    .update({ status: parsed.data.status })
    .in("id", parsed.data.ids);
  if (error) return fail(dbError(error, "Could not update messages."));
  revalidateMessages();
  return ok(
    null,
    `${parsed.data.ids.length} message${parsed.data.ids.length === 1 ? "" : "s"} updated.`,
  );
}
