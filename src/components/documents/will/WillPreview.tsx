/**
 * WillPreview — Read-only view of a completed Islamic Will form.
 * Used in the review step of the builder and in DocumentViewPage.
 */

import { Box, Typography, Divider, Chip } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import type { IslamicWillData } from "@/types";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, display: "block", mb: 0.1 }}>
      {children}
    </Typography>
  );
}

function Value({ children, empty }: { children: React.ReactNode; empty?: boolean }) {
  return (
    <Typography variant="body2" sx={{ fontSize: 13, mb: 1.25, fontStyle: empty ? "italic" : "normal", color: empty ? "text.disabled" : "text.primary", whiteSpace: "pre-wrap" }}>
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

interface Props {
  data: IslamicWillData;
}

export default function WillPreview({ data }: Props) {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography sx={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "text.secondary", mb: 0.5 }}>
          NoorSpace Document
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          Islamic Will (Wasiyyah)
        </Typography>
      </Box>

      {/* Legal notice */}
      <Box sx={{ bgcolor: "warning.50", border: "1px solid", borderColor: "warning.200", borderRadius: "12px", p: 2, mb: 2.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
          This document is a guide prepared using NoorSpace. Final legal enforceability depends on
          your local laws and should be reviewed by a qualified legal professional.
        </Typography>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Personal Details */}
      <Box sx={{ mb: 2.5 }}>
        <Chip label="Testator" size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
        <Grid2 container spacing={0} sx={{ pl: 0.5 }}>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Full Legal Name</Label>
            <Value empty={!data.personal.fullName}>{data.personal.fullName || "—"}</Value>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Date of Birth</Label>
            <Value empty={!data.personal.dateOfBirth}>{formatDate(data.personal.dateOfBirth)}</Value>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Email</Label>
            <Value empty={!data.personal.email}>{data.personal.email || "—"}</Value>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Phone</Label>
            <Value empty={!data.personal.phone}>{data.personal.phone || "—"}</Value>
          </Grid2>
          <Grid2 size={12}>
            <Label>Address</Label>
            <Value empty={!data.personal.address}>{data.personal.address || "—"}</Value>
          </Grid2>
          <Grid2 size={12}>
            <Label>Country / State</Label>
            <Value empty={!data.personal.countryState}>{data.personal.countryState || "—"}</Value>
          </Grid2>
        </Grid2>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Declaration */}
      <Box sx={{ mb: 2.5 }}>
        <Chip label="Declaration" size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
        <Grid2 container spacing={0} sx={{ pl: 0.5 }}>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Sound Mind Confirmation</Label>
            <Value>{data.declaration.soundMind?.toLowerCase() === "yes" ? "Confirmed" : "—"}</Value>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Revoke Previous Wills</Label>
            <Value>{data.declaration.revokePrevious?.toLowerCase() === "yes" ? "Yes — all previous wills revoked" : "No"}</Value>
          </Grid2>
          {data.declaration.faithStatement && (
            <Grid2 size={12}>
              <Label>Faith Statement</Label>
              <Value>{data.declaration.faithStatement}</Value>
            </Grid2>
          )}
        </Grid2>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Executor */}
      <Box sx={{ mb: 2.5 }}>
        <Chip label="Executor" size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
        <Grid2 container spacing={0} sx={{ pl: 0.5 }}>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Full Name</Label>
            <Value empty={!data.executor.fullName}>{data.executor.fullName || "—"}</Value>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Relationship</Label>
            <Value empty={!data.executor.relationship}>{data.executor.relationship || "—"}</Value>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Email</Label>
            <Value empty={!data.executor.email}>{data.executor.email || "—"}</Value>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Label>Phone</Label>
            <Value empty={!data.executor.phone}>{data.executor.phone || "—"}</Value>
          </Grid2>
          {data.executor.address && (
            <Grid2 size={12}>
              <Label>Address</Label>
              <Value>{data.executor.address}</Value>
            </Grid2>
          )}
        </Grid2>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Beneficiaries */}
      <Box sx={{ mb: 2.5 }}>
        <Chip label={`Beneficiaries (${data.beneficiaries.filter((b) => b.name).length})`} size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
        {data.beneficiaries.filter((b) => b.name).length === 0 ? (
          <Value empty>No beneficiaries added</Value>
        ) : (
          data.beneficiaries.filter((b) => b.name).map((b, i) => (
            <Box key={i} sx={{ pl: 0.5, mb: 1.5, pb: 1, borderBottom: i < data.beneficiaries.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
              <Grid2 container spacing={0}>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Label>Name</Label>
                  <Value>{b.name}</Value>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Label>Relationship</Label>
                  <Value>{b.relationship || "—"}</Value>
                </Grid2>
                {b.notes && (
                  <Grid2 size={12}>
                    <Label>Notes</Label>
                    <Value>{b.notes}</Value>
                  </Grid2>
                )}
              </Grid2>
            </Box>
          ))
        )}
      </Box>

      {/* Bequests */}
      {data.bequests.filter((b) => b.description).length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2.5 }}>
            <Chip label={`Specific Bequests (${data.bequests.filter((b) => b.description).length})`} size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
            {data.bequests.filter((b) => b.description).map((b, i) => (
              <Box key={i} sx={{ pl: 0.5, mb: 1.5, pb: 1, borderBottom: i < data.bequests.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
                <Grid2 container spacing={0}>
                  <Grid2 size={12}>
                    <Label>Description</Label>
                    <Value>{b.description}</Value>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Label>Recipient</Label>
                    <Value>{b.recipient || "—"}</Value>
                  </Grid2>
                  {b.notes && (
                    <Grid2 size={12}>
                      <Label>Notes</Label>
                      <Value>{b.notes}</Value>
                    </Grid2>
                  )}
                </Grid2>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Debts */}
      {data.debts.filter((d) => d.description).length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2.5 }}>
            <Chip label={`Debts & Obligations (${data.debts.filter((d) => d.description).length})`} size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
            {data.debts.filter((d) => d.description).map((d, i) => (
              <Box key={i} sx={{ pl: 0.5, mb: 1.5, pb: 1, borderBottom: i < data.debts.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
                <Grid2 container spacing={0}>
                  <Grid2 size={12}>
                    <Label>Description</Label>
                    <Value>{d.description}</Value>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Label>Amount</Label>
                    <Value empty={!d.amount}>{d.amount || "—"}</Value>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Label>Creditor</Label>
                    <Value>{d.creditor || "—"}</Value>
                  </Grid2>
                </Grid2>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Burial Wishes */}
      {data.burial.notes && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2.5 }}>
            <Chip label="Burial & Funeral Wishes" size="small" color="primary" variant="outlined" sx={{ mb: 1.5, fontWeight: 600 }} />
            <Box sx={{ pl: 0.5 }}>
              <Value>{data.burial.notes}</Value>
            </Box>
          </Box>
        </>
      )}

      <Divider sx={{ my: 2 }} />

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

      {/* Footer disclaimer */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, display: "block", textAlign: "center", mt: 2 }}>
        This Islamic Will was prepared using NoorSpace. Legal enforceability depends on local law.
        Please consult a qualified legal professional to ensure compliance with your jurisdiction.
      </Typography>
    </Box>
  );
}
