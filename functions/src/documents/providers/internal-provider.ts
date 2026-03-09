/**
 * NoorSpace Documents — Internal Signature Provider
 *
 * Phase 1 signing provider. Uses canvas-drawn signatures stored
 * as base64 PNGs directly in Firestore. No external API calls.
 *
 * Signing URLs point to the NoorSpace app:
 *   /documents/{docId}?sign={participantId}
 *
 * This provider:
 *   - Has no webhooks (signing happens in-app)
 *   - Has no embedded sessions (signing is native)
 *   - Does not generate PDFs (Firestore data is canonical)
 *   - Can be swapped to an external provider without changing business logic
 */

import * as crypto from "crypto";
import type {
  SignatureProvider,
  SignatureRequestResult,
  EmbeddedSigningSession,
  WebhookEvent,
  SignatureStatusResult,
  FinalizeResult,
} from "./signature-provider";
import type { DocumentParticipant, NoorDocument } from "../models";

const APP_URL = process.env.APP_URL || "https://noorspace-33e29.web.app";

export class InternalSignatureProvider implements SignatureProvider {
  readonly name = "internal";

  async createSignatureRequest(
    document: NoorDocument,
    participants: DocumentParticipant[],
  ): Promise<SignatureRequestResult> {
    const requestId = `int_${crypto.randomUUID()}`;

    const signingUrls: Record<string, string> = {};
    for (const p of participants) {
      signingUrls[p.id] = `${APP_URL}/documents/${document.id}?sign=${p.id}`;
    }

    return {
      requestId,
      signingUrls,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async createEmbeddedSigningSession(
    _requestId: string,
    _participantId: string,
  ): Promise<EmbeddedSigningSession> {
    // Internal provider uses native in-app signing, not embedded iframes.
    throw new Error("Embedded signing sessions are not supported by the internal provider");
  }

  async getSigningUrl(
    _requestId: string,
    participantId: string,
  ): Promise<string> {
    return `${APP_URL}/documents/?sign=${participantId}`;
  }

  async recordSignature(
    _requestId: string,
    _participantId: string,
    _signatureData: string,
  ): Promise<void> {
    // Signature data is stored directly in the participant record
    // by the service layer. No external API call needed.
  }

  async handleWebhook(
    _headers: Record<string, string>,
    _body: unknown,
  ): Promise<WebhookEvent | null> {
    // Internal provider has no external webhooks.
    return null;
  }

  async getSignatureStatus(
    _providerRequestId: string,
  ): Promise<SignatureStatusResult> {
    // Internal provider has no external state to query.
    // The service layer reads actual status from Firestore participants.
    return { status: "in_progress", participants: [] };
  }

  async finalizeCompletedDocument(
    _requestId: string,
    _document: NoorDocument,
  ): Promise<FinalizeResult> {
    // Phase 1: no PDF generation. Firestore data is the canonical record.
    // Future: generate a signed PDF and upload to Firebase Storage.
    return { success: true };
  }

  async cancelRequest(_requestId: string): Promise<void> {
    // Internal provider has no external state to cancel.
  }
}
