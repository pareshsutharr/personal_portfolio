#!/usr/bin/env node
/**
 * Creates (or updates) the single admin user for /admin.
 * Sets app_metadata.role = 'admin', which the RLS policies check via is_admin().
 *
 * Usage:
 *   node scripts/auth/create-admin.mjs <email> <password>
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/auth/create-admin.mjs <email> <password>");
  process.exit(1);
}

const env = Object.fromEntries(
  (await readFile(new URL("../../.env.local", import.meta.url), "utf8"))
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;
const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: { ...(existing.app_metadata ?? {}), role: "admin" },
  });
  if (error) throw error;
  console.log(`Updated admin user ${email} (${existing.id})`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });
  if (error) throw error;
  console.log(`Created admin user ${email} (${data.user.id})`);
}
