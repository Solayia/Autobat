# 📊 Analyse Comparative : Graneet vs Autobat

**Date :** 12 février 2026
**Objectif :** Identifier les forces/faiblesses de Graneet pour positionner Autobat

---

## 🔍 Vue d'Ensemble Graneet

**Graneet** est une solution SaaS complète pour les professionnels du BTP couvrant :
- Gestion commerciale (Contacts, Devis)
- Gestion de chantiers
- Facturation et encaissements
- Gestion RH (Intervenants, temps passé)
- Achats et commandes
- Comptabilité
- Banque

**Positionnement :** Solution tout-en-un pour entreprises BTP (PME principalement)

---

## 📋 Analyse par Module

### 1. DEVIS

#### ✅ **Ce qu'ils font BIEN**

**Gestion complète :**
- Liste claire avec filtres puissants (Brouillon, Finalisé, Accepté)
- Recherche rapide
- Statistiques globales en bas (172 Devis, 3 009 180,72€ HT)
- Statuts visuels clairs
- Import/Export de devis
- Colonnes pertinentes : N°, Nom, Date acceptation, Date devis, Client, Montant HT, Statut

**Bibliothèque de prix :**
- Organisation par dossiers/catégories
- Structure claire : Code, Dénomination, Unité, Déboursé HT
- Import d'ouvrages en masse
- 324 ouvrages récupérés (pour SYLA CONSTRUCTION)

#### ❌ **Ce qui MANQUE ou est FAIBLE**

**Pas d'apprentissage automatique :**
- ❌ La bibliothèque de prix est **STATIQUE**
- ❌ Aucun ajustement automatique basé sur les chantiers réels
- ❌ Pas de suivi "Temps estimé vs Temps réel"
- ❌ Impossible de savoir si un prix catalogue est fiable ou pas

**Manque de prédictivité :**
- ❌ Pas d'indicateur de rentabilité prévisionnelle
- ❌ Pas d'alerte si le devis semble sous-évalué
- ❌ Pas d'historique "devis similaires"

**Interface :**
- Certaines dénominations stockées en JSON Lexical (format éditeur) → données pas propres
- Pas de code sur la plupart des ouvrages (juste "Charpente" répété)

---

### 2. CHANTIERS

#### ✅ **Ce qu'ils font BIEN**

**Suivi visuel :**
- Barres de progression pour chaque chantier
- Colonnes claires : REF, Nom, Client, Dates, Montant, Facturé, Solde
- Filtres par statut (New, Fournir, Passé)
- Vue d'ensemble rapide

**Organisation :**
- Référence unique par chantier
- Liaison avec clients
- Dates de début/fin
- Montants et suivi facturation

#### ❌ **Ce qui MANQUE ou est FAIBLE**

**❌ PAS DE BADGEAGE PAR TÂCHE**
- Impossible de savoir combien de temps a pris chaque tâche
- Pas de lien entre "Temps passé" et "Catalogue de prix"
- Perte de données critiques pour améliorer les devis futurs

**Manque de granularité :**
- ❌ Pas de découpage en tâches détaillées visibles
- ❌ Pas d'assignation de tâches aux employés depuis cette vue
- ❌ Progression globale seulement (pas par tâche)

**Pas de documentation intégrée visible :**
- ❌ Pas d'accès rapide aux photos/documents du chantier
- ❌ Probablement dans une autre section (dispersé)

---

### 3. FACTURATION

#### ✅ **Ce qu'ils font BIEN**

**Gestion complète :**
- Liste des factures de vente
- Filtres par statut (En attente d'encaissement, Encaissée)
- Colonnes : N°, Client, Date, Montant TTC, À encaisser, Chantier, Date paiement, Montant HT
- Liaison facture → chantier
- Suivi des encaissements

**Workflow clair :**
- Création de facture
- Suivi paiement
- Relances (probablement)

#### ❌ **Ce qui MANQUE ou est FAIBLE**

**Suivi des acomptes :**
- ✅ Présent mais...
- ❌ Pas visible dans la liste principale
- ❌ Pas de colonne "Acompte versé / Reste à payer" directement

**Pas de lien direct avec badgeage :**
- ❌ Impossible de facturer automatiquement basé sur temps réel
- ❌ Pas de "Facturation au temps passé"

---

### 4. INTERVENANTS (Employés)

#### ✅ **Ce qu'ils font BIEN**

**Gestion RH basique :**
- Liste des intervenants/employés
- Taux horaire individuel (15-27€)
- Type de main d'œuvre
- Options : Panier repas, Transport
- Champs : N° matricule, Email, Téléphone

**Simple et efficace :**
- Interface claire
- Recherche rapide
- Ajout facile d'intervenant

#### ❌ **Ce qui MANQUE ou est FAIBLE**

**❌ PAS DE BADGEAGE DES TÂCHES**
- Pas de lien avec le temps réel passé sur chantier
- Pas de "temps badgé cette semaine"
- Pas d'historique des interventions par employé
- **C'est LE GROS MANQUE de Graneet**

**Manque de données :**
- ❌ Pas de photo de profil
- ❌ Pas de compétences/spécialités
- ❌ Pas d'affectation aux chantiers visible ici
- ❌ Pas de planning individuel

---

### 5. SUIVI DU TEMPS PASSÉ (227 entrées)

**Note :** J'ai vu dans le menu "Suivi du temps passé" avec 227 entrées. Cette section existe mais je n'ai pas pu l'explorer en détail.

**Hypothèse :**
- Probablement un système de pointage manuel
- Probablement PAS lié directement au catalogue de prix
- Probablement PAS de badgeage automatique GPS

---

## 🎯 DIFFÉRENCIATION AUTOBAT

### 🚀 **AVANTAGE CONCURRENTIEL #1 : Catalogue Auto-Apprenant**

| Graneet | Autobat |
|---------|---------|
| ❌ Catalogue statique | ✅ Catalogue dynamique qui s'améliore |
| ❌ Prix manuels | ✅ Prix ajustés tous les 2 chantiers |
| ❌ Pas de feedback terrain | ✅ Badgeage → Données réelles → Ajustement auto |
| ❌ Devis au doigt mouillé | ✅ Devis basés sur historique réel |

**Exemple concret :**
```
Graneet :
"Pose carrelage 60x60" → 35€/m² (fixe, jamais mis à jour)

Autobat :
"Pose carrelage 60x60"
- Prix initial : 35€/m²
- Après 2 chantiers badgés : Temps réel = 38min/m² au lieu de 30min
- Prix ajusté automatiquement : 42€/m²
- Futurs devis plus précis = Meilleure rentabilité
```

---

### 🚀 **AVANTAGE CONCURRENTIEL #2 : Badgeage Intelligent**

| Graneet | Autobat |
|---------|---------|
| ❌ Pas de badgeage par tâche | ✅ Badgeage GPS + Par tâche |
| ❌ Temps global chantier seulement | ✅ Temps détaillé par tâche |
| ❌ Données perdues | ✅ Données exploitées pour améliorer devis |
| ❌ Mode manuel uniquement | ✅ Mode simple (GPS seul) OU détaillé (par tâche) |

**Workflow Autobat :**
```
1. Employé arrive sur chantier
   → GPS détecte automatiquement → Badge "Début journée"

2. Mode Détaillé activé par le gérant :
   → Employé badge "Démarre : Pose carrelage cuisine"
   → Chrono tourne
   → Badge "Termine"
   → Temps réel enregistré : 3h15

3. Système apprend :
   → Compare temps estimé vs temps réel
   → Ajuste le catalogue après 2 chantiers similaires
   → Futurs devis plus précis
```

---

### 🚀 **AVANTAGE CONCURRENTIEL #3 : Vision 360° Centralisée**

| Graneet | Autobat |
|---------|---------|
| ✅ Modules séparés | ✅ Tout connecté et centralisé |
| ⚠️ Données dispersées | ✅ Dossier chantier unique |
| ⚠️ Pas de lien Badgeage→Devis | ✅ Boucle complète : Devis → Chantier → Badgeage → Apprentissage → Nouveaux devis |

**Dossier Chantier Autobat :**
```
Chantier "Villa Dupont"
├─ Devis initial (lié)
├─ Tâches avec assignation employés
├─ Badgeages en temps réel
├─ Documents (contrats, PV)
├─ Photos (avant/pendant/après)
├─ Facturation (acomptes, solde)
└─ Rentabilité réelle vs prévue
```

---

## 🎨 ANALYSE UX/UI

### ✅ **Ce que Graneet fait BIEN (à reproduire)**

**Design moderne et pro :**
- Interface claire, épurée
- Sidebar gauche avec navigation logique
- Tableaux bien structurés
- Filtres accessibles et intuitifs
- Boutons d'action visibles (Créer un devis, etc.)

**Codes couleurs :**
- Statuts visuels (Brouillon, Finalisé, etc.)
- Barres de progression pour chantiers
- Indicateurs verts/rouges (panier repas/transport)

**Recherche omniprésente :**
- Barre de recherche en haut de chaque liste
- Filtres puissants
- Statistiques en bas de liste

---

### ❌ **Ce qu'Autobat peut faire MIEUX**

**Simplifier l'interface :**
- Graneet a BEAUCOUP de modules → peut être intimidant
- Autobat : Focus sur l'essentiel (Devis, Chantiers, Facturation)
- Moins de clics pour les actions courantes

**Mobile First :**
- Graneet web → mobile responsive mais pas app native
- Autobat : PWA optimisée pour mobile dès le départ
- Badgeage doit être ultra-rapide sur mobile

**Dashboard plus visuel :**
- Graneet : beaucoup de tableaux
- Autobat : Plus de graphiques, KPIs visuels
  - "Rentabilité moyenne : +12%"
  - "Devis précision : +8% ce mois"
  - "Top 3 employés productifs"

**Onboarding guidé :**
- Graneet : interface riche mais courbe d'apprentissage
- Autobat : Wizard de démarrage
  - "Créez votre 1er devis"
  - "Ajoutez vos employés"
  - "Configurez votre catalogue"

---

## 📊 COMPARAISON FONCTIONNALITÉS

| Fonctionnalité | Graneet | Autobat MVP | Avantage Autobat |
|----------------|---------|-------------|------------------|
| **Devis** | ✅ Complet | ✅ Complet | Catalogue auto-apprenant |
| **Catalogue de prix** | ✅ Statique | ✅ **Dynamique** | **⭐⭐⭐** |
| **Chantiers** | ✅ Suivi global | ✅ Suivi détaillé | Tâches + Assignation |
| **Badgeage GPS** | ❌ Non | ✅ **Oui** | **⭐⭐⭐** |
| **Badgeage par tâche** | ❌ Non | ✅ **Oui (optionnel)** | **⭐⭐⭐** |
| **Dossier chantier docs** | ⚠️ Dispersé | ✅ Centralisé | Tout au même endroit |
| **Facturation** | ✅ Complet | ✅ Basique (MVP) | Suivi acomptes simple |
| **Gestion employés** | ✅ Basique | ✅ Basique | Historique badgeages |
| **Apprentissage IA** | ❌ Non | ✅ **Oui** | **⭐⭐⭐** |
| **Mobile** | ⚠️ Responsive | ✅ **PWA optimisée** | **⭐⭐** |
| **Planning** | ✅ Oui | ⚠️ Post-MVP | - |
| **Achats/Commandes** | ✅ Oui | ❌ Post-MVP | - |
| **Comptabilité** | ✅ Oui | ❌ Post-MVP | - |
| **Banque** | ✅ Oui | ❌ Post-MVP | - |

**Légende :**
- ⭐⭐⭐ = Différenciation majeure
- ⭐⭐ = Différenciation importante
- ⭐ = Amélioration mineure

---

## 💡 INSIGHTS & OPPORTUNITÉS

### 1. **Le Badgeage est LE Point Faible de Graneet**

**Constat :**
- Graneet a un module "Suivi du temps passé" mais pas de badgeage intelligent
- Pas de lien avec le catalogue de prix
- Données perdues

**Opportunité Autobat :**
- Faire du badgeage la KILLER FEATURE
- Marketing : "Le seul logiciel BTP qui s'améliore automatiquement"
- Communication : "Vos devis deviennent plus précis à chaque chantier"

---

### 2. **La Complexité de Graneet peut être un frein**

**Constat :**
- Graneet couvre TOUT (Devis, Chantiers, Facturation, Achats, Banque, Compta...)
- Interface riche mais peut être intimidante pour TPE
- Beaucoup de fonctionnalités que les artisans n'utilisent jamais

**Opportunité Autobat :**
- Positionner sur "Simple mais puissant"
- Focus sur le cycle Devis → Chantier → Facturation
- Marketing : "Graneet pour les grosses boîtes, Autobat pour les artisans qui veulent l'essentiel"

---

### 3. **Pas de Mobile App Native**

**Constat :**
- Graneet est web responsive
- Pas d'app iOS/Android dédiée
- Badgeage mobile probablement pas optimal

**Opportunité Autobat :**
- PWA installable dès le MVP
- Badgeage ultra-rapide : 2 taps maximum
- Hors ligne natif (sync auto)

---

### 4. **Pricing Graneet (hypothèse à vérifier)**

**Analyse :**
- Graneet se positionne comme solution "premium"
- Probablement 100-200€/mois/entreprise
- Tarif dégressif selon nb utilisateurs

**Opportunité Autobat :**
- Pricing agressif pour MVP : 130€ + 30€/utilisateur
- Plus accessible pour TPE/artisans
- Valeur perçue : "Même prix mais avec apprentissage auto"

---

## 🎯 POSITIONNEMENT AUTOBAT

### Graneet c'est :
- La "Mercedes" du BTP software
- Tout-en-un pour PME structurées
- Complet mais complexe
- Catalogue statique
- Pas de badgeage intelligent

### Autobat c'est :
- La "Tesla" du BTP software (innovant, intelligent)
- **L'essentiel + l'IA** pour artisans et PME
- Simple mais puissant
- **Catalogue qui apprend**
- **Badgeage intelligent**

---

## 📝 RECOMMANDATIONS POUR LE PRD

### 1. **Ne PAS copier Graneet**
- ❌ Ne pas essayer de faire un clone
- ✅ Se concentrer sur nos 3 avantages concurrentiels

### 2. **Messaging Marketing**
```
"Graneet vous dit combien vous PENSEZ gagner.
Autobat vous dit combien vous ALLEZ vraiment gagner."

"Le seul logiciel BTP qui devient plus intelligent à chaque chantier."

"Devis imprécis ? Plus jamais. Autobat apprend de vos chantiers."
```

### 3. **Fonctionnalités MVP à Prioriser**
1. ✅ Catalogue personnalisable (base Graneet récupérée)
2. ✅ Badgeage GPS + par tâche
3. ✅ Apprentissage automatique (ajustement tous les 2 chantiers)
4. ✅ Devis avec catalogue
5. ✅ Gestion chantiers avec tâches
6. ✅ Facturation basique
7. ✅ Dossier documentaire par chantier

### 4. **Post-MVP (Phase 2)**
- Planning avancé
- Achats/Commandes
- Comptabilité
- Intégrations tierces

---

## ✅ CONCLUSION

**Graneet est un concurrent sérieux et complet.**

**MAIS il a 3 faiblesses critiques qu'Autobat exploite :**

1. **❌ Pas d'apprentissage automatique** → ✅ Autobat ajuste les prix
2. **❌ Pas de badgeage intelligent** → ✅ Autobat GPS + par tâche
3. **⚠️ Complexité** → ✅ Autobat simple et focus

**Notre positionnement :**
> "Autobat n'est pas Graneet.
> Autobat est le logiciel BTP qui apprend de vos chantiers pour améliorer vos devis."

---

## 🚀 NEXT STEPS

1. ✅ Brainstorming terminé
2. ⏭️ Créer le PRD détaillé (02-prd/)
3. ⏭️ Définir l'architecture technique (03-architecture/)
4. ⏭️ User stories (04-stories/)
5. ⏭️ Développement (05-implementation/)

**Prêt à passer au PRD ! 💪**
