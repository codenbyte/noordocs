-- ============================================================
-- NoorSpace Documents — Postgres Schema (Future Migration Reference)
--
-- This schema mirrors the Firestore data model used in Phase 1.
-- Use this as the migration target when moving to Postgres.
--
-- Run with: psql -d noorspace -f schema.sql
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────

CREATE TYPE document_type AS ENUM ('nikah_contract', 'islamic_will');

CREATE TYPE document_status AS ENUM (
  'draft',
  'pending_review',
  'reviewed',
  'sent_for_signature',
  'partially_signed',
  'completed',
  'rejected',
  'archived'
);

CREATE TYPE participant_role AS ENUM (
  'creator',
  'spouse',
  'witness',
  'imam',
  'executor',
  'admin'
);

CREATE TYPE signature_status AS ENUM ('pending', 'signed', 'declined', 'expired');

CREATE TYPE review_decision AS ENUM ('approved', 'rejected');

CREATE TYPE audit_action AS ENUM (
  'document.created',
  'document.updated',
  'document.submitted_for_review',
  'document.approved',
  'document.rejected',
  'document.sent_for_signature',
  'document.signed',
  'document.declined',
  'document.completed',
  'document.archived',
  'participant.added',
  'participant.removed',
  'review.note_added'
);

-- ── Document Templates ───────────────────────────────────
-- Phase 2: DB-driven templates. Phase 1 uses hardcoded templates.

CREATE TABLE document_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          document_type NOT NULL,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  version       INTEGER NOT NULL DEFAULT 1,
  sections      JSONB NOT NULL DEFAULT '[]',
  participant_roles participant_role[] NOT NULL DEFAULT '{}',
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Documents ────────────────────────────────────────────

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id     UUID REFERENCES document_templates(id),
  type            document_type NOT NULL,
  title           VARCHAR(200) NOT NULL,
  status          document_status NOT NULL DEFAULT 'draft',

  -- Creator (denormalized for fast reads)
  creator_uid     VARCHAR(128) NOT NULL,
  creator_name    VARCHAR(200) NOT NULL,
  creator_email   VARCHAR(320) NOT NULL,

  -- Form data (template field values)
  data            JSONB NOT NULL DEFAULT '{}',

  -- Review
  review          JSONB,  -- { reviewerUid, reviewerName, decision, note, reviewedAt }

  -- Signing
  signature_request_id UUID,
  signing_expires_at   TIMESTAMPTZ,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ
);

CREATE INDEX idx_documents_creator ON documents(creator_uid);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_creator_status ON documents(creator_uid, status);

-- ── Document Participants ────────────────────────────────

CREATE TABLE document_participants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  uid               VARCHAR(128),  -- NoorSpace user ID (null if external)
  name              VARCHAR(200) NOT NULL,
  email             VARCHAR(320) NOT NULL DEFAULT '',
  role              participant_role NOT NULL,
  signature_status  signature_status NOT NULL DEFAULT 'pending',
  signed_at         TIMESTAMPTZ,
  signature_data    TEXT,  -- base64 PNG (internal provider)
  signing_url       TEXT,  -- external provider URL
  sort_order        INTEGER NOT NULL DEFAULT 0,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_participants_document ON document_participants(document_id);
CREATE INDEX idx_participants_uid ON document_participants(uid);
CREATE INDEX idx_participants_email ON document_participants(email);

-- ── Signature Requests ───────────────────────────────────
-- Tracks external signing sessions

CREATE TABLE signature_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  provider        VARCHAR(50) NOT NULL DEFAULT 'internal',
  external_id     VARCHAR(500),  -- provider's reference
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  signing_urls    JSONB NOT NULL DEFAULT '{}',
  webhook_secret  VARCHAR(256),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_sig_requests_document ON signature_requests(document_id);
CREATE INDEX idx_sig_requests_external ON signature_requests(external_id);

-- ── Signature Events ─────────────────────────────────────
-- Immutable record of each signing action

CREATE TABLE signature_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  participant_id    UUID NOT NULL REFERENCES document_participants(id),
  participant_name  VARCHAR(200) NOT NULL,
  participant_email VARCHAR(320) NOT NULL DEFAULT '',
  status            VARCHAR(20) NOT NULL,  -- 'signed' | 'declined'
  signature_data    TEXT,
  ip                INET,
  user_agent        TEXT,
  signed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sig_events_document ON signature_events(document_id);

-- ── Audit Log ────────────────────────────────────────────
-- Append-only trail of every action on a document

CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action        audit_action NOT NULL,
  actor_uid     VARCHAR(128) NOT NULL,
  actor_name    VARCHAR(200) NOT NULL,
  actor_email   VARCHAR(320),
  metadata      JSONB,
  ip            INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_document ON audit_log(document_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_actor ON audit_log(actor_uid);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ── Document Reviews ─────────────────────────────────────
-- Separate table for review history (optional — can also use JSONB on documents)

CREATE TABLE document_reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reviewer_uid    VARCHAR(128) NOT NULL,
  reviewer_name   VARCHAR(200) NOT NULL,
  decision        review_decision NOT NULL,
  note            TEXT,
  reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_document ON document_reviews(document_id);
CREATE INDEX idx_reviews_reviewer ON document_reviews(reviewer_uid);

-- ── Updated_at Trigger ───────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_updated
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_participants_updated
  BEFORE UPDATE ON document_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sig_requests_updated
  BEFORE UPDATE ON signature_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
