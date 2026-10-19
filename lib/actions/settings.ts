"use server";

import { seoSettingsSchema, siteSettingsSchema } from "@/lib/validation/schemas";
import type { ActionResult, SeoSettings, SiteSettings } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

/** Site settings are a singleton row: update if present, otherwise insert. */
export async function updateSiteSettings(input: unknown): Promise<ActionResult<SiteSettings>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(siteSettingsSchema, input);
  if (!parsed.ok) return parsed.result;

  const { data: existing, error: lookupError } = await supabase
    .from("site_settings")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (lookupError) return fail(dbError(lookupError, "Could not load site settings."));

  if (existing) {
    const { data, error } = await supabase
      .from("site_settings")
      .update(parsed.data)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return fail(dbError(error, "Could not save site settings."));
    revalidatePublic();
    return ok(data, "Site settings saved.");
  }

  const { data, error } = await supabase
    .from("site_settings")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not create site settings."));
  revalidatePublic();
  return ok(data, "Site settings saved.");
}

/** SEO settings are a singleton row: update if present, otherwise insert. */
export async function updateSeoSettings(input: unknown): Promise<ActionResult<SeoSettings>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(seoSettingsSchema, input);
  if (!parsed.ok) return parsed.result;

  const { data: existing, error: lookupError } = await supabase
    .from("seo_settings")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (lookupError) return fail(dbError(lookupError, "Could not load SEO settings."));

  if (existing) {
    const { data, error } = await supabase
      .from("seo_settings")
      .update(parsed.data)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return fail(dbError(error, "Could not save SEO settings."));
    revalidatePublic(["/sitemap.xml", "/robots.txt", "/opengraph-image"]);
    return ok(data, "SEO settings saved.");
  }

  const { data, error } = await supabase
    .from("seo_settings")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not create SEO settings."));
  revalidatePublic(["/sitemap.xml", "/robots.txt", "/opengraph-image"]);
  return ok(data, "SEO settings saved.");
}
