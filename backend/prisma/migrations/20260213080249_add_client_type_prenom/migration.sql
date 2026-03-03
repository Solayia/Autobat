-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ENTREPRISE',
    "prenom" TEXT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT,
    "code_postal" TEXT,
    "ville" TEXT,
    "siret" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Client_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("actif", "adresse", "code_postal", "created_at", "email", "id", "nom", "notes", "siret", "telephone", "tenant_id", "updated_at", "ville") SELECT "actif", "adresse", "code_postal", "created_at", "email", "id", "nom", "notes", "siret", "telephone", "tenant_id", "updated_at", "ville" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_tenant_id_email_key" ON "Client"("tenant_id", "email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
