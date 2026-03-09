"use strict";
/**
 * NoorSpace Documents — Dropbox Sign (HelloSign) Provider (Stub)
 *
 * Dropbox Sign (formerly HelloSign) is an enterprise e-signature platform.
 * https://www.dropbox.com/sign
 *
 * ┌────────────────────────────────────────────────────────┐
 * │  THIS IS A PLACEHOLDER STUB — NOT YET FUNCTIONAL      │
 * │                                                        │
 * │  To implement:                                         │
 * │  1. Install: npm install @dropbox/sign                 │
 * │  2. Set env vars: DROPBOX_SIGN_API_KEY                 │
 * │  3. Implement each method using Dropbox Sign API       │
 * │  4. Map Dropbox Sign callbacks to WebhookEventType     │
 * │  5. Register in provider factory (index.ts)            │
 * └────────────────────────────────────────────────────────┘
 *
 * Dropbox Sign API docs: https://developers.hellosign.com
 *
 * Webhook event mapping:
 *   Dropbox Sign "signature_request_sent"     → SENT
 *   Dropbox Sign "signature_request_viewed"   → VIEWED
 *   Dropbox Sign "signature_request_signed"   → SIGNED
 *   Dropbox Sign "signature_request_declined" → DECLINED
 *   Dropbox Sign "signature_request_all_signed" → COMPLETED
 *   Dropbox Sign "signature_request_expired"  → EXPIRED
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropboxSignProvider = void 0;
// ── Dropbox Sign-specific type mappings ──────────────
const DROPBOX_SIGN_EVENT_MAP = {
    "signature_request_sent": "SENT",
    "signature_request_viewed": "VIEWED",
    "signature_request_signed": "SIGNED",
    "signature_request_declined": "DECLINED",
    "signature_request_all_signed": "COMPLETED",
    "signature_request_expired": "EXPIRED",
};
function mapDropboxSignWebhook(payload) {
    const eventType = DROPBOX_SIGN_EVENT_MAP[payload.event?.event_type];
    if (!eventType)
        return null;
    const sigReq = payload.signature_request || {};
    const signer = payload.event?.event_metadata?.related_signature_id
        ? sigReq.signatures?.find((s) => s.signature_id === payload.event.event_metadata.related_signature_id)
        : undefined;
    return {
        type: eventType,
        providerRequestId: sigReq.signature_request_id || "",
        participantId: signer?.signer_email_address, // mapped via email
        participantEmail: signer?.signer_email_address,
        timestamp: payload.event?.event_time
            ? new Date(payload.event.event_time * 1000).toISOString()
            : new Date().toISOString(),
        rawPayload: payload,
    };
}
// ── Provider stub ────────────────────────────────────
class DropboxSignProvider {
    apiKey;
    name = "dropbox_sign";
    constructor(apiKey) {
        this.apiKey = apiKey;
        if (!apiKey)
            throw new Error("DROPBOX_SIGN_API_KEY is required");
    }
    async createSignatureRequest(_document, _participants) {
        // TODO: Implement using Dropbox Sign API
        // POST /signature_request/send — send with file and signers
        // Or POST /signature_request/create_embedded — for embedded signing
        throw new Error("DropboxSignProvider.createSignatureRequest not implemented");
    }
    async createEmbeddedSigningSession(_requestId, _participantId) {
        // TODO: Dropbox Sign has strong embedded signing support
        // POST /embedded/sign_url/{signature_id}
        // Returns a sign_url for iframe embedding
        throw new Error("DropboxSignProvider.createEmbeddedSigningSession not implemented");
    }
    async getSigningUrl(_requestId, _participantId) {
        // TODO: GET /signature_request/{id} — extract signer URL
        throw new Error("DropboxSignProvider.getSigningUrl not implemented");
    }
    async recordSignature(_requestId, _participantId, _signatureData) {
        // Dropbox Sign handles signatures via its hosted page.
        // Nothing to do here — webhook confirms completion.
    }
    async handleWebhook(_headers, body) {
        // TODO: Verify webhook hash
        // Dropbox Sign uses HMAC-SHA256 with your API key
        // Hash = HMAC(api_key, event_time + event_type)
        const payload = body;
        return mapDropboxSignWebhook(payload);
    }
    async getSignatureStatus(_providerRequestId) {
        // TODO: GET /signature_request/{id}
        throw new Error("DropboxSignProvider.getSignatureStatus not implemented");
    }
    async finalizeCompletedDocument(_requestId, _document) {
        // TODO: GET /signature_request/files/{id} — download signed PDF
        throw new Error("DropboxSignProvider.finalizeCompletedDocument not implemented");
    }
    async cancelRequest(_requestId) {
        // TODO: POST /signature_request/cancel/{id}
        throw new Error("DropboxSignProvider.cancelRequest not implemented");
    }
}
exports.DropboxSignProvider = DropboxSignProvider;
//# sourceMappingURL=dropbox-sign-provider.js.map