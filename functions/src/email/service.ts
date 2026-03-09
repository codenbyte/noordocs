/**
 * Email Service — lightweight wrapper around Resend.
 *
 * Configuration:
 *   Set RESEND_API_KEY in functions/.env:
 *     RESEND_API_KEY=re_xxxx
 *
 * Without the key, emails are logged to console instead of sent.
 */

import { Resend } from "resend";

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("Email: RESEND_API_KEY not configured — emails will be logged only");
    return null;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const DEFAULT_FROM = "NoorSpace <noreply@noorspace.app>";

/**
 * Send an email. Falls back to console.log if Resend is not configured.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const client = getClient();
  const from = payload.from || DEFAULT_FROM;

  if (!client) {
    console.log("Email (dev mode):", {
      from,
      to: payload.to,
      subject: payload.subject,
      htmlLength: payload.html.length,
    });
    return;
  }

  try {
    await client.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    console.log(`Email sent to ${payload.to}: ${payload.subject}`);
  } catch (err) {
    console.error("Failed to send email:", err);
    // Don't throw — email failure shouldn't block the main flow
  }
}
