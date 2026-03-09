/**
 * NoorSpace Documents — Mock Signature Provider
 *
 * In-memory mock for local development and testing.
 * Simulates the full signing lifecycle without external API calls.
 *
 * Usage:
 *   Set SIGNATURE_PROVIDER=mock in your environment or .env file.
 *
 * Features:
 *   - Tracks requests and signatures in memory
 *   - Generates fake signing URLs
 *   - Supports embedded signing sessions
 *   - Simulates webhook parsing
 *   - Useful for unit tests and local dev
 *
 * Limitations:
 *   - State is lost on restart (in-memory only)
 *   - Not suitable for production or multi-instance deployments
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

// ── In-memory state ──────────────────────────────────

interface MockRequest {
  requestId: string;
  documentId: string;
  participants: Array<{
    participantId: string;
    name: string;
    email: string;
    status: "pending" | "signed" | "declined" | "expired";
    signedAt?: string;
    signatureData?: string;
  }>;
  status: "pending" | "in_progress" | "completed" | "expired" | "cancelled";
  createdAt: string;
  expiresAt: string;
}

// ── Provider ─────────────────────────────────────────

export class MockSignatureProvider implements SignatureProvider {
  readonly name = "mock";

  /** In-memory request store — cleared on restart */
  private requests = new Map<string, MockRequest>();

  async createSignatureRequest(
    document: NoorDocument,
    participants: DocumentParticipant[],
  ): Promise<SignatureRequestResult> {
    const requestId = `mock_${crypto.randomUUID().slice(0, 8)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const signingUrls: Record<string, string> = {};
    const mockParticipants: MockRequest["participants"] = [];

    for (const p of participants) {
      const url = `http://localhost:5173/mock-sign/${requestId}/${p.id}`;
      signingUrls[p.id] = url;
      mockParticipants.push({
        participantId: p.id,
        name: p.name,
        email: p.email,
        status: "pending",
      });
    }

    this.requests.set(requestId, {
      requestId,
      documentId: document.id,
      participants: mockParticipants,
      status: "in_progress",
      createdAt: new Date().toISOString(),
      expiresAt,
    });

    console.log(`[MockProvider] Created request ${requestId} for document ${document.id} with ${participants.length} participants`);

    return { requestId, signingUrls, expiresAt };
  }

  async createEmbeddedSigningSession(
    requestId: string,
    participantId: string,
  ): Promise<EmbeddedSigningSession> {
    const req = this.requests.get(requestId);
    if (!req) throw new Error(`Mock request ${requestId} not found`);

    const sessionToken = `mock_session_${crypto.randomUUID().slice(0, 8)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    console.log(`[MockProvider] Created embedded session for ${participantId} on request ${requestId}`);

    return {
      signingUrl: `http://localhost:5173/mock-sign/${requestId}/${participantId}?embedded=true&token=${sessionToken}`,
      sessionToken,
      expiresAt,
    };
  }

  async getSigningUrl(
    requestId: string,
    participantId: string,
  ): Promise<string> {
    return `http://localhost:5173/mock-sign/${requestId}/${participantId}`;
  }

  async recordSignature(
    requestId: string,
    participantId: string,
    signatureData: string,
  ): Promise<void> {
    const req = this.requests.get(requestId);
    if (!req) {
      console.warn(`[MockProvider] Request ${requestId} not found for recordSignature`);
      return;
    }

    const participant = req.participants.find((p) => p.participantId === participantId);
    if (participant) {
      participant.status = "signed";
      participant.signedAt = new Date().toISOString();
      participant.signatureData = signatureData;
    }

    // Check if all signed
    const allSigned = req.participants.every((p) => p.status === "signed");
    if (allSigned) {
      req.status = "completed";
    }

    console.log(`[MockProvider] Recorded signature for ${participantId} on request ${requestId}. All signed: ${allSigned}`);
  }

  async handleWebhook(
    _headers: Record<string, string>,
    body: unknown,
  ): Promise<WebhookEvent | null> {
    // Mock webhook format:
    // { type: "SIGNED", requestId: "mock_xxx", participantId: "abc123" }
    const payload = body as Record<string, string>;
    if (!payload?.type || !payload?.requestId) return null;

    const event: WebhookEvent = {
      type: payload.type as WebhookEvent["type"],
      providerRequestId: payload.requestId,
      participantId: payload.participantId,
      participantEmail: payload.participantEmail,
      signatureData: payload.signatureData,
      timestamp: new Date().toISOString(),
      rawPayload: body,
    };

    console.log(`[MockProvider] Parsed webhook event: ${event.type} for request ${event.providerRequestId}`);
    return event;
  }

  async getSignatureStatus(
    providerRequestId: string,
  ): Promise<SignatureStatusResult> {
    const req = this.requests.get(providerRequestId);
    if (!req) {
      return { status: "pending", participants: [] };
    }

    return {
      status: req.status,
      participants: req.participants.map((p) => ({
        participantId: p.participantId,
        status: p.status,
        signedAt: p.signedAt,
      })),
    };
  }

  async finalizeCompletedDocument(
    requestId: string,
    _document: NoorDocument,
  ): Promise<FinalizeResult> {
    console.log(`[MockProvider] Finalized document for request ${requestId}`);
    return {
      success: true,
      documentUrl: `http://localhost:5173/mock-documents/${requestId}/signed.pdf`,
    };
  }

  async cancelRequest(requestId: string): Promise<void> {
    const req = this.requests.get(requestId);
    if (req) {
      req.status = "cancelled";
      console.log(`[MockProvider] Cancelled request ${requestId}`);
    }
  }

  // ── Test helpers (not part of the interface) ─────────

  /** Simulate a participant signing — useful in tests */
  simulateSign(requestId: string, participantId: string): WebhookEvent | null {
    const req = this.requests.get(requestId);
    if (!req) return null;

    const p = req.participants.find((pp) => pp.participantId === participantId);
    if (!p || p.status === "signed") return null;

    p.status = "signed";
    p.signedAt = new Date().toISOString();
    p.signatureData = "data:image/png;base64,iVBORw0KGgoAAAANS...mock...";

    const allSigned = req.participants.every((pp) => pp.status === "signed");
    if (allSigned) req.status = "completed";

    return {
      type: allSigned ? "COMPLETED" : "SIGNED",
      providerRequestId: requestId,
      participantId,
      signatureData: p.signatureData,
      timestamp: p.signedAt,
    };
  }

  /** Get all tracked requests — useful for assertions */
  getRequests(): Map<string, MockRequest> {
    return this.requests;
  }

  /** Clear all state — call between tests */
  reset(): void {
    this.requests.clear();
  }
}
