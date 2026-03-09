/**
 * NoorSpace — Nikah Contract Types & Validation
 *
 * Dedicated types for the Nikah Contract builder.
 * Separated from generic document types for clarity.
 */

// ──────────────────────────────────────────────────────────
// Person Blocks (reusable across sections)
// ──────────────────────────────────────────────────────────

export interface PersonDetails {
  fullName: string;
  email: string;
  phone: string;
}

export interface PartyDetails extends PersonDetails {
  dateOfBirth: string;
  address: string;
}

export interface WaliDetails extends PersonDetails {
  relationship: string;
}

export interface ImamDetails extends PersonDetails {
  mosqueName: string;
}

export interface NikahDetails {
  nikahDate: string;
  nikahLocation: string;
  mahrAmount: string;
  mahrDescription: string;
  specialConditions: string;
  additionalNotes: string;
}

// ──────────────────────────────────────────────────────────
// Full Nikah Contract Form Data
// ──────────────────────────────────────────────────────────

export interface NikahContractData {
  bride: PartyDetails;
  groom: PartyDetails;
  wali: WaliDetails;
  witness1: PersonDetails;
  witness2: PersonDetails;
  imam: ImamDetails;
  nikah: NikahDetails;
}

/** Empty state factory */
export function emptyNikahData(): NikahContractData {
  return {
    bride: { fullName: "", email: "", phone: "", dateOfBirth: "", address: "" },
    groom: { fullName: "", email: "", phone: "", dateOfBirth: "", address: "" },
    wali: { fullName: "", relationship: "", email: "", phone: "" },
    witness1: { fullName: "", email: "", phone: "" },
    witness2: { fullName: "", email: "", phone: "" },
    imam: { fullName: "", mosqueName: "", email: "", phone: "" },
    nikah: { nikahDate: "", nikahLocation: "", mahrAmount: "", mahrDescription: "", specialConditions: "", additionalNotes: "" },
  };
}

// ──────────────────────────────────────────────────────────
// Step Definitions
// ──────────────────────────────────────────────────────────

export type NikahStep =
  | "bride"
  | "groom"
  | "wali"
  | "witnesses"
  | "imam"
  | "nikah"
  | "review";

export interface StepConfig {
  key: NikahStep;
  label: string;
  shortLabel: string;
  description: string;
}

export const NIKAH_STEPS: StepConfig[] = [
  { key: "bride", label: "Bride Details", shortLabel: "Bride", description: "Information about the bride" },
  { key: "groom", label: "Groom Details", shortLabel: "Groom", description: "Information about the groom" },
  { key: "wali", label: "Wali (Guardian)", shortLabel: "Wali", description: "The bride's guardian or representative" },
  { key: "witnesses", label: "Witnesses", shortLabel: "Witnesses", description: "Two witnesses are required for the Nikah" },
  { key: "imam", label: "Imam / Officiant", shortLabel: "Imam", description: "The person who will officiate the Nikah" },
  { key: "nikah", label: "Nikah Details", shortLabel: "Nikah", description: "Date, location, mahr, and any special terms" },
  { key: "review", label: "Review & Confirm", shortLabel: "Review", description: "Review everything before saving" },
];

// ──────────────────────────────────────────────────────────
// Field Definitions (drives the reusable form components)
// ──────────────────────────────────────────────────────────

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "textarea";
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  rows?: number;
  gridHalf?: boolean; // render at 50% width on desktop
}

export const BRIDE_FIELDS: FieldDef[] = [
  { key: "fullName", label: "Full Name", type: "text", required: true, placeholder: "As it appears on ID" },
  { key: "email", label: "Email Address", type: "email", placeholder: "bride@example.com", gridHalf: true },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 072 123 4567", gridHalf: true },
  { key: "dateOfBirth", label: "Date of Birth", type: "date", gridHalf: true },
  { key: "address", label: "Residential Address", type: "text", placeholder: "Street, city, postal code" },
];

export const GROOM_FIELDS: FieldDef[] = [
  { key: "fullName", label: "Full Name", type: "text", required: true, placeholder: "As it appears on ID" },
  { key: "email", label: "Email Address", type: "email", placeholder: "groom@example.com", gridHalf: true },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 072 123 4567", gridHalf: true },
  { key: "dateOfBirth", label: "Date of Birth", type: "date", gridHalf: true },
  { key: "address", label: "Residential Address", type: "text", placeholder: "Street, city, postal code" },
];

export const WALI_FIELDS: FieldDef[] = [
  { key: "fullName", label: "Full Name", type: "text", required: true, placeholder: "Guardian's full name" },
  { key: "relationship", label: "Relationship to Bride", type: "text", required: true, placeholder: "e.g. Father, Brother, Uncle", helperText: "The Wali is typically the bride's father or closest male relative" },
  { key: "email", label: "Email Address", type: "email", placeholder: "wali@example.com", gridHalf: true },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 072 123 4567", gridHalf: true },
];

export const WITNESS_FIELDS: FieldDef[] = [
  { key: "fullName", label: "Full Name", type: "text", required: true },
  { key: "email", label: "Email Address", type: "email", gridHalf: true },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 072 123 4567", gridHalf: true },
];

export const IMAM_FIELDS: FieldDef[] = [
  { key: "fullName", label: "Full Name", type: "text", required: true, placeholder: "Imam's full name" },
  { key: "mosqueName", label: "Mosque / Organisation", type: "text", placeholder: "e.g. Masjid Al-Quds", helperText: "The mosque or organisation the imam is affiliated with" },
  { key: "email", label: "Email Address", type: "email", placeholder: "imam@masjid.org", gridHalf: true },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 072 123 4567", gridHalf: true },
];

export const NIKAH_DETAIL_FIELDS: FieldDef[] = [
  { key: "nikahDate", label: "Date of Nikah", type: "date", required: true },
  { key: "nikahLocation", label: "Location", type: "text", required: true, placeholder: "e.g. Masjid Al-Quds, Cape Town" },
  { key: "mahrAmount", label: "Mahr Amount", type: "text", required: true, placeholder: "e.g. R5,000", helperText: "The gift from the groom to the bride — this is her right" },
  { key: "mahrDescription", label: "Mahr Description", type: "textarea", placeholder: "Describe the mahr in detail (e.g. R5,000 cash, gold ring, etc.)", rows: 2 },
  { key: "specialConditions", label: "Special Conditions", type: "textarea", placeholder: "Any conditions agreed upon by both parties (optional)", helperText: "Both bride and groom may include conditions, e.g. right to work, education, etc.", rows: 3 },
  { key: "additionalNotes", label: "Additional Notes", type: "textarea", placeholder: "Any other information relevant to this Nikah", rows: 2 },
];

// ──────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────

export interface ValidationError {
  step: NikahStep;
  field: string;
  message: string;
}

/** Validate a single section. Returns errors for that section. */
export function validateSection(
  step: NikahStep,
  fields: FieldDef[],
  data: Record<string, string>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const value = data[field.key]?.trim() || "";

    if (field.required && !value) {
      errors.push({ step, field: field.key, message: `${field.label} is required` });
      continue;
    }

    if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push({ step, field: field.key, message: "Please enter a valid email" });
    }

    if (field.type === "tel" && value && !/^[\d\s+()-]{7,15}$/.test(value)) {
      errors.push({ step, field: field.key, message: "Please enter a valid phone number" });
    }
  }

  return errors;
}

/** Validate the entire form. Returns all errors grouped by step. */
export function validateNikahForm(data: NikahContractData): ValidationError[] {
  return [
    ...validateSection("bride", BRIDE_FIELDS, data.bride as unknown as Record<string, string>),
    ...validateSection("groom", GROOM_FIELDS, data.groom as unknown as Record<string, string>),
    ...validateSection("wali", WALI_FIELDS, data.wali as unknown as Record<string, string>),
    ...validateSection("witnesses", WITNESS_FIELDS, data.witness1 as unknown as Record<string, string>).map((e) => ({ ...e, field: `witness1.${e.field}` })),
    ...validateSection("witnesses", WITNESS_FIELDS, data.witness2 as unknown as Record<string, string>).map((e) => ({ ...e, field: `witness2.${e.field}` })),
    ...validateSection("imam", IMAM_FIELDS, data.imam as unknown as Record<string, string>),
    ...validateSection("nikah", NIKAH_DETAIL_FIELDS, data.nikah as unknown as Record<string, string>),
  ];
}

/** Convert structured NikahContractData to a flat Record for Firestore */
export function nikahDataToRecord(data: NikahContractData): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [section, fields] of Object.entries(data)) {
    for (const [key, value] of Object.entries(fields as Record<string, string>)) {
      flat[`${section}.${key}`] = value || "";
    }
  }
  return flat;
}

/** Convert flat Record back to structured NikahContractData */
export function recordToNikahData(record: Record<string, string>): NikahContractData {
  const data = emptyNikahData();
  for (const [flatKey, value] of Object.entries(record)) {
    const [section, key] = flatKey.split(".");
    if (section && key && section in data) {
      (data as any)[section][key] = value;
    }
  }
  return data;
}
