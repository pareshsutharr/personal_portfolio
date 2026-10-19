"use server";

import { certificationSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, Certification } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const PATHS = ["/about", "/experience"];

export async function createCertification(input: unknown): Promise<ActionResult<Certification>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(certificationSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("certifications")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not create certification."));
  revalidatePublic(PATHS);
  return ok(data, "Certification created.");
}

export async function updateCertification(
  id: string,
  input: unknown,
): Promise<ActionResult<Certification>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(certificationSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("certifications")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update certification."));
  revalidatePublic(PATHS);
  return ok(data, "Certification saved.");
}

export async function deleteCertification(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("certifications").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete certification."));
  revalidatePublic(PATHS);
  return ok(null, "Certification deleted.");
}

export async function reorderCertifications(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("certifications")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(PATHS);
  return ok(null, "Order saved.");
}

export async function toggleCertification(
  id: string,
  field: "is_visible",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_visible" ? { is_visible: value } : {};
  const { error } = await supabase.from("certifications").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update certification."));
  revalidatePublic(PATHS);
  return ok(null);
}
