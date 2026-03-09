"use strict";
/**
 * NoorSpace Documents — DocuSeal Signature Provider (Stub)
 *
 * DocuSeal is an open-source document signing platform with
 * strong embedded signing support.
 * https://www.docuseal.co
 *
 * ┌────────────────────────────────────────────────────────┐
 * │  THIS IS A PLACEHOLDER STUB — NOT YET FUNCTIONAL      │
 * │                                                        │
 * │  To implement:                                         │
 * │  1. Set env vars: DOCUSEAL_API_KEY, DOCUSEAL_URL       │
 * │  2. Implement each method using DocuSeal REST API      │
 * │  3. Map DocuSeal webhook events to WebhookEventType    │
 * │  4. Register in provider factory (index.ts)            │
 * └────────────────────────────────────────────────────────┘
 *
 * DocuSeal API docs: https://www.docuseal.co/docs/api
 *
 * Webhook event mapping:
 *   DocuSeal "form.started"   → VIEWED
 *   DocuSeal "form.completed" → SIGNED  (per submitter)
 *   DocuSeal "submission.completed" → COMPLETED (all done)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocuSealProvider = void 0;
// ── DocuSeal-specific type mappings ──────────────────
const DOCUSEAL_EVENT_MAP = {
    "form.started": "VIEWED",
    "form.completed": "SIGNED",
    "submission.completed": "COMPLETED",
};
function mapDocuSealWebhook(payload) {
    const eventType = DOCUSEAL_EVENT_MAP[payload.event_type];
    if (!eventType)
        return null;
    return {
        type: eventType,
        providerRequestId: payload.data?.submission_id?.toString() || "",
        participantId: payload.data?.submitter_id?.toString(),
        participantEmail: payload.data?.email,
        timestamp: payload.timestamp || new Date().toISOString(),
        rawPayload: payload,
    };
}
// ── Provider stub ────────────────────────────────────
class DocuSealProvider {
    apiKey;
    baseUrl;
    name = "docuseal";
    constructor(apiKey, baseUrl = "https://api.docuseal.co") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        if (!apiKey)
            throw new Error("DOCUSEAL_API_KEY is required");
    }
    async createSignatureRequest(_document, _participants) {
        // TODO: Implement using DocuSeal API
        // POST /api/submissions — create submission from template
        // DocuSeal uses template-based submissions with submitter roles
        throw new Error("DocuSealProvider.createSignatureRequest not implemented");
    }
    async createEmbeddedSigningSession(_requestId, _participantId) {
        // TODO: DocuSeal has strong embedded signing support
        // Use the @docuseal/react embed component or generate an iframe URL
        // GET /api/submissions/{id} — retrieve submitter signing slug
        throw new Error("DocuSealProvider.createEmbeddedSigningSession not implemented");
    }
    async getSigningUrl(_requestId, _participantId) {
        // TODO: GET /api/submissions/{id} — extract submitter URL
        throw new Error("DocuSealProvider.getSigningUrl not implemented");
    }
    async recordSignature(_requestId, _participantId, _signatureData) {
        // DocuSeal handles signatures via its hosted/embedded page.
        // Nothing to do here after webhook confirms.
    }
    async handleWebhook(_headers, body) {
        // TODO: Verify webhook signature if DocuSeal supports it
        const payload = body;
        return mapDocuSealWebhook(payload);
    }
    async getSignatureStatus(_providerRequestId) {
        // TODO: GET /api/submissions/{id}
        throw new Error("DocuSealProvider.getSignatureStatus not implemented");
    }
    async finalizeCompletedDocument(_requestId, _document) {
        // TODO: GET /api/submissions/{id}/documents/{documentId}/download
        throw new Error("DocuSealProvider.finalizeCompletedDocument not implemented");
    }
    async cancelRequest(_requestId) {
        // TODO: DELETE /api/submissions/{id} or PATCH to archived
        throw new Error("DocuSealProvider.cancelRequest not implemented");
    }
}
exports.DocuSealProvider = DocuSealProvider;
//# sourceMappingURL=docuseal-provider.js.map