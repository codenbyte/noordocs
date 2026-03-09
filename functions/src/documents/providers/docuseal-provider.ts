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

// ── DocuSeal-specific type mappings ──────────────────

const DOCUSEAL_EVENT_MAP: Record<string, WebhookEventType> = {
  "form.started": "VIEWED",
  "form.completed": "SIGNED",
  "submission.completed": "COMPLETED",
};

function mapDocuSealWebhook(payload: Record<string, any>): WebhookEvent | null {
  const eventType = DOCUSEAL_EVENT_MAP[payload.event_type];
  if (!eventType) return null;

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

export class DocuSealProvider implements SignatureProvider {
  readonly name = "docuseal";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://api.docuseal.co",
  ) {
    if (!apiKey) throw new Error("DOCUSEAL_API_KEY is required");
  }

  async createSignatureRequest(
    _document: NoorDocument,
    _participants: DocumentParticipant[],
  ): Promise<SignatureRequestResult> {
    // TODO: Implement using DocuSeal API
    // POST /api/submissions — create submission from template
    // DocuSeal uses template-based submissions with submitter roles
    throw new Error("DocuSealProvider.createSignatureRequest not implemented");
  }

  async createEmbeddedSigningSession(
    _requestId: string,
    _participantId: string,
  ): Promise<EmbeddedSigningSession> {
    // TODO: DocuSeal has strong embedded signing support
    // Use the @docuseal/react embed component or generate an iframe URL
    // GET /api/submissions/{id} — retrieve submitter signing slug
    throw new Error("DocuSealProvider.createEmbeddedSigningSession not implemented");
  }

  async getSigningUrl(
    _requestId: string,
    _participantId: string,
  ): Promise<string> {
    // TODO: GET /api/submissions/{id} — extract submitter URL
    throw new Error("DocuSealProvider.getSigningUrl not implemented");
  }

  async recordSignature(
    _requestId: string,
    _participantId: string,
    _signatureData: string,
  ): Promise<void> {
    // DocuSeal handles signatures via its hosted/embedded page.
    // Nothing to do here after webhook confirms.
  }

  async handleWebhook(
    _headers: Record<string, string>,
    body: unknown,
  ): Promise<WebhookEvent | null> {
    // TODO: Verify webhook signature if DocuSeal supports it
    const payload = body as Record<string, any>;
    return mapDocuSealWebhook(payload);
  }

  async getSignatureStatus(
    _providerRequestId: string,
  ): Promise<SignatureStatusResult> {
    // TODO: GET /api/submissions/{id}
    throw new Error("DocuSealProvider.getSignatureStatus not implemented");
  }

  async finalizeCompletedDocument(
    _requestId: string,
    _document: NoorDocument,
  ): Promise<FinalizeResult> {
    // TODO: GET /api/submissions/{id}/documents/{documentId}/download
    throw new Error("DocuSealProvider.finalizeCompletedDocument not implemented");
  }

  async cancelRequest(_requestId: string): Promise<void> {
    // TODO: DELETE /api/submissions/{id} or PATCH to archived
    throw new Error("DocuSealProvider.cancelRequest not implemented");
  }
}
