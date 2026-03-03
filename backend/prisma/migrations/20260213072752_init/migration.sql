-- CreateTable
CREATE TABLE "Tenant" (
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
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "date_inscription" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "avatar_url" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login" DATETIME,
    CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quota_mensuel_heures" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Employe_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Employe_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Ouvrage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "denomination" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "prix_unitaire_ht" REAL NOT NULL,
    "temps_estime_minutes" INTEGER,
    "temps_reel_moyen" REAL,
    "nb_chantiers_realises" INTEGER NOT NULL DEFAULT 0,
    "derniere_maj_auto" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Ouvrage_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoriquePrix" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ouvrage_id" TEXT NOT NULL,
    "ancien_prix" REAL NOT NULL,
    "nouveau_prix" REAL NOT NULL,
    "raison" TEXT NOT NULL,
    "ecart_pourcent" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoriquePrix_ouvrage_id_fkey" FOREIGN KEY ("ouvrage_id") REFERENCES "Ouvrage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "numero_devis" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "montant_ht" REAL NOT NULL,
    "montant_tva" REAL NOT NULL,
    "montant_ttc" REAL NOT NULL,
    "date_creation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_validite" DATETIME NOT NULL,
    "date_envoi" DATETIME,
    "date_acceptation" DATETIME,
    "date_refus" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "pdf_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Devis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Devis_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneDevis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "devis_id" TEXT NOT NULL,
    "ouvrage_id" TEXT,
    "description" TEXT NOT NULL,
    "quantite" REAL NOT NULL,
    "unite" TEXT NOT NULL,
    "prix_unitaire_ht" REAL NOT NULL,
    "montant_ht" REAL NOT NULL,
    "tva_pourcent" REAL NOT NULL DEFAULT 20.00,
    "montant_ttc" REAL NOT NULL,
    "ordre" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LigneDevis_devis_id_fkey" FOREIGN KEY ("devis_id") REFERENCES "Devis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneDevis_ouvrage_id_fkey" FOREIGN KEY ("ouvrage_id") REFERENCES "Ouvrage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chantier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "devis_id" TEXT,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "code_postal" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "rayon_gps_metres" INTEGER NOT NULL DEFAULT 100,
    "badgeage_par_tache" BOOLEAN NOT NULL DEFAULT false,
    "date_debut" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_fin_prevue" DATETIME,
    "date_fin_reelle" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Chantier_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Chantier_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chantier_devis_id_fkey" FOREIGN KEY ("devis_id") REFERENCES "Devis" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChantierEmploye" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chantier_id" TEXT NOT NULL,
    "employe_id" TEXT NOT NULL,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChantierEmploye_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChantierEmploye_employe_id_fkey" FOREIGN KEY ("employe_id") REFERENCES "Employe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chantier_id" TEXT NOT NULL,
    "ouvrage_id" TEXT,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "quantite_prevue" REAL,
    "unite" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'A_FAIRE',
    "ordre" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Tache_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tache_ouvrage_id_fkey" FOREIGN KEY ("ouvrage_id") REFERENCES "Ouvrage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Badgeage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "employe_id" TEXT NOT NULL,
    "tache_id" TEXT,
    "type" TEXT NOT NULL,
    "methode" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "precision_metres" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Badgeage_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Badgeage_employe_id_fkey" FOREIGN KEY ("employe_id") REFERENCES "Employe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Badgeage_tache_id_fkey" FOREIGN KEY ("tache_id") REFERENCES "Tache" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "taille_bytes" INTEGER NOT NULL,
    "titre" TEXT,
    "description" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "numero_facture" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "devis_id" TEXT,
    "client_id" TEXT NOT NULL,
    "entreprise_nom" TEXT NOT NULL,
    "entreprise_siret" TEXT NOT NULL,
    "entreprise_adresse" TEXT NOT NULL,
    "entreprise_tel" TEXT NOT NULL,
    "entreprise_email" TEXT NOT NULL,
    "client_nom" TEXT NOT NULL,
    "client_adresse" TEXT NOT NULL,
    "client_siret" TEXT,
    "client_tel" TEXT NOT NULL,
    "client_email" TEXT NOT NULL,
    "montant_ht" REAL NOT NULL,
    "montant_tva" REAL NOT NULL,
    "montant_ttc" REAL NOT NULL,
    "acompte_demande" REAL NOT NULL,
    "acompte_recu" REAL NOT NULL DEFAULT 0,
    "reste_a_payer" REAL NOT NULL,
    "statut_paiement" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "statut_facture" TEXT NOT NULL DEFAULT 'BROUILLON',
    "date_emission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_echeance" DATETIME NOT NULL,
    "date_envoi" DATETIME,
    "date_paiement_complet" DATETIME,
    "pdf_url" TEXT,
    "notes" TEXT,
    "facture_origine_id" TEXT,
    "facture_avoir_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Facture_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Facture_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "Chantier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Facture_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneFacture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facture_id" TEXT NOT NULL,
    "ouvrage_id" TEXT,
    "description" TEXT NOT NULL,
    "quantite" REAL NOT NULL,
    "unite" TEXT NOT NULL,
    "prix_unitaire_ht" REAL NOT NULL,
    "montant_ht" REAL NOT NULL,
    "tva_pourcent" REAL NOT NULL DEFAULT 20.00,
    "montant_ttc" REAL NOT NULL,
    "ordre" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LigneFacture_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "Facture" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneFacture_ouvrage_id_fkey" FOREIGN KEY ("ouvrage_id") REFERENCES "Ouvrage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaiementFacture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facture_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "date_paiement" DATETIME NOT NULL,
    "moyen_paiement" TEXT NOT NULL,
    "reference" TEXT,
    "type" TEXT NOT NULL,
    "valide" BOOLEAN NOT NULL DEFAULT true,
    "valide_par" TEXT,
    "valide_le" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "PaiementFacture_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "Facture" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien_url" TEXT,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_siret_key" ON "Tenant"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenant_id_email_key" ON "User"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Employe_user_id_key" ON "Employe"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Client_tenant_id_email_key" ON "Client"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Ouvrage_tenant_id_code_key" ON "Ouvrage"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_tenant_id_numero_devis_key" ON "Devis"("tenant_id", "numero_devis");

-- CreateIndex
CREATE UNIQUE INDEX "ChantierEmploye_chantier_id_employe_id_key" ON "ChantierEmploye"("chantier_id", "employe_id");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_tenant_id_numero_facture_key" ON "Facture"("tenant_id", "numero_facture");
