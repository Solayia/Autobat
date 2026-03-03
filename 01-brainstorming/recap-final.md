# 📋 Récapitulatif Final du Brainstorming

**Date :** 12 février 2026
**Projet :** Autobat - Application SaaS de gestion pour professionnels du BTP
**Équipe :** Kevin (fullstack) + Claude (AI assistant)

---

## 🎯 Vision du Projet

### Concept
Plateforme SaaS multi-tenant permettant aux professionnels du BTP de gérer l'intégralité de leur activité, de la prospection à la facturation, avec un système unique d'apprentissage automatique basé sur les données réelles de terrain.

### Problèmes Résolus
1. **Devis imprécis** - Manque de données historiques sur les temps réels
2. **Rentabilité invisible** - Impossible de savoir si un chantier est rentable avant la fin
3. **Absence de données réelles** - Pas de mesure objective du temps passé par tâche
4. **Dispersion des documents** - Photos, devis, factures éparpillés
5. **Suivi des paiements** - Besoin de tracker l'état d'avancement (acompte → soldé)

### Avantage Concurrentiel Principal
**Catalogue auto-apprenant** qui se personnalise automatiquement tous les 2 chantiers avec les données réelles de badgeage, permettant des devis de plus en plus précis.

---

## 👥 Public Cible

### Validation Marché
- ✅ Discussions avec de nombreux pros du BTP
- ✅ Expérience pratique (rénovation maison)
- ✅ **Plusieurs entreprises déjà en attente du logiciel**

### Taille d'Entreprises Ciblées
- Artisans solo (1-3 personnes)
- PME du BTP (5-20 employés)

---

## 💰 Modèle Commercial

### Pricing
```
130€/mois pour le 1er compte (gérant)
+ 30€/mois par compte supplémentaire

Exemples :
- Artisan solo (1 compte) : 130€/mois
- PME 5 personnes (1+4) : 130€ + 120€ = 250€/mois
- PME 15 personnes (1+14) : 130€ + 420€ = 550€/mois
```

### Gestion des Quotas
- Limitation stricte du nombre de comptes selon l'abonnement
- Impossibilité de créer plus de comptes que le quota
- Upgrade possible à tout moment (+30€/compte/mois)

---

## 🏗️ Architecture Technique

### Type d'Application
**Web App Progressive (PWA)**
- Un seul codebase pour desktop + mobile
- Responsive design
- Installable sur smartphones
- Accès GPS, caméra, notifications
- Fonctionne offline avec synchronisation

### Stack Technique

**Frontend**
- React + TypeScript
- Design responsive (mobile-first)
- PWA (Service Workers)

**Backend**
- Node.js + Express + TypeScript
- Prisma ORM
- Architecture multi-tenant (tenant_id)

**Base de Données**
- PostgreSQL

**Hébergement**
- VPS Hostinger
- Nginx (reverse proxy + SSL)
- PM2 (process manager)
- Certbot (SSL Let's Encrypt)

---

## 👤 Rôles & Permissions

### Hiérarchie des Rôles
```
🔴 SUPER_ADMIN (Nous)
└─ Gestion complète de la plateforme

🟠 COMPANY_ADMIN (Gérant)
└─ Gestion de son entreprise

🟡 MANAGER (Chef de chantier)
└─ Gestion opérationnelle des chantiers

🟢 EMPLOYEE (Ouvrier)
└─ Badgeage et consultation
```

### Permissions Clés

**Employé :**
- ❌ NE voit PAS les prix/marges du catalogue
- ❌ NE peut PAS modifier son badgeage après coup
- ✅ Badge ses tâches
- ✅ Consulte son planning

**Chef de Chantier :**
- ✅ Gère les chantiers au quotidien
- ✅ Assigne les tâches
- ✅ Upload documents/photos
- ✅ Peut créer des devis SI le gérant lui donne le droit

**Gérant :**
- ✅ Accès total à son entreprise
- ✅ Crée/gère les utilisateurs (dans limite quota)
- ✅ Active/désactive les rôles selon besoin
- ✅ Choisit le mode de badgeage (simple ou détaillé)
- ✅ Voit tableaux de bord financiers

**Super Admin :**
- ✅ Crée des entreprises (tenants)
- ✅ Crée le compte gérant initial
- ✅ Gère les quotas de comptes
- ✅ Accède à n'importe quelle entreprise (support)
- ✅ Voit analytics globaux
- ✅ Gestion abonnements et paiements

---

## 📦 Modules du MVP

### 1. Devis Prospect

**Fonctionnalités :**
- Création de devis
- Catalogue style Batiprix
  - Catalogue de base fourni (tâches standards BTP)
  - Personnalisation par entreprise (ajout tâches spécifiques)
  - Structure : Catégorie, Unité, Prix, Temps estimé, Fournitures, Marge
- Génération PDF
- Validation devis (prospect accepte/refuse)

**Catalogue Auto-Apprenant :**
```
Exemple :
Tâche : "Pose carrelage 60x60"
- Prix initial catalogue : 45€/m²
- Temps estimé : 30min/m²

Après 2 chantiers avec cette tâche :
- Temps réel moyen : 38min/m²
- Coût réel : 52€/m²

→ Catalogue s'ajuste automatiquement
→ Futurs devis plus précis
```

---

### 2. Suivi de Chantier

**Fonctionnalités :**
- Création de fiches chantier
- Création de tâches
- Assignation de tâches aux employés
- **Système de badgeage hybride** (voir section dédiée)
- Espace documentation :
  - Upload documents (PDF, Word, etc.)
  - Upload photos
  - Organisation par chantier
- Déclaration fin de chantier

---

### 3. Facturation Client

**Fonctionnalités :**
- Génération de factures clients
- Suivi des paiements :
  - Acompte versé
  - Montant total
  - Reste à payer
  - Statut : Payé en totalité
- Génération PDF factures
- Historique paiements

---

## 📍 Système de Badgeage

### Mode Automatique GPS (Présence Chantier)
```
8h05 : Arrivée sur zone GPS du chantier
→ Badge automatique "Début de journée"
→ Notification : "Vous êtes sur Chantier Villa Dupont"

17h30 : Sortie de la zone GPS
→ Badge automatique "Fin de journée"
→ Total enregistré : 9h25 sur le chantier
```

### Mode Badgeage par Tâche (Optionnel)

**Le gérant choisit le mode pour son entreprise :**

**🔧 MODE SIMPLE (Sans badgeage par tâche)**
- Seul le temps total sur chantier est enregistré
- Pas de détail par tâche
- ✅ Facile pour les employés
- ⚠️ Apprentissage catalogue LENT (besoin de beaucoup de chantiers)

**🎯 MODE DÉTAILLÉ (Avec badgeage par tâche)**
- L'employé badge manuellement chaque tâche via l'app mobile :
```
8h05 : Arrivée auto (GPS)
8h10 : Badge "Démarre : Pose carrelage cuisine"
12h00 : Badge "Pause"
13h00 : Badge "Reprend : Pose carrelage cuisine"
14h30 : Badge "Termine tâche"
14h35 : Badge "Démarre : Joints carrelage"
17h30 : Départ auto (GPS)
```
- ✅ Apprentissage catalogue RAPIDE (données précises dès 2 chantiers)
- ⚠️ Demande rigueur des employés

### Validation & Offline

**Validation :**
- ✅ Automatique (pas de validation manuelle par chef de chantier)

**Mode Offline :**
- ✅ Stockage local sur le smartphone
- ✅ Synchronisation automatique au retour du réseau
- ✅ Zéro friction pour employés sur chantier sans réseau

---

## 🔐 Architecture Multi-Tenant

### Principe
Chaque entreprise est un **tenant** avec ses données complètement isolées.

### Structure Base de Données
```sql
-- Table des tenants
companies
├─ id (UUID)
├─ name
├─ max_users (quota)
├─ subscription_status (active, suspended, cancelled)
├─ subscription_price (calculé : 130 + (nb_users-1)*30)
└─ created_at

-- Toutes les autres tables incluent tenant_id
users
├─ id
├─ tenant_id (NULL pour super admins)
├─ email
├─ role (SUPER_ADMIN, COMPANY_ADMIN, MANAGER, EMPLOYEE)
└─ ...

chantiers
├─ id
├─ tenant_id
├─ name
└─ ...

devis
├─ id
├─ tenant_id
└─ ...
```

### Middleware Tenant
```typescript
// Toutes les requêtes API incluent automatiquement le filtre tenant_id
// Sauf pour les super admins qui peuvent accéder à tous les tenants
```

---

## 🎛️ Interface Super Admin

### Fonctionnalités Essentielles

**Gestion des Entreprises**
- Créer une nouvelle entreprise (tenant)
- Créer le compte gérant initial
- Définir le quota de comptes (par défaut : illimité ou limité ?)
- Suspendre/réactiver une entreprise
- Supprimer une entreprise

**Gestion des Quotas**
- Voir quota actuel vs utilisé (ex: 3/5 comptes)
- Augmenter/réduire le quota
- Voir historique des modifications

**Accès Support**
- Se connecter en tant que n'importe quelle entreprise (impersonate)
- Accéder à leur interface pour debug/support
- Revenir à l'interface super admin

**Analytics Globaux**
- Nombre total d'entreprises
- Nombre total d'utilisateurs
- Revenus mensuels
- Taux de conversion
- Utilisation (nb chantiers, devis, etc.)

**Gestion Abonnements**
- Suivi des paiements
- Entreprises en retard de paiement
- Historique facturation

---

## 📅 Plan de Développement

### Objectif
**Livrer le MVP le plus rapidement possible**
Timeline estimée : **3-4 mois**

### Équipe
- **Kevin** : Développement fullstack
- **Claude** : Assistance développement, architecture, code review

---

### PHASE 0 : Fondations & Super Admin (Semaine 1-2)

**Setup Projet**
- [ ] Init projet React + TypeScript
- [ ] Init projet Node.js + Express + TypeScript
- [ ] Setup PostgreSQL + Prisma
- [ ] Configuration VPS Hostinger (Nginx, PM2, SSL)

**Architecture Multi-Tenant**
- [ ] Schéma base de données avec tenant_id
- [ ] Middleware d'isolation tenant
- [ ] Système de permissions (RBAC)

**Authentification**
- [ ] Système JWT + Refresh Tokens
- [ ] Endpoints login/logout/refresh
- [ ] Protection des routes

**Interface Super Admin**
- [ ] Dashboard super admin
- [ ] CRUD entreprises (tenants)
- [ ] Créer compte gérant initial
- [ ] Gestion quotas utilisateurs
- [ ] Fonction "Se connecter en tant que" (impersonate)
- [ ] Analytics de base

**Interface Gérant**
- [ ] Gestion des employés (CRUD)
- [ ] Respect du quota max
- [ ] Attribution des rôles/permissions
- [ ] Configuration mode badgeage (simple/détaillé)

---

### PHASE 1 : Module Devis (Semaine 3-5)

**Catalogue Batiprix**
- [ ] Import catalogue de base (CSV/JSON)
- [ ] Structure catalogue (catégories, tâches, unités, prix, temps)
- [ ] CRUD tâches personnalisées
- [ ] Filtrage et recherche

**Création de Devis**
- [ ] Formulaire création devis
- [ ] Sélection tâches du catalogue
- [ ] Calcul automatique (quantités × prix unitaires)
- [ ] Ajout marge personnalisée
- [ ] Gestion prospect (nom, email, tél, adresse)

**Génération PDF**
- [ ] Template PDF devis
- [ ] Logo entreprise personnalisé
- [ ] Mentions légales
- [ ] Export PDF téléchargeable

**Validation Devis**
- [ ] Statuts : Brouillon, Envoyé, Accepté, Refusé
- [ ] Lien de validation client (optionnel)
- [ ] Historique des devis

---

### PHASE 2 : Module Chantier & Badgeage (Semaine 6-9)

**Gestion Chantiers**
- [ ] CRUD chantiers
- [ ] Informations : nom, adresse, client, dates
- [ ] Statuts : Planifié, En cours, Terminé, Suspendu
- [ ] Liaison devis → chantier

**Gestion des Tâches**
- [ ] Créer tâches pour un chantier
- [ ] Assigner employés à des tâches
- [ ] Définir temps estimé (depuis catalogue)
- [ ] Statuts tâches : À faire, En cours, Terminée

**Badgeage GPS (Présence Chantier)**
- [ ] Définir zone GPS par chantier (rayon autour d'une adresse)
- [ ] Détection automatique arrivée/départ
- [ ] Enregistrement temps total présence
- [ ] Notifications push

**Badgeage par Tâche (Mode Détaillé)**
- [ ] Interface mobile badge tâche
- [ ] Démarrer/Pause/Reprendre/Terminer
- [ ] Chronomètre temps réel
- [ ] Historique badgeages par employé

**Mode Offline & Sync**
- [ ] Service Worker (PWA)
- [ ] Stockage local IndexedDB
- [ ] Queue de synchronisation
- [ ] Indicateur online/offline

**Documentation Chantier**
- [ ] Upload documents (PDF, Word, Excel, etc.)
- [ ] Upload photos (compression automatique)
- [ ] Organisation en dossiers
- [ ] Prévisualisation
- [ ] Téléchargement

**Fin de Chantier**
- [ ] Bouton "Déclarer fin de chantier"
- [ ] Validation finale
- [ ] Récapitulatif temps passé vs estimé
- [ ] Récapitulatif coûts

**Apprentissage Catalogue**
- [ ] Calcul temps réel moyen par tâche
- [ ] Mise à jour automatique après 2 chantiers
- [ ] Historique des ajustements
- [ ] Indicateur "Données mises à jour" dans catalogue

---

### PHASE 3 : Module Facturation (Semaine 10-12)

**Génération Factures**
- [ ] Créer facture depuis chantier terminé
- [ ] Liaison chantier → facture
- [ ] Template PDF facture
- [ ] Numérotation automatique
- [ ] Logo et mentions légales

**Suivi des Paiements**
- [ ] Acompte versé (montant + date)
- [ ] Montant total
- [ ] Calcul automatique reste à payer
- [ ] Statuts : En attente, Partiellement payé, Soldé
- [ ] Historique paiements

**Tableaux de Bord**
- [ ] Dashboard gérant :
  - Chantiers en cours
  - Chiffre d'affaires du mois
  - Factures impayées
  - Temps badgé cette semaine
- [ ] Dashboard employé :
  - Ses tâches à venir
  - Ses heures de la semaine
- [ ] Dashboard super admin :
  - Revenus plateforme
  - Nb entreprises actives
  - Nb utilisateurs totaux

---

### PHASE 4 : Polish & Lancement (Semaine 13-14)

**Tests Utilisateurs**
- [ ] Onboarding des premières entreprises en attente
- [ ] Formation utilisateurs
- [ ] Collecte feedback
- [ ] Corrections bugs

**Optimisations**
- [ ] Performance (lazy loading, cache)
- [ ] SEO (meta tags, sitemap)
- [ ] Mobile UX (tactile, gestes)

**Documentation**
- [ ] Guide utilisateur (PDF ou intégré)
- [ ] FAQ
- [ ] Vidéos tutoriels (optionnel)

**Déploiement Production**
- [ ] Configuration finale VPS
- [ ] Backups automatiques PostgreSQL
- [ ] Monitoring (uptime, logs)
- [ ] SSL configuré
- [ ] DNS configuré

**Go Live ! 🚀**

---

## 📊 KPIs à Suivre Post-Lancement

### Adoption
- Nombre d'entreprises inscrites
- Nombre d'utilisateurs actifs (DAU, MAU)
- Taux de conversion (inscription → utilisation régulière)

### Utilisation
- Nombre de devis créés/semaine
- Nombre de chantiers actifs
- Nombre de badgeages/jour
- Taux d'utilisation du mode détaillé vs simple

### Business
- MRR (Monthly Recurring Revenue)
- Churn rate (taux de désabonnement)
- ARPU (Average Revenue Per User)
- Coût d'acquisition client

### Technique
- Uptime (objectif : 99.9%)
- Temps de réponse API
- Taux d'erreurs
- Utilisation stockage (photos/docs)

---

## 🚀 Évolutions Post-MVP (Phase 2)

### Fonctionnalités Avancées
- Intégrations comptabilité (Sage, Cegid, QuickBooks)
- Signature électronique devis (Yousign, DocuSign)
- Récupération automatique factures fournisseurs (OCR)
- Planning/calendrier partagé
- Chat intégré (communication équipe)
- Notifications SMS (en plus des push)

### Analytics & IA
- Prédiction rentabilité chantier (ML)
- Détection anomalies (chantier qui dérape)
- Suggestions optimisation (réaffectation employés)
- Tableau de bord avancé (Power BI style)

### Mobile Native
- Si besoin de performances GPS meilleures
- Ou si besoin de fonctionnalités natives avancées

### Marketplace
- Extensions tierces
- Templates de devis/factures
- Catalogues Batiprix spécialisés

---

## ✅ Validation du Brainstorming

**Questions clés validées :**
1. ✅ Vision et problèmes résolus
2. ✅ Pain points utilisateurs
3. ✅ MVP et fonctionnalités prioritaires
4. ✅ Catalogue et apprentissage automatique
5. ✅ Rôles et permissions
6. ✅ Système de badgeage
7. ✅ Stack technique et timeline

**Prêt pour passer au PRD (Product Requirements Document) ! 🎯**

---

## 🎬 Prochaines Étapes

1. **Créer le PRD détaillé** (dossier `02-prd/`)
   - Spécifications fonctionnelles complètes
   - User stories détaillées
   - Wireframes/mockups (optionnel)

2. **Définir l'architecture technique** (dossier `03-architecture/`)
   - Schéma base de données
   - Architecture API
   - Diagrammes de flux

3. **Créer les User Stories** (dossier `04-stories/`)
   - Décomposition en stories développables
   - Estimation de complexité
   - Priorisation

4. **Démarrer l'implémentation** (dossier `05-implementation/`)
   - Setup projet
   - Premiers sprints

**Let's build this ! 💪**
