"use strict";
/**
 * Email Service — lightweight wrapper around Resend.
 *
 * Configuration:
 *   Set RESEND_API_KEY in functions/.env:
 *     RESEND_API_KEY=re_xxxx
 *
 * Without the key, emails are logged to console instead of sent.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
let resendClient = null;
function getClient() {
    if (resendClient)
        return resendClient;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn("Email: RESEND_API_KEY not configured — emails will be logged only");
        return null;
    }
    resendClient = new resend_1.Resend(apiKey);
    return resendClient;
}
const DEFAULT_FROM = "NoorSpace <noreply@noorspace.app>";
/**
 * Send an email. Falls back to console.log if Resend is not configured.
 */
async function sendEmail(payload) {
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
    }
    catch (err) {
        console.error("Failed to send email:", err);
        // Don't throw — email failure shouldn't block the main flow
    }
}
//# sourceMappingURL=service.js.map