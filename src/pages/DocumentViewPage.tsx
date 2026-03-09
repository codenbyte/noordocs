/**
 * DocumentViewPage — Detail view for a NoorSpace document.
 *
 * Shows:
 * - Summary card with status, type, dates, creator, reviewer
 * - Review info card (who reviewed, decision, notes)
 * - Contextual action buttons based on status
 * - Edit draft link for drafts/rejected/needs_changes
 * - "Send for Signatures" for reviewed docs
 * - Document preview
 * - Participant/signer statuses with progress
 * - Audit timeline
 * - Signature canvas (inline)
 * - Admin review dialog (approve / reject / request changes)
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  LinearProgress,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Send,
  Draw,
  RateReview,
  Edit,
  Gavel,
  Description,
  CalendarToday,
  Person,
  People,
  EditNote,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useDocument, useAuditTrail } from "@/hooks/useDocuments";
import {
  submitForReview,
  approveDocument,
  rejectDocument,
  requestChanges,
  submitSignature,
  declineSignature,
  sendForSignatures,
  assignReviewer,
} from "@/services/documents";
import { notifyDocumentReviewComplete, notifyDocumentReviewRequest } from "@/services/notifications";
import ReviewerPicker from "@/components/documents/ReviewerPicker";
import type { AdminUser } from "@/hooks/useAdminUsers";
import DocumentStatusChip from "@/components/documents/DocumentStatusChip";
import DocumentPreview from "@/components/documents/DocumentPreview";
import AuditTimeline from "@/components/documents/AuditTimeline";
import SignatureCanvas from "@/components/documents/SignatureCanvas";
import type { DocumentSigner, DocumentType } from "@/types";
import { DOCUMENT_TYPE_LABELS } from "@/types";

// ── Helpers ──────────────────────────────────────────

const TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  nikah_contract: <Gavel sx={{ fontSize: 20 }} />,
  islamic_will: <Description sx={{ fontSize: 20 }} />,
};

const SIGNER_STATUS_COLORS: Record<string, string> = {
  pending: "#ED6C02",
  signed: "#2E7D32",
  declined: "#D32F2F",
};

function formatDate(ts: any): string {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(ts: any): string {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Summary info row ─────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.75 }}>
      <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, display: "block" }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 13 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

// ── Signer row ───────────────────────────────────────

function SignerRow({ signer }: { signer: DocumentSigner }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: 13,
          bgcolor: SIGNER_STATUS_COLORS[signer.status] + "22",
          color: SIGNER_STATUS_COLORS[signer.status],
        }}
      >
        {signer.status === "signed" ? <CheckCircle sx={{ fontSize: 18 }} /> : signer.name?.[0] || "?"}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
          {signer.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {signer.role} {signer.email && `· ${signer.email}`}
        </Typography>
      </Box>
      <Chip
        label={signer.status === "signed" ? "Signed" : signer.status === "declined" ? "Declined" : "Pending"}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: 11,
          bgcolor: SIGNER_STATUS_COLORS[signer.status] + "18",
          color: SIGNER_STATUS_COLORS[signer.status],
        }}
      />
    </Box>
  );
}

// ── Review dialog mode type ─────────────────────────

type ReviewMode = "approve" | "reject" | "changes" | null;

const REVIEW_DIALOG_CONFIG: Record<string, { title: string; label: string; color: "success" | "error" | "warning"; buttonLabel: string; requireNote: boolean }> = {
  approve: { title: "Approve Document", label: "Note (optional)", color: "success", buttonLabel: "Approve", requireNote: false },
  reject: { title: "Reject Document", label: "Reason for rejection *", color: "error", buttonLabel: "Reject", requireNote: true },
  changes: { title: "Request Changes", label: "What changes are needed? *", color: "warning", buttonLabel: "Request Changes", requireNote: true },
};

// ── Main component ───────────────────────────────────

export default function DocumentViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const { document: noorDoc, loading } = useDocument(id);
  const { entries: auditEntries } = useAuditTrail(id);

  const [showSignature, setShowSignature] = useState(false);
  const [signingAs, setSigningAs] = useState<DocumentSigner | null>(null);
  const [signing, setSigning] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<ReviewMode>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [assigningReviewer, setAssigningReviewer] = useState(false);

  // ── Loading state ──────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", py: 4, px: { xs: 2, md: 3 } }}>
        <Skeleton variant="rounded" height={40} width={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: "16px", mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: "16px" }} />
      </Box>
    );
  }

  // ── Not found state ────────────────────────────────

  if (!noorDoc) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", py: 4, px: { xs: 2, md: 3 }, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Document not found</Typography>
        <Button onClick={() => navigate("/documents")} sx={{ mt: 2 }}>Back to Documents</Button>
      </Box>
    );
  }

  const isOwner = user?.uid === noorDoc.createdBy;
  const displayName = profile?.displayName || user?.displayName || "User";
  const isDraft = noorDoc.status === "draft";
  const isRejected = noorDoc.status === "rejected";
  const isNeedsChanges = noorDoc.status === "needs_changes";
  const isReviewed = noorDoc.status === "reviewed";
  const canEdit = isDraft || isRejected || isNeedsChanges;

  // Review info — from the `review` object or legacy flat fields
  const review = noorDoc.review;
  const reviewerName = review?.reviewerName || noorDoc.reviewerName;
  const reviewNote_ = review?.note || noorDoc.reviewNote || noorDoc.rejectionReason;

  // Signer progress
  const signedCount = noorDoc.signers.filter((s) => s.status === "signed").length;
  const totalSigners = noorDoc.signers.length;
  const hasSigners = totalSigners > 0;
  const showSignerProgress = hasSigners && ["pending_signatures", "partially_signed"].includes(noorDoc.status);

  // Edit URL for drafts
  const editUrl = noorDoc.type === "nikah_contract"
    ? `/documents/nikah/${noorDoc.id}`
    : noorDoc.type === "islamic_will"
      ? `/documents/will/${noorDoc.id}`
      : null;

  // Find if current user is a signer
  const mySignerEntry = noorDoc.signers.find(
    (s) => s.email === user?.email || s.uid === user?.uid,
  );
  const canSign = noorDoc.status === "pending_signatures" && mySignerEntry?.status === "pending";

  // ── Action handlers ────────────────────────────────

  const handleSubmitForReview = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    try { await submitForReview(id, user.uid, displayName); }
    catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const handleSendForSignatures = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    try { await sendForSignatures(id, user.uid, displayName); }
    catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const handleReviewAction = async () => {
    if (!id || !user || !reviewDialog || !noorDoc) return;
    const config = REVIEW_DIALOG_CONFIG[reviewDialog];
    if (config.requireNote && !reviewNote.trim()) return;

    setActionLoading(true);
    try {
      const decisionMap = { approve: "approved", reject: "rejected", changes: "changes_requested" } as const;

      if (reviewDialog === "approve") {
        await approveDocument(id, user.uid, displayName, reviewNote);
      } else if (reviewDialog === "reject") {
        await rejectDocument(id, user.uid, displayName, reviewNote.trim());
      } else if (reviewDialog === "changes") {
        await requestChanges(id, user.uid, displayName, reviewNote.trim());
      }

      // Send in-app notification to the document creator
      notifyDocumentReviewComplete(
        noorDoc.createdBy,
        user.uid,
        displayName,
        id,
        noorDoc.title,
        noorDoc.type,
        decisionMap[reviewDialog],
        reviewNote || undefined,
      ).catch((err) => console.error("Failed to send review notification:", err));

      setReviewDialog(null);
      setReviewNote("");
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const handleSign = async (signatureData: string) => {
    if (!id || !user || !signingAs) return;
    setSigning(true);
    try {
      await submitSignature(id, signingAs.email, displayName, user.uid, signatureData, noorDoc.signers);
      setShowSignature(false);
      setSigningAs(null);
    } catch (err) { console.error(err); }
    setSigning(false);
  };

  const handleDecline = async () => {
    if (!id || !user || !mySignerEntry) return;
    setActionLoading(true);
    try {
      await declineSignature(id, mySignerEntry.email, displayName, user.uid, noorDoc.signers);
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const handleAssignReviewer = async (admin: AdminUser | null) => {
    if (!id || !user || !admin || !noorDoc) return;
    setAssigningReviewer(true);
    try {
      await assignReviewer(id, admin.uid, admin.displayName, user.uid, displayName);

      notifyDocumentReviewRequest(
        admin.uid,
        user.uid,
        displayName,
        id,
        noorDoc.title,
        noorDoc.type,
      ).catch((err) => console.error("Failed to send assign notification:", err));
    } catch (err) { console.error(err); }
    setAssigningReviewer(false);
  };

  // ── Render ─────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate("/documents")} size="small">
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h6" fontWeight={700}>
              {noorDoc.title}
            </Typography>
            <DocumentStatusChip status={noorDoc.status} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Created by {noorDoc.createdByName}
          </Typography>
        </Box>
      </Box>

      {/* ── Summary Card ── */}
      <Card sx={{ borderRadius: "16px", mb: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <InfoRow
                icon={TYPE_ICONS[noorDoc.type]}
                label="Document Type"
                value={DOCUMENT_TYPE_LABELS[noorDoc.type]}
              />
              <InfoRow
                icon={<CalendarToday sx={{ fontSize: 18 }} />}
                label="Created"
                value={formatDate(noorDoc.createdAt)}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <InfoRow
                icon={<Person sx={{ fontSize: 18 }} />}
                label="Creator"
                value={noorDoc.createdByName}
              />
              {hasSigners && (
                <InfoRow
                  icon={<People sx={{ fontSize: 18 }} />}
                  label="Participants"
                  value={`${signedCount} of ${totalSigners} signed`}
                />
              )}
            </Grid2>
          </Grid2>

          {/* Signature progress bar */}
          {showSignerProgress && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Signature Progress</Typography>
                <Typography variant="caption" fontWeight={600}>{signedCount}/{totalSigners}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0}
                sx={{ borderRadius: 1, height: 6 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Review Info Card ── */}
      {reviewerName && (isReviewed || isRejected || isNeedsChanges) && (
        <Alert
          severity={isReviewed ? "success" : isNeedsChanges ? "warning" : "error"}
          sx={{ mb: 3, borderRadius: "12px" }}
          icon={isReviewed ? <CheckCircle /> : isNeedsChanges ? <EditNote /> : <Cancel />}
        >
          <Typography variant="body2" fontWeight={600}>
            {isReviewed
              ? "Approved by " + reviewerName
              : isNeedsChanges
                ? "Changes requested by " + reviewerName
                : "Rejected by " + reviewerName}
          </Typography>
          {reviewNote_ && (
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
              {reviewNote_}
            </Typography>
          )}
          {review?.reviewedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {formatDateTime(review.reviewedAt)}
            </Typography>
          )}
        </Alert>
      )}

      {/* ── Owner Action Buttons ── */}
      {isOwner && canEdit && (
        <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
          {editUrl && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(editUrl)}
              sx={{ borderRadius: "12px" }}
            >
              {isRejected ? "Edit & Resubmit" : isNeedsChanges ? "Make Changes" : "Continue Editing"}
            </Button>
          )}
          {(isDraft || isNeedsChanges) && (
            <Button
              variant="outlined"
              startIcon={<RateReview />}
              onClick={handleSubmitForReview}
              disabled={actionLoading}
              sx={{ borderRadius: "12px" }}
            >
              {isNeedsChanges ? "Resubmit for Review" : "Submit for Imam Review"}
            </Button>
          )}
          {isDraft && (
            <Button
              variant="outlined"
              startIcon={<Send />}
              onClick={handleSendForSignatures}
              disabled={actionLoading}
              sx={{ borderRadius: "12px" }}
            >
              Send for Signatures
            </Button>
          )}
        </Box>
      )}

      {/* ── Reviewed → Send for Signatures ── */}
      {isOwner && isReviewed && (
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleSendForSignatures}
            disabled={actionLoading}
            sx={{ borderRadius: "12px" }}
          >
            Send for Signatures
          </Button>
        </Box>
      )}

      {/* ── Assigned reviewer info ── */}
      {noorDoc.status === "pending_review" && noorDoc.assignedReviewerName && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }} icon={<RateReview />}>
          <Typography variant="body2" fontWeight={600}>
            Assigned to {noorDoc.assignedReviewerName}
          </Typography>
        </Alert>
      )}

      {/* ── Admin: assign reviewer if unassigned ── */}
      {isAdmin && noorDoc.status === "pending_review" && !noorDoc.assignedReviewerUid && (
        <Card sx={{ borderRadius: "16px", mb: 3, border: "1px solid", borderColor: "warning.200", bgcolor: "warning.50" }} elevation={0}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              This document hasn't been assigned to a reviewer yet.
            </Typography>
            <ReviewerPicker
              selectedUid=""
              onChange={(admin) => handleAssignReviewer(admin)}
            />
            {assigningReviewer && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
          </CardContent>
        </Card>
      )}

      {/* ── Admin review actions ── */}
      {isAdmin && noorDoc.status === "pending_review" && !isOwner && (
        <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => setReviewDialog("approve")}
            sx={{ borderRadius: "12px" }}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<EditNote />}
            onClick={() => setReviewDialog("changes")}
            sx={{ borderRadius: "12px" }}
          >
            Request Changes
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => setReviewDialog("reject")}
            sx={{ borderRadius: "12px" }}
          >
            Reject
          </Button>
        </Box>
      )}

      {/* ── Signing actions ── */}
      {canSign && !showSignature && (
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Draw />}
            onClick={() => {
              setSigningAs(mySignerEntry!);
              setShowSignature(true);
            }}
            sx={{ borderRadius: "12px" }}
          >
            Sign as {mySignerEntry!.role}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDecline}
            disabled={actionLoading}
            sx={{ borderRadius: "12px" }}
          >
            Decline
          </Button>
        </Box>
      )}

      {/* ── Signature Canvas ── */}
      {showSignature && (
        <Card sx={{ borderRadius: "16px", mb: 3 }}>
          <CardContent>
            <SignatureCanvas
              onSave={handleSign}
              onCancel={() => {
                setShowSignature(false);
                setSigningAs(null);
              }}
              saving={signing}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Document Content ── */}
      <Card sx={{ borderRadius: "16px", mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <DocumentPreview document={noorDoc} />
        </CardContent>
      </Card>

      {/* ── Participants ── */}
      {hasSigners && (
        <Card sx={{ borderRadius: "16px", mb: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Participants
              </Typography>
              <Chip
                label={`${signedCount}/${totalSigners} signed`}
                size="small"
                color={signedCount === totalSigners ? "success" : "default"}
                sx={{ fontSize: 11, fontWeight: 600 }}
              />
            </Box>
            <Divider sx={{ mb: 1 }} />
            {noorDoc.signers.map((signer, i) => (
              <SignerRow key={i} signer={signer} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Audit Trail ── */}
      {auditEntries.length > 0 && (
        <Card sx={{ borderRadius: "16px", border: "1px solid", borderColor: "divider" }} elevation={0}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <AuditTimeline entries={auditEntries} />
          </CardContent>
        </Card>
      )}

      {/* ── Review Dialog ── */}
      <Dialog
        open={reviewDialog !== null}
        onClose={() => setReviewDialog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        {reviewDialog && (
          <>
            <DialogTitle fontWeight={700}>
              {REVIEW_DIALOG_CONFIG[reviewDialog].title}
            </DialogTitle>
            <DialogContent>
              {reviewDialog === "changes" && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Let the creator know what needs to be updated. They will be able to make changes and resubmit for your review.
                </Typography>
              )}
              <TextField
                fullWidth
                multiline
                rows={3}
                label={REVIEW_DIALOG_CONFIG[reviewDialog].label}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => { setReviewDialog(null); setReviewNote(""); }}>Cancel</Button>
              <Button
                variant="contained"
                color={REVIEW_DIALOG_CONFIG[reviewDialog].color}
                onClick={handleReviewAction}
                disabled={actionLoading || (REVIEW_DIALOG_CONFIG[reviewDialog].requireNote && !reviewNote.trim())}
                sx={{ borderRadius: "12px" }}
              >
                {actionLoading ? "Saving..." : REVIEW_DIALOG_CONFIG[reviewDialog].buttonLabel}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
