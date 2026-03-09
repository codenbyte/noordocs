export type DocumentType = 'nikah_contract' | 'islamic_will';

export type DocumentStatus =
  | 'draft'
  | 'pending_review'
  | 'reviewed'
  | 'needs_changes'
  | 'pending_signatures'
  | 'partially_signed'
  | 'completed'
  | 'rejected'
  | 'archived';

export type ReviewDecision = 'approved' | 'rejected' | 'changes_requested';

export interface DocumentReview {
  reviewerUid: string;
  reviewerName: string;
  decision: ReviewDecision;
  note?: string;
  reviewedAt: any;
}

export type SignerStatus = 'pending' | 'signed' | 'declined';

export type AuditAction =
  | 'created'
  | 'updated'
  | 'submitted_for_review'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'reviewer_assigned'
  | 'sent_for_signatures'
  | 'signed'
  | 'declined'
  | 'completed';

export interface DocumentSigner {
  uid?: string;
  name: string;
  email: string;
  role: string;
  status: SignerStatus;
  signedAt?: any;
  signatureData?: string;
}

export interface NoorDocument {
  id: string;
  type: DocumentType;
  title: string;
  status: DocumentStatus;
  createdBy: string;
  createdByName: string;
  data: Record<string, any>;
  signers: DocumentSigner[];
  // Review tracking
  review?: DocumentReview;
  assignedReviewerUid?: string;
  assignedReviewerName?: string;
  // Legacy flat review fields (Phase 1 compat)
  reviewerUid?: string;
  reviewerName?: string;
  reviewNote?: string;
  rejectionReason?: string;
  completedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actorUid: string;
  actorName: string;
  details?: string;
  createdAt: any;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  nikah_contract: 'Nikah Contract',
  islamic_will: 'Islamic Will',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  reviewed: 'Approved',
  needs_changes: 'Needs Changes',
  pending_signatures: 'Awaiting Signatures',
  partially_signed: 'Partially Signed',
  completed: 'Completed',
  rejected: 'Rejected',
  archived: 'Archived',
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  draft: 'default',
  pending_review: 'warning',
  reviewed: 'success',
  needs_changes: 'warning',
  pending_signatures: 'info',
  partially_signed: 'warning',
  completed: 'success',
  rejected: 'error',
  archived: 'default',
};

// --- Template field definitions ---

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'textarea' | 'number';
  required?: boolean;
  placeholder?: string;
  section: string;
}

export const NIKAH_CONTRACT_FIELDS: TemplateField[] = [
  // Groom
  { key: 'groomName', label: 'Full Name of Groom', type: 'text', required: true, section: 'Groom Details' },
  { key: 'groomIdNumber', label: 'ID / Passport Number', type: 'text', required: true, section: 'Groom Details' },
  { key: 'groomAddress', label: 'Residential Address', type: 'text', section: 'Groom Details' },
  { key: 'groomFatherName', label: "Father's Name", type: 'text', section: 'Groom Details' },
  // Bride
  { key: 'brideName', label: 'Full Name of Bride', type: 'text', required: true, section: 'Bride Details' },
  { key: 'brideIdNumber', label: 'ID / Passport Number', type: 'text', required: true, section: 'Bride Details' },
  { key: 'brideAddress', label: 'Residential Address', type: 'text', section: 'Bride Details' },
  { key: 'brideFatherName', label: "Father's Name (Wali)", type: 'text', section: 'Bride Details' },
  // Mahr
  { key: 'mahrAmount', label: 'Mahr Amount', type: 'text', required: true, section: 'Mahr (Dowry)' },
  { key: 'mahrDescription', label: 'Mahr Description', type: 'textarea', placeholder: 'e.g. R5,000 cash, gold jewellery, etc.', section: 'Mahr (Dowry)' },
  { key: 'mahrPaymentTerms', label: 'Payment Terms', type: 'text', placeholder: 'e.g. Paid in full at Nikah, deferred, etc.', section: 'Mahr (Dowry)' },
  // Ceremony
  { key: 'ceremonyDate', label: 'Date of Nikah', type: 'date', required: true, section: 'Ceremony Details' },
  { key: 'ceremonyLocation', label: 'Location', type: 'text', section: 'Ceremony Details' },
  { key: 'imamName', label: 'Officiating Imam', type: 'text', section: 'Ceremony Details' },
  // Witnesses
  { key: 'witness1Name', label: 'Witness 1 Full Name', type: 'text', required: true, section: 'Witnesses' },
  { key: 'witness2Name', label: 'Witness 2 Full Name', type: 'text', required: true, section: 'Witnesses' },
  // Conditions
  { key: 'additionalConditions', label: 'Additional Conditions', type: 'textarea', placeholder: 'Any conditions agreed upon by both parties', section: 'Additional Terms' },
];

export const ISLAMIC_WILL_FIELDS: TemplateField[] = [
  // Testator
  { key: 'testatorName', label: 'Full Legal Name', type: 'text', required: true, section: 'Testator (You)' },
  { key: 'testatorIdNumber', label: 'ID / Passport Number', type: 'text', required: true, section: 'Testator (You)' },
  { key: 'testatorAddress', label: 'Residential Address', type: 'text', section: 'Testator (You)' },
  // Islamic Declaration
  { key: 'declaration', label: 'Declaration', type: 'textarea', placeholder: 'I declare that I am a Muslim and wish to have my estate distributed according to Islamic Shariah law...', section: 'Islamic Declaration' },
  // Executor
  { key: 'executorName', label: 'Executor Full Name', type: 'text', required: true, section: 'Executor' },
  { key: 'executorIdNumber', label: 'Executor ID / Passport Number', type: 'text', section: 'Executor' },
  { key: 'executorRelation', label: 'Relationship to Testator', type: 'text', section: 'Executor' },
  // Bequests
  { key: 'bequests', label: 'Specific Bequests (Wasiyyah)', type: 'textarea', placeholder: 'List any specific bequests (max 1/3 of estate)...', section: 'Bequests (Wasiyyah)' },
  // Debts
  { key: 'outstandingDebts', label: 'Outstanding Debts', type: 'textarea', placeholder: 'List any debts to be settled from the estate...', section: 'Debts & Obligations' },
  // Funeral
  { key: 'funeralWishes', label: 'Funeral Wishes', type: 'textarea', placeholder: 'e.g. Ghusl, Janazah prayer, burial preferences...', section: 'Funeral Arrangements' },
  // Witnesses
  { key: 'witness1Name', label: 'Witness 1 Full Name', type: 'text', required: true, section: 'Witnesses' },
  { key: 'witness2Name', label: 'Witness 2 Full Name', type: 'text', required: true, section: 'Witnesses' },
  // Date
  { key: 'willDate', label: 'Date', type: 'date', required: true, section: 'Execution' },
];

export const NIKAH_SIGNER_ROLES = ['Groom', 'Bride', 'Witness 1', 'Witness 2', 'Imam'];
export const WILL_SIGNER_ROLES = ['Testator', 'Witness 1', 'Witness 2', 'Executor'];

export const TEMPLATE_FIELDS: Record<DocumentType, TemplateField[]> = {
  nikah_contract: NIKAH_CONTRACT_FIELDS,
  islamic_will: ISLAMIC_WILL_FIELDS,
};

export const SIGNER_ROLES: Record<DocumentType, string[]> = {
  nikah_contract: NIKAH_SIGNER_ROLES,
  islamic_will: WILL_SIGNER_ROLES,
};
