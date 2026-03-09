import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  NoorDocument,
  DocumentType,
  DocumentSigner,
  AuditAction,
} from "@/types";
import { notifyDocumentReviewRequest, notifyDocumentReviewComplete } from "./notifications";

// ---- Audit Trail ----

export async function addAuditEntry(
  documentId: string,
  action: AuditAction,
  actorUid: string,
  actorName: string,
  details?: string,
) {
  await addDoc(collection(db, "documents", documentId, "audit"), {
    action,
    actorUid,
    actorName,
    details: details || null,
    createdAt: serverTimestamp(),
  });
}

// ---- Document CRUD ----

export async function createDocument(
  type: DocumentType,
  title: string,
  createdBy: string,
  createdByName: string,
  data: Record<string, any>,
  signers: DocumentSigner[],
): Promise<string> {
  const docRef = await addDoc(collection(db, "documents"), {
    type,
    title,
    status: "draft",
    createdBy,
    createdByName,
    data,
    signers,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addAuditEntry(docRef.id, "created", createdBy, createdByName);
  return docRef.id;
}

export async function updateDocumentData(
  documentId: string,
  data: Record<string, any>,
  actorUid: string,
  actorName: string,
) {
  await updateDoc(doc(db, "documents", documentId), {
    data,
    updatedAt: serverTimestamp(),
  });
  await addAuditEntry(documentId, "updated", actorUid, actorName);
}

export async function updateDocumentSigners(
  documentId: string,
  signers: DocumentSigner[],
) {
  await updateDoc(doc(db, "documents", documentId), {
    signers,
    updatedAt: serverTimestamp(),
  });
}

// ---- Submit for Review ----

export async function submitForReview(
  documentId: string,
  actorUid: string,
  actorName: string,
  reviewer?: { uid: string; name: string },
  meta?: { title: string; type: DocumentType },
) {
  await updateDoc(doc(db, "documents", documentId), {
    status: "pending_review",
    ...(reviewer ? {
      assignedReviewerUid: reviewer.uid,
      assignedReviewerName: reviewer.name,
    } : {}),
    updatedAt: serverTimestamp(),
  });
  await addAuditEntry(documentId, "submitted_for_review", actorUid, actorName);

  if (reviewer) {
    await addAuditEntry(documentId, "reviewer_assigned", actorUid, actorName, `Assigned to ${reviewer.name}`);

    // Send in-app notification to the reviewer
    notifyDocumentReviewRequest(
      reviewer.uid,
      actorUid,
      actorName,
      documentId,
      meta?.title || "Document",
      meta?.type || "nikah_contract",
    ).catch((err) => console.error("Failed to send review notification:", err));
  }
}

// ---- Assign Reviewer ----

export async function assignReviewer(
  documentId: string,
  reviewerUid: string,
  reviewerName: string,
  actorUid: string,
  actorName: string,
) {
  await updateDoc(doc(db, "documents", documentId), {
    assignedReviewerUid: reviewerUid,
    assignedReviewerName: reviewerName,
    updatedAt: serverTimestamp(),
  });
  await addAuditEntry(documentId, "reviewer_assigned", actorUid, actorName, `Assigned to ${reviewerName}`);
}

// ---- Imam/Admin Review ----

export async function approveDocument(
  documentId: string,
  reviewerUid: string,
  reviewerName: string,
  note?: string,
) {
  await updateDoc(doc(db, "documents", documentId), {
    status: "reviewed",
    review: {
      reviewerUid,
      reviewerName,
      decision: "approved",
      note: note || null,
      reviewedAt: serverTimestamp(),
    },
    reviewerUid,
    reviewerName,
    reviewNote: note || null,
    updatedAt: serverTimestamp(),
  });
  await addAuditEntry(documentId, "approved", reviewerUid, reviewerName, note);
}

export async function rejectDocument(
  documentId: string,
  reviewerUid: string,
  reviewerName: string,
  reason: string,
) {
  await updateDoc(doc(db, "documents", documentId), {
    status: "rejected",
    review: {
      reviewerUid,
      reviewerName,
      decision: "rejected",
      note: reason,
      reviewedAt: serverTimestamp(),
    },
    reviewerUid,
    reviewerName,
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });
  await addAuditEntry(documentId, "rejected", reviewerUid, reviewerName, reason);
}

export async function requestChanges(
  documentId: string,
  reviewerUid: string,
  reviewerName: string,
  feedback: string,
) {
  await updateDoc(doc(db, "documents", documentId), {
    status: "needs_changes",
    review: {
      reviewerUid,
      reviewerName,
      decision: "changes_requested",
      note: feedback,
      reviewedAt: serverTimestamp(),
    },
    reviewerUid,
    reviewerName,
    reviewNote: feedback,
    updatedAt: serverTimestamp(),
  });
  await addAuditEntry(documentId, "changes_requested", reviewerUid, reviewerName, feedback);
}

// ---- Signing ----

export async function submitSignature(
  documentId: string,
  signerEmail: string,
  signerName: string,
  signerUid: string,
  signatureData: string,
  currentSigners: DocumentSigner[],
) {
  const updatedSigners = currentSigners.map((s) =>
    s.email === signerEmail
      ? { ...s, status: "signed" as const, signedAt: new Date(), signatureData, uid: signerUid || s.uid }
      : s,
  );

  const allSigned = updatedSigners.every((s) => s.status === "signed");

  await updateDoc(doc(db, "documents", documentId), {
    signers: updatedSigners,
    ...(allSigned ? { status: "completed", completedAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  });

  await addAuditEntry(documentId, "signed", signerUid, signerName, `Signed as ${signerEmail}`);

  if (allSigned) {
    await addAuditEntry(documentId, "completed", signerUid, signerName, "All parties have signed");
  }
}

export async function declineSignature(
  documentId: string,
  signerEmail: string,
  signerName: string,
  signerUid: string,
  currentSigners: DocumentSigner[],
) {
  const updatedSigners = currentSigners.map((s) =>
    s.email === signerEmail
      ? { ...s, status: "declined" as const }
      : s,
  );

  await updateDoc(doc(db, "documents", documentId), {
    signers: updatedSigners,
    updatedAt: serverTimestamp(),
  });

  await addAuditEntry(documentId, "declined", signerUid, signerName, `Declined as ${signerEmail}`);
}

// ---- Send for Signatures (transition from draft/approved to pending_signatures) ----

export async function sendForSignatures(
  documentId: string,
  actorUid: string,
  actorName: string,
) {
  await updateDoc(doc(db, "documents", documentId), {
    status: "pending_signatures",
    updatedAt: serverTimestamp(),
  });
  await addAuditEntry(documentId, "sent_for_signatures", actorUid, actorName);
}

// ---- Fetch audit trail ----

export async function getAuditTrail(documentId: string) {
  const snap = await getDocs(
    query(
      collection(db, "documents", documentId, "audit"),
      orderBy("createdAt", "asc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---- Fetch documents pending review (for admins) ----

export async function getDocumentsPendingReview() {
  const snap = await getDocs(
    query(
      collection(db, "documents"),
      where("status", "==", "pending_review"),
      orderBy("createdAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoorDocument));
}
