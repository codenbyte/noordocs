/**
 * NoorSpace Documents — DTOs & Validation
 *
 * Request/response shapes with Zod runtime validation.
 * Every API input is validated before reaching the service layer.
 */

import { z } from "zod";

// ──────────────────────────────────────────────────────────
// Shared Enums (as Zod schemas for validation)
// ──────────────────────────────────────────────────────────

export const DocumentTypeSchema = z.enum(["nikah_contract", "islamic_will"]);

export const DocumentStatusSchema = z.enum([
  "draft",
  "pending_review",
  "reviewed",
  "needs_changes",
  "sent_for_signature",
  "partially_signed",
  "completed",
  "rejected",
  "archived",
]);

export const ParticipantRoleSchema = z.enum([
  "creator",
  "spouse",
  "witness",
  "imam",
  "executor",
  "admin",
]);

export const ReviewDecisionSchema = z.enum(["approved", "rejected", "changes_requested"]);

// ──────────────────────────────────────────────────────────
// Request DTOs
// ──────────────────────────────────────────────────────────

/** POST /documents — Create a new document */
export const CreateDocumentDto = z.object({
  type: DocumentTypeSchema,
  title: z.string().min(1).max(200),
  data: z.record(z.string(), z.string()).default({}),
  participants: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        email: z.string().email().or(z.literal("")),
        role: ParticipantRoleSchema,
        order: z.number().int().min(0).default(0),
      }),
    )
    .default([]),
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentDto>;

/** PATCH /documents/:id — Update draft document data */
export const UpdateDocumentDto = z.object({
  title: z.string().min(1).max(200).optional(),
  data: z.record(z.string(), z.string()).optional(),
});
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentDto>;

/** POST /documents/:id/participants — Add a participant */
export const AddParticipantDto = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().or(z.literal("")),
  role: ParticipantRoleSchema,
  order: z.number().int().min(0).default(0),
});
export type AddParticipantInput = z.infer<typeof AddParticipantDto>;

/** POST /documents/:id/review — Submit review decision */
export const ReviewDocumentDto = z.object({
  decision: ReviewDecisionSchema,
  note: z.string().max(2000).optional(),
});
export type ReviewDocumentInput = z.infer<typeof ReviewDocumentDto>;

/** POST /documents/:id/sign — Submit a signature */
export const SignDocumentDto = z.object({
  participantId: z.string().min(1),
  signatureData: z.string().min(1), // base64 PNG
});
export type SignDocumentInput = z.infer<typeof SignDocumentDto>;

/** POST /documents/:id/decline — Decline to sign */
export const DeclineDocumentDto = z.object({
  participantId: z.string().min(1),
  reason: z.string().max(1000).optional(),
});
export type DeclineDocumentInput = z.infer<typeof DeclineDocumentDto>;

/** GET /documents — Query filters */
export const ListDocumentsQuery = z.object({
  status: DocumentStatusSchema.optional(),
  type: DocumentTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListDocumentsQueryInput = z.infer<typeof ListDocumentsQuery>;

// ──────────────────────────────────────────────────────────
// Response DTOs
// ──────────────────────────────────────────────────────────

/** Standard API envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: z.ZodIssue[];
}

/** Document list response */
export interface DocumentListResponse {
  documents: DocumentSummary[];
  total: number;
}

/** Compact document for list views */
export interface DocumentSummary {
  id: string;
  type: string;
  title: string;
  status: string;
  creatorName: string;
  participantCount: number;
  signedCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Full document detail response */
export interface DocumentDetailResponse {
  document: import("./models").NoorDocument;
  audit: import("./models").AuditLogEntry[];
}
