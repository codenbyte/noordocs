import { Box, Typography } from "@mui/material";
import {
  Create,
  Edit,
  RateReview,
  CheckCircle,
  Cancel,
  Draw,
  Send,
  TaskAlt,
  EditNote,
  PersonAdd,
} from "@mui/icons-material";
import type { AuditEntry, AuditAction } from "@/types";

const ACTION_CONFIG: Record<AuditAction, { icon: React.ReactNode; label: string; color: string }> = {
  created: { icon: <Create sx={{ fontSize: 18 }} />, label: "Document created", color: "#1976D2" },
  updated: { icon: <Edit sx={{ fontSize: 18 }} />, label: "Document updated", color: "#757575" },
  submitted_for_review: { icon: <RateReview sx={{ fontSize: 18 }} />, label: "Submitted for review", color: "#ED6C02" },
  approved: { icon: <CheckCircle sx={{ fontSize: 18 }} />, label: "Approved", color: "#2E7D32" },
  rejected: { icon: <Cancel sx={{ fontSize: 18 }} />, label: "Rejected", color: "#D32F2F" },
  changes_requested: { icon: <EditNote sx={{ fontSize: 18 }} />, label: "Changes requested", color: "#ED6C02" },
  reviewer_assigned: { icon: <PersonAdd sx={{ fontSize: 18 }} />, label: "Reviewer assigned", color: "#1976D2" },
  sent_for_signatures: { icon: <Send sx={{ fontSize: 18 }} />, label: "Sent for signatures", color: "#1976D2" },
  signed: { icon: <Draw sx={{ fontSize: 18 }} />, label: "Signed", color: "#2E7D32" },
  declined: { icon: <Cancel sx={{ fontSize: 18 }} />, label: "Signature declined", color: "#D32F2F" },
  completed: { icon: <TaskAlt sx={{ fontSize: 18 }} />, label: "Completed", color: "#2E7D32" },
};

function formatDate(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  entries: AuditEntry[];
}

export default function AuditTimeline({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
        Activity
      </Typography>
      {entries.map((entry, i) => {
        const config = ACTION_CONFIG[entry.action];
        return (
          <Box key={entry.id} sx={{ display: "flex", gap: 1.5, mb: i < entries.length - 1 ? 0 : 0 }}>
            {/* Timeline line + dot */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  bgcolor: config.color + "18",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: config.color,
                  flexShrink: 0,
                }}
              >
                {config.icon}
              </Box>
              {i < entries.length - 1 && (
                <Box sx={{ width: 2, flex: 1, bgcolor: "divider", my: 0.5 }} />
              )}
            </Box>

            {/* Content */}
            <Box sx={{ pb: i < entries.length - 1 ? 2 : 0, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                {config.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {entry.actorName} &middot; {formatDate(entry.createdAt)}
              </Typography>
              {entry.details && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25, fontStyle: "italic" }}>
                  {entry.details}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
