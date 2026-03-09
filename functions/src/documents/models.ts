/**
 * NoorSpace Documents — Domain Models
 *
 * Core entities for the document management system.
 * These interfaces define the shape of data at rest (Firestore)
 * and serve as the canonical source of truth for the domain.
 *
 * All timestamps are Firestore Timestamps or ISO strings depending on context.
 */

// ──────────────────────────────────────────────────────────
// Enums / Literal Unions
// ──────────────────────────────────────────────────────────

export type DocumentType = "nikah_contract" | "islamic_will";

export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "reviewed"
  | "needs_changes"
  | "sent_for_signature"
  | "partially_signed"
  | "completed"
  | "rejected"
  | "archived";

export type ParticipantRole =
  | "creator"
  | "spouse"
  | "witness"
  | "imam"
  | "executor"
  | "admin";

export type SignatureStatus = "pending" | "signed" | "declined" | "expired";

export type AuditAction =
  | "document.created"
  | "document.updated"
  | "document.submitted_for_review"
  | "document.approved"
  | "document.rejected"
  | "document.changes_requested"
  | "document.reviewer_assigned"
  | "document.sent_for_signature"
  | "document.signed"
  | "document.declined"
  | "document.completed"
  | "document.archived"
  | "participant.added"
  | "participant.removed"
  | "review.note_added";

export type ReviewDecision = "approved" | "rejected" | "changes_requested";

// ──────────────────────────────────────────────────────────
// Core Entities
// ──────────────────────────────────────────────────────────

/**
 * A document template defines the fields and signer roles
 * for a specific document type (e.g. Nikah Contract).
 */
export interface DocumentTemplate {
  id: string;
  type: DocumentType;
  name: string;
  description: string;
  version: number;
  sections: TemplateSection[];
  participantRoles: ParticipantRole[];
  active: boolean;
}

export interface TemplateSection {
  key: string;
  label: string;
  fields: TemplateField[];
}

export interface TemplateField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

/**
 * A NoorSpace document — the central entity.
 * Contains form data, participant list, and status tracking.
 */
export interface NoorDocument {
  id: string;
  templateId: string;
  type: DocumentType;
  title: string;
  status: DocumentStatus;

  // Creator info (denormalized for reads)
  creatorUid: string;
  creatorName: string;
  creatorEmail: string;

  // The filled-in form data, keyed by TemplateField.key
  data: Record<string, string>;

  // Participants (signers, witnesses, imam, etc.)
  participants: DocumentParticipant[];

  // Review tracking
  review?: DocumentReview;
  assignedReviewerUid?: string;
  assignedReviewerName?: string;

  // Signing metadata
  signatureRequestId?: string; // external provider reference
  signingExpiresAt?: string;   // ISO timestamp

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
}

/**
 * A party involved in a document (signer, witness, imam, etc.)
 */
export interface DocumentParticipant {
  id: string;
  uid?: string;          // NoorSpace user ID (if registered)
  name: string;
  email: string;
  role: ParticipantRole;
  signatureStatus: SignatureStatus;
  signedAt?: string;
  signatureData?: string; // base64 PNG (internal provider)
  signingUrl?: string;    // external provider URL
  order: number;          // signing order (0 = any order)
}

/**
 * Imam or admin review of a document before signing.
 */
export interface DocumentReview {
  reviewerUid: string;
  reviewerName: string;
  decision: ReviewDecision;
  note?: string;
  reviewedAt: string;
}

/**
 * Immutable record of every significant action on a document.
 * Stored as a subcollection: documents/{docId}/audit/{auditId}
 */
export interface AuditLogEntry {
  id: string;
  documentId: string;
  action: AuditAction;
  actorUid: string;
  actorName: string;
  actorEmail?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Tracks an external signature request from a third-party provider.
 * One per document — maps the NoorSpace document to the external
 * signing session (DocuSign, DocuSeal, Documenso, etc.)
 */
export interface SignatureRequest {
  id: string;
  documentId: string;
  provider: string;         // "internal" | "documenso" | "docuseal" etc.
  externalId?: string;      // provider's reference ID
  status: "pending" | "in_progress" | "completed" | "expired" | "cancelled";
  signingUrls: Record<string, string>; // participantId -> URL
  webhookSecret?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * A single signing event — one per signer per document.
 * Stored as subcollection: documents/{docId}/signatureEvents/{eventId}
 */
export interface SignatureEvent {
  id: string;
  documentId: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  status: "signed" | "declined";
  signatureData?: string;
  signedAt: string;
  ip?: string;
  userAgent?: string;
}

// ──────────────────────────────────────────────────────────
// Template Definitions (Phase 1 — hardcoded, future: DB-driven)
// ──────────────────────────────────────────────────────────

export const NIKAH_CONTRACT_TEMPLATE: Omit<DocumentTemplate, "id"> = {
  type: "nikah_contract",
  name: "Nikah Contract",
  description: "Islamic marriage contract with mahr, witnesses, and imam certification.",
  version: 1,
  participantRoles: ["creator", "spouse", "witness", "witness", "imam"],
  active: true,
  sections: [
    {
      key: "groom",
      label: "Groom Details",
      fields: [
        { key: "groomName", label: "Full Name of Groom", type: "text", required: true },
        { key: "groomIdNumber", label: "ID / Passport Number", type: "text", required: true },
        { key: "groomAddress", label: "Residential Address", type: "text", required: false },
        { key: "groomFatherName", label: "Father's Name", type: "text", required: false },
      ],
    },
    {
      key: "bride",
      label: "Bride Details",
      fields: [
        { key: "brideName", label: "Full Name of Bride", type: "text", required: true },
        { key: "brideIdNumber", label: "ID / Passport Number", type: "text", required: true },
        { key: "brideAddress", label: "Residential Address", type: "text", required: false },
        { key: "brideFatherName", label: "Father's Name (Wali)", type: "text", required: false },
      ],
    },
    {
      key: "mahr",
      label: "Mahr (Dowry)",
      fields: [
        { key: "mahrAmount", label: "Mahr Amount", type: "text", required: true },
        { key: "mahrDescription", label: "Description", type: "textarea", required: false, placeholder: "e.g. R5,000 cash, gold jewellery" },
        { key: "mahrPaymentTerms", label: "Payment Terms", type: "text", required: false, placeholder: "e.g. Paid in full at Nikah" },
      ],
    },
    {
      key: "ceremony",
      label: "Ceremony Details",
      fields: [
        { key: "ceremonyDate", label: "Date of Nikah", type: "date", required: true },
        { key: "ceremonyLocation", label: "Location", type: "text", required: false },
        { key: "imamName", label: "Officiating Imam", type: "text", required: false },
      ],
    },
    {
      key: "witnesses",
      label: "Witnesses",
      fields: [
        { key: "witness1Name", label: "Witness 1 Full Name", type: "text", required: true },
        { key: "witness2Name", label: "Witness 2 Full Name", type: "text", required: true },
      ],
    },
    {
      key: "conditions",
      label: "Additional Terms",
      fields: [
        { key: "additionalConditions", label: "Conditions", type: "textarea", required: false, placeholder: "Any conditions agreed upon by both parties" },
      ],
    },
  ],
};

export const ISLAMIC_WILL_TEMPLATE: Omit<DocumentTemplate, "id"> = {
  type: "islamic_will",
  name: "Islamic Will",
  description: "Will prepared according to Islamic inheritance principles.",
  version: 1,
  participantRoles: ["creator", "executor", "witness", "witness"],
  active: true,
  sections: [
    {
      key: "testator",
      label: "Testator (You)",
      fields: [
        { key: "testatorName", label: "Full Legal Name", type: "text", required: true },
        { key: "testatorIdNumber", label: "ID / Passport Number", type: "text", required: true },
        { key: "testatorAddress", label: "Residential Address", type: "text", required: false },
      ],
    },
    {
      key: "declaration",
      label: "Islamic Declaration",
      fields: [
        { key: "declaration", label: "Declaration", type: "textarea", required: false, placeholder: "I declare that I am a Muslim and wish to have my estate distributed according to Islamic Shariah law..." },
      ],
    },
    {
      key: "executor",
      label: "Executor",
      fields: [
        { key: "executorName", label: "Executor Full Name", type: "text", required: true },
        { key: "executorIdNumber", label: "Executor ID / Passport", type: "text", required: false },
        { key: "executorRelation", label: "Relationship to Testator", type: "text", required: false },
      ],
    },
    {
      key: "bequests",
      label: "Bequests (Wasiyyah)",
      fields: [
        { key: "bequests", label: "Specific Bequests", type: "textarea", required: false, placeholder: "List specific bequests (max 1/3 of estate)..." },
      ],
    },
    {
      key: "debts",
      label: "Debts & Obligations",
      fields: [
        { key: "outstandingDebts", label: "Outstanding Debts", type: "textarea", required: false, placeholder: "List debts to be settled from the estate..." },
      ],
    },
    {
      key: "funeral",
      label: "Funeral Arrangements",
      fields: [
        { key: "funeralWishes", label: "Funeral Wishes", type: "textarea", required: false, placeholder: "e.g. Ghusl, Janazah prayer, burial preferences..." },
      ],
    },
    {
      key: "witnesses",
      label: "Witnesses",
      fields: [
        { key: "witness1Name", label: "Witness 1 Full Name", type: "text", required: true },
        { key: "witness2Name", label: "Witness 2 Full Name", type: "text", required: true },
      ],
    },
    {
      key: "execution",
      label: "Execution",
      fields: [
        { key: "willDate", label: "Date", type: "date", required: true },
      ],
    },
  ],
};

/** Quick lookup of templates by type */
export const TEMPLATES: Record<DocumentType, Omit<DocumentTemplate, "id">> = {
  nikah_contract: NIKAH_CONTRACT_TEMPLATE,
  islamic_will: ISLAMIC_WILL_TEMPLATE,
};

/** Human-readable labels */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  nikah_contract: "Nikah Contract",
  islamic_will: "Islamic Will",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  reviewed: "Reviewed",
  needs_changes: "Needs Changes",
  sent_for_signature: "Sent for Signature",
  partially_signed: "Partially Signed",
  completed: "Completed",
  rejected: "Rejected",
  archived: "Archived",
};
