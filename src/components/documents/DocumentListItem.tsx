/**
 * DocumentListItem — Enhanced document card for the dashboard list.
 * Shows title, type, dates, status, participant summary, progress, and contextual CTA.
 */

import { Box, Card, CardContent, Typography, Button, Avatar, LinearProgress, Chip } from "@mui/material";
import {
  Description,
  Gavel,
  Edit,
  Send,
  Draw,
  Visibility,
  RateReview,
  People,
} from "@mui/icons-material";
import DocumentStatusChip from "./DocumentStatusChip";
import type { NoorDocument, DocumentType } from "@/types";
import { DOCUMENT_TYPE_LABELS } from "@/types";

// ── Helpers ──────────────────────────────────────────

const TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  nikah_contract: <Gavel sx={{ fontSize: 20 }} />,
  islamic_will: <Description sx={{ fontSize: 20 }} />,
};

function formatDate(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(ts);
}

function getSignatureProgress(doc: NoorDocument): { signed: number; total: number } {
  if (!doc.signers || doc.signers.length === 0) return { signed: 0, total: 0 };
  const signed = doc.signers.filter((s) => s.status === "signed").length;
  return { signed, total: doc.signers.length };
}

function getCta(doc: NoorDocument): { label: string; icon: React.ReactNode } {
  switch (doc.status) {
    case "draft":
      return { label: "Continue Editing", icon: <Edit sx={{ fontSize: 16 }} /> };
    case "pending_review":
      return { label: "View", icon: <Visibility sx={{ fontSize: 16 }} /> };
    case "reviewed":
      return { label: "Send for Signing", icon: <Send sx={{ fontSize: 16 }} /> };
    case "pending_signatures":
    case "partially_signed":
      return { label: "Sign / View", icon: <Draw sx={{ fontSize: 16 }} /> };
    case "completed":
      return { label: "View Document", icon: <Visibility sx={{ fontSize: 16 }} /> };
    case "rejected":
      return { label: "Edit & Resubmit", icon: <Edit sx={{ fontSize: 16 }} /> };
    case "needs_changes":
      return { label: "Make Changes", icon: <Edit sx={{ fontSize: 16 }} /> };
    case "archived":
      return { label: "View", icon: <Visibility sx={{ fontSize: 16 }} /> };
    default:
      return { label: "View", icon: <Visibility sx={{ fontSize: 16 }} /> };
  }
}

// ── Component ────────────────────────────────────────

interface Props {
  doc: NoorDocument;
  onClick: () => void;
}

export default function DocumentListItem({ doc, onClick }: Props) {
  const { signed, total } = getSignatureProgress(doc);
  const cta = getCta(doc);
  const hasSigners = total > 0;
  const showProgress = hasSigners && ["pending_signatures", "partially_signed"].includes(doc.status);

  return (
    <Card
      sx={{
        mb: 1.5,
        cursor: "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s",
        "&:hover": { boxShadow: 3, borderColor: "primary.main" },
        borderRadius: "14px",
        border: "1px solid",
        borderColor: "divider",
      }}
      elevation={0}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
        {/* Top row: icon, title, status */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: doc.type === "nikah_contract" ? "primary.50" : "secondary.50",
              color: doc.type === "nikah_contract" ? "primary.main" : "secondary.main",
              flexShrink: 0,
            }}
          >
            {TYPE_ICONS[doc.type]}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body1" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
                {doc.title}
              </Typography>
              <DocumentStatusChip status={doc.status} />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
              {DOCUMENT_TYPE_LABELS[doc.type]}
            </Typography>
          </Box>
        </Box>

        {/* Meta row: dates + participants */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 2 },
            flexWrap: "wrap",
            ml: { xs: 0, sm: 7 },
            mb: showProgress ? 1 : 0,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Created {formatDate(doc.createdAt)}
          </Typography>

          {doc.updatedAt && (
            <Typography variant="caption" color="text.secondary">
              Updated {timeAgo(doc.updatedAt)}
            </Typography>
          )}

          {hasSigners && (
            <Chip
              icon={<People sx={{ fontSize: 14 }} />}
              label={`${signed}/${total} signed`}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: 11, "& .MuiChip-icon": { ml: 0.5 } }}
            />
          )}
        </Box>

        {/* Signature progress bar */}
        {showProgress && (
          <Box sx={{ ml: { xs: 0, sm: 7 }, mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={total > 0 ? (signed / total) * 100 : 0}
              sx={{ borderRadius: 1, height: 4 }}
            />
          </Box>
        )}

        {/* CTA button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
          <Button
            size="small"
            variant={doc.status === "draft" || doc.status === "rejected" || doc.status === "needs_changes" ? "contained" : "outlined"}
            startIcon={cta.icon}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontSize: 12,
              fontWeight: 600,
              px: 2,
            }}
          >
            {cta.label}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Admin review list item variant ───────────────────

export function ReviewDocumentItem({ doc, onClick }: Props) {
  return (
    <Card
      sx={{
        mb: 1.5,
        cursor: "pointer",
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: 3 },
        borderRadius: "14px",
        border: "1px solid",
        borderColor: "warning.200",
        bgcolor: "warning.50",
      }}
      elevation={0}
      onClick={onClick}
    >
      <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 }, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: "warning.100", color: "warning.dark" }}>
          <RateReview sx={{ fontSize: 18 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {doc.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {doc.createdByName} &middot; {DOCUMENT_TYPE_LABELS[doc.type]} &middot; {timeAgo(doc.createdAt)}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="contained"
          color="warning"
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 12, fontWeight: 600 }}
        >
          Review
        </Button>
      </CardContent>
    </Card>
  );
}
