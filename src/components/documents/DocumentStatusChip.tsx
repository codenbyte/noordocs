import { Chip } from "@mui/material";
import type { DocumentStatus } from "@/types";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS } from "@/types";

interface Props {
  status: DocumentStatus;
  size?: "small" | "medium";
}

export default function DocumentStatusChip({ status, size = "small" }: Props) {
  return (
    <Chip
      label={DOCUMENT_STATUS_LABELS[status]}
      color={DOCUMENT_STATUS_COLORS[status]}
      size={size}
      sx={{ fontWeight: 600, fontSize: size === "small" ? 11 : 13 }}
    />
  );
}
