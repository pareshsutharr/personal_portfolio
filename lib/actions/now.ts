"use server";

import { nowPageSchema } from "@/lib/validation/schemas";
import type { ActionResult, NowPage } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

/** The /now page content is a singleton row: update if present, otherwise insert. */
export async function updateNowPage(input: unknown): Promise<ActionResult<NowPage>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(nowPageSchema, input);
  if (!parsed.ok) return parsed.result;

  const { data: existing, error: lookupError } = await supabase
    .from("now_page")
    .select("id")
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (lookupError) return fail(dbError(lookupError, "Could not load the now page."));

  const patch = { ...parsed.data, updated_at: new Date().toISOString() };

  if (existing) {
    const { data, error } = await supabase
      .from("now_page")
      .update(patch)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return fail(dbError(error, "Could not save the now page."));
    revalidatePublic(["/now"]);
    return ok(data, "Now page saved.");
  }

  const { data, error } = await supabase.from("now_page").insert(patch).select("*").single();
  if (error) return fail(dbError(error, "Could not create the now page."));
  revalidatePublic(["/now"]);
  return ok(data, "Now page saved.");
}
