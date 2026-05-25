import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";

export type EmailSendResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "empty_recipients" };

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendBulkEmail({
  recipients,
  subject,
  html,
}: {
  recipients: { email: string; name: string }[];
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  if (recipients.length === 0) return { sent: false, reason: "empty_recipients" };
  if (!isEmailConfigured()) return { sent: false, reason: "not_configured" };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const CHUNK = 100;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    const { error } = await resend.batch.send(
      chunk.map((r) => ({ from: FROM, to: r.email, subject, html })),
    );
    if (error) throw new Error(`Email delivery failed: ${error.message}`);
  }
  return { sent: true };
}

// Sends individually personalized emails — each recipient gets unique body content.
export async function sendPersonalizedBatch(
  emails: { to: string; subject: string; html: string }[],
): Promise<EmailSendResult> {
  if (emails.length === 0) return { sent: false, reason: "empty_recipients" };
  if (!isEmailConfigured()) return { sent: false, reason: "not_configured" };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const CHUNK = 100;
  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK);
    const { error } = await resend.batch.send(chunk.map((e) => ({ from: FROM, ...e })));
    if (error) throw new Error(`Email delivery failed: ${error.message}`);
  }
  return { sent: true };
}
