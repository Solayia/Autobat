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
