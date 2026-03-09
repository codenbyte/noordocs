"use strict";
/**
 * NoorSpace Documents — Service Layer
 *
 * All document business logic lives here. Route handlers call these
 * methods — they never touch Firestore directly. This keeps the
 * routes thin and the logic testable.
 *
 * Firestore collections:
 *   documents/{docId}                    — document records
 *   documents/{docId}/audit/{auditId}    — audit trail
 *   documents/{docId}/signatureEvents/{eventId} — signing events
 *   signatureRequests/{reqId}            — provider signing sessions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = void 0;
exports.createDocument = createDocument;
exports.updateDocument = updateDocument;
exports.getDocumentById = getDocumentById;
exports.getDocumentWithAudit = getDocumentWithAudit;
exports.listUserDocuments = listUserDocuments;
exports.listPendingReview = listPendingReview;
exports.addParticipant = addParticipant;
exports.removeParticipant = removeParticipant;
exports.submitForReview = submitForReview;
exports.reviewDocument = reviewDocument;
exports.assignReviewer = assignReviewer;
exports.sendForSignatures = sendForSignatures;
exports.signDocument = signDocument;
exports.declineDocument = declineDocument;
exports.archiveDocument = archiveDocument;
exports.handleSignatureWebhook = handleSignatureWebhook;
exports.getAuditTrail = getAuditTrail;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const providers_1 = require("./providers");
const models_1 = require("./models");
const email_1 = require("../email");
const db = admin.firestore();
const DOCUMENTS_COL = "documents";
// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function now() {
    return new Date().toISOString();
}
function participantId() {
    return crypto.randomUUID().slice(0, 12);
}
async function appendAudit(documentId, action, actorUid, actorName, metadata) {
    await db
        .collection(DOCUMENTS_COL)
        .doc(documentId)
        .collection("audit")
        .add({
        documentId,
        action,
        actorUid,
        actorName,
        metadata: metadata || null,
        createdAt: now(),
    });
}
function toSummary(doc) {
    return {
        id: doc.id,
        type: doc.type,
        title: doc.title,
        status: doc.status,
        creatorName: doc.creatorName,
        participantCount: doc.participants.length,
        signedCount: doc.participants.filter((p) => p.signatureStatus === "signed").length,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
// ──────────────────────────────────────────────────────────
// Status Transition Guards
// ──────────────────────────────────────────────────────────
const VALID_TRANSITIONS = {
    draft: ["pending_review", "sent_for_signature", "archived"],
    pending_review: ["reviewed", "needs_changes", "rejected"],
    needs_changes: ["pending_review", "draft", "archived"],
    reviewed: ["sent_for_signature", "draft", "archived"],
    rejected: ["draft", "archived"],
    sent_for_signature: ["partially_signed", "completed", "archived"],
    partially_signed: ["completed", "archived"],
    completed: ["archived"],
    archived: [],
};
function assertTransition(from, to) {
    if (!VALID_TRANSITIONS[from]?.includes(to)) {
        throw new ServiceError(400, `Cannot transition from "${from}" to "${to}"`);
    }
}
// ──────────────────────────────────────────────────────────
// Service Error
// ──────────────────────────────────────────────────────────
class ServiceError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ServiceError";
    }
}
exports.ServiceError = ServiceError;
// ──────────────────────────────────────────────────────────
// Document CRUD
// ──────────────────────────────────────────────────────────
/**
 * Create a new document from a template.
 * Status starts as DRAFT. Audit log entry is appended.
 */
async function createDocument(input, actorUid, actorName, actorEmail) {
    const template = models_1.TEMPLATES[input.type];
    if (!template) {
        throw new ServiceError(400, `Unknown document type: ${input.type}`);
    }
    // Validate required template fields
    const requiredFields = template.sections
        .flatMap((s) => s.fields)
        .filter((f) => f.required);
    for (const field of requiredFields) {
        if (!input.data[field.key]?.trim()) {
            // Allow saving as draft with missing required fields
            // Validation is enforced at submit-for-review time
        }
    }
    const timestamp = now();
    const participants = input.participants.map((p) => ({
        id: participantId(),
        name: p.name,
        email: p.email,
        role: p.role,
        signatureStatus: "pending",
        order: p.order,
    }));
    const docData = {
        templateId: input.type, // Phase 1: template ID == type
        type: input.type,
        title: input.title,
        status: "draft",
        creatorUid: actorUid,
        creatorName: actorName,
        creatorEmail: actorEmail,
        data: input.data,
        participants,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
    const ref = await db.collection(DOCUMENTS_COL).add(docData);
    const doc = { id: ref.id, ...docData };
    await appendAudit(ref.id, "document.created", actorUid, actorName);
    return doc;
}
/**
 * Update a draft document's data and/or title.
 * Only the creator can update. Only drafts and rejected docs can be edited.
 */
async function updateDocument(documentId, input, actorUid, actorName) {
    const doc = await getDocumentById(documentId);
    if (doc.creatorUid !== actorUid) {
        throw new ServiceError(403, "Only the creator can edit this document");
    }
    if (doc.status !== "draft" && doc.status !== "rejected" && doc.status !== "needs_changes") {
        throw new ServiceError(400, "Only draft, rejected, or needs-changes documents can be edited");
    }
    const updates = { updatedAt: now() };
    if (input.title !== undefined)
        updates.title = input.title;
    if (input.data !== undefined)
        updates.data = input.data;
    await db.collection(DOCUMENTS_COL).doc(documentId).update(updates);
    await appendAudit(documentId, "document.updated", actorUid, actorName);
    return { ...doc, ...updates };
}
/**
 * Get a single document by ID. Throws if not found.
 */
async function getDocumentById(documentId) {
    const snap = await db.collection(DOCUMENTS_COL).doc(documentId).get();
    if (!snap.exists) {
        throw new ServiceError(404, "Document not found");
    }
    return { id: snap.id, ...snap.data() };
}
/**
 * Get document with full audit trail.
 */
async function getDocumentWithAudit(documentId) {
    const document = await getDocumentById(documentId);
    const auditSnap = await db
        .collection(DOCUMENTS_COL)
        .doc(documentId)
        .collection("audit")
        .orderBy("createdAt", "asc")
        .get();
    const audit = auditSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    }));
    return { document, audit };
}
/**
 * List documents for a user (as creator or participant).
 */
async function listUserDocuments(uid, filters) {
    // Query documents created by the user
    let query = db
        .collection(DOCUMENTS_COL)
        .where("creatorUid", "==", uid)
        .orderBy("createdAt", "desc");
    if (filters?.status) {
        query = query.where("status", "==", filters.status);
    }
    if (filters?.type) {
        query = query.where("type", "==", filters.type);
    }
    const snap = await query.get();
    const allDocs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    }));
    const total = allDocs.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 25;
    const paginated = allDocs.slice(offset, offset + limit);
    return {
        documents: paginated.map(toSummary),
        total,
    };
}
/**
 * List documents pending review (for admins/imams).
 */
async function listPendingReview() {
    const snap = await db
        .collection(DOCUMENTS_COL)
        .where("status", "==", "pending_review")
        .orderBy("createdAt", "desc")
        .get();
    return snap.docs.map((d) => {
        const data = { id: d.id, ...d.data() };
        return toSummary(data);
    });
}
// ──────────────────────────────────────────────────────────
// Participants
// ──────────────────────────────────────────────────────────
/**
 * Add a participant to a draft document.
 */
async function addParticipant(documentId, input, actorUid, actorName) {
    const doc = await getDocumentById(documentId);
    if (doc.creatorUid !== actorUid) {
        throw new ServiceError(403, "Only the creator can add participants");
    }
    if (doc.status !== "draft") {
        throw new ServiceError(400, "Participants can only be added to draft documents");
    }
    const participant = {
        id: participantId(),
        name: input.name,
        email: input.email,
        role: input.role,
        signatureStatus: "pending",
        order: input.order,
    };
    const updatedParticipants = [...doc.participants, participant];
    await db.collection(DOCUMENTS_COL).doc(documentId).update({
        participants: updatedParticipants,
        updatedAt: now(),
    });
    await appendAudit(documentId, "participant.added", actorUid, actorName, {
        participantName: input.name,
        participantRole: input.role,
    });
    return participant;
}
/**
 * Remove a participant from a draft document.
 */
async function removeParticipant(documentId, removeParticipantId, actorUid, actorName) {
    const doc = await getDocumentById(documentId);
    if (doc.creatorUid !== actorUid) {
        throw new ServiceError(403, "Only the creator can remove participants");
    }
    if (doc.status !== "draft") {
        throw new ServiceError(400, "Participants can only be removed from draft documents");
    }
    const participant = doc.participants.find((p) => p.id === removeParticipantId);
    if (!participant) {
        throw new ServiceError(404, "Participant not found");
    }
    const updatedParticipants = doc.participants.filter((p) => p.id !== removeParticipantId);
    await db.collection(DOCUMENTS_COL).doc(documentId).update({
        participants: updatedParticipants,
        updatedAt: now(),
    });
    await appendAudit(documentId, "participant.removed", actorUid, actorName, {
        participantName: participant.name,
    });
}
// ──────────────────────────────────────────────────────────
// Review Workflow
// ──────────────────────────────────────────────────────────
/**
 * Submit a document for imam/admin review.
 * Transitions: draft -> pending_review
 */
async function submitForReview(documentId, actorUid, actorName, reviewer) {
    const doc = await getDocumentById(documentId);
    if (doc.creatorUid !== actorUid) {
        throw new ServiceError(403, "Only the creator can submit for review");
    }
    assertTransition(doc.status, "pending_review");
    // Validate required fields before submission
    const template = models_1.TEMPLATES[doc.type];
    if (template) {
        const requiredFields = template.sections
            .flatMap((s) => s.fields)
            .filter((f) => f.required);
        const missing = requiredFields.filter((f) => !doc.data[f.key]?.trim());
        if (missing.length > 0) {
            throw new ServiceError(400, `Missing required fields: ${missing.map((f) => f.label).join(", ")}`);
        }
    }
    const updates = {
        status: "pending_review",
        updatedAt: now(),
    };
    if (reviewer) {
        updates.assignedReviewerUid = reviewer.uid;
        updates.assignedReviewerName = reviewer.name;
    }
    await db.collection(DOCUMENTS_COL).doc(documentId).update(updates);
    await appendAudit(documentId, "document.submitted_for_review", actorUid, actorName);
    if (reviewer) {
        await appendAudit(documentId, "document.reviewer_assigned", actorUid, actorName, {
            reviewerUid: reviewer.uid,
            reviewerName: reviewer.name,
        });
        // Send email notification to the assigned reviewer
        try {
            const reviewerDoc = await admin.auth().getUser(reviewer.uid);
            if (reviewerDoc.email) {
                const appUrl = process.env.APP_URL || "https://noorspace.app";
                const email = (0, email_1.reviewRequestEmail)({
                    reviewerName: reviewer.name,
                    submitterName: actorName,
                    documentTitle: doc.title,
                    documentType: doc.type,
                    documentId,
                    appUrl,
                });
                await (0, email_1.sendEmail)({ to: reviewerDoc.email, ...email });
            }
        }
        catch (emailErr) {
            console.error("Failed to send review request email:", emailErr);
        }
    }
}
/**
 * Imam/admin reviews a document (approve, reject, or request changes).
 * Transitions:
 *   pending_review -> reviewed       (approved)
 *   pending_review -> rejected       (rejected)
 *   pending_review -> needs_changes  (changes_requested)
 */
async function reviewDocument(documentId, input, reviewerUid, reviewerName) {
    const doc = await getDocumentById(documentId);
    const STATUS_MAP = {
        approved: "reviewed",
        rejected: "rejected",
        changes_requested: "needs_changes",
    };
    const targetStatus = STATUS_MAP[input.decision];
    assertTransition(doc.status, targetStatus);
    // Rejection and changes_requested require a note
    if ((input.decision === "rejected" || input.decision === "changes_requested") && !input.note?.trim()) {
        const label = input.decision === "rejected" ? "Rejection reason" : "Feedback note";
        throw new ServiceError(400, `${label} is required`);
    }
    const review = {
        reviewerUid,
        reviewerName,
        decision: input.decision,
        note: input.note,
        reviewedAt: now(),
    };
    await db.collection(DOCUMENTS_COL).doc(documentId).update({
        status: targetStatus,
        review,
        updatedAt: now(),
    });
    const AUDIT_MAP = {
        approved: "document.approved",
        rejected: "document.rejected",
        changes_requested: "document.changes_requested",
    };
    await appendAudit(documentId, AUDIT_MAP[input.decision], reviewerUid, reviewerName, {
        note: input.note,
    });
    // Send email notification to the document creator
    try {
        const creatorUser = await admin.auth().getUser(doc.creatorUid);
        if (creatorUser.email) {
            const appUrl = process.env.APP_URL || "https://noorspace.app";
            const email = (0, email_1.reviewCompleteEmail)({
                submitterName: doc.creatorName,
                reviewerName,
                documentTitle: doc.title,
                documentType: doc.type,
                documentId,
                decision: input.decision,
                note: input.note,
                appUrl,
            });
            await (0, email_1.sendEmail)({ to: creatorUser.email, ...email });
        }
    }
    catch (emailErr) {
        console.error("Failed to send review complete email:", emailErr);
    }
}
/**
 * Assign a specific imam/admin to review a document.
 * Can be called on any document in pending_review status.
 */
async function assignReviewer(documentId, reviewerUid, reviewerName, assignedByUid, assignedByName) {
    const doc = await getDocumentById(documentId);
    if (doc.status !== "pending_review") {
        throw new ServiceError(400, "Reviewer can only be assigned to documents pending review");
    }
    await db.collection(DOCUMENTS_COL).doc(documentId).update({
        assignedReviewerUid: reviewerUid,
        assignedReviewerName: reviewerName,
        updatedAt: now(),
    });
    await appendAudit(documentId, "document.reviewer_assigned", assignedByUid, assignedByName, {
        reviewerUid,
        reviewerName,
    });
}
// ──────────────────────────────────────────────────────────
// Signing Workflow
// ──────────────────────────────────────────────────────────
/**
 * Send a document for signatures via the configured provider.
 * Transitions: draft|reviewed -> sent_for_signature
 */
async function sendForSignatures(documentId, actorUid, actorName) {
    const doc = await getDocumentById(documentId);
    if (doc.creatorUid !== actorUid) {
        throw new ServiceError(403, "Only the creator can send for signatures");
    }
    assertTransition(doc.status, "sent_for_signature");
    if (doc.participants.length === 0) {
        throw new ServiceError(400, "At least one participant is required");
    }
    // Call the signature provider
    const provider = (0, providers_1.getSignatureProvider)();
    const result = await provider.createSignatureRequest(doc, doc.participants);
    // Update participant signing URLs
    const updatedParticipants = doc.participants.map((p) => ({
        ...p,
        signingUrl: result.signingUrls[p.id] || undefined,
    }));
    // Store the signing request
    const sigRequest = {
        documentId,
        provider: provider.name,
        externalId: result.requestId,
        status: "in_progress",
        signingUrls: result.signingUrls,
        createdAt: now(),
        updatedAt: now(),
    };
    const reqRef = await db.collection("signatureRequests").add(sigRequest);
    await db.collection(DOCUMENTS_COL).doc(documentId).update({
        status: "sent_for_signature",
        participants: updatedParticipants,
        signatureRequestId: reqRef.id,
        signingExpiresAt: result.expiresAt || null,
        updatedAt: now(),
    });
    await appendAudit(documentId, "document.sent_for_signature", actorUid, actorName, {
        provider: provider.name,
        participantCount: doc.participants.length,
    });
    return { id: reqRef.id, ...sigRequest };
}
/**
 * Record a signature from a participant.
 * Auto-completes if all participants have signed.
 */
async function signDocument(documentId, input, signerUid, signerName) {
    const doc = await getDocumentById(documentId);
    if (doc.status !== "sent_for_signature" && doc.status !== "partially_signed") {
        throw new ServiceError(400, "Document is not awaiting signatures");
    }
    const participant = doc.participants.find((p) => p.id === input.participantId);
    if (!participant) {
        throw new ServiceError(404, "Participant not found");
    }
    if (participant.signatureStatus === "signed") {
        throw new ServiceError(400, "Already signed");
    }
    // Update the participant's signature
    const updatedParticipants = doc.participants.map((p) => p.id === input.participantId
        ? {
            ...p,
            signatureStatus: "signed",
            signedAt: now(),
            signatureData: input.signatureData,
            uid: signerUid || p.uid,
        }
        : p);
    // Record in provider
    const provider = (0, providers_1.getSignatureProvider)();
    if (doc.signatureRequestId) {
        await provider.recordSignature(doc.signatureRequestId, input.participantId, input.signatureData);
    }
    // Store signature event
    await db
        .collection(DOCUMENTS_COL)
        .doc(documentId)
        .collection("signatureEvents")
        .add({
        documentId,
        participantId: input.participantId,
        participantName: participant.name,
        participantEmail: participant.email,
        status: "signed",
        signedAt: now(),
    });
    // Check if all signed
    const allSigned = updatedParticipants.every((p) => p.signatureStatus === "signed");
    const newStatus = allSigned ? "completed" : "partially_signed";
    const updates = {
        participants: updatedParticipants,
        status: newStatus,
        updatedAt: now(),
    };
    if (allSigned) {
        updates.completedAt = now();
        // Finalize with provider
        if (doc.signatureRequestId) {
            await provider.finalizeCompletedDocument(doc.signatureRequestId, {
                ...doc,
                participants: updatedParticipants,
            });
        }
    }
    await db.collection(DOCUMENTS_COL).doc(documentId).update(updates);
    await appendAudit(documentId, "document.signed", signerUid, signerName, {
        participantId: input.participantId,
        participantName: participant.name,
    });
    if (allSigned) {
        await appendAudit(documentId, "document.completed", signerUid, signerName, {
            message: "All parties have signed",
        });
    }
}
/**
 * Decline to sign a document.
 */
async function declineDocument(documentId, input, signerUid, signerName) {
    const doc = await getDocumentById(documentId);
    if (doc.status !== "sent_for_signature" && doc.status !== "partially_signed") {
        throw new ServiceError(400, "Document is not awaiting signatures");
    }
    const participant = doc.participants.find((p) => p.id === input.participantId);
    if (!participant) {
        throw new ServiceError(404, "Participant not found");
    }
    const updatedParticipants = doc.participants.map((p) => p.id === input.participantId
        ? { ...p, signatureStatus: "declined" }
        : p);
    await db.collection(DOCUMENTS_COL).doc(documentId).update({
        participants: updatedParticipants,
        updatedAt: now(),
    });
    await db
        .collection(DOCUMENTS_COL)
        .doc(documentId)
        .collection("signatureEvents")
        .add({
        documentId,
        participantId: input.participantId,
        participantName: participant.name,
        participantEmail: participant.email,
        status: "declined",
        signedAt: now(),
    });
    await appendAudit(documentId, "document.declined", signerUid, signerName, {
        participantId: input.participantId,
        reason: input.reason,
    });
}
// ──────────────────────────────────────────────────────────
// Archive
// ──────────────────────────────────────────────────────────
/**
 * Archive a document (soft-delete).
 */
async function archiveDocument(documentId, actorUid, actorName) {
    const doc = await getDocumentById(documentId);
    if (doc.creatorUid !== actorUid) {
        throw new ServiceError(403, "Only the creator can archive this document");
    }
    assertTransition(doc.status, "archived");
    await db.collection(DOCUMENTS_COL).doc(documentId).update({
        status: "archived",
        archivedAt: now(),
        updatedAt: now(),
    });
    await appendAudit(documentId, "document.archived", actorUid, actorName);
}
// ──────────────────────────────────────────────────────────
// Webhook (for external signature providers)
// ──────────────────────────────────────────────────────────
/**
 * Handle a webhook from the signature provider.
 * Routes the canonical WebhookEvent to the appropriate service method.
 *
 * Idempotency: each case checks current participant/document state
 * before mutating — duplicate webhook deliveries are safe.
 */
async function handleSignatureWebhook(headers, body) {
    const provider = (0, providers_1.getSignatureProvider)();
    const event = await provider.handleWebhook(headers, body);
    if (!event)
        return; // Internal provider or unrecognized event
    // Find the document by provider's request ID
    const reqSnap = await db
        .collection("signatureRequests")
        .where("externalId", "==", event.providerRequestId)
        .limit(1)
        .get();
    if (reqSnap.empty) {
        console.warn(`Webhook: No signature request found for ${event.providerRequestId}`);
        return;
    }
    const sigRequest = {
        id: reqSnap.docs[0].id,
        ...reqSnap.docs[0].data(),
    };
    const doc = await getDocumentById(sigRequest.documentId);
    // Store the raw signature event for audit purposes
    await db
        .collection(DOCUMENTS_COL)
        .doc(sigRequest.documentId)
        .collection("signatureEvents")
        .add({
        documentId: sigRequest.documentId,
        eventType: event.type,
        participantId: event.participantId || null,
        participantEmail: event.participantEmail || null,
        providerRequestId: event.providerRequestId,
        timestamp: event.timestamp,
        receivedAt: now(),
    });
    switch (event.type) {
        case "SENT":
            // Informational — the signing request was dispatched.
            // No state change needed; audit event is already stored above.
            break;
        case "VIEWED":
            // Informational — a participant opened the document.
            // Could update a "viewedAt" field in the future; no state change now.
            break;
        case "SIGNED": {
            if (!event.participantId)
                break;
            // Idempotent: skip if this participant already signed
            const participant = doc.participants.find((p) => p.id === event.participantId);
            if (!participant || participant.signatureStatus === "signed")
                break;
            await signDocument(sigRequest.documentId, {
                participantId: event.participantId,
                signatureData: event.signatureData || "",
            }, "system", "Signature Provider");
            break;
        }
        case "DECLINED": {
            if (!event.participantId)
                break;
            // Idempotent: skip if already declined
            const declinedParticipant = doc.participants.find((p) => p.id === event.participantId);
            if (!declinedParticipant || declinedParticipant.signatureStatus === "declined")
                break;
            await declineDocument(sigRequest.documentId, { participantId: event.participantId }, "system", "Signature Provider");
            break;
        }
        case "COMPLETED":
            // Provider confirmed all parties signed.
            // Idempotent: only act if we haven't already marked completed.
            if (doc.status !== "completed") {
                const allSigned = doc.participants.every((p) => p.signatureStatus === "signed");
                if (allSigned) {
                    await db.collection(DOCUMENTS_COL).doc(sigRequest.documentId).update({
                        status: "completed",
                        completedAt: now(),
                        updatedAt: now(),
                    });
                    await appendAudit(sigRequest.documentId, "document.completed", "system", "Signature Provider", { message: "Provider confirmed completion" });
                }
            }
            break;
        case "EXPIRED":
            // Mark all still-pending participants as expired and archive the document
            if (doc.status !== "archived" && doc.status !== "completed") {
                const expiredParticipants = doc.participants.map((p) => p.signatureStatus === "pending"
                    ? { ...p, signatureStatus: "expired" }
                    : p);
                await db.collection(DOCUMENTS_COL).doc(sigRequest.documentId).update({
                    participants: expiredParticipants,
                    status: "archived",
                    archivedAt: now(),
                    updatedAt: now(),
                });
                await appendAudit(sigRequest.documentId, "document.archived", "system", "Signature Provider", { reason: "Signing request expired" });
            }
            break;
    }
}
// ──────────────────────────────────────────────────────────
// Audit Trail (read)
// ──────────────────────────────────────────────────────────
/**
 * Get the full audit trail for a document.
 */
async function getAuditTrail(documentId) {
    const snap = await db
        .collection(DOCUMENTS_COL)
        .doc(documentId)
        .collection("audit")
        .orderBy("createdAt", "asc")
        .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
//# sourceMappingURL=service.js.map