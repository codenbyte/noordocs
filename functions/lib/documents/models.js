"use strict";
/**
 * NoorSpace Documents — Domain Models
 *
 * Core entities for the document management system.
 * These interfaces define the shape of data at rest (Firestore)
 * and serve as the canonical source of truth for the domain.
 *
 * All timestamps are Firestore Timestamps or ISO strings depending on context.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCUMENT_STATUS_LABELS = exports.DOCUMENT_TYPE_LABELS = exports.TEMPLATES = exports.ISLAMIC_WILL_TEMPLATE = exports.NIKAH_CONTRACT_TEMPLATE = void 0;
// ──────────────────────────────────────────────────────────
// Template Definitions (Phase 1 — hardcoded, future: DB-driven)
// ──────────────────────────────────────────────────────────
exports.NIKAH_CONTRACT_TEMPLATE = {
    type: "nikah_contract",
    name: "Nikah Contract",
    description: "Islamic marriage contract with mahr, witnesses, and imam certification.",
    version: 1,
    participantRoles: ["creator", "spouse", "witness", "witness", "imam"],
    active: true,
    sections: [
        {
            key: "groom",
            label: "Groom Details",
            fields: [
                { key: "groomName", label: "Full Name of Groom", type: "text", required: true },
                { key: "groomIdNumber", label: "ID / Passport Number", type: "text", required: true },
                { key: "groomAddress", label: "Residential Address", type: "text", required: false },
                { key: "groomFatherName", label: "Father's Name", type: "text", required: false },
            ],
        },
        {
            key: "bride",
            label: "Bride Details",
            fields: [
                { key: "brideName", label: "Full Name of Bride", type: "text", required: true },
                { key: "brideIdNumber", label: "ID / Passport Number", type: "text", required: true },
                { key: "brideAddress", label: "Residential Address", type: "text", required: false },
                { key: "brideFatherName", label: "Father's Name (Wali)", type: "text", required: false },
            ],
        },
        {
            key: "mahr",
            label: "Mahr (Dowry)",
            fields: [
                { key: "mahrAmount", label: "Mahr Amount", type: "text", required: true },
                { key: "mahrDescription", label: "Description", type: "textarea", required: false, placeholder: "e.g. R5,000 cash, gold jewellery" },
                { key: "mahrPaymentTerms", label: "Payment Terms", type: "text", required: false, placeholder: "e.g. Paid in full at Nikah" },
            ],
        },
        {
            key: "ceremony",
            label: "Ceremony Details",
            fields: [
                { key: "ceremonyDate", label: "Date of Nikah", type: "date", required: true },
                { key: "ceremonyLocation", label: "Location", type: "text", required: false },
                { key: "imamName", label: "Officiating Imam", type: "text", required: false },
            ],
        },
        {
            key: "witnesses",
            label: "Witnesses",
            fields: [
                { key: "witness1Name", label: "Witness 1 Full Name", type: "text", required: true },
                { key: "witness2Name", label: "Witness 2 Full Name", type: "text", required: true },
            ],
        },
        {
            key: "conditions",
            label: "Additional Terms",
            fields: [
                { key: "additionalConditions", label: "Conditions", type: "textarea", required: false, placeholder: "Any conditions agreed upon by both parties" },
            ],
        },
    ],
};
exports.ISLAMIC_WILL_TEMPLATE = {
    type: "islamic_will",
    name: "Islamic Will",
    description: "Will prepared according to Islamic inheritance principles.",
    version: 1,
    participantRoles: ["creator", "executor", "witness", "witness"],
    active: true,
    sections: [
        {
            key: "testator",
            label: "Testator (You)",
            fields: [
                { key: "testatorName", label: "Full Legal Name", type: "text", required: true },
                { key: "testatorIdNumber", label: "ID / Passport Number", type: "text", required: true },
                { key: "testatorAddress", label: "Residential Address", type: "text", required: false },
            ],
        },
        {
            key: "declaration",
            label: "Islamic Declaration",
            fields: [
                { key: "declaration", label: "Declaration", type: "textarea", required: false, placeholder: "I declare that I am a Muslim and wish to have my estate distributed according to Islamic Shariah law..." },
            ],
        },
        {
            key: "executor",
            label: "Executor",
            fields: [
                { key: "executorName", label: "Executor Full Name", type: "text", required: true },
                { key: "executorIdNumber", label: "Executor ID / Passport", type: "text", required: false },
                { key: "executorRelation", label: "Relationship to Testator", type: "text", required: false },
            ],
        },
        {
            key: "bequests",
            label: "Bequests (Wasiyyah)",
            fields: [
                { key: "bequests", label: "Specific Bequests", type: "textarea", required: false, placeholder: "List specific bequests (max 1/3 of estate)..." },
            ],
        },
        {
            key: "debts",
            label: "Debts & Obligations",
            fields: [
                { key: "outstandingDebts", label: "Outstanding Debts", type: "textarea", required: false, placeholder: "List debts to be settled from the estate..." },
            ],
        },
        {
            key: "funeral",
            label: "Funeral Arrangements",
            fields: [
                { key: "funeralWishes", label: "Funeral Wishes", type: "textarea", required: false, placeholder: "e.g. Ghusl, Janazah prayer, burial preferences..." },
            ],
        },
        {
            key: "witnesses",
            label: "Witnesses",
            fields: [
                { key: "witness1Name", label: "Witness 1 Full Name", type: "text", required: true },
                { key: "witness2Name", label: "Witness 2 Full Name", type: "text", required: true },
            ],
        },
        {
            key: "execution",
            label: "Execution",
            fields: [
                { key: "willDate", label: "Date", type: "date", required: true },
            ],
        },
    ],
};
/** Quick lookup of templates by type */
exports.TEMPLATES = {
    nikah_contract: exports.NIKAH_CONTRACT_TEMPLATE,
    islamic_will: exports.ISLAMIC_WILL_TEMPLATE,
};
/** Human-readable labels */
exports.DOCUMENT_TYPE_LABELS = {
    nikah_contract: "Nikah Contract",
    islamic_will: "Islamic Will",
};
exports.DOCUMENT_STATUS_LABELS = {
    draft: "Draft",
    pending_review: "Pending Review",
    reviewed: "Reviewed",
    needs_changes: "Needs Changes",
    sent_for_signature: "Sent for Signature",
    partially_signed: "Partially Signed",
    completed: "Completed",
    rejected: "Rejected",
    archived: "Archived",
};
//# sourceMappingURL=models.js.map