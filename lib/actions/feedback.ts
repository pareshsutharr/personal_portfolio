"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { sendOwnerEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";
import { fail, ok, parseInput } from "./helpers";

const MAX_PER_HOUR_PER_IP = 3;
const ANONYMOUS_EMAIL = "anonymous@feedback.local";
const LABELS: Record<number, string> = {
  1: "Not for me",
  2: "Could be better",
  3: "It's fine",
  4: "Liked it",
  5: "Loved it",
};

const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  name: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  page: z.string().trim().max(200).optional().or(z.literal("")),
  website: z.string().optional(), // honeypot
});

function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${ip}:${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Quick visitor feedback from the floating widget. Stored as a contact message
 * tagged "Feedback" so it shows in the admin inbox and triggers the same email
 * notification as the contact form.
 */
export async function submitFeedback(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = parseInput(feedbackSchema, Object.fromEntries(formData.entries()));
  if (!parsed.ok) return parsed.result;
  const input = parsed.data;
  if (input.website) return ok(null, "Thanks!");

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ipHash = hashIp(ip);
  const page = input.page || h.get("referer") || null;

  const supabase = createAdminClient();
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("project_type", "Feedback")
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= MAX_PER_HOUR_PER_IP) {
    return fail("Thanks, I already have your feedback. Email me if you want to say more.");
  }

  const name = input.name || "Anonymous visitor";
  const email = input.email || ANONYMOUS_EMAIL;
  const label = LABELS[input.rating] ?? "";
  const subject = `Feedback · ${input.rating}/5 · ${label}`;
  const message = input.message || "(no message, rating only)";

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    subject,
    message,
    project_type: "Feedback",
    source: page,
    ip_hash: ipHash,
    priority: input.rating <= 2 ? "high" : "normal",
  });
  if (error) return fail("Could not send that right now. Please try again.");

  void sendOwnerEmail({
    subject: `Portfolio feedback: ${input.rating}/5 (${label})`,
    text: [
      `Rating: ${input.rating}/5 · ${label}`,
      `From: ${name}${input.email ? ` <${input.email}>` : ""}`,
      page ? `Page: ${page}` : null,
      "",
      message,
    ]
      .filter((l): l is string => l !== null)
      .join("\n"),
    replyTo: input.email || null,
  }).catch(() => {});

  return ok(null, "I read every one of these, and I reply when there is an email to reply to.");
}
