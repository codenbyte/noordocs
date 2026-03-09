/**
 * WillBuilderPage — 9-step wizard for creating an Islamic Will.
 *
 * Steps: Personal → Declaration → Executor → Beneficiaries → Bequests →
 *        Debts → Burial → Witnesses → Review
 *
 * Supports dynamic arrays for beneficiaries, bequests, and debts.
 * Supports draft save/load, per-step validation, and submission for review.
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
import { ArrowBack, ArrowForward, Save, Send, Add, Delete } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { createDocument, updateDocumentData, submitForReview } from "@/services/documents";
import { useDocument } from "@/hooks/useDocuments";
import FormSection from "@/components/documents/FormSection";
import WillPreview from "@/components/documents/will/WillPreview";
import ReviewerPicker from "@/components/documents/ReviewerPicker";
import type { AdminUser } from "@/hooks/useAdminUsers";
import {
  emptyWillData,
  WILL_STEPS,
  PERSONAL_FIELDS,
  DECLARATION_FIELDS,
  EXECUTOR_FIELDS,
  BENEFICIARY_FIELDS,
  BEQUEST_FIELDS,
  DEBT_FIELDS,
  BURIAL_FIELDS,
  WILL_WITNESS_FIELDS,
  validateWillSection,
  validateWillForm,
  willDataToRecord,
  recordToWillData,
} from "@/types/will";
import type { IslamicWillData, WillStep, WillBeneficiary, WillBequest, WillDebt } from "@/types";

// ── Component ────────────────────────────────────────────

export default function WillBuilderPage() {
  const { id: draftId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { document: existingDoc, loading: loadingDoc } = useDocument(draftId);

  const [data, setData] = useState<IslamicWillData>(emptyWillData());
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState("");
  const [docId, setDocId] = useState<string | undefined>(draftId);
  const [globalErrors, setGlobalErrors] = useState<{ step: WillStep; field: string; message: string }[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<AdminUser | null>(null);

  const currentStep = WILL_STEPS[activeStep];
  const isReview = currentStep.key === "review";

  // Hydrate from existing draft
  useEffect(() => {
    if (existingDoc?.data && draftId) {
      const restored = recordToWillData(existingDoc.data as Record<string, string>);
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

  // ── Dynamic array handlers ───────────────────────────

  const handleArrayItemChange = useCallback(
    (
      arrayKey: "beneficiaries" | "bequests" | "debts",
      index: number,
      field: string,
      value: string,
    ) => {
      setData((prev) => ({
        ...prev,
        [arrayKey]: (prev[arrayKey] as any[]).map((item: any, i: number) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`${arrayKey.slice(0, -1)}_${index}.${field}`];
        return next;
      });
    },
    [],
  );

  const addArrayItem = useCallback(
    (arrayKey: "beneficiaries" | "bequests" | "debts") => {
      setData((prev) => {
        const empty: Record<string, WillBeneficiary | WillBequest | WillDebt> = {
          beneficiaries: { name: "", relationship: "", notes: "" },
          bequests: { description: "", recipient: "", notes: "" },
          debts: { description: "", amount: "", creditor: "" },
        };
        return {
          ...prev,
          [arrayKey]: [...(prev[arrayKey] as any[]), empty[arrayKey]],
        };
      });
    },
    [],
  );

  const removeArrayItem = useCallback(
    (arrayKey: "beneficiaries" | "bequests" | "debts", index: number) => {
      setData((prev) => ({
        ...prev,
        [arrayKey]: (prev[arrayKey] as any[]).filter((_, i) => i !== index),
      }));
    },
    [],
  );

  // ── Validation ───────────────────────────────────────

  const validateCurrentStep = (): boolean => {
    const step = currentStep.key;
    const stepErrors = validateWillSection(step, data);

    const errMap: Record<string, string> = {};
    stepErrors.forEach((e) => { errMap[e.field] = e.message; });
    setErrors(errMap);
    return stepErrors.length === 0;
  };

  // ── Navigation ───────────────────────────────────────

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setErrors({});
    setActiveStep((s) => Math.min(s + 1, WILL_STEPS.length - 1));
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
      const flat = willDataToRecord(data);
      const displayName = profile.displayName || user.displayName || "User";

      if (docId) {
        await updateDocumentData(docId, flat, user.uid, displayName);
      } else {
        const newId = await createDocument(
          "islamic_will",
          "Islamic Will",
          user.uid,
          displayName,
          flat,
          [],
        );
        setDocId(newId);
        window.history.replaceState(null, "", `/documents/will/${newId}`);
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

    const allErrors = validateWillForm(data);
    if (allErrors.length > 0) {
      setGlobalErrors(allErrors);
      const firstErrorStep = allErrors[0].step;
      const stepIdx = WILL_STEPS.findIndex((s) => s.key === firstErrorStep);
      if (stepIdx >= 0) setActiveStep(stepIdx);
      return;
    }

    setGlobalErrors([]);
    setSubmitting(true);
    try {
      const flat = willDataToRecord(data);
      const displayName = profile.displayName || user.displayName || "User";

      let finalDocId = docId;
      if (!finalDocId) {
        finalDocId = await createDocument(
          "islamic_will",
          "Islamic Will",
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
        { title: "Islamic Will", type: "islamic_will" },
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

  const progress = ((activeStep + 1) / WILL_STEPS.length) * 100;

  // ── Render dynamic array section ─────────────────────

  function renderArraySection(
    arrayKey: "beneficiaries" | "bequests" | "debts",
    items: any[],
    fields: typeof BENEFICIARY_FIELDS,
    singularLabel: string,
  ) {
    const isRequired = arrayKey === "beneficiaries";

    return (
      <>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
          {currentStep.label}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {currentStep.description}
          {arrayKey === "bequests" && (
            <>
              <br />
              <Typography component="span" variant="caption" color="text.secondary">
                In Islamic law, voluntary bequests (wasiyyah) are limited to one-third of the estate.
              </Typography>
            </>
          )}
          {arrayKey === "debts" && (
            <>
              <br />
              <Typography component="span" variant="caption" color="text.secondary">
                In Islam, settling debts takes priority over distributing the estate.
              </Typography>
            </>
          )}
        </Typography>

        {errors[arrayKey] && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{errors[arrayKey]}</Alert>
        )}

        {items.map((item, i) => (
          <Box key={i} sx={{ mb: 2, pb: 2, borderBottom: i < items.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                {singularLabel} {i + 1}
              </Typography>
              {(!isRequired || items.length > 1) && (
                <IconButton
                  size="small"
                  onClick={() => removeArrayItem(arrayKey, i)}
                  sx={{ color: "error.main" }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Box>
            <FormSection
              title=""
              fields={fields}
              data={item as Record<string, string>}
              onChange={(key, value) => handleArrayItemChange(arrayKey, i, key, value)}
              errors={Object.fromEntries(
                Object.entries(errors)
                  .filter(([k]) => k.startsWith(`${arrayKey.slice(0, -1)}_${i}.`))
                  .map(([k, v]) => [k.split(".").slice(1).join("."), v]),
              )}
            />
          </Box>
        ))}

        <Button
          startIcon={<Add />}
          onClick={() => addArrayItem(arrayKey)}
          sx={{ mt: 1 }}
        >
          Add {singularLabel}
        </Button>
      </>
    );
  }

  // ── Render step content ──────────────────────────────

  function renderStepContent() {
    const step = currentStep.key;

    switch (step) {
      case "personal":
        return (
          <FormSection
            title={currentStep.label}
            description={currentStep.description}
            fields={PERSONAL_FIELDS}
            data={data.personal as unknown as Record<string, string>}
            onChange={makeSectionHandler("personal")}
            errors={errors}
          />
        );

      case "declaration":
        return (
          <FormSection
            title={currentStep.label}
            description={currentStep.description}
            fields={DECLARATION_FIELDS}
            data={data.declaration as unknown as Record<string, string>}
            onChange={makeSectionHandler("declaration")}
            errors={errors}
          />
        );

      case "executor":
        return (
          <FormSection
            title={currentStep.label}
            description={currentStep.description}
            fields={EXECUTOR_FIELDS}
            data={data.executor as unknown as Record<string, string>}
            onChange={makeSectionHandler("executor")}
            errors={errors}
          />
        );

      case "beneficiaries":
        return renderArraySection("beneficiaries", data.beneficiaries, BENEFICIARY_FIELDS, "Beneficiary");

      case "bequests":
        return renderArraySection("bequests", data.bequests, BEQUEST_FIELDS, "Bequest");

      case "debts":
        return renderArraySection("debts", data.debts, DEBT_FIELDS, "Debt");

      case "burial":
        return (
          <FormSection
            title={currentStep.label}
            description={currentStep.description}
            fields={BURIAL_FIELDS}
            data={data.burial as unknown as Record<string, string>}
            onChange={makeSectionHandler("burial")}
            errors={errors}
          />
        );

      case "witnesses":
        return (
          <>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
              Witnesses
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Two witnesses are required to validate the will.
            </Typography>

            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: "primary.main" }}>
              Witness 1
            </Typography>
            <FormSection
              title=""
              fields={WILL_WITNESS_FIELDS}
              data={data.witness1 as unknown as Record<string, string>}
              onChange={makeSectionHandler("witness1")}
              errors={Object.fromEntries(
                Object.entries(errors)
                  .filter(([k]) => k.startsWith("w1."))
                  .map(([k, v]) => [k.replace("w1.", ""), v]),
              )}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: "primary.main" }}>
              Witness 2
            </Typography>
            <FormSection
              title=""
              fields={WILL_WITNESS_FIELDS}
              data={data.witness2 as unknown as Record<string, string>}
              onChange={makeSectionHandler("witness2")}
              errors={Object.fromEntries(
                Object.entries(errors)
                  .filter(([k]) => k.startsWith("w2."))
                  .map(([k, v]) => [k.replace("w2.", ""), v]),
              )}
            />
          </>
        );

      case "review":
        return (
          <>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Review & Confirm
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Please review all details carefully. This document is not legal advice — please consult
              a qualified professional for your jurisdiction.
            </Typography>
            <WillPreview data={data} />

            <Divider sx={{ my: 2.5 }} />
            <ReviewerPicker
              selectedUid={selectedReviewer?.uid || ""}
              onChange={setSelectedReviewer}
            />
          </>
        );

      default:
        return null;
    }
  }

  // ── Main render ──────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate("/documents")} size="small">
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Islamic Will
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
          "& .MuiStepLabel-label": { fontSize: 10 },
          display: { xs: "none", sm: "flex" },
        }}
      >
        {WILL_STEPS.map((step) => (
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
        Step {activeStep + 1} of {WILL_STEPS.length}: {currentStep.label}
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
          {renderStepContent()}
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
