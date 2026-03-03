# 📋 Product Requirements Document (PRD)
# Autobat - Logiciel de Gestion BTP Intelligent

**Version :** 1.0
**Date :** 12 février 2026
**Auteur :** Kevin + Claude
**Statut :** Draft → Review → Approved

---

## 📑 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Objectifs & Métriques](#objectifs--métriques)
3. [Public Cible](#public-cible)
4. [Modules Fonctionnels](#modules-fonctionnels)
5. [Avantages Concurrentiels](#avantages-concurrentiels)
6. [Architecture Multi-Tenant](#architecture-multi-tenant)
7. [Contraintes & Hypothèses](#contraintes--hypothèses)
8. [Roadmap](#roadmap)

---

## 🎯 Vue d'Ensemble

### Concept

**Autobat** est une application SaaS de gestion pour les professionnels du BTP qui se distingue par son **catalogue de prix auto-apprenant** et son **système de badgeage intelligent**.

Contrairement aux solutions existantes (Graneet, Obat, etc.), Autobat améliore automatiquement la précision des devis en apprenant des chantiers réels grâce au badgeage des tâches par les employés.

### Vision

> "Le seul logiciel BTP qui devient plus intelligent à chaque chantier terminé."

### Problèmes Résolus

| Problème | Solution Autobat |
|----------|------------------|
| **Devis imprécis** | Catalogue qui s'ajuste automatiquement avec données réelles |
| **Pas de données sur temps réel** | Badgeage GPS + par tâche (optionnel) |
| **Rentabilité invisible** | Suivi temps réel vs estimé, alertes de dérive |
| **Documents dispersés** | Dossier chantier centralisé (docs + photos + factures) |
| **Gestion complexe** | Interface simple, focus sur l'essentiel |

---

## 🎯 Objectifs & Métriques

### Objectifs Business (12 mois)

- **10 entreprises** clientes payantes (déjà plusieurs en attente)
- **MRR : 2 500€** (10 entreprises × 250€ moyen)
- **Taux de rétention : >85%**
- **NPS : >50**

### Objectifs Produit

1. **Précision des devis : +15%** grâce au catalogue auto-apprenant
2. **Temps de création de devis : -50%** (vs Excel/papier)
3. **Adoption mobile : >70%** des employés utilisent le badgeage
4. **Taux d'utilisation catalogue : >90%**

### Métriques de Succès (KPIs)

| Métrique | Cible MVP | Cible 6 mois |
|----------|-----------|--------------|
| Nb entreprises actives | 3 | 10 |
| Nb chantiers créés/mois | 20 | 100 |
| Nb badgeages/semaine | 50 | 500 |
| Taux ajustement catalogue | >10% ouvrages | >30% |
| Temps moyen création devis | <15 min | <10 min |

---

## 👥 Public Cible

### Segment Primaire

**Artisans et PME du BTP (1-20 employés)**

**Personas :**

#### 1. **Marc, Gérant (8 employés)**
- 45 ans, chef d'entreprise depuis 15 ans
- Fait 30-40 chantiers/an (rénovation, gros œuvre)
- **Pain points :**
  - Perd du temps sur devis (Excel, copier-coller)
  - Devis souvent sous-évalués → perte de rentabilité
  - Difficile de savoir si un chantier est rentable avant la fin
- **Objectifs :**
  - Devis précis et rapides
  - Visibilité sur rentabilité en temps réel
  - Moins de paperasse administrative

#### 2. **Sophie, Chef de chantier**
- 32 ans, gère 3-4 chantiers en parallèle
- **Pain points :**
  - Perd du temps à faire des comptes-rendus papier
  - Photos dispersées dans le téléphone
  - Difficile de suivre l'avancement précis
- **Objectifs :**
  - Centraliser tout au même endroit
  - Partager facilement l'avancement avec le gérant
  - Accès mobile simple

#### 3. **Ahmed, Ouvrier**
- 28 ans, compagnon maçon
- **Pain points :**
  - Pointage manuel fastidieux
  - Pas de visibilité sur son planning
- **Objectifs :**
  - Badger facilement (2 taps max)
  - Voir son planning de la semaine
  - Consulter ses heures

### Segment Secondaire (Post-MVP)

**PME structurées (20-50 employés)**
- Besoin de fonctionnalités avancées (planning, multi-projets)
- Intégrations comptabilité

---

## 🏗️ Modules Fonctionnels

### Architecture Générale

```
┌─────────────────────────────────────────────────┐
│           AUTOBAT - Architecture MVP            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐│
│  │    DEVIS     │→→│   CHANTIER   │→→│FACTURE ││
│  │   Prospect   │  │  + Badgeage  │  │ Client ││
│  └──────────────┘  └──────────────┘  └────────┘│
│         ↓                  ↓                    │
│  ┌──────────────────────────────────────────┐  │
│  │   CATALOGUE AUTO-APPRENANT (COEUR)       │  │
│  │   - Prix initiaux (324 ouvrages Graneet) │  │
│  │   - Ajustement automatique (tous les 2)  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │   MULTI-TENANT + SUPER ADMIN             │  │
│  │   - Isolation des données                │  │
│  │   - Gestion quotas utilisateurs          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Module 1 : DEVIS & CATALOGUE

**Voir détails dans :** [module-devis.md](./module-devis.md)

**Résumé :**
- Catalogue Batiprix personnalisable (324 ouvrages de base)
- Création de devis à partir du catalogue
- Génération PDF
- Validation client (accepté/refusé)
- **Apprentissage automatique** : ajustement prix après 2 chantiers

**User Stories clés :**
- US-01 : En tant que gérant, je veux créer un devis en sélectionnant des ouvrages du catalogue
- US-02 : En tant que gérant, je veux que le catalogue s'améliore automatiquement avec mes chantiers
- US-03 : En tant que gérant, je veux télécharger un devis en PDF

### Module 2 : CHANTIER & BADGEAGE

**Voir détails dans :** [module-chantier.md](./module-chantier.md)

**Résumé :**
- Création de chantiers depuis devis accepté
- Découpage en tâches
- Assignation employés aux tâches
- **Badgeage GPS** : arrivée/départ automatique
- **Badgeage par tâche** (optionnel) : temps réel par tâche
- Dossier documentaire (docs + photos)
- Déclaration fin de chantier

**User Stories clés :**
- US-10 : En tant que gérant, je veux créer un chantier depuis un devis accepté
- US-11 : En tant que chef de chantier, je veux créer des tâches et les assigner
- US-12 : En tant qu'employé, je veux badger automatiquement en arrivant (GPS)
- US-13 : En tant qu'employé, je veux badger une tâche spécifique (mode détaillé)

### Module 3 : FACTURATION CLIENT

**Voir détails dans :** [module-facturation.md](./module-facturation.md)

**Résumé :**
- Création de factures depuis chantier terminé
- Gestion acomptes (montant, date)
- Calcul automatique reste à payer
- Génération PDF facture
- Statuts : En attente, Partiellement payé, Soldé

**User Stories clés :**
- US-20 : En tant que gérant, je veux créer une facture depuis un chantier terminé
- US-21 : En tant que gérant, je veux enregistrer un acompte
- US-22 : En tant que gérant, je veux voir le reste à payer automatiquement

### Module 4 : GESTION EMPLOYÉS

**Voir détails dans :** [module-employes.md](./module-employes.md)

**Résumé :**
- CRUD employés (limité par quota abonnement)
- Taux horaire individuel
- Historique badgeages par employé
- Planning (vue simple MVP)

**User Stories clés :**
- US-30 : En tant que gérant, je veux ajouter un employé (si quota disponible)
- US-31 : En tant que gérant, je veux voir l'historique badgeages d'un employé
- US-32 : En tant qu'employé, je veux voir mon planning de la semaine

---

## 🌟 Avantages Concurrentiels

### 1. Catalogue Auto-Apprenant ⭐⭐⭐

**Description :**
Le catalogue de prix s'ajuste automatiquement tous les 2 chantiers basé sur les données réelles de badgeage.

**Workflow :**
```
1. Devis initial : "Pose carrelage" → 35€/m² (prix catalogue)
   Temps estimé : 30 min/m²

2. Chantier 1 : Badgeage réel → 38 min/m²
   → Système note l'écart mais n'ajuste pas encore

3. Chantier 2 : Badgeage réel → 36 min/m²
   → Moyenne : 37 min/m²
   → Système ajuste le catalogue :
      - Nouveau temps estimé : 37 min/m²
      - Nouveau prix : 37€/m² (basé sur taux horaire + marge)

4. Devis suivants : Utilisent automatiquement 37€/m²
   → Précision +5.7%
```

**Avantage vs Graneet :**
- Graneet : Prix manuels, jamais mis à jour
- Autobat : Amélioration continue automatique

### 2. Badgeage Intelligent ⭐⭐⭐

**Badgeage GPS (Automatique) :**
- Détection arrivée/départ sur zone chantier
- Notifications push
- Zéro action manuelle

**Badgeage par Tâche (Optionnel) :**
- Gérant active/désactive le mode détaillé
- Employé sélectionne tâche + démarre chrono
- Temps réel capturé par tâche
- Alimente l'apprentissage du catalogue

**Mode Offline :**
- Badgeages stockés localement (IndexedDB)
- Synchronisation automatique au retour réseau

**Avantage vs Graneet :**
- Graneet : Pas de badgeage intelligent
- Autobat : GPS + par tâche + offline

### 3. Simplicité & Mobile First ⭐⭐

**PWA (Progressive Web App) :**
- Un seul code pour desktop + mobile
- Installable sur smartphone (icône écran d'accueil)
- Fonctionne offline
- Accès natif GPS, caméra, notifications

**Interface simple :**
- Focus sur l'essentiel (vs 15 modules Graneet)
- Moins de clics pour actions courantes
- Onboarding guidé

---

## 🏢 Architecture Multi-Tenant

### Principe

Chaque entreprise cliente est un **tenant** avec isolation complète des données.

### Hiérarchie

```
SUPER ADMIN (Nous)
├─ Gestion des entreprises (tenants)
├─ Gestion des quotas utilisateurs
├─ Accès support (impersonate)
└─ Analytics globaux

ENTREPRISE A (tenant_id: uuid-1)
├─ Gérant (COMPANY_ADMIN)
│   ├─ Gère employés (dans limite quota)
│   ├─ Crée devis/chantiers/factures
│   └─ Configure mode badgeage
├─ Chef de chantier (MANAGER)
│   ├─ Gère chantiers
│   └─ Assigne tâches
└─ Employés (EMPLOYEE)
    ├─ Badge
    └─ Consulte planning

ENTREPRISE B (tenant_id: uuid-2)
└─ Données complètement isolées
```

### Base de Données

**Toutes les tables ont un `tenant_id` :**

```sql
companies (tenants)
├─ id (UUID)
├─ name
├─ max_users (quota)
├─ subscription_status
└─ subscription_price

users
├─ id
├─ tenant_id (NULL pour super admins)
├─ email
├─ role (SUPER_ADMIN, COMPANY_ADMIN, MANAGER, EMPLOYEE)
└─ ...

devis
├─ id
├─ tenant_id
└─ ...

chantiers
├─ id
├─ tenant_id
└─ ...
```

### Modèle de Pricing

**130€/mois pour le 1er compte (gérant)**
**+ 30€/mois par compte supplémentaire**

Exemples :
- Artisan solo (1 compte) : 130€/mois
- PME 5 personnes (1+4) : 130€ + 120€ = 250€/mois
- PME 15 personnes (1+14) : 130€ + 420€ = 550€/mois

**Gestion des quotas :**
- Impossible de créer plus de comptes que le quota
- Message : "Limite atteinte. Upgradez votre abonnement (+30€/mois par utilisateur)"

---

## 📱 Expérience Utilisateur

### Interface Super Admin

**Dashboard :**
- Nb entreprises actives
- Nb utilisateurs totaux
- MRR (Monthly Recurring Revenue)
- Churn rate

**Gestion Entreprises :**
- Créer entreprise + compte gérant initial
- Modifier quota utilisateurs
- Suspendre/réactiver entreprise
- Se connecter en tant que (impersonate) pour support

### Interface Gérant

**Dashboard :**
- Chantiers en cours (3)
- Devis en attente (2)
- CA du mois (45 000€)
- Factures impayées (12 000€)
- Temps badgé cette semaine

**Actions rapides :**
- Créer un devis
- Créer un chantier
- Voir planning employés

### Interface Mobile (Employé)

**Page d'accueil :**
- Badge présence (GPS automatique)
- Mes tâches du jour
- Badger une tâche (si mode détaillé)
- Prendre une photo

**2 taps maximum pour badger :**
```
Tap 1 : Ouvrir app
Tap 2 : Sélectionner tâche (si mode détaillé)
→ Badge enregistré
```

---

## ⚙️ Stack Technique

**Frontend :**
- React + TypeScript
- PWA (Service Workers)
- TailwindCSS ou Chakra UI

**Backend :**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL

**Hébergement :**
- VPS Hostinger
- Nginx (reverse proxy + SSL)
- PM2 (process manager)

**Stockage Fichiers :**
- Local disk (MVP)
- S3-compatible future (Cloudflare R2, AWS S3)

---

## 🚧 Contraintes & Hypothèses

### Contraintes Techniques

- **Offline mobile :** Badgeages doivent fonctionner sans réseau
- **Performance :** Temps de chargement <2s sur mobile 4G
- **Scalabilité :** Architecture doit supporter 100 tenants dès le MVP
- **Sécurité :** Isolation stricte des données entre tenants

### Hypothèses Business

- **Adoption badgeage :** Les employés acceptent de badger (GPS OK pour eux)
- **Précision GPS :** GPS smartphones suffisamment précis pour détection chantier
- **Marché :** Minimum 10 entreprises prêtes à payer 250€/mois
- **Catalogue initial :** 324 ouvrages Graneet suffisants pour démarrer

### Hypothèses Produit

- **Apprentissage :** 2 chantiers suffisent pour ajuster un prix (ni trop, ni pas assez)
- **Mode simple vs détaillé :** 30% clients activent mode détaillé (badgeage par tâche)
- **Mobile :** 80% badgeages se font sur mobile

---

## 🗺️ Roadmap

### Phase 0 : Fondations (Semaine 1-2)

- [ ] Setup projet (React + Node.js + PostgreSQL)
- [ ] Architecture multi-tenant
- [ ] Authentification (JWT + refresh tokens)
- [ ] Interface Super Admin (CRUD entreprises)
- [ ] Interface Gérant (CRUD employés avec quota)

### Phase 1 : Module Devis (Semaine 3-5)

- [ ] Import catalogue Batiprix (324 ouvrages)
- [ ] CRUD catalogue personnalisé
- [ ] Création de devis
- [ ] Génération PDF
- [ ] Validation devis (statuts)

### Phase 2 : Module Chantier & Badgeage (Semaine 6-9)

- [ ] Gestion chantiers (CRUD)
- [ ] Création tâches + assignation employés
- [ ] Badgeage GPS (détection zone)
- [ ] Badgeage par tâche (mode détaillé optionnel)
- [ ] Mode offline (Service Workers + IndexedDB)
- [ ] Upload documents/photos
- [ ] Déclaration fin de chantier
- [ ] **Apprentissage catalogue** (ajustement automatique)

### Phase 3 : Module Facturation (Semaine 10-12)

- [ ] Génération factures depuis chantier
- [ ] Gestion acomptes
- [ ] Calcul reste à payer
- [ ] Export PDF factures
- [ ] Dashboard basique (KPIs)

### Phase 4 : Polish & Lancement (Semaine 13-14)

- [ ] Tests utilisateurs (3 entreprises pilotes)
- [ ] Corrections bugs
- [ ] Optimisations performances
- [ ] Documentation utilisateur
- [ ] Déploiement production VPS Hostinger

### Post-MVP (Phase 2 - 6+ mois)

- Planning avancé (Gantt, calendrier)
- Achats & Commandes
- Intégrations comptabilité (Sage, Cegid)
- Signature électronique devis (Yousign)
- Analytics avancés
- API publique

---

## ✅ Critères de Succès MVP

**Le MVP est réussi si :**

1. ✅ **3 entreprises** utilisent Autobat en production
2. ✅ **>20 chantiers** créés sur 2 mois
3. ✅ **>50 badgeages/semaine** enregistrés
4. ✅ **Au moins 10%** des ouvrages du catalogue ont été ajustés automatiquement
5. ✅ **Taux de rétention : 100%** (aucune entreprise ne part dans les 3 premiers mois)
6. ✅ **NPS : >40** (satisfaction client)

**Critères d'acceptation technique :**

1. ✅ Temps de création devis : <15 minutes
2. ✅ Badge GPS : détection automatique <30 secondes après arrivée
3. ✅ Mode offline : synchronisation <10 secondes au retour réseau
4. ✅ Génération PDF : <5 secondes
5. ✅ Aucune fuite de données entre tenants (audit sécurité)

---

## 📚 Documents Annexes

- [Module Devis - Spécifications](./module-devis.md)
- [Module Chantier - Spécifications](./module-chantier.md)
- [Module Facturation - Spécifications](./module-facturation.md)
- [Module Employés - Spécifications](./module-employes.md)
- [User Stories Complètes](./user-stories.md)
- [Règles Métier](./regles-metier.md)
- [Wireframes](./wireframes.md)

---

## 📝 Changelog

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | 2026-02-12 | Kevin + Claude | Création initiale du PRD |

---

**🚀 Prêt pour validation et passage en développement !**
