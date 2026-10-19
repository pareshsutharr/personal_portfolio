"use server";

import { clientLogoSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, ClientLogo } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

export async function createClientLogo(input: unknown): Promise<ActionResult<ClientLogo>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(clientLogoSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("client_logos")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not add client."));
  revalidatePublic(["/"]);
  return ok(data, "Client added.");
}

export async function updateClientLogo(
  id: string,
  input: unknown,
): Promise<ActionResult<ClientLogo>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(clientLogoSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("client_logos")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update client."));
  revalidatePublic(["/"]);
  return ok(data, "Client saved.");
}

export async function deleteClientLogo(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("client_logos").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete client."));
  revalidatePublic(["/"]);
  return ok(null, "Client removed.");
}

export async function reorderClientLogos(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("client_logos")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(["/"]);
  return ok(null, "Order saved.");
}

export async function toggleClientLogo(
  id: string,
  field: "is_visible",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_visible" ? { is_visible: value } : {};
  const { error } = await supabase.from("client_logos").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update client."));
  revalidatePublic(["/"]);
  return ok(null);
}
