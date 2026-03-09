/**
 * NikahPreview — Read-only view of a completed Nikah contract form.
 * Used in the review step of the builder and in DocumentViewPage.
 */

import { Box, Typography, Divider, Chip } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import type { NikahContractData } from "@/types";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, display: "block", mb: 0.1 }}>
      {children}
    </Typography>
  );
}

function Value({ children, empty }: { children: React.ReactNode; empty?: boolean }) {
  return (
    <Typography variant="body2" sx={{ fontSize: 13, mb: 1.25, fontStyle: empty ? "italic" : "normal", color: empty ? "text.disabled" : "text.primary" }}>
      {children}
    </Typography>
  );
}

function formatDate(value: string): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return value;
  }
}

function PersonBlock({ title, data, extraFields }: {
  title: string;
  data: Record<string, string>;
  extraFields?: { key: string; label: string; isDate?: boolean }[];
}) {
  const fields = [
    { key: "fullName", label: "Full Name" },
    ...(extraFields || []),
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
  ];

  return (
    <Box sx={{ mb: 2.5 }}>
      <Chip label={title} size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
      <Grid2 container spacing={0} sx={{ pl: 0.5 }}>
        {fields.map((f) => {
          const value = data[f.key] || "";
          const display = (f as any).isDate ? formatDate(value) : value;
          return (
            <Grid2 key={f.key} size={{ xs: 12, sm: 6 }}>
              <Label>{f.label}</Label>
              <Value empty={!value}>{display || "—"}</Value>
            </Grid2>
          );
        })}
      </Grid2>
    </Box>
  );
}

interface Props {
  data: NikahContractData;
}

export default function NikahPreview({ data }: Props) {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography sx={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "text.secondary", mb: 0.5 }}>
          NoorSpace Document
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          Nikah Contract
        </Typography>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Bride */}
      <PersonBlock
        title="Bride"
        data={data.bride as unknown as Record<string, string>}
        extraFields={[
          { key: "dateOfBirth", label: "Date of Birth", isDate: true },
          { key: "address", label: "Address" },
        ]}
      />

      {/* Groom */}
      <PersonBlock
        title="Groom"
        data={data.groom as unknown as Record<string, string>}
        extraFields={[
          { key: "dateOfBirth", label: "Date of Birth", isDate: true },
          { key: "address", label: "Address" },
        ]}
      />

      <Divider sx={{ my: 2 }} />

      {/* Wali */}
      <PersonBlock
        title="Wali (Guardian)"
        data={data.wali as unknown as Record<string, string>}
        extraFields={[{ key: "relationship", label: "Relationship" }]}
      />

      {/* Witnesses */}
      <Box sx={{ mb: 2.5 }}>
        <Chip label="Witnesses" size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
        <Grid2 container spacing={2} sx={{ pl: 0.5 }}>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Witness 1</Label>
            <Value empty={!data.witness1.fullName}>{data.witness1.fullName || "—"}</Value>
            {data.witness1.email && <><Label>Email</Label><Value>{data.witness1.email}</Value></>}
            {data.witness1.phone && <><Label>Phone</Label><Value>{data.witness1.phone}</Value></>}
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Witness 2</Label>
            <Value empty={!data.witness2.fullName}>{data.witness2.fullName || "—"}</Value>
            {data.witness2.email && <><Label>Email</Label><Value>{data.witness2.email}</Value></>}
            {data.witness2.phone && <><Label>Phone</Label><Value>{data.witness2.phone}</Value></>}
          </Grid2>
        </Grid2>
      </Box>

      {/* Imam */}
      <PersonBlock
        title="Imam / Officiant"
        data={data.imam as unknown as Record<string, string>}
        extraFields={[{ key: "mosqueName", label: "Mosque / Organisation" }]}
      />

      <Divider sx={{ my: 2 }} />

      {/* Nikah Details */}
      <Box sx={{ mb: 2 }}>
        <Chip label="Nikah Details" size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
        <Grid2 container spacing={0} sx={{ pl: 0.5 }}>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Date of Nikah</Label>
            <Value empty={!data.nikah.nikahDate}>{formatDate(data.nikah.nikahDate)}</Value>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Location</Label>
            <Value empty={!data.nikah.nikahLocation}>{data.nikah.nikahLocation || "—"}</Value>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Mahr Amount</Label>
            <Value empty={!data.nikah.mahrAmount}>{data.nikah.mahrAmount || "—"}</Value>
          </Grid2>
          <Grid2 size={12}>
            <Label>Mahr Description</Label>
            <Value empty={!data.nikah.mahrDescription}>{data.nikah.mahrDescription || "—"}</Value>
          </Grid2>
          {data.nikah.specialConditions && (
            <Grid2 size={12}>
              <Label>Special Conditions</Label>
              <Value>{data.nikah.specialConditions}</Value>
            </Grid2>
          )}
          {data.nikah.additionalNotes && (
            <Grid2 size={12}>
              <Label>Additional Notes</Label>
              <Value>{data.nikah.additionalNotes}</Value>
            </Grid2>
          )}
        </Grid2>
      </Box>
    </Box>
  );
}
