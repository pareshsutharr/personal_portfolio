import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service client that bypasses RLS. Server-only, and used for exactly two
 * things: writing contact form submissions (anon has no insert grant) and
 * auth admin operations. Never import this from a Client Component.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY is not set on the server.");
  }
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
