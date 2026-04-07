// Script de migration sécurisé : ajoute les colonnes manquantes en production
// Idempotent — utilise ADD COLUMN IF NOT EXISTS
// Exécuté à chaque déploiement après prisma db push
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
global.currentTenantId = null;

const migrations = [
  // Colonnes Tenant ajoutées progressivement
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "is_demo" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "badgeage_par_tache_defaut" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP(3)`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "smtp_host" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "smtp_port" INTEGER`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "smtp_secure" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "smtp_user" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "smtp_password" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "smtp_from" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "smtp_configured" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "gmail_email" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "gmail_refresh_token" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "objectif_ca_annuel" DOUBLE PRECISION`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "objectif_ca_mensuel" DOUBLE PRECISION`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "objectif_taux_acceptation" DOUBLE PRECISION`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "objectif_taux_encaissement" DOUBLE PRECISION`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "objectif_nb_chantiers_mois" INTEGER`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "objectif_delai_paiement" INTEGER`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "cgu_accepted_at" TIMESTAMP(3)`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "cgv_accepted_at" TIMESTAMP(3)`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "couleur_primaire" TEXT NOT NULL DEFAULT '#FF9F43'`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "rib" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "bic" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "capital" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "rcs" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "tva_intra" TEXT`,
  `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logo_url" TEXT`,
  // Ouvrage : colonnes coûts détaillés (ajoutées v1.1.0)
  `ALTER TABLE "Ouvrage" ADD COLUMN IF NOT EXISTS "cout_ht" DOUBLE PRECISION`,
  `ALTER TABLE "Ouvrage" ADD COLUMN IF NOT EXISTS "cout_materiaux" DOUBLE PRECISION`,
  `ALTER TABLE "Ouvrage" ADD COLUMN IF NOT EXISTS "cout_materiel" DOUBLE PRECISION`,
  `ALTER TABLE "Ouvrage" ADD COLUMN IF NOT EXISTS "cout_main_oeuvre" DOUBLE PRECISION`,
  // Chantier : rendre adresse et GPS optionnels
  `ALTER TABLE "Chantier" ALTER COLUMN "adresse" DROP NOT NULL`,
  `ALTER TABLE "Chantier" ALTER COLUMN "code_postal" DROP NOT NULL`,
  `ALTER TABLE "Chantier" ALTER COLUMN "ville" DROP NOT NULL`,
  `ALTER TABLE "Chantier" ALTER COLUMN "latitude" DROP NOT NULL`,
  `ALTER TABLE "Chantier" ALTER COLUMN "longitude" DROP NOT NULL`,
  // Fournisseurs (nouvelles tables v1.3.0)
  `CREATE TABLE IF NOT EXISTS "Fournisseur" (
    "id"         TEXT NOT NULL,
    "tenant_id"  TEXT NOT NULL,
    "nom"        TEXT NOT NULL,
    "siret"      TEXT,
    "email"      TEXT,
    "telephone"  TEXT,
    "adresse"    TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fournisseur_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Fournisseur_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Fournisseur_tenant_id_idx" ON "Fournisseur"("tenant_id")`,
  `CREATE TABLE IF NOT EXISTS "FactureFournisseur" (
    "id"             TEXT NOT NULL,
    "tenant_id"      TEXT NOT NULL,
    "numero"         TEXT NOT NULL,
    "fournisseur_id" TEXT NOT NULL,
    "chantier_id"    TEXT,
    "date_facture"   TIMESTAMP(3) NOT NULL,
    "date_echeance"  TIMESTAMP(3),
    "categorie"      TEXT NOT NULL DEFAULT 'AUTRE',
    "description"    TEXT,
    "montant_ht"     DOUBLE PRECISION NOT NULL,
    "taux_tva"       DOUBLE PRECISION NOT NULL DEFAULT 20,
    "montant_tva"    DOUBLE PRECISION NOT NULL,
    "montant_ttc"    DOUBLE PRECISION NOT NULL,
    "statut"         TEXT NOT NULL DEFAULT 'A_PAYER',
    "date_paiement"  TIMESTAMP(3),
    "notes"          TEXT,
    "fichier_url"    TEXT,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FactureFournisseur_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FactureFournisseur_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FactureFournisseur_fournisseur_id_fkey" FOREIGN KEY ("fournisseur_id") REFERENCES "Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FactureFournisseur_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "FactureFournisseur_tenant_id_idx" ON "FactureFournisseur"("tenant_id")`,
  // TacheEmploye : colonnes planning (ajoutées v1.4.0)
  `ALTER TABLE "TacheEmploye" ADD COLUMN IF NOT EXISTS "date_planifiee" TIMESTAMP(3)`,
  `ALTER TABLE "TacheEmploye" ADD COLUMN IF NOT EXISTS "heure_debut" TEXT`,
  `ALTER TABLE "TacheEmploye" ADD COLUMN IF NOT EXISTS "duree_minutes" INTEGER`,
  // Support & Feature Requests (v1.5.0) — filet de sécurité si prisma db push échoue
  `CREATE TABLE IF NOT EXISTS "SupportTicket" (
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
  )`,
  `CREATE INDEX IF NOT EXISTS "SupportTicket_tenant_id_idx" ON "SupportTicket"("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "SupportTicket_statut_idx" ON "SupportTicket"("statut")`,
  `CREATE TABLE IF NOT EXISTS "FeatureRequest" (
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
  )`,
  `CREATE INDEX IF NOT EXISTS "FeatureRequest_statut_idx" ON "FeatureRequest"("statut")`,
  `CREATE TABLE IF NOT EXISTS "FeatureVote" (
    "id"                 TEXT NOT NULL,
    "user_id"            TEXT NOT NULL,
    "feature_request_id" TEXT NOT NULL,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeatureVote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FeatureVote_user_id_feature_request_id_key" UNIQUE ("user_id", "feature_request_id"),
    CONSTRAINT "FeatureVote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeatureVote_feature_request_id_fkey" FOREIGN KEY ("feature_request_id") REFERENCES "FeatureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "FaqItem" (
    "id"         TEXT NOT NULL,
    "categorie"  TEXT NOT NULL,
    "question"   TEXT NOT NULL,
    "reponse"    TEXT NOT NULL,
    "ordre"      INTEGER NOT NULL DEFAULT 0,
    "actif"      BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
  )`,
];

async function main() {
  console.log('🔧 Vérification des colonnes manquantes...');
  let ok = 0;
  let skip = 0;

  for (const sql of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      ok++;
    } catch (err) {
      // Ignorer les erreurs "column already exists" ou "relation already exists"
      if (err.message?.includes('already exists')) {
        skip++;
      } else {
        console.warn(`⚠️  ${sql.slice(0, 60)}... → ${err.message}`);
      }
    }
  }

  console.log(`✅ Migrations: ${ok} appliquées, ${skip} déjà existantes`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
