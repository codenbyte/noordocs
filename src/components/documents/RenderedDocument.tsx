/**
 * RenderedDocument — Universal document preview component
 *
 * Renders a DocumentViewModel as a clean, print-ready document.
 * This single component handles both Nikah contracts and Islamic
 * wills (and any future template types) because it only understands
 * the view model — never raw form data.
 *
 * Design: warm paper background, clean typography, subtle borders.
 * Ready for future PDF generation (html2pdf / puppeteer).
 */

import { Box, Typography, Divider, Chip } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import { CheckCircle, Schedule, Cancel, Warning } from "@mui/icons-material";
import type {
  DocumentViewModel,
  ContentBlock,
  DocField,
  SignatureBlock,
} from "@/types/document-renderer";

// ──────────────────────────────────────────────────────────
// Atomic renderers
// ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontSize: 11, display: "block", mb: 0.1, fontWeight: 500 }}
    >
      {children}
    </Typography>
  );
}

function Value({ children, empty }: { children: React.ReactNode; empty?: boolean }) {
  return (
    <Typography
      variant="body2"
      sx={{
        fontSize: 13,
        mb: 1.25,
        fontStyle: empty ? "italic" : "normal",
        color: empty ? "text.disabled" : "text.primary",
        whiteSpace: "pre-wrap",
      }}
    >
      {children}
    </Typography>
  );
}

function FieldGrid({ fields }: { fields: DocField[] }) {
  return (
    <Grid2 container spacing={0} sx={{ pl: 0.5 }}>
      {fields.map((f, i) => (
        <Grid2 key={`${f.label}-${i}`} size={{ xs: 12, sm: f.half ? 6 : 12 }}>
          <Label>{f.label}</Label>
          <Value empty={f.value === "—"}>{f.value}</Value>
        </Grid2>
      ))}
    </Grid2>
  );
}

// ──────────────────────────────────────────────────────────
// Block renderers
// ──────────────────────────────────────────────────────────

function renderBlock(block: ContentBlock, index: number) {
  switch (block.kind) {
    case "fields":
      return <FieldGrid key={index} fields={block.fields} />;

    case "paragraph":
      return (
        <Typography
          key={index}
          variant="body2"
          sx={{
            fontSize: 13,
            mb: 1.5,
            pl: 0.5,
            fontStyle: block.italic ? "italic" : "normal",
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
          }}
        >
          {block.text}
        </Typography>
      );

    case "list":
      if (block.items.length === 0) {
        return (
          <Typography
            key={index}
            variant="body2"
            sx={{ fontSize: 13, pl: 0.5, fontStyle: "italic", color: "text.disabled", mb: 1.5 }}
          >
            {block.emptyMessage || "None"}
          </Typography>
        );
      }
      return (
        <Box key={index}>
          {block.items.map((item, i) => (
            <Box
              key={i}
              sx={{
                pl: 0.5,
                mb: 1.5,
                pb: 1,
                borderBottom: i < block.items.length - 1 ? "1px solid" : "none",
                borderColor: "divider",
              }}
            >
              {item.title && (
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: 12, mb: 0.5 }}>
                  {item.title}
                </Typography>
              )}
              <FieldGrid fields={item.fields} />
            </Box>
          ))}
        </Box>
      );

    case "notice":
      return (
        <Box
          key={index}
          sx={{
            bgcolor: block.variant === "warning"
              ? "warning.50"
              : block.variant === "legal"
                ? "#FFF8E7"
                : "info.50",
            border: "1px solid",
            borderColor: block.variant === "warning"
              ? "warning.200"
              : block.variant === "legal"
                ? "#EBD9A0"
                : "info.200",
            borderRadius: "10px",
            p: 2,
            mb: 1.5,
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
          }}
        >
          <Warning sx={{ fontSize: 16, mt: 0.2, color: block.variant === "legal" ? "#B8941F" : "warning.main" }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.5 }}>
            {block.text}
          </Typography>
        </Box>
      );

    case "signature":
      return <SignatureArea key={index} block={block} />;
  }
}

// ──────────────────────────────────────────────────────────
// Signature area
// ──────────────────────────────────────────────────────────

const STATUS_ICON = {
  signed: <CheckCircle sx={{ fontSize: 14, color: "success.main" }} />,
  pending: <Schedule sx={{ fontSize: 14, color: "text.disabled" }} />,
  declined: <Cancel sx={{ fontSize: 14, color: "error.main" }} />,
  expired: <Cancel sx={{ fontSize: 14, color: "text.disabled" }} />,
};

const STATUS_LABEL: Record<string, string> = {
  signed: "Signed",
  pending: "Awaiting signature",
  declined: "Declined",
  expired: "Expired",
};

function SignatureArea({ block }: { block: SignatureBlock }) {
  return (
    <Grid2 container spacing={2}>
      {block.signers.map((signer, i) => (
        <Grid2 key={i} size={{ xs: 12, sm: 6 }}>
          <Box
            sx={{
              border: "1px solid",
              borderColor: signer.status === "signed" ? "success.200" : "divider",
              borderRadius: "10px",
              p: 2,
              textAlign: "center",
              bgcolor: signer.status === "signed" ? "success.50" : "transparent",
              minHeight: 100,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* Signature image if signed */}
            {signer.signatureData && (
              <Box sx={{ mb: 1 }}>
                <img
                  src={signer.signatureData.startsWith("data:") ? signer.signatureData : `data:image/png;base64,${signer.signatureData}`}
                  alt={`${signer.name}'s signature`}
                  style={{ maxHeight: 48, maxWidth: "80%", objectFit: "contain" }}
                />
              </Box>
            )}

            {/* Signature line */}
            {!signer.signatureData && (
              <Box
                sx={{
                  borderBottom: "1px dashed",
                  borderColor: "text.disabled",
                  width: "70%",
                  mx: "auto",
                  mb: 1,
                  height: 40,
                }}
              />
            )}

            <Typography variant="body2" fontWeight={600} sx={{ fontSize: 12 }}>
              {signer.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              {signer.role}
            </Typography>

            {/* Status badge */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 0.75 }}>
              {STATUS_ICON[signer.status]}
              <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary" }}>
                {STATUS_LABEL[signer.status]}
              </Typography>
              {signer.signedAt && (
                <Typography variant="caption" sx={{ fontSize: 9, color: "text.disabled" }}>
                  &middot; {formatDateShort(signer.signedAt)}
                </Typography>
              )}
            </Box>
          </Box>
        </Grid2>
      ))}
    </Grid2>
  );
}

function formatDateShort(value: string): string {
  try {
    return new Date(value).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

// ──────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────

interface Props {
  model: DocumentViewModel;
  /** Add a subtle paper-like background (default: true) */
  paperBg?: boolean;
}

export default function RenderedDocument({ model, paperBg = true }: Props) {
  return (
    <Box
      sx={{
        ...(paperBg && {
          bgcolor: "#FDFCF9",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "14px",
          p: { xs: 2.5, sm: 4 },
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }),
        /** PDF hint: set a max-width matching A4 proportions */
        maxWidth: 720,
        mx: "auto",
        fontFamily: "'Inter', sans-serif",
      }}
      className="noorspace-document"
    >
      {/* ─── Header ─── */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        {/* Arabic heading */}
        {model.arabicHeading && (
          <Typography
            sx={{
              fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
              fontSize: 18,
              color: "text.secondary",
              mb: 0.75,
              letterSpacing: 1,
            }}
          >
            {model.arabicHeading}
          </Typography>
        )}

        {/* Badge */}
        <Typography
          sx={{
            fontSize: 10,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: "text.disabled",
            mb: 0.5,
          }}
        >
          NoorSpace Document
        </Typography>

        {/* Title */}
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.25 }}>
          {model.title}
        </Typography>

        {/* Subtitle */}
        {model.subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
            {model.subtitle}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ─── Sections ─── */}
      {model.sections.map((section, si) => (
        <Box key={si} sx={{ mb: 2.5 }}>
          <Chip
            label={section.title}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mb: 1.5, fontWeight: 600 }}
          />
          {section.subtitle && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, pl: 0.5, fontSize: 11 }}>
              {section.subtitle}
            </Typography>
          )}
          {section.blocks.map((block, bi) => renderBlock(block, bi))}
          {si < model.sections.length - 1 && <Divider sx={{ mt: 1.5 }} />}
        </Box>
      ))}

      {/* ─── Signatures ─── */}
      {model.signatures && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            Signatures
          </Typography>
          <SignatureArea block={model.signatures} />
        </Box>
      )}

      {/* ─── Metadata Footer ─── */}
      <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
        {/* Closing verse */}
        {model.metadata.closingVerse && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              fontStyle: "italic",
              fontSize: 11,
              mb: 1.5,
              lineHeight: 1.6,
            }}
          >
            {model.metadata.closingVerse}
          </Typography>
        )}

        {/* Document metadata */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            flexWrap: "wrap",
          }}
        >
          {model.metadata.documentId && (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>
              ID: {model.metadata.documentId}
            </Typography>
          )}
          {model.metadata.createdBy && (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>
              Created by {model.metadata.createdBy}
            </Typography>
          )}
          {model.metadata.createdAt && (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>
              {formatDateShort(model.metadata.createdAt)}
            </Typography>
          )}
        </Box>

        {/* NoorSpace footer */}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: "block", textAlign: "center", fontSize: 9, mt: 1 }}
        >
          This document was prepared using NoorSpace. Legal enforceability depends on local law.
        </Typography>
      </Box>
    </Box>
  );
}
