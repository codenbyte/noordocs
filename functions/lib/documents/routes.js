"use strict";
/**
 * NoorSpace Documents — Express Route Handlers
 *
 * Thin controllers that validate input (Zod), extract auth,
 * and delegate to the service layer. All business logic lives
 * in service.ts — routes never touch Firestore directly.
 *
 * Auth: Firebase ID token verified via admin.auth().verifyIdToken()
 * mounted as middleware on all routes.
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
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const dtos_1 = require("./dtos");
const service = __importStar(require("./service"));
const service_1 = require("./service");
const router = (0, express_1.Router)();
/**
 * Verify Firebase ID token from Authorization header.
 * Populates req.uid, req.userEmail, req.userName, req.isAdmin.
 */
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ success: false, error: "Missing authorization token" });
        return;
    }
    try {
        const token = authHeader.slice(7);
        const decoded = await admin.auth().verifyIdToken(token);
        const authReq = req;
        authReq.uid = decoded.uid;
        authReq.userEmail = decoded.email || "";
        authReq.userName = decoded.name || decoded.email || "User";
        authReq.isAdmin = decoded.admin === true || decoded.superadmin === true;
        next();
    }
    catch {
        res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
}
/**
 * Require admin role (admin or superadmin custom claim).
 */
function requireAdminRole(req, res, next) {
    const authReq = req;
    if (!authReq.isAdmin) {
        res.status(403).json({ success: false, error: "Admin access required" });
        return;
    }
    next();
}
// Apply auth to all document routes
router.use(requireAuth);
/** Safely extract a route param as string */
function param(req, name) {
    const val = req.params[name];
    return Array.isArray(val) ? val[0] : val;
}
function wrap(handler) {
    return async (req, res, next) => {
        try {
            await handler(req, res);
        }
        catch (err) {
            if (err instanceof service_1.ServiceError) {
                res.status(err.statusCode).json({
                    success: false,
                    error: err.message,
                });
            }
            else {
                next(err);
            }
        }
    };
}
// ──────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────
/**
 * GET /documents
 * List the authenticated user's documents.
 * Query params: status, type, limit, offset
 */
router.get("/", wrap(async (req, res) => {
    const parsed = dtos_1.ListDocumentsQuery.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: "Invalid query", details: parsed.error.issues });
        return;
    }
    const result = await service.listUserDocuments(req.uid, parsed.data);
    res.json({ success: true, data: result });
}));
/**
 * GET /documents/pending-review
 * List documents pending imam/admin review.
 * Requires admin role.
 */
router.get("/pending-review", requireAdminRole, wrap(async (_req, res) => {
    const docs = await service.listPendingReview();
    res.json({ success: true, data: { documents: docs } });
}));
/**
 * GET /documents/:id
 * Get a document with its full audit trail.
 */
router.get("/:id", wrap(async (req, res) => {
    const result = await service.getDocumentWithAudit(param(req, "id"));
    res.json({ success: true, data: result });
}));
/**
 * POST /documents
 * Create a new document from a template.
 */
router.post("/", wrap(async (req, res) => {
    const parsed = dtos_1.CreateDocumentDto.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues });
        return;
    }
    const doc = await service.createDocument(parsed.data, req.uid, req.userName, req.userEmail);
    res.status(201).json({ success: true, data: { document: doc } });
}));
/**
 * PATCH /documents/:id
 * Update a draft document's data or title.
 */
router.patch("/:id", wrap(async (req, res) => {
    const parsed = dtos_1.UpdateDocumentDto.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues });
        return;
    }
    const doc = await service.updateDocument(param(req, "id"), parsed.data, req.uid, req.userName);
    res.json({ success: true, data: { document: doc } });
}));
/**
 * POST /documents/:id/participants
 * Add a participant to a draft document.
 */
router.post("/:id/participants", wrap(async (req, res) => {
    const parsed = dtos_1.AddParticipantDto.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues });
        return;
    }
    const participant = await service.addParticipant(param(req, "id"), parsed.data, req.uid, req.userName);
    res.status(201).json({ success: true, data: { participant } });
}));
/**
 * DELETE /documents/:id/participants/:participantId
 * Remove a participant from a draft document.
 */
router.delete("/:id/participants/:participantId", wrap(async (req, res) => {
    await service.removeParticipant(param(req, "id"), param(req, "participantId"), req.uid, req.userName);
    res.json({ success: true });
}));
/**
 * POST /documents/:id/submit-for-review
 * Submit a draft document for imam/admin review.
 */
router.post("/:id/submit-for-review", wrap(async (req, res) => {
    const { reviewerUid, reviewerName } = req.body || {};
    const reviewer = reviewerUid && reviewerName
        ? { uid: reviewerUid, name: reviewerName }
        : undefined;
    await service.submitForReview(param(req, "id"), req.uid, req.userName, reviewer);
    res.json({ success: true });
}));
/**
 * POST /documents/:id/review
 * Imam/admin reviews a document (approve or reject).
 * Requires admin role.
 */
router.post("/:id/review", requireAdminRole, wrap(async (req, res) => {
    const parsed = dtos_1.ReviewDocumentDto.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues });
        return;
    }
    await service.reviewDocument(param(req, "id"), parsed.data, req.uid, req.userName);
    res.json({ success: true });
}));
/**
 * POST /documents/:id/assign-reviewer
 * Assign a specific imam/admin to review a document.
 * Requires admin role.
 */
router.post("/:id/assign-reviewer", requireAdminRole, wrap(async (req, res) => {
    const { reviewerUid, reviewerName } = req.body;
    if (!reviewerUid || !reviewerName) {
        res.status(400).json({ success: false, error: "reviewerUid and reviewerName are required" });
        return;
    }
    await service.assignReviewer(param(req, "id"), reviewerUid, reviewerName, req.uid, req.userName);
    res.json({ success: true });
}));
/**
 * POST /documents/:id/send-for-signatures
 * Send a document to all participants for signing.
 */
router.post("/:id/send-for-signatures", wrap(async (req, res) => {
    const sigRequest = await service.sendForSignatures(param(req, "id"), req.uid, req.userName);
    res.json({ success: true, data: { signatureRequest: sigRequest } });
}));
/**
 * POST /documents/:id/sign
 * Submit a signature for a participant.
 */
router.post("/:id/sign", wrap(async (req, res) => {
    const parsed = dtos_1.SignDocumentDto.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues });
        return;
    }
    await service.signDocument(param(req, "id"), parsed.data, req.uid, req.userName);
    res.json({ success: true });
}));
/**
 * POST /documents/:id/decline
 * Decline to sign a document.
 */
router.post("/:id/decline", wrap(async (req, res) => {
    const parsed = dtos_1.DeclineDocumentDto.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues });
        return;
    }
    await service.declineDocument(param(req, "id"), parsed.data, req.uid, req.userName);
    res.json({ success: true });
}));
/**
 * POST /documents/:id/archive
 * Archive (soft-delete) a document.
 */
router.post("/:id/archive", wrap(async (req, res) => {
    await service.archiveDocument(param(req, "id"), req.uid, req.userName);
    res.json({ success: true });
}));
/**
 * GET /documents/:id/audit
 * Get the audit trail for a document.
 */
router.get("/:id/audit", wrap(async (req, res) => {
    const entries = await service.getAuditTrail(param(req, "id"));
    res.json({ success: true, data: { audit: entries } });
}));
/**
 * POST /documents/webhooks/signature
 * Handle webhooks from external signature providers.
 * No auth required — provider authenticates via webhook secret.
 */
router.post("/webhooks/signature", async (req, res) => {
    try {
        await service.handleSignatureWebhook(req.headers, req.body);
        res.json({ received: true });
    }
    catch (err) {
        console.error("Webhook error:", err);
        res.status(500).json({ received: false });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map