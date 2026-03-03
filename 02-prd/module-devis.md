# 📋 Module Devis & Catalogue Auto-Apprenant

**Parent :** [PRD.md](./PRD.md)
**Version :** 1.0
**Date :** 12 février 2026

---

## 🎯 Objectif du Module

Permettre aux gérants de créer des devis précis et rapides grâce à un **catalogue de prix intelligent** qui s'améliore automatiquement en apprenant des chantiers réels.

**Avantage concurrentiel #1 :** Le catalogue s'ajuste automatiquement tous les 2 chantiers basé sur les données de badgeage.

---

## 📊 Vue d'Ensemble

### Workflow Complet

```
1. CATALOGUE INITIAL
   ├─ Import 324 ouvrages (bibliothèque Graneet)
   ├─ Prix statiques au départ
   └─ Gérant peut ajouter ouvrages personnalisés

2. CRÉATION DEVIS
   ├─ Sélection client (nouveau ou existant)
   ├─ Ajout ouvrages du catalogue
   ├─ Calcul automatique (qté × prix unitaire)
   ├─ Ajout marge globale ou par ligne
   └─ Génération PDF

3. VALIDATION CLIENT
   ├─ Envoi devis (email ou téléchargement)
   ├─ Statuts : Brouillon → Envoyé → Accepté/Refusé
   └─ Si Accepté → Création chantier

4. CHANTIER & BADGEAGE
   ├─ Employés badgent les tâches
   ├─ Temps réels capturés
   └─ Données stockées pour apprentissage

5. APPRENTISSAGE AUTOMATIQUE ⭐
   ├─ Après 2 chantiers avec même ouvrage
   ├─ Calcul écart temps estimé vs réel
   ├─ Ajustement automatique prix catalogue
   └─ Futurs devis plus précis
```

---

## 🗂️ Catalogue de Prix

### Structure d'un Ouvrage

```typescript
interface Ouvrage {
  id: UUID
  tenant_id: UUID
  code: string                    // Ex: "CHARP-001" ou vide
  categorie: string               // Ex: "Charpente"
  denomination: string            // Ex: "Fourniture et pose de charpente traditionnelle"
  unite: string                   // Ex: "M²", "ML", "F", "U"

  // Prix et temps
  prix_unitaire_ht: number        // Ex: 97.75 (€)
  temps_estime_minutes: number    // Ex: 30 (minutes par unité)

  // Données d'apprentissage
  nb_chantiers_realises: number   // Nb fois utilisé sur chantiers
  temps_reel_moyen: number | null // Temps moyen constaté (minutes)
  derniere_maj_auto: Date | null  // Date dernier ajustement auto

  // Métadonnées
  note: string | null             // Note interne
  source: 'IMPORT' | 'CUSTOM'     // Import Graneet ou ajout manuel
  actif: boolean                  // Actif ou archivé
  created_at: Date
  updated_at: Date
}
```

### Import Initial (324 Ouvrages Graneet)

**Lors de la création d'une entreprise :**
1. Super Admin crée l'entreprise
2. Système copie automatiquement les 324 ouvrages de base
3. Gérant peut modifier/supprimer/ajouter des ouvrages

**Fichier source :** `bibliotheque-prix-syla-clean.json`

**Mapping :**
```
categorie → categorie
code → code (si vide, générer auto ex: CAT-001)
denomination → denomination
unite → unite
debourse_ht → prix_unitaire_ht
note → note

// Valeurs par défaut
nb_chantiers_realises: 0
temps_reel_moyen: null
temps_estime_minutes: calculé selon taux horaire moyen
source: 'IMPORT'
actif: true
```

### CRUD Catalogue

#### Lister les Ouvrages

**Page :** `/catalogue`

**Fonctionnalités :**
- Tableau avec colonnes : Code, Catégorie, Dénomination, Unité, Prix HT, Nb chantiers, Statut
- Recherche full-text (dénomination, catégorie, code)
- Filtres :
  - Par catégorie
  - Par source (Import / Custom)
  - Actifs / Archivés
  - Ajustés automatiquement (dernière_maj_auto IS NOT NULL)
- Tri par colonne
- Pagination (50 par page)

**Indicateurs visuels :**
- 🟢 Badge "Ajusté" si `derniere_maj_auto` récent (<30 jours)
- 🔵 Badge "N chantiers" si `nb_chantiers_realises > 0`

#### Créer un Ouvrage

**Bouton :** "Ajouter un ouvrage personnalisé"

**Formulaire :**
```
Catégorie *         [Dropdown : Charpente, Gros Oeuvre, ... + "Nouvelle catégorie"]
Code                [Input text, optionnel]
Dénomination *      [Textarea]
Unité *             [Dropdown : M², ML, F, U, m², h, etc.]
Prix unitaire HT *  [Number, €]
Temps estimé        [Number, minutes] (optionnel, pour future estimation)
Note                [Textarea, optionnel]

[Annuler]  [Créer l'ouvrage]
```

**Validation :**
- Dénomination unique dans le tenant
- Prix > 0
- Temps estimé >= 0 si renseigné

#### Modifier un Ouvrage

**Action :** Clic sur ligne → Modal ou page dédiée

**Formulaire :** Identique création

**Règles :**
- Si ouvrage utilisé dans devis/chantiers : warning "Cet ouvrage est utilisé dans X devis et Y chantiers. Modification affectera futurs devis uniquement."
- Prix modifiable manuellement (écrase ajustement auto)
- Si modification manuelle, flag `ajustement_manuel: true` → système n'ajuste plus automatiquement

#### Archiver un Ouvrage

**Action :** Bouton "Archiver"

**Effet :**
- `actif: false`
- N'apparaît plus dans sélection création devis
- Reste visible dans historique devis/chantiers

---

## 📝 Création de Devis

### Page Liste Devis

**URL :** `/devis`

**Tableau :**
| N° | Client | Nom devis | Date | Montant HT | Statut | Actions |
|----|--------|-----------|------|------------|--------|---------|
| D-001 | Villa Dupont | Rénovation complète | 12/02/26 | 45 000€ | Accepté | ••• |
| D-002 | Mme Martin | Salle de bain | 10/02/26 | 8 500€ | Envoyé | ••• |

**Filtres :**
- Par statut (Brouillon, Envoyé, Accepté, Refusé)
- Par date
- Par client
- Par montant (min-max)

**Statistiques en bas :**
- Total devis : 172
- Montant total HT : 3 009 180€
- Taux acceptation : 68%

### Créer un Devis

**Bouton :** "Créer un devis"

**Étape 1 : Informations générales**

```
Client *            [Autocomplete existant ou "Nouveau client"]
                    Si nouveau : Nom, Email, Téléphone, Adresse

Nom du devis *      [Input text] Ex: "Rénovation Villa Dupont"
Date du devis       [Date picker, défaut: aujourd'hui]
Validité (jours)    [Number, défaut: 30]

[Annuler]  [Suivant : Ajouter des ouvrages →]
```

**Étape 2 : Sélection des ouvrages**

**Interface :**
```
┌─────────────────────────────────────────────────────────────┐
│ Devis : Rénovation Villa Dupont - Mme Dupont              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Rechercher un ouvrage : [____________] 🔍                   │
│                                                             │
│ Catalogue :                     Devis :                     │
│ ┌─────────────────────┐        ┌─────────────────────┐    │
│ │Charpente            │        │ 1. Démolition cloison│    │
│ │├─ Forfait coupes    │        │    10 M² × 25€ = 250€│    │
│ │├─ Pose charpente    │        │                       │    │
│ │   [+Ajouter]        │        │ 2. Pose carrelage     │    │
│ │                     │        │    45 M² × 35€ = 1575€│    │
│ │Gros Oeuvre          │        │                       │    │
│ │├─ Démolition cloison│        │                       │    │
│ │   [Ajouté ✓]        │        │ Total HT : 1 825€     │    │
│ │├─ Pose carrelage    │        │ Marge (20%) : 365€    │    │
│ │   [Ajouté ✓]        │        │ Total TTC : 2 628€    │    │
│ └─────────────────────┘        └─────────────────────┘    │
│                                                             │
│ [← Retour] [Sauvegarder brouillon] [Prévisualiser PDF →]  │
└─────────────────────────────────────────────────────────────┘
```

**Ajout d'ouvrage :**
1. Clic sur ouvrage dans catalogue
2. Modal : "Quantité : [____] [Unité affichée]"
3. Prix unitaire affiché (modifiable si besoin)
4. Ajout à la liste devis

**Ligne de devis :**
```typescript
interface LigneDevis {
  ouvrage_id: UUID
  denomination: string      // Copié depuis ouvrage
  unite: string
  quantite: number
  prix_unitaire_ht: number  // Prix au moment du devis (figé)
  montant_ht: number        // quantite × prix_unitaire_ht
  ordre: number             // Pour tri
}
```

**Calculs automatiques :**
```
Sous-total HT = Σ (quantité × prix unitaire)
Marge (%) = configurable globalement ou par ligne
Total HT = Sous-total + Marge
TVA = Total HT × 20% (ou taux configuré)
Total TTC = Total HT + TVA
```

**Étape 3 : Prévisualisation & Génération PDF**

**Template PDF :**
```
┌────────────────────────────────────────┐
│ LOGO ENTREPRISE          DEVIS N° D-001│
│ SYLA CONSTRUCTION                      │
│ Adresse, Tel, Email                    │
├────────────────────────────────────────┤
│ Client :                               │
│ Mme Dupont                             │
│ 123 Rue Example                        │
│                                        │
│ Devis : Rénovation Villa Dupont        │
│ Date : 12/02/2026                      │
│ Validité : 30 jours                    │
├────────────────────────────────────────┤
│ Désignation       Qté  P.U.  Montant  │
│────────────────────────────────────────│
│ Démolition        10   25€   250€     │
│ cloison M²                            │
│                                        │
│ Pose carrelage    45   35€   1575€    │
│ 60x60 M²                              │
├────────────────────────────────────────┤
│                   Total HT : 1 825€   │
│                   Marge 20% : 365€    │
│                   Total HT : 2 190€   │
│                   TVA 20% : 438€      │
│                   Total TTC : 2 628€  │
├────────────────────────────────────────┤
│ Conditions de paiement :               │
│ Acompte 30% à la commande              │
│ Solde à la livraison                   │
│                                        │
│ Mentions légales...                    │
└────────────────────────────────────────┘
```

**Actions :**
- [Télécharger PDF]
- [Envoyer par email au client]
- [Marquer comme "Envoyé"]
- [Retour aux ouvrages]

---

## ✅ Statuts de Devis

```
BROUILLON
  ↓ (Génération PDF + Envoi)
ENVOYÉ
  ↓
ACCEPTÉ → Création chantier automatique
  ou
REFUSÉ
```

**Transitions :**
- Brouillon → Envoyé : Manuel (bouton "Marquer envoyé" ou envoi email)
- Envoyé → Accepté : Manuel (bouton "Client a accepté")
- Envoyé → Refusé : Manuel (bouton "Client a refusé")
- Accepté → Création chantier : Automatique (proposition) ou manuel

---

## 🤖 Apprentissage Automatique du Catalogue

### Principe

**Objectif :** Améliorer la précision des devis en ajustant automatiquement les prix du catalogue basés sur les temps réels constatés sur chantiers.

### Déclenchement

**Après chaque chantier terminé :**
1. Système parcourt toutes les tâches du chantier
2. Pour chaque tâche liée à un ouvrage catalogue :
   - Compare temps estimé vs temps badgé réel
   - Incrémente `nb_chantiers_realises`
   - Stocke `temps_reel_moyen` (moyenne mobile)
3. **Si `nb_chantiers_realises` = 2, 4, 6, ... (multiples de 2) :**
   - Ajuster automatiquement le prix

### Algorithme d'Ajustement

```typescript
function ajusterCatalogue(ouvrage: Ouvrage, chantier: Chantier) {
  // 1. Récupérer toutes les tâches du chantier utilisant cet ouvrage
  const taches = chantier.taches.filter(t => t.ouvrage_id === ouvrage.id)

  if (taches.length === 0) return // Ouvrage pas utilisé

  // 2. Calculer temps réel total badgé
  const tempsReelTotal = taches.reduce((sum, t) => {
    return sum + (t.temps_badge_minutes || 0)
  }, 0)

  const quantiteTotale = taches.reduce((sum, t) => sum + t.quantite, 0)
  const tempsReelParUnite = tempsReelTotal / quantiteTotale

  // 3. Mettre à jour statistiques ouvrage
  ouvrage.nb_chantiers_realises += 1

  // Moyenne mobile
  if (ouvrage.temps_reel_moyen === null) {
    ouvrage.temps_reel_moyen = tempsReelParUnite
  } else {
    ouvrage.temps_reel_moyen =
      (ouvrage.temps_reel_moyen + tempsReelParUnite) / 2
  }

  // 4. Si multiple de 2, ajuster prix
  if (ouvrage.nb_chantiers_realises % 2 === 0) {
    const tauxHoraireMoyen = getTauxHoraireMoyen(tenant_id) // Ex: 25€/h
    const margeSouhaitee = 0.30 // 30%

    const coutMainOeuvre = (ouvrage.temps_reel_moyen / 60) * tauxHoraireMoyen
    const nouveauPrix = coutMainOeuvre * (1 + margeSouhaitee)

    // Mettre à jour
    ouvrage.prix_unitaire_ht = Math.round(nouveauPrix * 100) / 100
    ouvrage.derniere_maj_auto = new Date()

    // Log pour traçabilité
    logAjustementCatalogue({
      ouvrage_id: ouvrage.id,
      ancien_prix: ouvrage.prix_unitaire_ht,
      nouveau_prix: nouveauPrix,
      temps_reel_moyen: ouvrage.temps_reel_moyen,
      nb_chantiers: ouvrage.nb_chantiers_realises
    })
  }
}
```

### Exemple Concret

**Ouvrage :** "Pose carrelage 60x60"
- **Prix initial :** 35€/m²
- **Temps estimé :** 30 min/m²

**Chantier 1 :**
- Quantité : 20 m²
- Temps badgé : 760 minutes (38 min/m²)
- → `nb_chantiers_realises: 1`
- → `temps_reel_moyen: 38 min/m²`
- → **Pas d'ajustement** (attente 2ème chantier)

**Chantier 2 :**
- Quantité : 15 m²
- Temps badgé : 540 minutes (36 min/m²)
- → `nb_chantiers_realises: 2`
- → `temps_reel_moyen: (38 + 36) / 2 = 37 min/m²`
- → **AJUSTEMENT DÉCLENCHÉ** :
  - Taux horaire moyen : 25€/h
  - Coût main d'œuvre : (37/60) × 25€ = 15,42€
  - Avec marge 30% : 15,42€ × 1.30 = **20,04€/m²**
  - **Nouveau prix catalogue : 20€/m²** ❌ TROP BAS !

**⚠️ PROBLÈME :** Le calcul ne prend en compte que la main d'œuvre, pas les fournitures !

### Algorithme Corrigé

```typescript
function ajusterCatalogue(ouvrage: Ouvrage, chantier: Chantier) {
  // ... (même début)

  // 4. Ajustement basé sur ÉCART temps seulement
  if (ouvrage.nb_chantiers_realises % 2 === 0) {
    const ecartPourcentage =
      (ouvrage.temps_reel_moyen - ouvrage.temps_estime_minutes) /
      ouvrage.temps_estime_minutes

    // Ajuster prix proportionnellement à l'écart de temps
    // Ex: Si temps réel +23% → prix +23%
    const nouveauPrix = ouvrage.prix_unitaire_ht * (1 + ecartPourcentage)

    ouvrage.prix_unitaire_ht = Math.round(nouveauPrix * 100) / 100
    ouvrage.derniere_maj_auto = new Date()
  }
}
```

**Reprise exemple :**
- Temps estimé initial : 30 min/m²
- Temps réel moyen : 37 min/m²
- Écart : (37 - 30) / 30 = +23%
- Prix initial : 35€/m²
- **Nouveau prix : 35€ × 1.23 = 43,05€/m²** ✅

**Chantiers 3 et 4 :**
- Si temps réels confirment ~37 min/m²
- → Pas de nouvel ajustement (stable)
- Si temps réels changent (ex: 32 min/m²)
- → Nouveau calcul écart et ajustement

---

## 📊 Interface d'Analyse Catalogue

**Page :** `/catalogue/analyse`

**Objectif :** Montrer au gérant comment le catalogue s'améliore.

**Widgets :**

1. **Ouvrages Ajustés Récemment**
   - Liste des 10 derniers ouvrages ajustés
   - Ancien prix vs Nouveau prix
   - Écart (%)
   - Nb chantiers

2. **Précision Globale**
   ```
   Catalogue initialisé : 12/02/2026
   Ouvrages ajustés : 32 / 324 (10%)
   Précision moyenne : +12% (devis plus fiables)
   ```

3. **Top 10 Ouvrages Utilisés**
   - Classement par `nb_chantiers_realises`
   - Permet d'identifier les ouvrages les plus rentables

4. **Historique Ajustements**
   - Timeline des ajustements
   - Graphique évolution prix dans le temps

---

## ✅ Critères d'Acceptation

### Catalogue

- [ ] Import automatique des 324 ouvrages Graneet lors création entreprise
- [ ] CRUD ouvrages personnalisés
- [ ] Recherche full-text < 200ms
- [ ] Filtres fonctionnels (catégorie, source, statut)

### Devis

- [ ] Création devis en <5 clics
- [ ] Calculs automatiques corrects (sous-total, marge, TVA)
- [ ] Génération PDF <5 secondes
- [ ] PDF conforme template (logo, mentions légales)
- [ ] Statuts gérés correctement

### Apprentissage

- [ ] Ajustement automatique déclenché tous les 2 chantiers
- [ ] Calcul écart temps estimé vs réel correct
- [ ] Prix ajusté proportionnellement
- [ ] Log traçabilité des ajustements
- [ ] Indicateur visuel "Ajusté" sur ouvrages

### Performance

- [ ] Liste devis < 1s (pagination 50)
- [ ] Génération PDF < 5s
- [ ] Ajustement catalogue < 500ms après fin chantier

---

## 🔄 User Stories

**Voir :** [user-stories.md](./user-stories.md) - Section Module Devis

---

**📝 Ce module est la KILLER FEATURE d'Autobat. Prioriser dans le développement !**
