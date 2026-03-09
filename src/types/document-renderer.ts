/**
 * NoorSpace Documents — Renderable Document View Model
 *
 * Template-agnostic structure produced by template renderers and
 * consumed by the RenderedDocument preview component. This layer
 * sits between raw form data and final presentation — the same
 * model can drive in-app preview, PDF generation, and signature
 * field placement.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  Form Data  →  Template Renderer  →  DocumentViewModel  │
 * │                                          ↓              │
 * │                                   RenderedDocument       │
 * │                                   (preview / PDF)        │
 * └─────────────────────────────────────────────────────────┘
 */

// ──────────────────────────────────────────────────────────
// Atomic Field Types
// ──────────────────────────────────────────────────────────

/** A single label → value pair */
export interface DocField {
  label: string;
  value: string;
  /** Render at half-width on desktop (default: full width) */
  half?: boolean;
}

/** A row of fields rendered side-by-side */
export interface DocFieldRow {
  fields: DocField[];
}

// ──────────────────────────────────────────────────────────
// Content Blocks (union type — renders polymorphically)
// ──────────────────────────────────────────────────────────

/** Simple label/value field grid */
export interface FieldsBlock {
  kind: "fields";
  fields: DocField[];
}

/** Free-form paragraph text */
export interface ParagraphBlock {
  kind: "paragraph";
  text: string;
  /** Render in italic (e.g. for declarations, quotes) */
  italic?: boolean;
}

/** A list of items, each with their own field grid */
export interface ListBlock {
  kind: "list";
  items: Array<{
    title?: string;
    fields: DocField[];
  }>;
  emptyMessage?: string;
}

/** Signature placeholder for a participant */
export interface SignatureBlock {
  kind: "signature";
  signers: Array<{
    role: string;
    name: string;
    /** Base64 PNG if already signed */
    signatureData?: string;
    signedAt?: string;
    status: "pending" | "signed" | "declined" | "expired";
  }>;
}

/** A small notice/disclaimer box */
export interface NoticeBlock {
  kind: "notice";
  text: string;
  variant: "info" | "warning" | "legal";
}

export type ContentBlock =
  | FieldsBlock
  | ParagraphBlock
  | ListBlock
  | SignatureBlock
  | NoticeBlock;

// ──────────────────────────────────────────────────────────
// Document Section
// ──────────────────────────────────────────────────────────

export interface DocSection {
  /** Section heading (e.g. "Bride Details", "Executor") */
  title: string;
  /** Optional subtitle or contextual note */
  subtitle?: string;
  /** Ordered content blocks within this section */
  blocks: ContentBlock[];
}

// ──────────────────────────────────────────────────────────
// Document View Model (top-level)
// ──────────────────────────────────────────────────────────

export interface DocumentViewModel {
  /** Document title (e.g. "Nikah Contract") */
  title: string;
  /** Subtitle (e.g. "Marriage contract between ...") */
  subtitle?: string;
  /** Arabic heading (e.g. Bismillah) */
  arabicHeading?: string;
  /** Document type key */
  type: "nikah_contract" | "islamic_will";

  /** Ordered sections of content */
  sections: DocSection[];

  /** Signature area (rendered at the bottom) */
  signatures?: SignatureBlock;

  /** Metadata footer */
  metadata: {
    documentId?: string;
    createdAt?: string;
    createdBy?: string;
    status?: string;
    /** Quranic or prophetic reference */
    closingVerse?: string;
  };
}
