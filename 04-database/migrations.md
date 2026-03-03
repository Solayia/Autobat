# Migrations Database - Autobat

## Vue d'ensemble

**Outil:** Prisma Migrate
**Strategy:** Migration incrémentale (forward-only)
**Environment:** Development → Staging → Production

---

## 1. WORKFLOW MIGRATIONS

### 1.1 Développement Local

```bash
# 1. Modifier schema.prisma
nano prisma/schema.prisma

# 2. Créer migration
npx prisma migrate dev --name add_user_avatar

# Ce qui se passe:
# - Prisma génère SQL dans prisma/migrations/
# - Applique migration sur DB locale
# - Génère Prisma Client mis à jour
```

**Exemple output :**
```
✔ Generated Prisma Client (5.9.1) to ./node_modules/@prisma/client

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260212120000_add_user_avatar/
      └─ migration.sql
```

---

### 1.2 Production

```bash
# NE PAS utiliser "prisma migrate dev" en production !
# Utiliser "migrate deploy" qui n'est PAS interactif

npx prisma migrate deploy

# Ce qui se passe:
# - Lit migrations/ directory
# - Applique migrations pending (jamais appliquées)
# - NE génère PAS de nouvelles migrations
# - NE reset PAS la DB
```

---

## 2. PREMIÈRE MIGRATION (INIT)

### 2.1 Création DB de zéro

**migration.sql complet :**
```sql
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE "TenantStatus" AS ENUM ('ACTIF', 'SUSPENDU', 'INACTIF');
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE');
CREATE TYPE "StatutDevis" AS ENUM ('BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE');
CREATE TYPE "StatutChantier" AS ENUM ('EN_COURS', 'TERMINE', 'ANNULE', 'FACTURE');
CREATE TYPE "StatutTache" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINEE');
CREATE TYPE "TypeBadgeage" AS ENUM ('PRESENCE_DEBUT', 'PRESENCE_FIN', 'TACHE_DEBUT', 'TACHE_FIN');
CREATE TYPE "MethodeBadgeage" AS ENUM ('GPS_AUTO', 'MANUEL');
CREATE TYPE "TypeDocument" AS ENUM ('PHOTO', 'PDF', 'AUTRE');
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'ACOMPTE_RECU', 'PARTIELLEMENT_PAYE', 'SOLDE');
CREATE TYPE "StatutFacture" AS ENUM ('BROUILLON', 'EMISE', 'ENVOYEE', 'ANNULEE');
CREATE TYPE "MoyenPaiement" AS ENUM ('VIREMENT', 'CHEQUE', 'ESPECES', 'CARTE', 'AUTRE');
CREATE TYPE "TypePaiement" AS ENUM ('ACOMPTE', 'SOLDE', 'PARTIEL');
CREATE TYPE "TypeNotification" AS ENUM ('DEVIS_ACCEPTE', 'DEVIS_REFUSE', 'FACTURE_PAYEE', 'FACTURE_EN_RETARD', 'BADGEAGE_CREE', 'CHANTIER_TERMINE', 'DOCUMENT_AJOUTE', 'AUTRE');

-- CreateTable: TENANTS
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
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
    "plan" "PlanType" NOT NULL DEFAULT 'STARTER',
    "statut" "TenantStatus" NOT NULL DEFAULT 'ACTIF',
    "date_inscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: USERS
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "avatar_url" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- [... Toutes les autres tables CreateTable ...]

-- CreateIndex
CREATE UNIQUE INDEX "tenants_siret_key" ON "tenants"("siret");
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
CREATE INDEX "users_email_idx" ON "users"("email");

-- [... Tous les autres indexes ...]

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- [... Toutes les autres foreign keys ...]
```

**Commande :**
```bash
npx prisma migrate dev --name init
```

---

## 3. EXEMPLES MIGRATIONS FRÉQUENTES

### 3.1 Ajouter une colonne

**Modification schema.prisma :**
```prisma
model User {
  // ... champs existants
  avatar_url String?  // ← NOUVELLE COLONNE
}
```

**Migration générée automatiquement :**
```bash
npx prisma migrate dev --name add_user_avatar
```

**migrations/20260212_add_user_avatar/migration.sql :**
```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;
```

---

### 3.2 Ajouter un index

**Modification schema.prisma :**
```prisma
model Badgeage {
  // ... champs existants

  @@index([employe_id, timestamp]) // ← NOUVEL INDEX
}
```

**Migration :**
```bash
npx prisma migrate dev --name add_badgeage_index
```

**migration.sql :**
```sql
-- CreateIndex
CREATE INDEX "badgeages_employe_id_timestamp_idx"
ON "badgeages"("employe_id", "timestamp");
```

---

### 3.3 Modifier type colonne (avec données)

**⚠️ ATTENTION: Risque de perte de données**

**Exemple: Agrandir champ `telephone` de VARCHAR(10) → VARCHAR(20)**

**Modification schema.prisma :**
```prisma
model Client {
  telephone String @db.VarChar(20)  // Avant: VarChar(10)
}
```

**Migration générée :**
```sql
-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "telephone" TYPE VARCHAR(20);
```

**Si données incompatibles :**
```sql
-- Migration custom nécessaire
-- Etape 1: Créer nouvelle colonne
ALTER TABLE "clients" ADD COLUMN "telephone_new" VARCHAR(20);

-- Etape 2: Copier données (avec transformation si besoin)
UPDATE "clients" SET "telephone_new" = "telephone";

-- Etape 3: Supprimer ancienne colonne
ALTER TABLE "clients" DROP COLUMN "telephone";

-- Etape 4: Renommer nouvelle colonne
ALTER TABLE "clients" RENAME COLUMN "telephone_new" TO "telephone";
```

---

### 3.4 Ajouter enum value

**Modification schema.prisma :**
```prisma
enum Role {
  SUPER_ADMIN
  COMPANY_ADMIN
  MANAGER
  EMPLOYEE
  ACCOUNTANT  // ← NOUVELLE VALEUR
}
```

**Migration :**
```bash
npx prisma migrate dev --name add_accountant_role
```

**migration.sql :**
```sql
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ACCOUNTANT';
```

---

### 3.5 Ajouter relation (foreign key)

**Modification schema.prisma :**
```prisma
model Facture {
  // ... champs existants
  comptable_valide_par String? @db.Uuid
  comptable            User?   @relation("FactureComptable", fields: [comptable_valide_par], references: [id])
}
```

**Migration :**
```bash
npx prisma migrate dev --name add_facture_comptable
```

**migration.sql :**
```sql
-- AlterTable
ALTER TABLE "factures" ADD COLUMN "comptable_valide_par" UUID;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_comptable_valide_par_fkey"
    FOREIGN KEY ("comptable_valide_par") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
```

---

## 4. MIGRATIONS COMPLEXES (DATA MIGRATION)

### 4.1 Exemple: Split name field

**Avant :**
```prisma
model Client {
  nom String  // "Jean Dupont"
}
```

**Après :**
```prisma
model Client {
  prenom String
  nom String
}
```

**Migration custom nécessaire :**
```sql
-- Etape 1: Ajouter nouvelles colonnes
ALTER TABLE "clients" ADD COLUMN "prenom" TEXT;
ALTER TABLE "clients" ADD COLUMN "nom_new" TEXT;

-- Etape 2: Migrer données (split sur espace)
UPDATE "clients"
SET
  "prenom" = SPLIT_PART("nom", ' ', 1),
  "nom_new" = SPLIT_PART("nom", ' ', 2);

-- Etape 3: Gérer cas où pas d'espace (nom complet)
UPDATE "clients"
SET "nom_new" = "prenom"
WHERE "nom_new" = '';

-- Etape 4: Supprimer ancienne colonne
ALTER TABLE "clients" DROP COLUMN "nom";

-- Etape 5: Renommer nouvelle colonne
ALTER TABLE "clients" RENAME COLUMN "nom_new" TO "nom";

-- Etape 6: Rendre NOT NULL
ALTER TABLE "clients" ALTER COLUMN "prenom" SET NOT NULL;
ALTER TABLE "clients" ALTER COLUMN "nom" SET NOT NULL;
```

---

### 4.2 Exemple: Populate default values

**Ajouter champ avec valeur par défaut basée sur autre table :**

```sql
-- Ajouter colonne
ALTER TABLE "chantiers" ADD COLUMN "ville" TEXT;

-- Populer depuis adresse (extraction ville)
UPDATE "chantiers"
SET "ville" = SUBSTRING("adresse" FROM '\d{5}\s+(.+)$');

-- Rendre NOT NULL
ALTER TABLE "chantiers" ALTER COLUMN "ville" SET NOT NULL;
```

---

## 5. ROLLBACK STRATEGY

### 5.1 Rollback simple (dev)

```bash
# Annuler dernière migration
npx prisma migrate resolve --rolled-back 20260212120000_migration_name

# Supprimer fichier migration
rm -rf prisma/migrations/20260212120000_migration_name/
```

---

### 5.2 Rollback production (⚠️ DANGEREUX)

**Méthode 1: Forward fix (recommandé)**
```bash
# Créer nouvelle migration qui annule les changements
npx prisma migrate dev --name revert_previous_change

# Dans migration.sql: faire l'inverse
# Ex: Si ajout colonne → DROP COLUMN
#     Si CREATE INDEX → DROP INDEX
```

**Méthode 2: Restore backup (si migration catastrophique)**
```bash
# 1. Arrêter l'app
pm2 stop autobat-api

# 2. Restore DB backup
./scripts/restore-db.sh /backups/autobat-2026-02-11.sql.gz

# 3. Rollback code
git revert <commit-hash>
git push

# 4. Redémarrer app
pm2 restart autobat-api
```

---

## 6. BEST PRACTICES

### 6.1 Nommage migrations

**❌ Mauvais :**
```bash
npx prisma migrate dev --name migration
npx prisma migrate dev --name fix
npx prisma migrate dev --name update
```

**✅ Bon :**
```bash
npx prisma migrate dev --name add_user_avatar_field
npx prisma migrate dev --name create_badgeage_index_employe_timestamp
npx prisma migrate dev --name update_client_phone_to_varchar20
```

**Format recommandé :**
- `add_<table>_<field>` - Ajouter colonne
- `remove_<table>_<field>` - Supprimer colonne
- `create_<table>_index_<fields>` - Créer index
- `alter_<table>_<field>_<change>` - Modifier colonne
- `create_<table>` - Créer table

---

### 6.2 Tester migrations

```bash
# 1. Créer migration en dev
npx prisma migrate dev --name my_migration

# 2. Tester sur DB de test avec données
psql -U autobat_user -d autobat_test < seed-test-data.sql
npx prisma migrate deploy

# 3. Vérifier données
psql -U autobat_user -d autobat_test
SELECT * FROM ... WHERE ...;

# 4. Si OK → commit et deploy
git add prisma/migrations/
git commit -m "feat: add my_migration"
```

---

### 6.3 Migrations avec downtime

**Si migration lourde (ex: index sur 10M rows) :**

1. **Planifier maintenance window**
2. **Communiquer aux utilisateurs**
3. **Backup DB avant migration**
4. **Exécuter migration**
5. **Tester app**
6. **Remettre en ligne**

**Script maintenance :**
```bash
#!/bin/bash
# maintenance-migration.sh

echo "🚨 MAINTENANCE MODE - Migration en cours"

# 1. Activer page maintenance Nginx
sudo cp /etc/nginx/sites-available/maintenance.conf /etc/nginx/sites-enabled/autobat
sudo systemctl reload nginx

# 2. Arrêter app
pm2 stop autobat-api

# 3. Backup DB
./scripts/backup-db.sh

# 4. Exécuter migration
cd /var/www/autobat/backend
npx prisma migrate deploy

# 5. Vérifier migration
if [ $? -eq 0 ]; then
  echo "✅ Migration réussie"

  # 6. Redémarrer app
  pm2 restart autobat-api

  # 7. Tester health check
  sleep 5
  curl http://localhost:3000/api/health

  # 8. Désactiver maintenance
  sudo rm /etc/nginx/sites-enabled/autobat
  sudo cp /etc/nginx/sites-available/autobat.conf /etc/nginx/sites-enabled/autobat
  sudo systemctl reload nginx

  echo "🎉 Maintenance terminée"
else
  echo "❌ Migration échouée - Rollback"
  ./scripts/restore-db.sh $(ls -t /var/www/autobat/backups/ | head -1)
  pm2 restart autobat-api
fi
```

---

## 7. SEED DATA (Données initiales)

### 7.1 Seed Script

**prisma/seed.ts :**
```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Créer tenant demo
  const tenant = await prisma.tenant.upsert({
    where: { siret: '12345678900001' },
    update: {},
    create: {
      nom: 'Entreprise Demo',
      siret: '12345678900001',
      adresse: '123 Rue Example',
      code_postal: '75001',
      ville: 'Paris',
      telephone: '0123456789',
      email: 'demo@autobat.fr',
      plan: 'STARTER',
      statut: 'ACTIF'
    }
  })

  console.log('✅ Tenant créé:', tenant.nom)

  // 2. Créer super admin
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: {
      tenant_id_email: {
        tenant_id: tenant.id,
        email: 'admin@autobat.fr'
      }
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      email: 'admin@autobat.fr',
      password_hash: passwordHash,
      role: 'COMPANY_ADMIN',
      prenom: 'Admin',
      nom: 'Demo',
      actif: true,
      email_verified: true
    }
  })

  console.log('✅ Admin créé:', admin.email)

  // 3. Seed catalogue (import depuis bibliothèque Graneet)
  const catalogueData = require('./bibliotheque-prix-syla-clean.json')

  for (const item of catalogueData) {
    await prisma.ouvrage.create({
      data: {
        tenant_id: tenant.id,
        code: item.code,
        categorie: item.categorie,
        denomination: item.denomination,
        unite: item.unite,
        prix_unitaire_ht: item.debourse_ht,
        notes: item.note,
        temps_estime_minutes: null,  // À calculer ultérieurement
        nb_chantiers_realises: 0
      }
    })
  }

  console.log('✅ Catalogue importé:', catalogueData.length, 'ouvrages')

  console.log('🎉 Seed terminé !')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

**Exécuter seed :**
```bash
npx prisma db seed
```

---

## 8. CHECKLIST PRE-MIGRATION PRODUCTION

- [ ] **Backup DB** récent (< 24h)
- [ ] **Test migration** sur DB de staging identique
- [ ] **Code déployé** et compatible avec nouvelle structure
- [ ] **Downtime planifié** si nécessaire
- [ ] **Rollback plan** documenté
- [ ] **Monitoring** prêt (logs, Sentry)
- [ ] **Communication** utilisateurs si downtime

---

## Résumé

**Stratégie migrations :**
- ✅ Prisma Migrate (auto-generated SQL)
- ✅ Forward-only (pas de rollback, forward fix)
- ✅ Test sur staging avant prod
- ✅ Backup avant toute migration prod
- ✅ Seed data pour dev/staging

**Prochaine étape :** Dossier 05-api/ (endpoints REST)
