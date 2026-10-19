import "server-only";

/**
 * Sends a plain-text notification to the site owner through Gmail SMTP.
 * Silently does nothing when GMAIL_USER / GMAIL_APP_PASSWORD are not set, so
 * the site keeps working without email configured. Never throws to callers
 * that fire-and-forget; they should still `.catch` to be safe.
 */
export async function sendOwnerEmail(input: {
  subject: string;
  text: string;
  replyTo?: string | null;
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;
  const to = process.env.CONTACT_NOTIFY_EMAIL ?? user;

  const { createTransport } = await import("nodemailer");
  const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Portfolio" <${user}>`,
    to,
    replyTo: input.replyTo ?? undefined,
    subject: input.subject,
    text: input.text,
  });
  return true;
}
