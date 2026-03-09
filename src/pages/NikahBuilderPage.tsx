/**
 * NikahBuilderPage — 7-step wizard for creating a Nikah Contract.
 *
 * Steps: Bride → Groom → Wali → Witnesses → Imam → Nikah Details → Review
 * Supports draft save/load, per-step validation, and submission for imam review.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
  LinearProgress,
  Divider,
} from "@mui/material";
import { ArrowBack, ArrowForward, Save, Send } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { createDocument, updateDocumentData, submitForReview } from "@/services/documents";
import { useDocument } from "@/hooks/useDocuments";
import FormSection from "@/components/documents/FormSection";
import NikahPreview from "@/components/documents/nikah/NikahPreview";
import ReviewerPicker from "@/components/documents/ReviewerPicker";
import type { AdminUser } from "@/hooks/useAdminUsers";
import {
  emptyNikahData,
  NIKAH_STEPS,
  BRIDE_FIELDS,
  GROOM_FIELDS,
  WALI_FIELDS,
  WITNESS_FIELDS,
  IMAM_FIELDS,
  NIKAH_DETAIL_FIELDS,
  validateSection,
  validateNikahForm,
  nikahDataToRecord,
  recordToNikahData,
} from "@/types/nikah";
import type { NikahContractData, NikahStep, ValidationError } from "@/types";

// ── Helpers ──────────────────────────────────────────────

/** Map step key → field definitions */
function getFieldsForStep(step: NikahStep) {
  switch (step) {
    case "bride": return BRIDE_FIELDS;
    case "groom": return GROOM_FIELDS;
    case "wali": return WALI_FIELDS;
    case "witnesses": return WITNESS_FIELDS;
    case "imam": return IMAM_FIELDS;
    case "nikah": return NIKAH_DETAIL_FIELDS;
    default: return [];
  }
}

/** Get the section data object for a step key */
function getSectionData(data: NikahContractData, step: NikahStep): Record<string, string> {
  switch (step) {
    case "bride": return data.bride as unknown as Record<string, string>;
    case "groom": return data.groom as unknown as Record<string, string>;
    case "wali": return data.wali as unknown as Record<string, string>;
    case "imam": return data.imam as unknown as Record<string, string>;
    case "nikah": return data.nikah as unknown as Record<string, string>;
    default: return {};
  }
}

// ── Component ────────────────────────────────────────────

export default function NikahBuilderPage() {
  const { id: draftId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Load existing draft if editing
  const { document: existingDoc, loading: loadingDoc } = useDocument(draftId);

  const [data, setData] = useState<NikahContractData>(emptyNikahData());
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState("");
  const [docId, setDocId] = useState<string | undefined>(draftId);
  const [globalErrors, setGlobalErrors] = useState<ValidationError[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<AdminUser | null>(null);

  const currentStep = NIKAH_STEPS[activeStep];
  const isReview = currentStep.key === "review";
  const isWitnesses = currentStep.key === "witnesses";

  // Hydrate from existing draft
  useEffect(() => {
    if (existingDoc?.data && draftId) {
      const restored = recordToNikahData(existingDoc.data as Record<string, string>);
      setData(restored);
      setDocId(draftId);
    }
  }, [existingDoc, draftId]);

  // ── Field change handlers ────────────────────────────

  const handleChange = useCallback(
    (section: string, key: string, value: string) => {
      setData((prev) => ({
        ...prev,
        [section]: { ...(prev as any)[section], [key]: value },
      }));
      // Clear error for this field
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const makeSectionHandler = useCallback(
    (section: string) => (key: string, value: string) => handleChange(section, key, value),
    [handleChange],
  );

  // ── Validation ───────────────────────────────────────

  const validateCurrentStep = (): boolean => {
    const step = currentStep.key;
    if (step === "review") return true;

    if (step === "witnesses") {
      const w1Errors = validateSection("witnesses", WITNESS_FIELDS, data.witness1 as unknown as Record<string, string>);
      const w2Errors = validateSection("witnesses", WITNESS_FIELDS, data.witness2 as unknown as Record<string, string>);
      const errMap: Record<string, string> = {};
      w1Errors.forEach((e) => { errMap[`w1_${e.field}`] = e.message; });
      w2Errors.forEach((e) => { errMap[`w2_${e.field}`] = e.message; });
      setErrors(errMap);
      return w1Errors.length === 0 && w2Errors.length === 0;
    }

    const fields = getFieldsForStep(step);
    const sectionData = getSectionData(data, step);
    const sectionErrors = validateSection(step, fields, sectionData);
    const errMap: Record<string, string> = {};
    sectionErrors.forEach((e) => { errMap[e.field] = e.message; });
    setErrors(errMap);
    return sectionErrors.length === 0;
  };

  // ── Navigation ───────────────────────────────────────

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setErrors({});
    setActiveStep((s) => Math.min(s + 1, NIKAH_STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  // ── Save Draft ───────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const flat = nikahDataToRecord(data);
      const displayName = profile.displayName || user.displayName || "User";

      if (docId) {
        await updateDocumentData(docId, flat, user.uid, displayName);
      } else {
        const newId = await createDocument(
          "nikah_contract",
          "Nikah Contract",
          user.uid,
          displayName,
          flat,
          [],
        );
        setDocId(newId);
        // Update URL without full navigation
        window.history.replaceState(null, "", `/documents/nikah/${newId}`);
      }
      setSnack("Draft saved");
    } catch (err: any) {
      setSnack(err.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  // ── Submit for Review ────────────────────────────────

  const handleSubmit = async () => {
    if (!user || !profile) return;

    // Validate entire form
    const allErrors = validateNikahForm(data);
    if (allErrors.length > 0) {
      setGlobalErrors(allErrors);
      // Jump to the first step with errors
      const firstErrorStep = allErrors[0].step;
      const stepIdx = NIKAH_STEPS.findIndex((s) => s.key === firstErrorStep);
      if (stepIdx >= 0) setActiveStep(stepIdx);
      return;
    }

    setGlobalErrors([]);
    setSubmitting(true);
    try {
      const flat = nikahDataToRecord(data);
      const displayName = profile.displayName || user.displayName || "User";

      let finalDocId = docId;
      if (!finalDocId) {
        finalDocId = await createDocument(
          "nikah_contract",
          "Nikah Contract",
          user.uid,
          displayName,
          flat,
          [],
        );
      } else {
        await updateDocumentData(finalDocId, flat, user.uid, displayName);
      }

      await submitForReview(
        finalDocId,
        user.uid,
        displayName,
        selectedReviewer ? { uid: selectedReviewer.uid, name: selectedReviewer.displayName } : undefined,
        { title: "Nikah Contract", type: "nikah_contract" },
      );
      navigate(`/documents/${finalDocId}`);
    } catch (err: any) {
      setSnack(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Guards ───────────────────────────────────────────

  if (!user || !profile) {
    navigate("/login");
    return null;
  }

  if (draftId && loadingDoc) {
    return (
      <Box sx={{ maxWidth: 700, mx: "auto", py: 4, px: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  // ── Progress ─────────────────────────────────────────

  const progress = ((activeStep + 1) / NIKAH_STEPS.length) * 100;

  // ── Render ───────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate("/documents")} size="small">
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Nikah Contract
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentStep.description}
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<Save />}
          onClick={handleSaveDraft}
          disabled={saving}
          sx={{ display: { xs: "none", sm: "inline-flex" } }}
        >
          {saving ? "Saving..." : "Save Draft"}
        </Button>
      </Box>

      {/* Progress bar (mobile) */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 2, borderRadius: 1, display: { sm: "none" } }}
      />

      {/* Stepper (desktop) */}
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 3,
          "& .MuiStepLabel-label": { fontSize: 11 },
          display: { xs: "none", sm: "flex" },
        }}
      >
        {NIKAH_STEPS.map((step) => (
          <Step key={step.key}>
            <StepLabel>{step.shortLabel}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Mobile step indicator */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: { xs: "block", sm: "none" }, mb: 1 }}
      >
        Step {activeStep + 1} of {NIKAH_STEPS.length}: {currentStep.label}
      </Typography>

      {/* Global validation errors */}
      {globalErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }} onClose={() => setGlobalErrors([])}>
          Please fix {globalErrors.length} error{globalErrors.length > 1 ? "s" : ""} before submitting.
        </Alert>
      )}

      {/* Step Content */}
      <Card sx={{ borderRadius: "16px", mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Regular section steps */}
          {!isReview && !isWitnesses && (
            <FormSection
              title={currentStep.label}
              description={currentStep.description}
              fields={getFieldsForStep(currentStep.key)}
              data={getSectionData(data, currentStep.key)}
              onChange={makeSectionHandler(currentStep.key)}
              errors={errors}
            />
          )}

          {/* Witnesses step — two sub-sections */}
          {isWitnesses && (
            <>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
                Witnesses
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Two adult Muslim witnesses are required for the Nikah to be valid.
              </Typography>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: "primary.main" }}>
                Witness 1
              </Typography>
              <FormSection
                title=""
                fields={WITNESS_FIELDS}
                data={data.witness1 as unknown as Record<string, string>}
                onChange={makeSectionHandler("witness1")}
                errors={Object.fromEntries(
                  Object.entries(errors)
                    .filter(([k]) => k.startsWith("w1_"))
                    .map(([k, v]) => [k.replace("w1_", ""), v]),
                )}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: "primary.main" }}>
                Witness 2
              </Typography>
              <FormSection
                title=""
                fields={WITNESS_FIELDS}
                data={data.witness2 as unknown as Record<string, string>}
                onChange={makeSectionHandler("witness2")}
                errors={Object.fromEntries(
                  Object.entries(errors)
                    .filter(([k]) => k.startsWith("w2_"))
                    .map(([k, v]) => [k.replace("w2_", ""), v]),
                )}
              />
            </>
          )}

          {/* Review step */}
          {isReview && (
            <>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                Review & Confirm
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Please review all details carefully before submitting for imam review.
              </Typography>
              <NikahPreview data={data} />

              <Divider sx={{ my: 2.5 }} />
              <ReviewerPicker
                selectedUid={selectedReviewer?.uid || ""}
                onChange={setSelectedReviewer}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Mobile save draft */}
          <IconButton
            onClick={handleSaveDraft}
            disabled={saving}
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            <Save />
          </IconButton>

          {!isReview ? (
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleNext}
              sx={{ borderRadius: "12px" }}
            >
              Next
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Save />}
                onClick={handleSaveDraft}
                disabled={saving}
                sx={{ borderRadius: "12px" }}
              >
                Save Draft
              </Button>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={handleSubmit}
                disabled={submitting}
                sx={{ borderRadius: "12px" }}
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack("")}
        message={snack}
      />
    </Box>
  );
}
