-- Auto Bat Man: Support Tickets, Feature Requests, Feature Votes, FAQ Items

-- SupportTicket
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id"             TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "user_id"        TEXT NOT NULL,
  "type"           TEXT NOT NULL,
  "titre"          TEXT NOT NULL,
  "message"        TEXT NOT NULL,
  "page_url"       TEXT,
  "entity_name"    TEXT,
  "screenshot_url" TEXT,
  "attachments"    TEXT,
  "statut"         TEXT NOT NULL DEFAULT 'OUVERT',
  "priorite"       TEXT NOT NULL DEFAULT 'MEDIUM',
  "admin_notes"    TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportTicket_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SupportTicket_tenant_id_idx" ON "SupportTicket"("tenant_id");
CREATE INDEX IF NOT EXISTS "SupportTicket_statut_idx" ON "SupportTicket"("statut");

-- FeatureRequest
CREATE TABLE IF NOT EXISTS "FeatureRequest" (
  "id"          TEXT NOT NULL,
  "tenant_id"   TEXT NOT NULL,
  "user_id"     TEXT NOT NULL,
  "titre"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "statut"      TEXT NOT NULL DEFAULT 'PENDING',
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeatureRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FeatureRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FeatureRequest_statut_idx" ON "FeatureRequest"("statut");

-- FeatureVote
CREATE TABLE IF NOT EXISTS "FeatureVote" (
  "id"                 TEXT NOT NULL,
  "user_id"            TEXT NOT NULL,
  "feature_request_id" TEXT NOT NULL,
  "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeatureVote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FeatureVote_user_id_feature_request_id_key" UNIQUE ("user_id", "feature_request_id"),
  CONSTRAINT "FeatureVote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FeatureVote_feature_request_id_fkey" FOREIGN KEY ("feature_request_id") REFERENCES "FeatureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- FaqItem
CREATE TABLE IF NOT EXISTS "FaqItem" (
  "id"        TEXT NOT NULL,
  "categorie" TEXT NOT NULL,
  "question"  TEXT NOT NULL,
  "reponse"   TEXT NOT NULL,
  "ordre"     INTEGER NOT NULL DEFAULT 0,
  "actif"     BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);
