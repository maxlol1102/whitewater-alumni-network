import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";

export async function sendBulkEmail({
  recipients,
  subject,
  html,
}: {
  recipients: { email: string; name: string }[];
  subject: string;
  html: string;
}) {
  if (recipients.length === 0) return;

  // Resend batch API: max 100 per request
  const CHUNK = 100;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    const { error } = await resend.batch.send(
      chunk.map((r) => ({
        from: FROM,
        to: r.email,
        subject,
        html,
      })),
    );
    if (error) throw new Error(`Email delivery failed: ${error.message}`);
  }
}
