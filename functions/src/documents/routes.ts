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

import { Router, Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  AddParticipantDto,
  ReviewDocumentDto,
  SignDocumentDto,
  DeclineDocumentDto,
  ListDocumentsQuery,
} from "./dtos";
import type { ApiResponse } from "./dtos";
import * as service from "./service";
import { ServiceError } from "./service";

const router = Router();

// ──────────────────────────────────────────────────────────
// Auth Middleware
// ──────────────────────────────────────────────────────────

interface AuthRequest extends Request {
  uid: string;
  userEmail: string;
  userName: string;
  isAdmin: boolean;
}

/**
 * Verify Firebase ID token from Authorization header.
 * Populates req.uid, req.userEmail, req.userName, req.isAdmin.
 */
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing authorization token" } as ApiResponse);
    return;
  }

  try {
    const token = authHeader.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);
    const authReq = req as AuthRequest;
    authReq.uid = decoded.uid;
    authReq.userEmail = decoded.email || "";
    authReq.userName = decoded.name || decoded.email || "User";
    authReq.isAdmin = decoded.admin === true || decoded.superadmin === true;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" } as ApiResponse);
  }
}

/**
 * Require admin role (admin or superadmin custom claim).
 */
function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  if (!authReq.isAdmin) {
    res.status(403).json({ success: false, error: "Admin access required" } as ApiResponse);
    return;
  }
  next();
}

// Apply auth to all document routes
router.use(requireAuth);

// ──────────────────────────────────────────────────────────
// Error Wrapper
// ──────────────────────────────────────────────────────────

type AsyncHandler = (req: AuthRequest, res: Response) => Promise<void>;

/** Safely extract a route param as string */
function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

function wrap(handler: AsyncHandler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as AuthRequest, res);
    } catch (err) {
      if (err instanceof ServiceError) {
        res.status(err.statusCode).json({
          success: false,
          error: err.message,
        } as ApiResponse);
      } else {
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
router.get(
  "/",
  wrap(async (req, res) => {
    const parsed = ListDocumentsQuery.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid query", details: parsed.error.issues } as ApiResponse);
      return;
    }

    const result = await service.listUserDocuments(req.uid, parsed.data);
    res.json({ success: true, data: result } as ApiResponse);
  }),
);

/**
 * GET /documents/pending-review
 * List documents pending imam/admin review.
 * Requires admin role.
 */
router.get(
  "/pending-review",
  requireAdminRole,
  wrap(async (_req, res) => {
    const docs = await service.listPendingReview();
    res.json({ success: true, data: { documents: docs } } as ApiResponse);
  }),
);

/**
 * GET /documents/:id
 * Get a document with its full audit trail.
 */
router.get(
  "/:id",
  wrap(async (req, res) => {
    const result = await service.getDocumentWithAudit(param(req, "id"));
    res.json({ success: true, data: result } as ApiResponse);
  }),
);

/**
 * POST /documents
 * Create a new document from a template.
 */
router.post(
  "/",
  wrap(async (req, res) => {
    const parsed = CreateDocumentDto.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues } as ApiResponse);
      return;
    }

    const doc = await service.createDocument(
      parsed.data,
      req.uid,
      req.userName,
      req.userEmail,
    );

    res.status(201).json({ success: true, data: { document: doc } } as ApiResponse);
  }),
);

/**
 * PATCH /documents/:id
 * Update a draft document's data or title.
 */
router.patch(
  "/:id",
  wrap(async (req, res) => {
    const parsed = UpdateDocumentDto.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues } as ApiResponse);
      return;
    }

    const doc = await service.updateDocument(
      param(req, "id"),
      parsed.data,
      req.uid,
      req.userName,
    );

    res.json({ success: true, data: { document: doc } } as ApiResponse);
  }),
);

/**
 * POST /documents/:id/participants
 * Add a participant to a draft document.
 */
router.post(
  "/:id/participants",
  wrap(async (req, res) => {
    const parsed = AddParticipantDto.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues } as ApiResponse);
      return;
    }

    const participant = await service.addParticipant(
      param(req, "id"),
      parsed.data,
      req.uid,
      req.userName,
    );

    res.status(201).json({ success: true, data: { participant } } as ApiResponse);
  }),
);

/**
 * DELETE /documents/:id/participants/:participantId
 * Remove a participant from a draft document.
 */
router.delete(
  "/:id/participants/:participantId",
  wrap(async (req, res) => {
    await service.removeParticipant(
      param(req, "id"),
      param(req, "participantId"),
      req.uid,
      req.userName,
    );

    res.json({ success: true } as ApiResponse);
  }),
);

/**
 * POST /documents/:id/submit-for-review
 * Submit a draft document for imam/admin review.
 */
router.post(
  "/:id/submit-for-review",
  wrap(async (req, res) => {
    const { reviewerUid, reviewerName } = req.body || {};
    const reviewer = reviewerUid && reviewerName
      ? { uid: reviewerUid, name: reviewerName }
      : undefined;

    await service.submitForReview(param(req, "id"), req.uid, req.userName, reviewer);
    res.json({ success: true } as ApiResponse);
  }),
);

/**
 * POST /documents/:id/review
 * Imam/admin reviews a document (approve or reject).
 * Requires admin role.
 */
router.post(
  "/:id/review",
  requireAdminRole,
  wrap(async (req, res) => {
    const parsed = ReviewDocumentDto.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues } as ApiResponse);
      return;
    }

    await service.reviewDocument(
      param(req, "id"),
      parsed.data,
      req.uid,
      req.userName,
    );

    res.json({ success: true } as ApiResponse);
  }),
);

/**
 * POST /documents/:id/assign-reviewer
 * Assign a specific imam/admin to review a document.
 * Requires admin role.
 */
router.post(
  "/:id/assign-reviewer",
  requireAdminRole,
  wrap(async (req, res) => {
    const { reviewerUid, reviewerName } = req.body;
    if (!reviewerUid || !reviewerName) {
      res.status(400).json({ success: false, error: "reviewerUid and reviewerName are required" } as ApiResponse);
      return;
    }

    await service.assignReviewer(
      param(req, "id"),
      reviewerUid,
      reviewerName,
      req.uid,
      req.userName,
    );

    res.json({ success: true } as ApiResponse);
  }),
);

/**
 * POST /documents/:id/send-for-signatures
 * Send a document to all participants for signing.
 */
router.post(
  "/:id/send-for-signatures",
  wrap(async (req, res) => {
    const sigRequest = await service.sendForSignatures(
      param(req, "id"),
      req.uid,
      req.userName,
    );

    res.json({ success: true, data: { signatureRequest: sigRequest } } as ApiResponse);
  }),
);

/**
 * POST /documents/:id/sign
 * Submit a signature for a participant.
 */
router.post(
  "/:id/sign",
  wrap(async (req, res) => {
    const parsed = SignDocumentDto.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues } as ApiResponse);
      return;
    }

    await service.signDocument(
      param(req, "id"),
      parsed.data,
      req.uid,
      req.userName,
    );

    res.json({ success: true } as ApiResponse);
  }),
);

/**
 * POST /documents/:id/decline
 * Decline to sign a document.
 */
router.post(
  "/:id/decline",
  wrap(async (req, res) => {
    const parsed = DeclineDocumentDto.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.issues } as ApiResponse);
      return;
    }

    await service.declineDocument(
      param(req, "id"),
      parsed.data,
      req.uid,
      req.userName,
    );

    res.json({ success: true } as ApiResponse);
  }),
);

/**
 * POST /documents/:id/archive
 * Archive (soft-delete) a document.
 */
router.post(
  "/:id/archive",
  wrap(async (req, res) => {
    await service.archiveDocument(param(req, "id"), req.uid, req.userName);
    res.json({ success: true } as ApiResponse);
  }),
);

/**
 * GET /documents/:id/audit
 * Get the audit trail for a document.
 */
router.get(
  "/:id/audit",
  wrap(async (req, res) => {
    const entries = await service.getAuditTrail(param(req, "id"));
    res.json({ success: true, data: { audit: entries } } as ApiResponse);
  }),
);

/**
 * POST /documents/webhooks/signature
 * Handle webhooks from external signature providers.
 * No auth required — provider authenticates via webhook secret.
 */
router.post("/webhooks/signature", async (req: Request, res: Response) => {
  try {
    await service.handleSignatureWebhook(
      req.headers as Record<string, string>,
      req.body,
    );
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ received: false });
  }
});

export default router;
