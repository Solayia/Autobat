# Schéma de Base de Données - Autobat

## Vue d'ensemble

**Database:** PostgreSQL 16
**ORM:** Prisma
**Strategy:** Multi-tenant (shared database avec tenant_id)
**Tables:** 21 tables principales
**Extensions:** uuid-ossp

---

## 1. DIAGRAMME RELATIONNEL GLOBAL

```
┌─────────────┐
│   TENANT    │◄──────────────┐
└─────────────┘               │
       │                      │
       │ 1:N                  │
       ▼                      │
┌─────────────┐               │
│    USER     │               │
└─────────────┘               │
       │                      │
       │ 1:1 (if EMPLOYEE)    │
       ▼                      │
┌─────────────┐               │
│   EMPLOYE   │◄──────┐       │
└─────────────┘       │       │
       │              │       │
       │              │ N:M   │
       │              │       │
       ▼              │       │
┌─────────────┐       │       │
│  BADGEAGE   │       │       │
└─────────────┘       │       │
       │              │       │
       ▼              │       │
┌─────────────┐       │       │
│   CHANTIER  │◄──────┘       │
└─────────────┘               │
       │                      │
       │ 1:N                  │
       ▼                      │
┌─────────────┐               │
│    TACHE    │               │
└─────────────┘               │
       │                      │
       ▼                      │
┌─────────────┐               │
│   OUVRAGE   │◄──────────────┘
│ (Catalogue) │
└─────────────┘
       │
       ▼
┌─────────────┐
│HISTORIQUE_  │
│   PRIX      │
└─────────────┘

┌─────────────┐
│   CLIENT    │
└─────────────┘
       │
       │ 1:N
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐ ┌─────────────┐
│    DEVIS    │ │   FACTURE   │
└─────────────┘ └─────────────┘
       │              │
       │ 1:N          │ 1:N
       ▼              ▼
┌─────────────┐ ┌─────────────┐
│ LIGNE_DEVIS │ │LIGNE_FACTURE│
└─────────────┘ └─────────────┘
```

---

## 2. TABLES DÉTAILLÉES

### 2.1 TENANTS (Point d'entrée multi-tenant)

**Purpose:** Isoler les données par entreprise cliente

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR NOT NULL,
  siret VARCHAR UNIQUE NOT NULL,
  adresse VARCHAR NOT NULL,
  code_postal VARCHAR NOT NULL,
  ville VARCHAR NOT NULL,
  telephone VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  logo_url VARCHAR,

  -- Facturation
  rib VARCHAR,
  capital VARCHAR,
  rcs VARCHAR,
  tva_intra VARCHAR,

  -- Abonnement
  plan VARCHAR NOT NULL DEFAULT 'STARTER',  -- STARTER, PRO, ENTERPRISE
  statut VARCHAR NOT NULL DEFAULT 'ACTIF',  -- ACTIF, SUSPENDU, INACTIF
  date_inscription TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_siret ON tenants(siret);
CREATE INDEX idx_tenants_statut ON tenants(statut);
```

**Taille estimée:** 100 tenants (MVP) → 1 000 tenants (1 an)
**Croissance:** +50 tenants/mois

---

### 2.2 USERS (Authentification)

**Purpose:** Comptes utilisateurs avec rôles

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL,  -- SUPER_ADMIN, COMPANY_ADMIN, MANAGER, EMPLOYEE

  -- Info personnelle
  prenom VARCHAR NOT NULL,
  nom VARCHAR NOT NULL,
  telephone VARCHAR,
  avatar_url VARCHAR,

  -- Status
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP,

  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Indexes critiques:**
- `(tenant_id)` - Toutes les requêtes filtrent par tenant
- `(tenant_id, email)` - Login unique par tenant
- `(role)` - Filtres par rôle fréquents

**Taille estimée:** 1 000 users (MVP) → 10 000 users (1 an)

---

### 2.3 EMPLOYES (Extension User pour EMPLOYEE)

**Purpose:** Données spécifiques aux employés (quota horaire, etc.)

```sql
CREATE TABLE employes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Quota
  quota_mensuel_heures DECIMAL(5,2),  -- Ex: 151.67

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employes_tenant_id ON employes(tenant_id);
CREATE INDEX idx_employes_user_id ON employes(user_id);
```

**Relation:** 1 User (role=EMPLOYEE) ↔ 1 Employe

---

### 2.4 CLIENTS

**Purpose:** Clients de l'entreprise (particuliers ou pros)

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Informations
  nom VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  telephone VARCHAR NOT NULL,
  adresse VARCHAR,
  code_postal VARCHAR,
  ville VARCHAR,

  -- Si client pro
  siret VARCHAR,

  -- Status
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_email ON clients(email);
```

**Taille estimée:** 500 clients (MVP) → 5 000 clients (1 an)

---

### 2.5 OUVRAGES (Catalogue auto-apprenant)

**Purpose:** Catalogue des prestations avec auto-learning

```sql
CREATE TABLE ouvrages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Référence
  code VARCHAR NOT NULL,              -- GO-DEM-001
  categorie VARCHAR NOT NULL,         -- Gros Oeuvre

  -- Description
  denomination VARCHAR NOT NULL,
  unite VARCHAR NOT NULL,             -- m², ml, u, h

  -- Prix
  prix_unitaire_ht DECIMAL(10,2) NOT NULL,

  -- Auto-learning
  temps_estime_minutes INT,
  temps_reel_moyen DECIMAL(10,2),     -- Moyenne mobile
  nb_chantiers_realises INT NOT NULL DEFAULT 0,
  derniere_maj_auto TIMESTAMP,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_ouvrages_tenant_id ON ouvrages(tenant_id);
CREATE INDEX idx_ouvrages_categorie ON ouvrages(categorie);
CREATE INDEX idx_ouvrages_code ON ouvrages(code);
```

**Taille estimée:** 324 ouvrages/tenant (base Graneet) → 500 ouvrages (personnalisés)

**Requête fréquente:**
```sql
-- Catalogue par catégorie
SELECT * FROM ouvrages
WHERE tenant_id = $1
  AND categorie = $2
ORDER BY denomination;
```

---

### 2.6 HISTORIQUE_PRIX

**Purpose:** Traçabilité des ajustements de prix (auto-learning)

```sql
CREATE TABLE historique_prix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ouvrage_id UUID NOT NULL REFERENCES ouvrages(id) ON DELETE CASCADE,

  -- Prix
  ancien_prix DECIMAL(10,2) NOT NULL,
  nouveau_prix DECIMAL(10,2) NOT NULL,

  -- Raison
  raison VARCHAR NOT NULL,            -- "Auto-learning", "Manuel", "Inflation"
  ecart_pourcent DECIMAL(5,2),

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historique_prix_ouvrage_id ON historique_prix(ouvrage_id);
```

**Exemple d'insertion (auto-learning) :**
```sql
INSERT INTO historique_prix (ouvrage_id, ancien_prix, nouveau_prix, raison, ecart_pourcent)
VALUES (
  'uuid-ouvrage',
  45.00,
  55.35,
  'Auto-learning (chantier #4)',
  23.00  -- +23%
);
```

---

### 2.7 DEVIS

**Purpose:** Propositions commerciales

```sql
CREATE TABLE devis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero_devis VARCHAR NOT NULL,      -- DEV-2026-0001
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Montants
  montant_ht DECIMAL(10,2) NOT NULL,
  montant_tva DECIMAL(10,2) NOT NULL,
  montant_ttc DECIMAL(10,2) NOT NULL,

  -- Dates
  date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
  date_validite TIMESTAMP NOT NULL,
  date_envoi TIMESTAMP,
  date_acceptation TIMESTAMP,
  date_refus TIMESTAMP,

  -- Statut
  statut VARCHAR NOT NULL DEFAULT 'BROUILLON',
    -- BROUILLON, ENVOYE, ACCEPTE, REFUSE, EXPIRE

  -- Document
  pdf_url VARCHAR,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, numero_devis)
);

CREATE INDEX idx_devis_tenant_id ON devis(tenant_id);
CREATE INDEX idx_devis_client_id ON devis(client_id);
CREATE INDEX idx_devis_statut ON devis(statut);
CREATE INDEX idx_devis_numero ON devis(numero_devis);
```

**Génération numéro devis :**
```sql
-- Récupérer dernier numéro de l'année
SELECT MAX(CAST(SUBSTRING(numero_devis FROM 10) AS INT))
FROM devis
WHERE tenant_id = $1
  AND numero_devis LIKE 'DEV-2026-%';

-- Générer suivant: DEV-2026-0043
```

---

### 2.8 LIGNES_DEVIS

**Purpose:** Détail des prestations du devis

```sql
CREATE TABLE lignes_devis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  ouvrage_id UUID REFERENCES ouvrages(id),  -- NULL si personnalisé

  -- Détails
  description VARCHAR NOT NULL,
  quantite DECIMAL(10,2) NOT NULL,
  unite VARCHAR NOT NULL,
  prix_unitaire_ht DECIMAL(10,2) NOT NULL,
  montant_ht DECIMAL(10,2) NOT NULL,
  tva_pourcent DECIMAL(4,2) NOT NULL DEFAULT 20.00,
  montant_ttc DECIMAL(10,2) NOT NULL,

  -- Ordre
  ordre INT NOT NULL,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lignes_devis_devis_id ON lignes_devis(devis_id);
CREATE INDEX idx_lignes_devis_ouvrage_id ON lignes_devis(ouvrage_id);
```

**Calcul montants (trigger ou app logic) :**
```typescript
montant_ht = quantite * prix_unitaire_ht
montant_ttc = montant_ht * (1 + tva_pourcent / 100)
```

---

### 2.9 CHANTIERS

**Purpose:** Projets en cours ou terminés

```sql
CREATE TABLE chantiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  devis_id UUID REFERENCES devis(id),

  -- Informations
  nom VARCHAR NOT NULL,
  adresse VARCHAR NOT NULL,
  code_postal VARCHAR NOT NULL,
  ville VARCHAR NOT NULL,

  -- GPS (pour badgeage automatique)
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  rayon_gps_metres INT NOT NULL DEFAULT 100,

  -- Configuration
  badgeage_par_tache BOOLEAN NOT NULL DEFAULT FALSE,

  -- Dates
  date_debut TIMESTAMP NOT NULL DEFAULT NOW(),
  date_fin_prevue TIMESTAMP,
  date_fin_reelle TIMESTAMP,

  -- Statut
  statut VARCHAR NOT NULL DEFAULT 'EN_COURS',
    -- EN_COURS, TERMINE, ANNULE, FACTURE

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chantiers_tenant_id ON chantiers(tenant_id);
CREATE INDEX idx_chantiers_client_id ON chantiers(client_id);
CREATE INDEX idx_chantiers_statut ON chantiers(statut);
CREATE INDEX idx_chantiers_gps ON chantiers(latitude, longitude);  -- Spatial query
```

---

### 2.10 CHANTIER_EMPLOYE (Table de liaison N:M)

**Purpose:** Assigner employés aux chantiers

```sql
CREATE TABLE chantier_employe (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,

  -- Metadata
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(chantier_id, employe_id)
);

CREATE INDEX idx_chantier_employe_chantier ON chantier_employe(chantier_id);
CREATE INDEX idx_chantier_employe_employe ON chantier_employe(employe_id);
```

**Requête fréquente :**
```sql
-- Employés assignés à un chantier
SELECT e.*, u.prenom, u.nom
FROM employes e
JOIN users u ON e.user_id = u.id
JOIN chantier_employe ce ON e.id = ce.employe_id
WHERE ce.chantier_id = $1;
```

---

### 2.11 TACHES

**Purpose:** Décomposition du chantier en tâches (optionnel)

```sql
CREATE TABLE taches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  ouvrage_id UUID REFERENCES ouvrages(id),

  -- Détails
  nom VARCHAR NOT NULL,
  description TEXT,
  quantite_prevue DECIMAL(10,2),
  unite VARCHAR,

  -- Status
  statut VARCHAR NOT NULL DEFAULT 'A_FAIRE',
    -- A_FAIRE, EN_COURS, TERMINEE

  -- Ordre
  ordre INT NOT NULL,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_taches_chantier_id ON taches(chantier_id);
CREATE INDEX idx_taches_ouvrage_id ON taches(ouvrage_id);
```

---

### 2.12 BADGEAGES

**Purpose:** Enregistrer présence et temps de travail

```sql
CREATE TABLE badgeages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES employes(id),
  tache_id UUID REFERENCES taches(id),

  -- Type
  type VARCHAR NOT NULL,
    -- PRESENCE_DEBUT, PRESENCE_FIN, TACHE_DEBUT, TACHE_FIN

  methode VARCHAR NOT NULL,
    -- GPS_AUTO, MANUEL

  -- GPS (si GPS_AUTO)
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  precision_metres INT,

  -- Timestamp
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Metadata
  synced BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE si créé offline
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_badgeages_tenant_id ON badgeages(tenant_id);
CREATE INDEX idx_badgeages_chantier_id ON badgeages(chantier_id);
CREATE INDEX idx_badgeages_employe_id ON badgeages(employe_id);
CREATE INDEX idx_badgeages_timestamp ON badgeages(timestamp);
CREATE INDEX idx_badgeages_synced ON badgeages(synced);  -- Offline sync
```

**Requêtes fréquentes :**
```sql
-- Heures d'un employé sur un chantier (paires DEBUT/FIN)
SELECT
  employe_id,
  SUM(
    EXTRACT(EPOCH FROM (fin.timestamp - debut.timestamp)) / 3600
  ) AS heures_totales
FROM badgeages debut
JOIN badgeages fin ON
  fin.chantier_id = debut.chantier_id AND
  fin.employe_id = debut.employe_id AND
  fin.type = 'PRESENCE_FIN' AND
  debut.type = 'PRESENCE_DEBUT' AND
  fin.timestamp > debut.timestamp AND
  fin.timestamp = (
    SELECT MIN(timestamp) FROM badgeages
    WHERE type = 'PRESENCE_FIN'
      AND employe_id = debut.employe_id
      AND timestamp > debut.timestamp
  )
WHERE debut.chantier_id = $1
GROUP BY employe_id;
```

---

### 2.13 DOCUMENTS

**Purpose:** Photos et PDFs par chantier

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,

  -- Fichier
  nom VARCHAR NOT NULL,
  type VARCHAR NOT NULL,              -- PHOTO, PDF, AUTRE
  url VARCHAR NOT NULL,
  taille_bytes INT NOT NULL,

  -- Metadata
  titre VARCHAR,
  description TEXT,
  uploaded_by UUID NOT NULL,          -- user_id
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_chantier_id ON documents(chantier_id);
CREATE INDEX idx_documents_type ON documents(type);
```

---

### 2.14 FACTURES

**Purpose:** Facturation clients

```sql
CREATE TABLE factures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero_facture VARCHAR NOT NULL,    -- FAC-2026-0001
  chantier_id UUID NOT NULL REFERENCES chantiers(id),
  devis_id UUID REFERENCES devis(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Snapshots (données figées)
  entreprise_nom VARCHAR NOT NULL,
  entreprise_siret VARCHAR NOT NULL,
  entreprise_adresse VARCHAR NOT NULL,
  entreprise_tel VARCHAR NOT NULL,
  entreprise_email VARCHAR NOT NULL,

  client_nom VARCHAR NOT NULL,
  client_adresse VARCHAR NOT NULL,
  client_siret VARCHAR,
  client_tel VARCHAR NOT NULL,
  client_email VARCHAR NOT NULL,

  -- Montants
  montant_ht DECIMAL(10,2) NOT NULL,
  montant_tva DECIMAL(10,2) NOT NULL,
  montant_ttc DECIMAL(10,2) NOT NULL,

  -- Paiements
  acompte_demande DECIMAL(10,2) NOT NULL,
  acompte_recu DECIMAL(10,2) NOT NULL DEFAULT 0,
  reste_a_payer DECIMAL(10,2) NOT NULL,

  -- Statuts
  statut_paiement VARCHAR NOT NULL DEFAULT 'EN_ATTENTE',
    -- EN_ATTENTE, ACOMPTE_RECU, PARTIELLEMENT_PAYE, SOLDE

  statut_facture VARCHAR NOT NULL DEFAULT 'BROUILLON',
    -- BROUILLON, EMISE, ENVOYEE, ANNULEE

  -- Dates
  date_emission TIMESTAMP NOT NULL DEFAULT NOW(),
  date_echeance TIMESTAMP NOT NULL,
  date_envoi TIMESTAMP,
  date_paiement_complet TIMESTAMP,

  -- Document
  pdf_url VARCHAR,
  notes TEXT,

  -- Facture d'avoir
  facture_origine_id UUID,
  facture_avoir_id UUID,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, numero_facture)
);

CREATE INDEX idx_factures_tenant_id ON factures(tenant_id);
CREATE INDEX idx_factures_chantier_id ON factures(chantier_id);
CREATE INDEX idx_factures_client_id ON factures(client_id);
CREATE INDEX idx_factures_statut_paiement ON factures(statut_paiement);
CREATE INDEX idx_factures_statut_facture ON factures(statut_facture);
CREATE INDEX idx_factures_numero ON factures(numero_facture);
```

---

### 2.15 PAIEMENTS_FACTURE

**Purpose:** Enregistrer les paiements reçus

```sql
CREATE TABLE paiements_facture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Paiement
  montant DECIMAL(10,2) NOT NULL,
  date_paiement TIMESTAMP NOT NULL,
  moyen_paiement VARCHAR NOT NULL,
    -- VIREMENT, CHEQUE, ESPECES, CARTE, AUTRE

  reference VARCHAR,                  -- Numéro chèque, ref virement
  type VARCHAR NOT NULL,
    -- ACOMPTE, SOLDE, PARTIEL

  -- Validation
  valide BOOLEAN NOT NULL DEFAULT TRUE,
  valide_par UUID,                    -- user_id
  valide_le TIMESTAMP,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_paiements_facture_facture_id ON paiements_facture(facture_id);
CREATE INDEX idx_paiements_facture_tenant_id ON paiements_facture(tenant_id);
```

---

## 3. STRATÉGIES D'OPTIMISATION

### 3.1 Indexes Critiques

**Toutes les tables avec tenant_id :**
```sql
CREATE INDEX idx_<table>_tenant_id ON <table>(tenant_id);
```

**Raison :** Toutes les requêtes filtrent par tenant (multi-tenant isolation)

---

### 3.2 Composite Indexes

**Badgeages (requête heures par employé par mois) :**
```sql
CREATE INDEX idx_badgeages_employe_timestamp
ON badgeages(employe_id, timestamp DESC);
```

**Factures (dashboard financier) :**
```sql
CREATE INDEX idx_factures_tenant_statut_date
ON factures(tenant_id, statut_paiement, date_emission DESC);
```

---

### 3.3 Partitioning (V2 - si > 10M rows)

**Badgeages par mois (range partitioning) :**
```sql
CREATE TABLE badgeages (
  ...
  timestamp TIMESTAMP NOT NULL
) PARTITION BY RANGE (timestamp);

CREATE TABLE badgeages_2026_01 PARTITION OF badgeages
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE badgeages_2026_02 PARTITION OF badgeages
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Etc.
```

---

## 4. CONTRAINTES & VALIDATIONS

### 4.1 Check Constraints

**Montants positifs :**
```sql
ALTER TABLE devis
ADD CONSTRAINT check_montant_positif
CHECK (montant_ht >= 0 AND montant_tva >= 0 AND montant_ttc >= 0);
```

**Dates cohérentes :**
```sql
ALTER TABLE chantiers
ADD CONSTRAINT check_dates_logiques
CHECK (date_fin_reelle IS NULL OR date_fin_reelle >= date_debut);
```

---

### 4.2 Foreign Keys avec ON DELETE

**Cascade deletion (tenant supprimé → tout supprimé) :**
```sql
REFERENCES tenants(id) ON DELETE CASCADE
```

**Prevent deletion (ne pas supprimer client si factures existent) :**
```sql
-- Géré en app logic, pas en DB constraint
```

---

## 5. TAILLE ET VOLUMÉTRIE

### Estimations (après 1 an - 1000 tenants)

| Table | Rows estimées | Taille approx |
|-------|---------------|---------------|
| tenants | 1 000 | 100 KB |
| users | 10 000 | 2 MB |
| employes | 5 000 | 500 KB |
| clients | 50 000 | 10 MB |
| ouvrages | 500 000 | 100 MB |
| devis | 100 000 | 30 MB |
| lignes_devis | 500 000 | 100 MB |
| chantiers | 50 000 | 15 MB |
| taches | 200 000 | 50 MB |
| badgeages | **10 000 000** | **2 GB** |
| documents | 500 000 | 50 MB (metadata) |
| factures | 80 000 | 50 MB |
| paiements_facture | 200 000 | 30 MB |
| **TOTAL** | **~12M rows** | **~3 GB** |

**Table critique :** `badgeages` (croissance exponentielle)

---

## 6. BACKUPS & MAINTENANCE

### 6.1 Backup Strategy

```bash
# Backup complet quotidien (2h du matin)
pg_dump -U autobat_user -h localhost autobat_prod | gzip > backup-$(date +%Y-%m-%d).sql.gz

# Retention: 30 jours
```

### 6.2 Vacuum Auto

```sql
-- Déjà activé par défaut dans PostgreSQL
-- Vérifier config:
SHOW autovacuum;  -- on
```

---

## Résumé

**Schéma complet :**
- ✅ 21 tables principales
- ✅ Multi-tenant avec tenant_id
- ✅ Indexes optimisés
- ✅ Relations cohérentes
- ✅ Support auto-learning (historique prix)
- ✅ Support offline (badges non synced)

**Prochaine étape :** migrations.md (stratégie de migration)
