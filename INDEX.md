# INDEX - Autobat Documentation

## 📌 Vue d'ensemble du projet

**Nom:** Autobat
**Type:** SaaS Construction Management (BTP)
**USP:** Catalogue de prix auto-apprenant qui s'améliore avec chaque chantier
**Statut:** Spécifications complètes - Prêt pour développement
**Méthodologie:** BMAD (Brainstorming → PRD → Architecture → Database → API)

---

## 📁 Structure de la Documentation

### 01-brainstorming/ (Idéation et Analyse)

#### recap-final.md
**Contenu:** Vision complète du produit, MVP défini, décisions clés
**Points clés:**
- Vision: "Le seul logiciel BTP qui devient plus intelligent à chaque chantier"
- MVP: Devis + Chantier + Facturation
- Auto-learning: Ajustement prix tous les 2 chantiers
- Badgeage: GPS automatique (60s) + optionnel par tâche
- Pricing: 130€ (1er compte) + 30€/utilisateur
- Tech: React PWA + Node.js + PostgreSQL + Prisma
- Hosting: VPS Hostinger
- Timeline: 14 semaines (4 phases)

**Créé:** Session 1
**Décisions importantes:**
- Multi-tenant architecture (1 DB, isolation par tenant_id)
- Offline-first PWA (Service Workers + IndexedDB)
- Auto-learning simple (pas de ML complexe, juste calcul %)

---

#### analyse-graneet.md
**Contenu:** Analyse concurrentielle complète de Graneet
**Points clés:**
- 3 avantages Autobat vs Graneet:
  1. Auto-learning catalog (Graneet = statique)
  2. Badgeage intelligent GPS + tâches (Graneet = pas de badgeage tâche)
  3. Simplicité interface (Graneet = complexe)
- Positionnement: "Autobat n'est pas Graneet. Autobat apprend de vos chantiers"
- Prix Graneet: ~50€/mois/user (nous: 130€ + 30€/user = plus cher mais plus value)

**Créé:** Session 1
**Source data:** Extraction API Graneet (client SYLA CONSTRUCTION)

---

### 02-prd/ (Product Requirements Document)

#### PRD.md
**Contenu:** Document central - Vue d'ensemble complète
**Points clés:**
- Objectifs: 10 clients, 2500€ MRR en 12 mois
- Success metrics: +15% précision devis, -50% temps création
- Architecture overview
- Roadmap: 4 phases sur 14 semaines
  - Phase 1: Auth + Catalogue (3 sem)
  - Phase 2: Devis + Chantier (4 sem)
  - Phase 3: Facturation (3 sem)
  - Phase 4: Polish + Deploy (4 sem)
- Personas: Marc (gérant 8 employés), Jean (chef chantier), Paul (ouvrier)

**Créé:** Session 2
**À consulter:** Vue d'ensemble avant chaque sprint

---

#### module-devis.md
**Contenu:** Spécifications détaillées module Devis + Auto-learning
**Points clés:**
- Workflow: Client → Catalogue → Lignes → PDF → Envoi → Acceptation
- Numérotation: DEV-YYYY-NNNN (auto-increment par année)
- Auto-learning algorithm (CRITIQUE):
  ```typescript
  // Tous les 2 chantiers
  if (ouvrage.nb_chantiers_realises % 2 === 0) {
    const ecart = (temps_reel_moyen - temps_estime) / temps_estime
    nouveau_prix = prix_actuel * (1 + ecart)  // Proportionnel
  }
  ```
- Badges catalogue: 🟢 Optimisé (8+ chantiers) | 🟡 Apprentissage (2-7) | ⚪ Non testé (0-1)
- Validations: Devis BROUILLON seul modifiable, ENVOYÉ → ACCEPTÉ/REFUSÉ/EXPIRÉ

**Créé:** Session 2
**Fichiers liés:** 04-database/schema.prisma (tables devis, lignes_devis, ouvrages)

---

#### module-chantier.md
**Contenu:** Spécifications Chantier + Badgeage GPS + Offline
**Points clés:**
- GPS automatique toutes les 60s (7h-19h, lun-sam)
- Rayon détection: 100m par défaut (configurable)
- Badgeage hybride:
  - Présence: GPS auto (DEBUT/FIN)
  - Tâches: Manuel optionnel (TACHE_DEBUT/FIN)
- Offline mode (CRITIQUE):
  - Service Worker cache app shell
  - IndexedDB stocke badges non synced
  - Auto-sync au retour réseau
  - Notification "X badgeages synchronisés"
- Fin chantier → Déclenche auto-learning

**Créé:** Session 2
**Code clé:** Algorithme GPS (voir fichier ligne 50-80)

---

#### module-facturation.md
**Contenu:** Spécifications Facturation + Paiements + PDF légal
**Points clés:**
- Numérotation: FAC-YYYY-NNNN (séquence légale obligatoire)
- Snapshots: Infos entreprise/client figées au moment création
- Acompte: 30% par défaut (modifiable)
- Échéance: Émission + 30 jours
- Statuts paiement (auto-calculés):
  - EN_ATTENTE → ACOMPTE_RECU → PARTIELLEMENT_PAYE → SOLDE
- Relances automatiques: J-7, J+0, J+15
- Mentions légales françaises (OBLIGATOIRE):
  - Numéro unique, SIRET, TVA 20%, conditions paiement
  - Pénalités retard, escompte
- PDF generation: Puppeteer + Handlebars template
- Conservation: 10 ans (obligation légale)

**Créé:** Session 2
**Compliance:** Conforme législation française facturation

---

#### user-stories.md
**Contenu:** 42 user stories complètes avec critères d'acceptation
**Structure:**
- 🔴 Critiques (MVP): 20 stories
  - US-D01: Créer devis
  - US-C01: Créer chantier depuis devis
  - US-C02: Badgeage GPS auto
  - US-C03: Badgeage manuel tâche
  - US-F01: Créer facture depuis chantier terminé
  - US-E01: Ajouter employé
- 🟡 Importantes (MVP+): 15 stories
- 🟢 Nice to have (V2): 7 stories

**Créé:** Session 2
**Format:** "En tant que [rôle], je veux [action] afin de [bénéfice]"
**Usage:** Backlog sprint planning

---

#### regles-metier.md
**Contenu:** 100+ règles métier, workflows, validations
**Sections principales:**
1. Multi-tenant (isolation tenant_id)
2. Devis (7 règles)
3. Chantier (7 règles)
4. Facturation (8 règles)
5. Employés (4 règles)
6. Workflows complets (4 flows end-to-end)

**Règles critiques (TOP 20):**
- Isolation tenant_id sur TOUTES les requêtes
- Auto-learning tous les 2 chantiers
- Badge GPS 7h-19h lun-sam uniquement
- Facture = chantier TERMINÉ obligatoire
- TVA fixe 20% (pas de paramétrage)
- Conservation factures 10 ans
- Snapshots factures (pas de références)

**Créé:** Session 2
**Usage:** Référence AVANT chaque implémentation

---

#### wireframes.md
**Contenu:** Wireframes ASCII art des écrans critiques
**Écrans documentés:**
1. Badgeage mobile (3 écrans):
   - Liste chantiers + distance GPS
   - Détail chantier + tâches
   - Mes heures + quota
2. Création devis (2 écrans):
   - Liste devis + KPIs
   - Formulaire + modal catalogue
3. Dashboard manager
4. Liste chantiers (mobile + desktop)

**Design system suggéré:**
- Couleurs BTP: Bleu #1E40AF + Orange #F59E0B
- Font: Inter
- Composants: Badges, boutons, toasts, indicateurs offline

**Créé:** Session 3
**Usage:** Base pour mockups Figma puis développement UI

---

### 03-architecture/ (Architecture Technique)

#### architecture.md
**Contenu:** Architecture système complète avec diagrammes
**Sections:**
1. Diagramme global (VPS → Nginx → React + API + PostgreSQL)
2. Architecture multi-tenant (shared DB, tenant_id isolation)
3. Architecture frontend PWA (structure dossiers, Service Worker)
4. Flux de données (exemple: badgeage GPS end-to-end)
5. Sécurité (Defense in Depth: 5 niveaux)
6. Performance (frontend + backend + DB optimization)
7. Monitoring (logs, metrics, health checks)

**Décisions architecturales clés:**
- Multi-tenant: Shared database (pas de DB par tenant)
- Middleware: Injection automatique tenant_id (Prisma)
- PWA: Workbox + Dexie.js pour offline
- PM2: Cluster mode (max instances = CPU cores)

**Créé:** Session 3
**Diagrammes:** ASCII art (70+ lignes)

---

#### tech-stack.md
**Contenu:** Stack technique avec versions exactes + configurations
**Frontend dependencies (32 packages):**
- react: ^18.3.1
- react-router-dom: ^6.22.0
- axios: ^1.6.7
- react-hook-form: ^7.50.1
- zod: ^3.22.4
- tailwindcss: ^3.4.1
- dexie: ^3.2.5 (IndexedDB)
- workbox: ^7.0.0 (Service Worker)

**Backend dependencies (26 packages):**
- express: ^4.18.2
- @prisma/client: ^5.9.1
- jsonwebtoken: ^9.0.2
- bcrypt: ^5.1.1
- helmet: ^7.1.0
- puppeteer: ^22.2.0 (PDF generation)
- @sendgrid/mail: ^8.1.0

**Configurations:**
- Vite config (PWA + proxy)
- Tailwind config (palette BTP)
- TypeScript config (strict mode)
- PM2 ecosystem config (cluster)
- PostgreSQL config

**Créé:** Session 3
**Usage:** Copier configs lors du setup

---

#### deployment.md
**Contenu:** CI/CD + Scripts déploiement VPS
**Contenu:**
1. Setup VPS (script bash complet):
   - Node.js 20, PostgreSQL 16, Nginx, PM2, Certbot
   - Firewall UFW
2. Config PostgreSQL (sécurité, utilisateur, DB)
3. Config Nginx (HTTP → HTTPS redirect, SSL, caching)
4. Structure dossiers serveur
5. Déploiement manuel (première fois)
6. GitHub Actions workflows (backend + frontend)
7. Scripts utilitaires:
   - backup-db.sh (quotidien 2h)
   - restore-db.sh
   - health-check.sh

**GitHub Actions:**
- deploy-backend.yml (lint → build → deploy → PM2 reload)
- deploy-frontend.yml (lint → build → rsync → nginx reload)

**Créé:** Session 3
**Secrets GitHub requis:** VPS_HOST, VPS_USER, VPS_SSH_KEY, DATABASE_URL, JWT_SECRET

---

### 04-database/ (Base de Données)

#### schema.prisma
**Contenu:** Schéma Prisma COMPLET (21 tables, production-ready)
**Tables:**
1. tenants (entreprises clientes)
2. users (authentification + rôles)
3. refresh_tokens (JWT refresh)
4. employes (extension users pour EMPLOYEE)
5. clients (clients des entreprises)
6. ouvrages (catalogue auto-apprenant)
7. historique_prix (traçabilité ajustements)
8. devis + lignes_devis
9. chantiers
10. chantier_employe (liaison N:M)
11. taches
12. badgeages (présence + tâches)
13. documents (photos, PDFs)
14. factures + lignes_facture
15. paiements_facture
16. notifications

**Enums (14):**
- Role, PlanType, TenantStatus
- StatutDevis, StatutChantier, StatutTache
- TypeBadgeage, MethodeBadgeage
- StatutPaiement, StatutFacture
- MoyenPaiement, TypePaiement
- TypeDocument, TypeNotification

**Indexes critiques:**
- tenant_id sur TOUTES les tables (multi-tenant)
- Composite indexes (employe_id + timestamp pour badgeages)
- Unique constraints (tenant_id + email, tenant_id + numero_devis)

**Créé:** Session 4
**Usage:** Copier dans backend/prisma/schema.prisma

---

#### schema.md
**Contenu:** Documentation modèle relationnel + diagrammes
**Sections:**
1. Diagramme relationnel global (ASCII art)
2. Documentation détaillée 21 tables (structure SQL + exemples)
3. Stratégies optimisation (indexes, partitioning)
4. Requêtes fréquentes (avec SQL examples)
5. Estimations volumétrie:
   - 1 an: ~12M rows, ~3 GB
   - Table critique: badgeages (10M rows = 2 GB)

**Indexes recommandés:**
```sql
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_badgeages_employe_timestamp
  ON badgeages(employe_id, timestamp DESC);
```

**Créé:** Session 4
**Usage:** Référence structure DB pendant dev

---

#### migrations.md
**Contenu:** Stratégie migrations Prisma + exemples
**Workflow:**
1. Dev: `prisma migrate dev --name xxx`
2. Prod: `prisma migrate deploy` (JAMAIS migrate dev en prod)

**Exemples migrations:**
- Ajouter colonne
- Ajouter index
- Modifier type (avec migration data)
- Ajouter enum value
- Split field (migration complexe)

**Rollback strategy:**
- Dev: `prisma migrate resolve --rolled-back`
- Prod: Forward fix (nouvelle migration qui annule)

**Seed script:**
- Tenant demo
- Admin user
- Import catalogue (324 ouvrages SYLA)

**Créé:** Session 4
**Best practices:** Nommage, tests, downtime planning

---

### 05-api/ (API REST)

#### endpoints.md
**Contenu:** ~80 endpoints REST documentés (Request + Response)
**Groupes (12 modules):**
1. Authentication (7 endpoints):
   - POST /auth/register, /auth/login, /auth/refresh
   - POST /auth/logout, /auth/forgot-password, /auth/reset-password
2. Users (6 endpoints)
3. Clients (6 endpoints)
4. Catalogue (6 endpoints)
5. Devis (8 endpoints)
6. Chantiers (7 endpoints)
7. Badgeages (5 endpoints)
8. Tâches (4 endpoints)
9. Documents (3 endpoints)
10. Factures (6 endpoints)
11. Dashboard (1 endpoint)
12. Notifications (3 endpoints)

**Format standard:**
```
### POST /api/resource
Description

**Auth:** Bearer Token (ROLE+)

**Request:** JSON example

**Response:** JSON example

**Errors:** Liste erreurs possibles
```

**Query params standards:**
- page, limit (pagination)
- search (recherche)
- statut, client_id, etc. (filtres)

**Créé:** Session 5
**Usage:** Référence lors de l'implémentation routes

---

#### contracts.md
**Contenu:** ~60 types TypeScript (Request/Response formats)
**Structure:**
- Types communs (Pagination, Error)
- Par module: Input/Response/List/Detail
- Validation schemas (Zod examples)

**Exemples types:**
```typescript
interface DevisCreateInput {
  client_id: string
  date_validite: string
  notes?: string
  lignes: LigneDevisInput[]
}

interface DevisResponse {
  id: string
  numero_devis: string
  client: ClientSummary
  montant_ttc: number
  statut: StatutDevis
  // ...
}
```

**Conventions:**
- `<Resource>CreateInput` → POST body
- `<Resource>UpdateInput` → PATCH body
- `<Resource>Response` → GET response
- `<Resource>ListResponse` → GET list with pagination

**Créé:** Session 5
**Usage:** Implémenter types dans backend + frontend

---

#### authentication.md
**Contenu:** JWT, permissions, sécurité complète
**Sections:**
1. JWT structure (Access 24h + Refresh 7j)
2. Token generation (code examples)
3. Middleware auth (verification + tenant isolation)
4. Authorization RBAC (requireRole, requireOwnership)
5. Permission matrix (42 lignes, 4 rôles)
6. Authentication flows (4 diagrammes)
7. Password security (bcrypt, regex validation)
8. Rate limiting (global 100/min, login 5/15min)
9. Security headers (Helmet config)
10. CORS configuration

**Permission matrix extrait:**
| Action | EMPLOYEE | MANAGER | COMPANY_ADMIN |
|--------|----------|---------|---------------|
| Créer devis | ❌ | ✅ | ✅ |
| Créer badge (soi) | ✅ | ✅ | ✅ |
| Voir factures | ❌ | ✅ | ✅ |

**Security checklist (15 points):**
- JWT secrets 256-bit random
- bcrypt salt rounds = 10
- Rate limiting activé
- Helmet + CORS configurés
- npm audit clean

**Créé:** Session 5
**CRITIQUE:** À implémenter EXACTEMENT comme spécifié

---

## 🗂️ Fichiers Annexes

### bibliotheque-prix-syla-clean.json
**Contenu:** 324 ouvrages extraits de Graneet (client SYLA)
**Structure:**
```json
{
  "categorie": "Gros Oeuvre",
  "code": "GO-DEM-001",
  "denomination": "Démolition cloisons",
  "unite": "m²",
  "debourse_ht": 38.00,
  "note": "Inclut évacuation gravats"
}
```

**Catégories:**
- Gros Oeuvre: 101 items
- Électricité: 26 items
- Plomberie: 34 items
- Charpente: 20 items
- Finitions: 67 items
- Autres: 76 items

**Source:** API Graneet (extraction légale avec permission client)
**Usage:** Seed initial catalogue (prisma/seed.ts)

---

### bibliotheque-prix-syla-clean.csv
**Contenu:** Même data en CSV (pour Excel/import)
**Colonnes:** categorie,code,denomination,unite,debourse_ht,note

---

## 📈 Métriques Documentation

### Complétude
- Brainstorming: ✅ 100%
- PRD: ✅ 100%
- Architecture: ✅ 100%
- Database: ✅ 100%
- API: ✅ 100%

### Volumétrie
- Fichiers créés: 18
- Pages équivalent: ~200
- Lines of code (examples): ~2000
- Diagrammes ASCII: 12
- Tables documentées: 21
- Endpoints: 80
- User stories: 42
- Règles métier: 100+

---

## 🎯 Quick Reference - Développeur

### Je veux implémenter...

**...l'authentification JWT**
→ Lire: `05-api/authentication.md`
→ Types: `05-api/contracts.md` (section 2)
→ Endpoints: `05-api/endpoints.md` (section 1)
→ DB: `04-database/schema.prisma` (users, refresh_tokens)

**...le badgeage GPS automatique**
→ Specs: `02-prd/module-chantier.md` (section GPS)
→ Règles: `02-prd/regles-metier.md` (RG-C03)
→ Endpoints: `05-api/endpoints.md` (section 7 Badgeages)
→ DB: `04-database/schema.prisma` (badgeages)
→ Frontend: `02-prd/wireframes.md` (écran 1.1, 1.2)

**...la création de devis**
→ Specs: `02-prd/module-devis.md`
→ User story: `02-prd/user-stories.md` (US-D01)
→ Règles: `02-prd/regles-metier.md` (section 2)
→ Endpoints: `05-api/endpoints.md` (section 5 Devis)
→ Types: `05-api/contracts.md` (section 6)
→ DB: `04-database/schema.prisma` (devis, lignes_devis)

**...l'auto-learning du catalogue**
→ Algorithme: `02-prd/module-devis.md` (section 2.3)
→ Règles: `02-prd/regles-metier.md` (RG-D05)
→ DB: `04-database/schema.prisma` (ouvrages, historique_prix)
→ Déclenchement: À la fin du chantier (voir `02-prd/module-chantier.md`)

**...les factures PDF conformes**
→ Specs: `02-prd/module-facturation.md` (section 2.3)
→ Règles: `02-prd/regles-metier.md` (RG-F08 mentions légales)
→ Template: `02-prd/module-facturation.md` (template HTML)
→ Tech: `03-architecture/tech-stack.md` (Puppeteer)

**...le mode offline PWA**
→ Specs: `02-prd/module-chantier.md` (section 2.5 offline)
→ Archi: `03-architecture/architecture.md` (section 2.2)
→ Config: `03-architecture/tech-stack.md` (Workbox + Dexie)
→ Endpoints: `05-api/endpoints.md` (POST /badgeages/sync)

---

## ⚡ Commandes Rapides

### Trouver une info rapidement

```bash
# Rechercher un concept dans toute la doc
grep -r "auto-learning" 02-prd/

# Trouver tous les endpoints d'un module
grep "### GET /api/devis" 05-api/endpoints.md

# Voir toutes les règles d'un module
grep "^###" 02-prd/regles-metier.md

# Lister tous les types d'un module
grep "^interface.*Response" 05-api/contracts.md
```

---

## 🔄 Changelog Documentation

### Session 1 (Brainstorming)
- Créé: recap-final.md, analyse-graneet.md
- Extraction: bibliotheque-prix-syla (324 items)

### Session 2 (PRD)
- Créé: PRD.md, module-devis.md, module-chantier.md
- Créé: module-facturation.md, user-stories.md, regles-metier.md

### Session 3 (Wireframes + Architecture)
- Créé: wireframes.md
- Créé: architecture.md, tech-stack.md, deployment.md

### Session 4 (Database)
- Créé: schema.prisma (21 tables complètes)
- Créé: schema.md, migrations.md

### Session 5 (API)
- Créé: endpoints.md (80 routes)
- Créé: contracts.md (60 types)
- Créé: authentication.md

---

## 📝 Notes Importantes

### Décisions Non Négociables
1. Multi-tenant avec tenant_id (pas de DB séparées)
2. Auto-learning tous les 2 chantiers (pas à chaque chantier)
3. TVA fixe 20% (pas de paramétrage)
4. Conservation factures 10 ans (légal)
5. Offline-first PWA (Service Workers obligatoire)
6. JWT avec refresh token rotation

### Points d'Attention Développement
1. **TOUJOURS** filtrer par tenant_id (sécurité critique)
2. **JAMAIS** modifier factures envoyées (créer avoir)
3. **Badges GPS** : Vérifier 7h-19h + lun-sam + rayon
4. **Snapshots factures** : Copier data, pas références
5. **Migrations Prisma** : Tester sur staging AVANT prod
6. **Secrets** : Jamais dans le code, toujours .env

### Performance Critiques
1. Index sur tenant_id (TOUTES les tables)
2. Pagination (max 100 items)
3. PM2 cluster mode
4. Service Worker cache agressif
5. Images compressées < 1 MB

---

## 🎓 Pour les Nouveaux Développeurs

**Ordre de lecture recommandé:**
1. `02-prd/PRD.md` - Comprendre le produit
2. `01-brainstorming/recap-final.md` - Vision et décisions
3. `03-architecture/architecture.md` - Architecture système
4. `04-database/schema.md` - Modèle de données
5. `05-api/endpoints.md` - API disponible
6. `02-prd/user-stories.md` - Fonctionnalités à implémenter

**Temps de lecture:** ~4-6 heures pour tout lire

---

## ✅ Validation Complétude

- [x] Vision produit claire et documentée
- [x] Analyse concurrentielle (Graneet)
- [x] PRD complet avec modules détaillés
- [x] User stories avec critères d'acceptation
- [x] Règles métier exhaustives
- [x] Wireframes écrans critiques
- [x] Architecture système multi-tenant
- [x] Stack technique avec versions
- [x] CI/CD et déploiement
- [x] Schéma DB complet (21 tables)
- [x] Stratégie migrations
- [x] 80 endpoints API documentés
- [x] Types TypeScript définis
- [x] Authentication JWT complète
- [x] Seed data (catalogue 324 items)

**Status:** ✅ PRÊT POUR DÉVELOPPEMENT

---

**Dernière mise à jour:** 2026-02-12
**Version:** 1.0.0
**Mainteneur:** Kevin (avec Claude Sonnet 4.5)
