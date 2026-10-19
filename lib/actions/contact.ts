"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { contactSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "@/types";
import { fail, ok, parseInput } from "./helpers";

const MIN_FILL_MS = 3000; // bots submit instantly
const MAX_PER_HOUR_PER_IP = 5;
const MAX_PER_DAY_PER_EMAIL = 5;

function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${ip}:${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    .digest("hex")
    .slice(0, 32);
}

export async function submitContact(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = parseInput(contactSchema, Object.fromEntries(formData.entries()));
  if (!parsed.ok) return parsed.result;
  const input = parsed.data;

  // Honeypot + fill-time checks. Respond as success so bots learn nothing.
  if (input.website) return ok(null, "Thanks, your message is in.");
  if (input.started_at && Date.now() - input.started_at < MIN_FILL_MS) {
    return ok(null, "Thanks, your message is in.");
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ipHash = hashIp(ip);
  const source = h.get("referer") ?? null;

  const supabase = createAdminClient();

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: ipCount }, { count: emailCount }] = await Promise.all([
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", hourAgo),
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", input.email.toLowerCase())
      .gte("created_at", dayAgo),
  ]);
  if ((ipCount ?? 0) >= MAX_PER_HOUR_PER_IP || (emailCount ?? 0) >= MAX_PER_DAY_PER_EMAIL) {
    return fail("Too many messages in a short time. Please try again later or email directly.");
  }

  const { error } = await supabase.from("contact_messages").insert({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone ?? null,
    company: input.company ?? null,
    project_type: input.project_type ?? null,
    budget: input.budget ?? null,
    timeline: input.timeline ?? null,
    subject: input.project_type
      ? `${input.project_type} — ${input.name}`
      : `Message from ${input.name}`,
    message: input.message,
    source,
    ip_hash: ipHash,
  });
  if (error) return fail("Could not send your message right now. Please try again.");

  void notifyByEmail(input).catch(() => {});

  return ok(null, "Thanks. I read every message and reply personally.");
}

async function notifyByEmail(input: {
  name: string;
  email: string;
  company?: string | null;
  project_type?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return;
  const to = process.env.CONTACT_NOTIFY_EMAIL ?? user;

  const { createTransport } = await import("nodemailer");
  const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const lines = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.company ? `Company: ${input.company}` : null,
    input.project_type ? `Project type: ${input.project_type}` : null,
    input.budget ? `Budget: ${input.budget}` : null,
    input.timeline ? `Timeline: ${input.timeline}` : null,
    "",
    input.message,
  ].filter((l): l is string => l !== null);

  await transporter.sendMail({
    from: `"Portfolio" <${user}>`,
    to,
    replyTo: input.email,
    subject: `New portfolio inquiry from ${input.name}`,
    text: lines.join("\n"),
  });
}
