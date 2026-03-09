/**
 * NoorSpace — Islamic Will Types & Validation
 *
 * Dedicated types for the Islamic Will builder.
 * Supports dynamic arrays for beneficiaries, bequests, and debts.
 */

import type { FieldDef } from "./nikah";

// ──────────────────────────────────────────────────────────
// Data Structures
// ──────────────────────────────────────────────────────────

export interface WillPersonalDetails {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  countryState: string;
}

export interface WillDeclaration {
  soundMind: string; // "yes" | "no" — stored as string for form compat
  faithStatement: string;
  revokePrevious: string; // "yes" | "no"
}

export interface WillExecutor {
  fullName: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
}

export interface WillBeneficiary {
  name: string;
  relationship: string;
  notes: string;
}

export interface WillBequest {
  description: string;
  recipient: string;
  notes: string;
}

export interface WillDebt {
  description: string;
  amount: string;
  creditor: string;
}

export interface WillPersonDetails {
  fullName: string;
  email: string;
  phone: string;
}

export interface WillBurial {
  notes: string;
}

export interface IslamicWillData {
  personal: WillPersonalDetails;
  declaration: WillDeclaration;
  executor: WillExecutor;
  beneficiaries: WillBeneficiary[];
  bequests: WillBequest[];
  debts: WillDebt[];
  burial: WillBurial;
  witness1: WillPersonDetails;
  witness2: WillPersonDetails;
}

/** Empty state factory */
export function emptyWillData(): IslamicWillData {
  return {
    personal: { fullName: "", email: "", phone: "", dateOfBirth: "", address: "", countryState: "" },
    declaration: { soundMind: "", faithStatement: "", revokePrevious: "" },
    executor: { fullName: "", relationship: "", email: "", phone: "", address: "" },
    beneficiaries: [{ name: "", relationship: "", notes: "" }],
    bequests: [],
    debts: [],
    burial: { notes: "" },
    witness1: { fullName: "", email: "", phone: "" },
    witness2: { fullName: "", email: "", phone: "" },
  };
}

// ──────────────────────────────────────────────────────────
// Step Definitions
// ──────────────────────────────────────────────────────────

export type WillStep =
  | "personal"
  | "declaration"
  | "executor"
  | "beneficiaries"
  | "bequests"
  | "debts"
  | "burial"
  | "witnesses"
  | "review";

export interface WillStepConfig {
  key: WillStep;
  label: string;
  shortLabel: string;
  description: string;
}

export const WILL_STEPS: WillStepConfig[] = [
  { key: "personal", label: "Personal Details", shortLabel: "Personal", description: "Your identifying information as the testator" },
  { key: "declaration", label: "Declaration", shortLabel: "Declaration", description: "Confirm your intent and mental capacity" },
  { key: "executor", label: "Executor", shortLabel: "Executor", description: "The person responsible for carrying out your will" },
  { key: "beneficiaries", label: "Beneficiaries", shortLabel: "Beneficiaries", description: "People who will benefit from your estate" },
  { key: "bequests", label: "Specific Bequests", shortLabel: "Bequests", description: "Particular items or amounts you wish to leave" },
  { key: "debts", label: "Debts & Obligations", shortLabel: "Debts", description: "Outstanding debts that must be settled from the estate" },
  { key: "burial", label: "Burial & Funeral Wishes", shortLabel: "Burial", description: "Your wishes for burial and funeral arrangements" },
  { key: "witnesses", label: "Witnesses", shortLabel: "Witnesses", description: "Two witnesses are required" },
  { key: "review", label: "Review & Confirm", shortLabel: "Review", description: "Review everything before saving" },
];

// ──────────────────────────────────────────────────────────
// Field Definitions
// ──────────────────────────────────────────────────────────

export const PERSONAL_FIELDS: FieldDef[] = [
  { key: "fullName", label: "Full Legal Name", type: "text", required: true, placeholder: "As it appears on your ID" },
  { key: "email", label: "Email Address", type: "email", placeholder: "you@example.com", gridHalf: true },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 072 123 4567", gridHalf: true },
  { key: "dateOfBirth", label: "Date of Birth", type: "date", gridHalf: true },
  { key: "address", label: "Residential Address", type: "text", required: true, placeholder: "Street, city, postal code" },
  { key: "countryState", label: "Country / State / Province", type: "text", required: true, placeholder: "e.g. South Africa, Western Cape" },
];

export const DECLARATION_FIELDS: FieldDef[] = [
  {
    key: "soundMind",
    label: "Sound Mind Confirmation",
    type: "text",
    required: true,
    placeholder: "Type \"yes\" to confirm",
    helperText: "I confirm that I am of sound mind and making this will voluntarily",
  },
  {
    key: "faithStatement",
    label: "Faith Statement",
    type: "textarea",
    rows: 3,
    placeholder: "I bear witness that there is no god but Allah and that Muhammad (peace be upon him) is His Messenger...",
    helperText: "Optional declaration of faith (Shahada) to appear at the beginning of your will",
  },
  {
    key: "revokePrevious",
    label: "Revoke Previous Wills",
    type: "text",
    placeholder: "Type \"yes\" to revoke all previous wills",
    helperText: "This will revoke any previous wills or codicils you have made",
  },
];

export const EXECUTOR_FIELDS: FieldDef[] = [
  { key: "fullName", label: "Executor's Full Name", type: "text", required: true, placeholder: "Full legal name" },
  { key: "relationship", label: "Relationship to You", type: "text", required: true, placeholder: "e.g. Spouse, Son, Brother, Friend" },
  { key: "email", label: "Email Address", type: "email", placeholder: "executor@example.com", gridHalf: true },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 072 123 4567", gridHalf: true },
  { key: "address", label: "Address", type: "text", placeholder: "Executor's residential address" },
];

export const BENEFICIARY_FIELDS: FieldDef[] = [
  { key: "name", label: "Beneficiary Name", type: "text", required: true, placeholder: "Full name", gridHalf: true },
  { key: "relationship", label: "Relationship", type: "text", required: true, placeholder: "e.g. Son, Daughter, Spouse", gridHalf: true },
  { key: "notes", label: "Notes", type: "textarea", rows: 2, placeholder: "Any additional details (optional)" },
];

export const BEQUEST_FIELDS: FieldDef[] = [
  { key: "description", label: "Item / Amount Description", type: "text", required: true, placeholder: "e.g. R10,000 cash, gold watch, property at..." },
  { key: "recipient", label: "Recipient", type: "text", required: true, placeholder: "Name of the person or organisation", gridHalf: true },
  { key: "notes", label: "Notes", type: "textarea", rows: 2, placeholder: "Any conditions or details (optional)" },
];

export const DEBT_FIELDS: FieldDef[] = [
  { key: "description", label: "Debt Description", type: "text", required: true, placeholder: "e.g. Home loan, personal loan to..." },
  { key: "amount", label: "Approximate Amount", type: "text", placeholder: "e.g. R150,000", gridHalf: true },
  { key: "creditor", label: "Creditor / Owed To", type: "text", required: true, placeholder: "Bank, person, or organisation", gridHalf: true },
];

export const BURIAL_FIELDS: FieldDef[] = [
  {
    key: "notes",
    label: "Burial & Funeral Wishes",
    type: "textarea",
    rows: 5,
    placeholder: "Describe your wishes for burial, e.g.:\n- Burial according to Islamic rites\n- Preferred cemetery\n- Ghusl and Janazah prayer instructions\n- Any other arrangements",
    helperText: "These wishes will be communicated to your executor and family",
  },
];

export const WILL_WITNESS_FIELDS: FieldDef[] = [
  { key: "fullName", label: "Full Name", type: "text", required: true },
  { key: "email", label: "Email Address", type: "email", gridHalf: true },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 072 123 4567", gridHalf: true },
];

// ──────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────

export interface WillValidationError {
  step: WillStep;
  field: string;
  message: string;
}

function validateFields(
  step: WillStep,
  fields: FieldDef[],
  data: Record<string, string>,
  prefix?: string,
): WillValidationError[] {
  const errors: WillValidationError[] = [];

  for (const field of fields) {
    const value = data[field.key]?.trim() || "";
    const fieldKey = prefix ? `${prefix}.${field.key}` : field.key;

    if (field.required && !value) {
      errors.push({ step, field: fieldKey, message: `${field.label} is required` });
      continue;
    }

    if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push({ step, field: fieldKey, message: "Please enter a valid email" });
    }

    if (field.type === "tel" && value && !/^[\d\s+()-]{7,15}$/.test(value)) {
      errors.push({ step, field: fieldKey, message: "Please enter a valid phone number" });
    }
  }

  return errors;
}

/** Validate a single section of the will */
export function validateWillSection(
  step: WillStep,
  data: IslamicWillData,
): WillValidationError[] {
  switch (step) {
    case "personal":
      return validateFields(step, PERSONAL_FIELDS, data.personal as unknown as Record<string, string>);
    case "declaration": {
      const errs = validateFields(step, DECLARATION_FIELDS, data.declaration as unknown as Record<string, string>);
      if (data.declaration.soundMind && data.declaration.soundMind.toLowerCase() !== "yes") {
        errs.push({ step, field: "soundMind", message: "Please type \"yes\" to confirm you are of sound mind" });
      }
      return errs;
    }
    case "executor":
      return validateFields(step, EXECUTOR_FIELDS, data.executor as unknown as Record<string, string>);
    case "beneficiaries": {
      const errs: WillValidationError[] = [];
      if (data.beneficiaries.length === 0) {
        errs.push({ step, field: "beneficiaries", message: "At least one beneficiary is required" });
      }
      data.beneficiaries.forEach((b, i) => {
        errs.push(...validateFields(step, BENEFICIARY_FIELDS, b as unknown as Record<string, string>, `beneficiary_${i}`));
      });
      return errs;
    }
    case "bequests": {
      const errs: WillValidationError[] = [];
      data.bequests.forEach((b, i) => {
        errs.push(...validateFields(step, BEQUEST_FIELDS, b as unknown as Record<string, string>, `bequest_${i}`));
      });
      return errs;
    }
    case "debts": {
      const errs: WillValidationError[] = [];
      data.debts.forEach((d, i) => {
        errs.push(...validateFields(step, DEBT_FIELDS, d as unknown as Record<string, string>, `debt_${i}`));
      });
      return errs;
    }
    case "burial":
      return []; // burial is entirely optional
    case "witnesses": {
      const w1 = validateFields(step, WILL_WITNESS_FIELDS, data.witness1 as unknown as Record<string, string>, "w1");
      const w2 = validateFields(step, WILL_WITNESS_FIELDS, data.witness2 as unknown as Record<string, string>, "w2");
      return [...w1, ...w2];
    }
    case "review":
      return [];
    default:
      return [];
  }
}

/** Validate the entire will form */
export function validateWillForm(data: IslamicWillData): WillValidationError[] {
  const steps: WillStep[] = ["personal", "declaration", "executor", "beneficiaries", "bequests", "debts", "burial", "witnesses"];
  return steps.flatMap((step) => validateWillSection(step, data));
}

// ──────────────────────────────────────────────────────────
// Serialization (structured ↔ flat Firestore record)
// ──────────────────────────────────────────────────────────

/** Convert structured IslamicWillData to a flat Record for Firestore */
export function willDataToRecord(data: IslamicWillData): Record<string, string> {
  const flat: Record<string, string> = {};

  // Simple sections
  for (const section of ["personal", "declaration", "executor", "burial", "witness1", "witness2"] as const) {
    for (const [key, value] of Object.entries(data[section] as unknown as Record<string, string>)) {
      flat[`${section}.${key}`] = value || "";
    }
  }

  // Arrays — JSON-encode them
  flat["_beneficiaries"] = JSON.stringify(data.beneficiaries);
  flat["_bequests"] = JSON.stringify(data.bequests);
  flat["_debts"] = JSON.stringify(data.debts);

  return flat;
}

/** Convert flat Record back to structured IslamicWillData */
export function recordToWillData(record: Record<string, string>): IslamicWillData {
  const data = emptyWillData();

  for (const [flatKey, value] of Object.entries(record)) {
    if (flatKey.startsWith("_")) continue; // arrays handled below
    const [section, key] = flatKey.split(".");
    if (section && key && section in data) {
      (data as any)[section][key] = value;
    }
  }

  // Arrays
  try { data.beneficiaries = JSON.parse(record["_beneficiaries"] || "[]"); } catch { /* keep default */ }
  try { data.bequests = JSON.parse(record["_bequests"] || "[]"); } catch { /* keep default */ }
  try { data.debts = JSON.parse(record["_debts"] || "[]"); } catch { /* keep default */ }

  // Ensure at least one beneficiary
  if (data.beneficiaries.length === 0) {
    data.beneficiaries = [{ name: "", relationship: "", notes: "" }];
  }

  return data;
}
