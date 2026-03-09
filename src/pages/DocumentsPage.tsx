/**
 * DocumentsPage — NoorSpace Documents dashboard.
 *
 * Features:
 * - Header with intro copy
 * - Quick action cards for creating documents
 * - Status filter chips (All, Draft, Pending Review, Awaiting Signatures, Completed)
 * - Enhanced document list with progress, participants, contextual CTAs
 * - Admin tab for pending reviews
 * - Empty state with onboarding guidance
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Tabs,
  Tab,
  Chip,
  Button,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import {
  Description,
  Gavel,
  Add,
  FilterList,
  FolderOpen,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useMyDocuments, useDocumentsPendingReview } from "@/hooks/useDocuments";
import DocumentListItem, { ReviewDocumentItem } from "@/components/documents/DocumentListItem";
import type { DocumentType, DocumentStatus, NoorDocument } from "@/types";

// ── Filter definitions ───────────────────────────────

type FilterKey = "all" | "draft" | "pending_review" | "signatures" | "completed";

const FILTERS: { key: FilterKey; label: string; match: (s: DocumentStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "draft", label: "Drafts", match: (s) => s === "draft" || s === "rejected" || s === "needs_changes" },
  { key: "pending_review", label: "Pending Review", match: (s) => s === "pending_review" },
  { key: "signatures", label: "Signatures", match: (s) => ["reviewed", "pending_signatures", "partially_signed"].includes(s) },
  { key: "completed", label: "Completed", match: (s) => s === "completed" },
];

// ── Quick action card ────────────────────────────────

function QuickActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card
      sx={{
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.2s",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
      elevation={0}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
          {icon}
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, fontSize: 13 }}>
          {description}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          sx={{ alignSelf: "flex-start", borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
        >
          Create
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Empty state ──────────────────────────────────────

function EmptyState({ filter }: { filter: FilterKey }) {
  if (filter !== "all") {
    return (
      <Card sx={{ borderRadius: "14px", border: "1px solid", borderColor: "divider" }} elevation={0}>
        <CardContent sx={{ textAlign: "center", py: 5 }}>
          <FilterList sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
            No documents match this filter
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try a different filter or create a new document.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: "16px", border: "1px solid", borderColor: "divider" }} elevation={0}>
      <CardContent sx={{ textAlign: "center", py: 5, px: 3 }}>
        <FolderOpen sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          Your documents will appear here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
          NoorSpace Documents helps you create, review, and sign important Islamic documents
          with care and dignity. Choose a template above to get started.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Box sx={{ textAlign: "center", maxWidth: 160 }}>
            <Gavel sx={{ fontSize: 28, color: "primary.main", mb: 0.5 }} />
            <Typography variant="caption" fontWeight={600} display="block">Nikah Contract</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
              Marriage contract with mahr, witnesses, and imam certification
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", maxWidth: 160 }}>
            <Description sx={{ fontSize: 28, color: "primary.main", mb: 0.5 }} />
            <Typography variant="caption" fontWeight={600} display="block">Islamic Will</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
              Will with beneficiaries, bequests, executor, and witnesses
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────

export default function DocumentsPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { documents, loading } = useMyDocuments();
  const { documents: reviewDocs, loading: reviewLoading } = useDocumentsPendingReview();

  const [tab, setTab] = useState<"my" | "review">("my");
  const [filter, setFilter] = useState<FilterKey>("all");

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleCreate = (type: DocumentType) => {
    if (type === "nikah_contract") navigate("/documents/nikah");
    else if (type === "islamic_will") navigate("/documents/will");
    else navigate(`/documents/new/${type}`);
  };

  const handleDocClick = (doc: NoorDocument) => {
    // Editable docs (drafts, rejected, needs changes) go to the dedicated builder
    if (doc.status === "draft" || doc.status === "rejected" || doc.status === "needs_changes") {
      if (doc.type === "nikah_contract") {
        navigate(`/documents/nikah/${doc.id}`);
      } else if (doc.type === "islamic_will") {
        navigate(`/documents/will/${doc.id}`);
      } else {
        navigate(`/documents/${doc.id}`);
      }
    } else {
      navigate(`/documents/${doc.id}`);
    }
  };

  // Filter documents
  const filteredDocs = useMemo(() => {
    const matchFn = FILTERS.find((f) => f.key === filter)?.match || (() => true);
    return documents.filter((d) => matchFn(d.status));
  }, [documents, filter]);

  // Count per filter for badges
  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = { all: 0, draft: 0, pending_review: 0, signatures: 0, completed: 0 };
    for (const d of documents) {
      counts.all++;
      for (const f of FILTERS) {
        if (f.key !== "all" && f.match(d.status)) counts[f.key]++;
      }
    }
    return counts;
  }, [documents]);

  const showReviewDocs = tab === "review";
  const isLoading = showReviewDocs ? reviewLoading : loading;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          NoorSpace Documents
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Create, review, and sign your important documents with care and dignity.
        </Typography>
      </Box>

      {/* ── Quick Actions ── */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
        <Add sx={{ fontSize: 18 }} />
        New Document
      </Typography>
      <Grid2 container spacing={2} sx={{ mb: 4 }}>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <QuickActionCard
            icon={<Gavel sx={{ fontSize: 24, color: "primary.main" }} />}
            title="Nikah Contract"
            description="Marriage contract with mahr details, witnesses, and imam certification."
            onClick={() => handleCreate("nikah_contract")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <QuickActionCard
            icon={<Description sx={{ fontSize: 24, color: "primary.main" }} />}
            title="Islamic Will"
            description="Prepare a will with beneficiaries, bequests, executor, and witnesses."
            onClick={() => handleCreate("islamic_will")}
          />
        </Grid2>
      </Grid2>

      {/* ── Tabs (admin sees Review tab) ── */}
      {isAdmin ? (
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
        >
          <Tab value="my" label="My Documents" />
          <Tab
            value="review"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                Pending Review
                {reviewDocs.length > 0 && (
                  <Chip label={reviewDocs.length} size="small" color="warning" sx={{ height: 20, fontSize: 11 }} />
                )}
              </Box>
            }
          />
        </Tabs>
      ) : (
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          My Documents
        </Typography>
      )}

      {/* ── Status Filters (My Documents tab only) ── */}
      {!showReviewDocs && documents.length > 0 && (
        <Box sx={{ display: "flex", gap: 0.75, mb: 2, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={`${f.label}${filterCounts[f.key] > 0 && f.key !== "all" ? ` (${filterCounts[f.key]})` : ""}`}
              size="small"
              variant={filter === f.key ? "filled" : "outlined"}
              color={filter === f.key ? "primary" : "default"}
              onClick={() => setFilter(f.key)}
              sx={{ fontWeight: 600, fontSize: 12, cursor: "pointer" }}
            />
          ))}
        </Box>
      )}

      {/* ── Document List ── */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 1.5, borderRadius: "14px" }} />
        ))
      ) : showReviewDocs ? (
        // Review tab
        reviewDocs.length === 0 ? (
          <Card sx={{ borderRadius: "14px", border: "1px solid", borderColor: "divider" }} elevation={0}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Description sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary">No documents pending review.</Typography>
            </CardContent>
          </Card>
        ) : (
          reviewDocs.map((d) => (
            <ReviewDocumentItem key={d.id} doc={d} onClick={() => navigate(`/documents/${d.id}`)} />
          ))
        )
      ) : filteredDocs.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        filteredDocs.map((d) => (
          <DocumentListItem key={d.id} doc={d} onClick={() => handleDocClick(d)} />
        ))
      )}
    </Box>
  );
}
