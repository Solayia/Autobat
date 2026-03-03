-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "code_postal" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "logo_url" TEXT,
    "rib" TEXT,
    "capital" TEXT,
    "rcs" TEXT,
    "tva_intra" TEXT,
    "couleur_primaire" TEXT NOT NULL DEFAULT '#FF9F43',
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "date_inscription" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_Tenant" ("adresse", "capital", "code_postal", "created_at", "date_inscription", "email", "id", "logo_url", "nom", "plan", "rcs", "rib", "siret", "statut", "telephone", "tva_intra", "updated_at", "ville") SELECT "adresse", "capital", "code_postal", "created_at", "date_inscription", "email", "id", "logo_url", "nom", "plan", "rcs", "rib", "siret", "statut", "telephone", "tva_intra", "updated_at", "ville" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
CREATE UNIQUE INDEX "Tenant_siret_key" ON "Tenant"("siret");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
