/*
  Warnings:

  - Added the required column `tenant_id` to the `LigneDevis` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LigneDevis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "devis_id" TEXT NOT NULL,
    "ouvrage_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OUVRAGE',
    "parent_ligne_id" TEXT,
    "description" TEXT NOT NULL,
    "quantite" REAL NOT NULL,
    "unite" TEXT NOT NULL,
    "prix_unitaire_ht" REAL NOT NULL,
    "montant_ht" REAL NOT NULL,
    "tva_pourcent" REAL NOT NULL DEFAULT 20.00,
    "montant_ttc" REAL NOT NULL,
    "ordre" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LigneDevis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneDevis_devis_id_fkey" FOREIGN KEY ("devis_id") REFERENCES "Devis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneDevis_ouvrage_id_fkey" FOREIGN KEY ("ouvrage_id") REFERENCES "Ouvrage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LigneDevis_parent_ligne_id_fkey" FOREIGN KEY ("parent_ligne_id") REFERENCES "LigneDevis" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LigneDevis" ("created_at", "description", "devis_id", "id", "montant_ht", "montant_ttc", "ordre", "ouvrage_id", "parent_ligne_id", "prix_unitaire_ht", "quantite", "tva_pourcent", "type", "unite") SELECT "created_at", "description", "devis_id", "id", "montant_ht", "montant_ttc", "ordre", "ouvrage_id", "parent_ligne_id", "prix_unitaire_ht", "quantite", "tva_pourcent", "type", "unite" FROM "LigneDevis";
DROP TABLE "LigneDevis";
ALTER TABLE "new_LigneDevis" RENAME TO "LigneDevis";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
