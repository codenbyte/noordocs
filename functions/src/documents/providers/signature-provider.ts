/**
 * NoorSpace Documents — Signature Provider Interface
 *
 * This abstraction decouples NoorSpace business logic from any specific
 * e-sign vendor. The service layer calls these methods exclusively —
 * route handlers and webhook controllers never touch provider internals.
 *
 * ┌────────────────────────────────────────────────────────┐
 * │                  HOW TO ADD A PROVIDER                 │
 * │                                                        │
 * │  1. Create a new file (e.g. documenso-provider.ts)     │
 * │  2. Implement the SignatureProvider interface           │
 * │  3. Register it in the provider registry (index.ts)    │
 * │  4. Set SIGNATURE_PROVIDER env var to your key         │
 * │  5. All business logic works unchanged                 │
 * └────────────────────────────────────────────────────────┘
 *
 * Current providers:
 *   - "internal"     — canvas-based, stored in Firestore (Phase 1)
 *   - "mock"         — in-memory mock for local development & testing
 *   - "documenso"    — placeholder stub
 *   - "docuseal"     — placeholder stub
 *   - "dropbox_sign" — placeholder stub
 */

import type { DocumentParticipant, NoorDocument } from "../models";

// ──────────────────────────────────────────────────────────
// Provider-Neutral Webhook Events
// ──────────────────────────────────────────────────────────

/**
 * Canonical event types that any provider must map their
 * vendor-specific events onto. The service layer only
 * understands these — never raw vendor payloads.
 */
export type WebhookEventType =
  | "SENT"        // signing request was dispatched to participants
  | "VIEWED"      // a participant opened/viewed the document
  | "SIGNED"      // a participant signed the document
  | "DECLINED"    // a participant declined to sign
  | "COMPLETED"   // all required parties have signed
  | "EXPIRED";    // the signing request expired without completion

/**
 * Provider-neutral webhook event. Every provider adapter must
 * translate its vendor-specific webhook payload into this shape.
 */
export interface WebhookEvent {
  /** Canonical event type (SIGNED, DECLINED, etc.) */
  type: WebhookEventType;

  /** The provider's request ID (used to look up our SignatureRequest) */
  providerRequestId: string;

  /** The NoorSpace participant ID this event relates to (if applicable) */
  participantId?: string;

  /** Participant email (fallback identifier if participantId isn't mapped) */
  participantEmail?: string;

  /** Base64 signature image data (for SIGNED events, if available) */
  signatureData?: string;

  /** ISO timestamp of when the event occurred at the provider */
  timestamp: string;

  /** Raw vendor payload for debugging — never used in business logic */
  rawPayload?: unknown;
}

// ──────────────────────────────────────────────────────────
// Result Types
// ──────────────────────────────────────────────────────────

export interface SignatureRequestResult {
  /** Provider's unique request ID */
  requestId: string;

  /** Map of NoorSpace participantId → signing URL */
  signingUrls: Record<string, string>;

  /** ISO timestamp when the request expires (optional) */
  expiresAt?: string;
}

export interface EmbeddedSigningSession {
  /** URL to embed in an iframe or redirect to */
  signingUrl: string;

  /** Session token (some providers require this) */
  sessionToken?: string;

  /** ISO timestamp when this session expires */
  expiresAt: string;
}

export interface SignatureStatusResult {
  /** Overall request status */
  status: "pending" | "in_progress" | "completed" | "expired" | "cancelled";

  /** Per-participant status from the provider */
  participants: Array<{
    participantId: string;
    status: "pending" | "signed" | "declined" | "expired";
    signedAt?: string;
  }>;
}

export interface FinalizeResult {
  /** Whether finalization succeeded */
  success: boolean;

  /** URL to the final signed PDF (if provider generates one) */
  documentUrl?: string;

  /** Raw signed document bytes (if provider returns inline) */
  documentBytes?: Buffer;
}

// ──────────────────────────────────────────────────────────
// Core Interface
// ──────────────────────────────────────────────────────────

export interface SignatureProvider {
  /**
   * Unique identifier for this provider.
   * Used in the SignatureRequest.provider field and in logs.
   * Examples: "internal", "mock", "documenso", "docuseal", "dropbox_sign"
   */
  readonly name: string;

  /**
   * Create a signature request for a document.
   * Called when the document owner clicks "Send for Signatures".
   *
   * The provider should:
   *   - Register the signing session with the external service (if applicable)
   *   - Return a unique request ID and per-participant signing URLs
   *   - Optionally set an expiration
   *
   * @param document  The NoorSpace document being signed
   * @param participants  The list of people who need to sign
   * @returns  Request ID and signing URLs
   */
  createSignatureRequest(
    document: NoorDocument,
    participants: DocumentParticipant[],
  ): Promise<SignatureRequestResult>;

  /**
   * Create an embedded signing session for a specific participant.
   * Used for providers that support iframe-based signing (e.g. DocuSeal).
   *
   * Not all providers support this — throw if unsupported.
   *
   * @param requestId  The provider's request ID
   * @param participantId  NoorSpace participant ID
   * @returns  Embeddable signing URL and session metadata
   */
  createEmbeddedSigningSession(
    requestId: string,
    participantId: string,
  ): Promise<EmbeddedSigningSession>;

  /**
   * Get the signing URL for a specific participant.
   * For internal provider: a NoorSpace URL.
   * For external providers: the provider's hosted signing page.
   */
  getSigningUrl(
    requestId: string,
    participantId: string,
  ): Promise<string>;

  /**
   * Record a signature for a participant.
   * For internal provider: stores base64 data in Firestore.
   * For external providers: called after webhook confirms signing.
   */
  recordSignature(
    requestId: string,
    participantId: string,
    signatureData: string,
  ): Promise<void>;

  /**
   * Handle an incoming webhook from the provider.
   * Parses vendor-specific payload into a canonical WebhookEvent.
   *
   * Returns null if:
   *   - The provider has no webhooks (internal provider)
   *   - The event type is not relevant (e.g. reminder emails)
   *   - Signature verification fails
   *
   * @param headers  HTTP headers (for signature verification)
   * @param body  Raw request body
   * @returns  Canonical WebhookEvent or null
   */
  handleWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): Promise<WebhookEvent | null>;

  /**
   * Query the current status of a signing request from the provider.
   * Useful for polling when webhooks are unreliable.
   *
   * @param providerRequestId  The provider's request ID
   */
  getSignatureStatus(
    providerRequestId: string,
  ): Promise<SignatureStatusResult>;

  /**
   * Called when all required parties have signed.
   * The provider may:
   *   - Apply a digital seal or certificate
   *   - Generate a final signed PDF
   *   - Return the document URL or bytes
   *
   * @param requestId  The provider's request ID
   * @param document  The completed NoorSpace document
   */
  finalizeCompletedDocument(
    requestId: string,
    document: NoorDocument,
  ): Promise<FinalizeResult>;

  /**
   * Cancel an in-progress signing request.
   * Called when the document owner cancels or the document is archived.
   */
  cancelRequest(requestId: string): Promise<void>;
}
