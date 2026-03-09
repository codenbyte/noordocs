import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton,
  Alert,
} from "@mui/material";
import { ArrowBack, ArrowForward, Save } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { createDocument } from "@/services/documents";
import type { DocumentType, DocumentSigner, TemplateField } from "@/types";
import { TEMPLATE_FIELDS, SIGNER_ROLES, DOCUMENT_TYPE_LABELS } from "@/types";

export default function DocumentBuilderPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const docType = type as DocumentType;

  const fields = TEMPLATE_FIELDS[docType] || [];
  const signerRoles = SIGNER_ROLES[docType] || [];
  const sections = useMemo(() => [...new Set(fields.map((f) => f.section))], [fields]);

  // Steps: each section + "Signers" + "Review"
  const steps = useMemo(() => [...sections, "Signers", "Review & Save"], [sections]);
  const [activeStep, setActiveStep] = useState(0);

  // Form data
  const [data, setData] = useState<Record<string, string>>({});
  const [signers, setSigners] = useState<{ name: string; email: string; role: string }[]>(
    signerRoles.map((role) => ({ name: "", email: "", role })),
  );
  const [title, setTitle] = useState(DOCUMENT_TYPE_LABELS[docType] || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user || !profile) {
    navigate("/login");
    return null;
  }

  if (!TEMPLATE_FIELDS[docType]) {
    navigate("/documents");
    return null;
  }

  const handleFieldChange = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignerChange = (index: number, field: "name" | "email", value: string) => {
    setSigners((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const currentSectionFields = activeStep < sections.length
    ? fields.filter((f) => f.section === sections[activeStep])
    : [];

  const canProceed = () => {
    if (activeStep < sections.length) {
      const requiredFields = currentSectionFields.filter((f) => f.required);
      return requiredFields.every((f) => data[f.key]?.trim());
    }
    if (activeStep === sections.length) {
      // Signers step — at least names required
      return signers.every((s) => s.name.trim());
    }
    return true;
  };

  const handleSave = async () => {
    setError("");
    setSubmitting(true);
    try {
      const displayName = profile.displayName || user.displayName || "User";
      const docSigners: DocumentSigner[] = signers.map((s) => ({
        name: s.name,
        email: s.email,
        role: s.role,
        status: "pending",
      }));

      const docId = await createDocument(
        docType,
        title.trim() || DOCUMENT_TYPE_LABELS[docType],
        user.uid,
        displayName,
        data,
        docSigners,
      );

      navigate(`/documents/${docId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create document");
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldInput = (field: TemplateField) => (
    <TextField
      key={field.key}
      fullWidth
      label={field.label + (field.required ? " *" : "")}
      placeholder={field.placeholder}
      type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
      multiline={field.type === "textarea"}
      rows={field.type === "textarea" ? 3 : undefined}
      value={data[field.key] || ""}
      onChange={(e) => handleFieldChange(field.key, e.target.value)}
      slotProps={field.type === "date" ? { inputLabel: { shrink: true } } : undefined}
      sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
    />
  );

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate("/documents")} size="small">
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {DOCUMENT_TYPE_LABELS[docType]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Fill in the details step by step
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 3,
          "& .MuiStepLabel-label": { fontSize: 11 },
          display: { xs: "none", sm: "flex" },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Mobile step indicator */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: { xs: "block", sm: "none" }, mb: 2 }}
      >
        Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
      </Typography>

      {/* Step Content */}
      <Card sx={{ borderRadius: "16px", mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Section fields */}
          {activeStep < sections.length && (
            <>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                {sections[activeStep]}
              </Typography>
              {currentSectionFields.map(renderFieldInput)}
            </>
          )}

          {/* Signers step */}
          {activeStep === sections.length && (
            <>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                Signers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add the name and email of each party who needs to sign this document.
              </Typography>
              {signers.map((signer, i) => (
                <Box key={i} sx={{ mb: 2.5 }}>
                  <Typography variant="caption" fontWeight={700} color="primary" sx={{ mb: 0.5, display: "block" }}>
                    {signer.role}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Full Name *"
                      value={signer.name}
                      onChange={(e) => handleSignerChange(i, "name", e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Email"
                      type="email"
                      value={signer.email}
                      onChange={(e) => handleSignerChange(i, "email", e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                    />
                  </Box>
                </Box>
              ))}
            </>
          )}

          {/* Review step */}
          {activeStep === sections.length + 1 && (
            <>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Review & Save
              </Typography>
              <TextField
                fullWidth
                label="Document Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />

              {/* Summary */}
              {sections.map((section) => (
                <Box key={section} sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight={700} color="primary">
                    {section}
                  </Typography>
                  {fields
                    .filter((f) => f.section === section && data[f.key]?.trim())
                    .map((f) => (
                      <Box key={f.key} sx={{ display: "flex", gap: 1, mb: 0.25 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140 }}>
                          {f.label}:
                        </Typography>
                        <Typography variant="caption">{data[f.key]}</Typography>
                      </Box>
                    ))}
                </Box>
              ))}

              <Typography variant="caption" fontWeight={700} color="primary" sx={{ display: "block", mb: 0.5 }}>
                Signers
              </Typography>
              {signers.map((s, i) => (
                <Typography key={i} variant="caption" display="block">
                  {s.role}: {s.name} {s.email && `(${s.email})`}
                </Typography>
              ))}

              {error && <Alert severity="error" sx={{ mt: 2, borderRadius: "12px" }}>{error}</Alert>}
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          disabled={activeStep === 0}
          onClick={() => setActiveStep((s) => s - 1)}
        >
          Back
        </Button>

        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            disabled={!canProceed()}
            onClick={() => setActiveStep((s) => s + 1)}
            sx={{ borderRadius: "12px" }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={submitting}
            onClick={handleSave}
            sx={{ borderRadius: "12px" }}
          >
            {submitting ? "Saving..." : "Save as Draft"}
          </Button>
        )}
      </Box>
    </Box>
  );
}
