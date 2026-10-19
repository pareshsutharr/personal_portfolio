"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/schemas";
import { parseInput } from "./helpers";
import type { ActionResult } from "@/types";

export async function signInWithPassword(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = parseInput(loginSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.ok) return parsed.result;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, error: "Invalid email or password." };
  }

  // Only accounts flagged as admin (app_metadata.role) may enter /admin.
  const role = (data.user?.app_metadata as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    await supabase.auth.signOut();
    return { ok: false, error: "This account does not have admin access." };
  }

  const next = formData.get("next");
  const target = typeof next === "string" && next.startsWith("/admin") ? next : "/admin";
  redirect(target as Route);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login" as Route);
}
