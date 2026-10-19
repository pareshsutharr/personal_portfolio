"use server";

/**
 * Reference implementation of an admin CRUD action module.
 * Other entity modules (experiences, skills, …) follow this exact shape:
 *   create(input) / update(id, input) / remove(id) / reorder(ids) / toggle(id, field, value)
 */

import { serviceSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, Service } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

export async function createService(input: unknown): Promise<ActionResult<Service>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(serviceSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase.from("services").insert(parsed.data).select("*").single();
  if (error) return fail(dbError(error, "Could not create service."));
  revalidatePublic(["/services"]);
  return ok(data, "Service created.");
}

export async function updateService(id: string, input: unknown): Promise<ActionResult<Service>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(serviceSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("services")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update service."));
  revalidatePublic(["/services"]);
  return ok(data, "Service saved.");
}

export async function deleteService(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete service."));
  revalidatePublic(["/services"]);
  return ok(null, "Service deleted.");
}

export async function reorderServices(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("services")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(["/services"]);
  return ok(null, "Order saved.");
}

export async function toggleService(
  id: string,
  field: "is_visible" | "featured",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "featured" ? { featured: value } : { is_visible: value };
  const { error } = await supabase.from("services").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update service."));
  revalidatePublic(["/services"]);
  return ok(null);
}
