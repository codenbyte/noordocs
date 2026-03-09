import { Box, Typography, Divider } from "@mui/material";
import type { NoorDocument } from "@/types";
import { TEMPLATE_FIELDS, DOCUMENT_TYPE_LABELS } from "@/types";

function formatValue(value: any, type: string): string {
  if (!value) return "—";
  if (type === "date") {
    try {
      return new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return value;
    }
  }
  return String(value);
}

interface Props {
  document: NoorDocument;
}

export default function DocumentPreview({ document: noorDoc }: Props) {
  const fields = TEMPLATE_FIELDS[noorDoc.type] || [];
  const sections = [...new Set(fields.map((f) => f.section))];

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
        {noorDoc.title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
        {DOCUMENT_TYPE_LABELS[noorDoc.type]}
      </Typography>

      {sections.map((section) => (
        <Box key={section} sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 1 }}>
            {section}
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
          {fields
            .filter((f) => f.section === section)
            .map((field) => (
              <Box key={field.key} sx={{ display: "flex", mb: 0.75, gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, flexShrink: 0, fontSize: 13 }}>
                  {field.label}:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                  {formatValue(noorDoc.data[field.key], field.type)}
                </Typography>
              </Box>
            ))}
        </Box>
      ))}
    </Box>
  );
}
