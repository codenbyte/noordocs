"use strict";
/**
 * NoorSpace Documents — DTOs & Validation
 *
 * Request/response shapes with Zod runtime validation.
 * Every API input is validated before reaching the service layer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListDocumentsQuery = exports.DeclineDocumentDto = exports.SignDocumentDto = exports.ReviewDocumentDto = exports.AddParticipantDto = exports.UpdateDocumentDto = exports.CreateDocumentDto = exports.ReviewDecisionSchema = exports.ParticipantRoleSchema = exports.DocumentStatusSchema = exports.DocumentTypeSchema = void 0;
const zod_1 = require("zod");
// ──────────────────────────────────────────────────────────
// Shared Enums (as Zod schemas for validation)
// ──────────────────────────────────────────────────────────
exports.DocumentTypeSchema = zod_1.z.enum(["nikah_contract", "islamic_will"]);
exports.DocumentStatusSchema = zod_1.z.enum([
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
exports.ParticipantRoleSchema = zod_1.z.enum([
    "creator",
    "spouse",
    "witness",
    "imam",
    "executor",
    "admin",
]);
exports.ReviewDecisionSchema = zod_1.z.enum(["approved", "rejected", "changes_requested"]);
// ──────────────────────────────────────────────────────────
// Request DTOs
// ──────────────────────────────────────────────────────────
/** POST /documents — Create a new document */
exports.CreateDocumentDto = zod_1.z.object({
    type: exports.DocumentTypeSchema,
    title: zod_1.z.string().min(1).max(200),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).default({}),
    participants: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1).max(200),
        email: zod_1.z.string().email().or(zod_1.z.literal("")),
        role: exports.ParticipantRoleSchema,
        order: zod_1.z.number().int().min(0).default(0),
    }))
        .default([]),
});
/** PATCH /documents/:id — Update draft document data */
exports.UpdateDocumentDto = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
});
/** POST /documents/:id/participants — Add a participant */
exports.AddParticipantDto = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    email: zod_1.z.string().email().or(zod_1.z.literal("")),
    role: exports.ParticipantRoleSchema,
    order: zod_1.z.number().int().min(0).default(0),
});
/** POST /documents/:id/review — Submit review decision */
exports.ReviewDocumentDto = zod_1.z.object({
    decision: exports.ReviewDecisionSchema,
    note: zod_1.z.string().max(2000).optional(),
});
/** POST /documents/:id/sign — Submit a signature */
exports.SignDocumentDto = zod_1.z.object({
    participantId: zod_1.z.string().min(1),
    signatureData: zod_1.z.string().min(1), // base64 PNG
});
/** POST /documents/:id/decline — Decline to sign */
exports.DeclineDocumentDto = zod_1.z.object({
    participantId: zod_1.z.string().min(1),
    reason: zod_1.z.string().max(1000).optional(),
});
/** GET /documents — Query filters */
exports.ListDocumentsQuery = zod_1.z.object({
    status: exports.DocumentStatusSchema.optional(),
    type: exports.DocumentTypeSchema.optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
});
//# sourceMappingURL=dtos.js.map