-- CreateTable
CREATE TABLE "TacheEmploye" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tache_id" TEXT NOT NULL,
    "employe_id" TEXT NOT NULL,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TacheEmploye_tache_id_fkey" FOREIGN KEY ("tache_id") REFERENCES "Tache" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TacheEmploye_employe_id_fkey" FOREIGN KEY ("employe_id") REFERENCES "Employe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TacheEmploye_tache_id_employe_id_key" ON "TacheEmploye"("tache_id", "employe_id");
