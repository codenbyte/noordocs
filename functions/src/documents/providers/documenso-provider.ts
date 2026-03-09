/**
 * NoorSpace Documents — Documenso Signature Provider (Stub)
 *
 * Documenso is an open-source DocuSign alternative.
 * https://documenso.com
 *
 * ┌────────────────────────────────────────────────────────┐
 * │  THIS IS A PLACEHOLDER STUB — NOT YET FUNCTIONAL      │
 * │                                                        │
 * │  To implement:                                         │
 * │  1. Install: npm install @documenso/sdk                │
 * │  2. Set env vars: DOCUMENSO_API_KEY, DOCUMENSO_URL     │
 * │  3. Implement each method using Documenso REST API     │
 * │  4. Map Documenso webhook events to WebhookEventType   │
 * │  5. Register in provider factory (index.ts)            │
 * └────────────────────────────────────────────────────────┘
 *
 * Documenso API docs: https://documenso.com/docs/api
 *
 * Webhook event mapping:
 *   Documenso "DOCUMENT_SENT"      → SENT
 *   Documenso "DOCUMENT_OPENED"    → VIEWED
 *   Documenso "DOCUMENT_SIGNED"    → SIGNED
 *   Documenso "DOCUMENT_COMPLETED" → COMPLETED
 */

import type {
  SignatureProvider,
  SignatureRequestResult,
  EmbeddedSigningSession,
  WebhookEvent,
  WebhookEventType,
  SignatureStatusResult,
  FinalizeResult,
} from "./signature-provider";
import type { DocumentParticipant, NoorDocument } from "../models";

// ── Documenso-specific type mappings ─────────────────

/** Map Documenso event names to our canonical types */
const DOCUMENSO_EVENT_MAP: Record<string, WebhookEventType> = {
  "DOCUMENT_SENT": "SENT",
  "DOCUMENT_OPENED": "VIEWED",
  "DOCUMENT_SIGNED": "SIGNED",
  "DOCUMENT_COMPLETED": "COMPLETED",
};

/** Convert a Documenso webhook payload to our canonical format */
function mapDocumensoWebhook(payload: Record<string, any>): WebhookEvent | null {
  const eventType = DOCUMENSO_EVENT_MAP[payload.event];
  if (!eventType) return null;

  return {
    type: eventType,
    providerRequestId: payload.documentId?.toString() || "",
    participantId: payload.recipientId?.toString(),
    participantEmail: payload.recipientEmail,
    signatureData: undefined, // Documenso handles this server-side
    timestamp: payload.createdAt || new Date().toISOString(),
    rawPayload: payload,
  };
}

// ── Provider stub ────────────────────────────────────

export class DocumensoProvider implements SignatureProvider {
  readonly name = "documenso";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://app.documenso.com/api/v1",
  ) {
    if (!apiKey) throw new Error("DOCUMENSO_API_KEY is required");
  }

  async createSignatureRequest(
    _document: NoorDocument,
    _participants: DocumentParticipant[],
  ): Promise<SignatureRequestResult> {
    // TODO: Implement using Documenso API
    // POST /api/v1/documents — create document
    // POST /api/v1/documents/{id}/recipients — add signers
    // POST /api/v1/documents/{id}/send — send for signing
    throw new Error("DocumensoProvider.createSignatureRequest not implemented");
  }

  async createEmbeddedSigningSession(
    _requestId: string,
    _participantId: string,
  ): Promise<EmbeddedSigningSession> {
    // TODO: Implement using Documenso embedded signing
    // POST /api/v1/documents/{id}/recipients/{recipientId}/signing-url
    throw new Error("DocumensoProvider.createEmbeddedSigningSession not implemented");
  }

  async getSigningUrl(
    _requestId: string,
    _participantId: string,
  ): Promise<string> {
    // TODO: GET /api/v1/documents/{id}/recipients/{recipientId}/signing-url
    throw new Error("DocumensoProvider.getSigningUrl not implemented");
  }

  async recordSignature(
    _requestId: string,
    _participantId: string,
    _signatureData: string,
  ): Promise<void> {
    // Documenso handles signatures server-side via its hosted page.
    // This is called after webhook confirms signing — no action needed.
  }

  async handleWebhook(
    _headers: Record<string, string>,
    body: unknown,
  ): Promise<WebhookEvent | null> {
    // TODO: Add webhook signature verification
    // Documenso signs webhooks with HMAC — verify headers["x-documenso-signature"]
    const payload = body as Record<string, any>;
    return mapDocumensoWebhook(payload);
  }

  async getSignatureStatus(
    _providerRequestId: string,
  ): Promise<SignatureStatusResult> {
    // TODO: GET /api/v1/documents/{id}
    throw new Error("DocumensoProvider.getSignatureStatus not implemented");
  }

  async finalizeCompletedDocument(
    _requestId: string,
    _document: NoorDocument,
  ): Promise<FinalizeResult> {
    // TODO: GET /api/v1/documents/{id}/download — fetch signed PDF
    throw new Error("DocumensoProvider.finalizeCompletedDocument not implemented");
  }

  async cancelRequest(_requestId: string): Promise<void> {
    // TODO: DELETE /api/v1/documents/{id}
    throw new Error("DocumensoProvider.cancelRequest not implemented");
  }
}
