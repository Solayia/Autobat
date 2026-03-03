# Wireframes Low-Fi - Autobat

## Vue d'ensemble
Wireframes textuels des écrans critiques avant développement. Ces wireframes servent de base pour les mockups Figma haute-fidélité.

**Légende :**
- `[Bouton]` = Bouton cliquable
- `( )` = Radio button
- `[ ]` = Checkbox
- `[________]` = Input texte
- `▼` = Dropdown
- `≡` = Menu hamburger
- `🔔` = Notifications
- `⚙️` = Paramètres
- `👤` = Profil utilisateur

---

## 1. BADGEAGE EMPLOYÉ (Mobile)

### Écran 1.1: Liste des chantiers (vue employé)

```
┌─────────────────────────────────────┐
│  ≡  AUTOBAT            🔔(3)  👤    │ ← Header sticky
├─────────────────────────────────────┤
│                                     │
│  📍 MES CHANTIERS                   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏗️ Rénovation ACME           │ │ ← Chantier actif
│  │ 12 Rue de la Paix, Paris     │ │
│  │                               │ │
│  │ 📍 150m (dans la zone)        │ │ ← Distance temps réel
│  │ ⏱️  3h20 aujourd'hui           │ │ ← Heures du jour
│  │                               │ │
│  │ [✅ BADGÉ PRÉSENCE]           │ │ ← Badge vert = présent
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏗️ Extension SYLA             │ │ ← Chantier non actif
│  │ 8 Avenue Victor Hugo          │ │
│  │                               │ │
│  │ 📍 2.3 km                      │ │ ← Hors zone
│  │ ⏱️  0h00 aujourd'hui           │ │
│  │                               │ │
│  │ [ Badge présence ]            │ │ ← Bouton gris = non badgé
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏗️ Chantier Mairie            │ │
│  │ Place du Général de Gaulle    │ │
│  │                               │ │
│  │ 📍 8.5 km                      │ │
│  │ ⏱️  0h00 aujourd'hui           │ │
│  │                               │ │
│  │ [ Badge présence ]            │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│                                     │ ← Footer sticky
│  💼 Chantiers  📊 Mes heures  👤   │
│     (actif)                         │
└─────────────────────────────────────┘
```

**Annotations :**
- **Badge GPS automatique** : Si employé entre dans zone → Badge vert s'affiche automatiquement
- **Distance temps réel** : Mise à jour toutes les 60s
- **Indicateur visuel** : Badge vert = présent, gris = absent
- **Navigation** : 3 onglets bottom (Chantiers, Mes heures, Profil)
- **Notification badge** : Affiche nombre de notifications non lues

**États possibles :**
- 📍 + distance (m) = Dans la zone
- 📍 + distance (km) = Hors zone
- ⏱️ = Heures badgées aujourd'hui
- ✅ BADGÉ PRÉSENCE = Badge actif
- Badge gris = Non badgé

---

### Écran 1.2: Détail chantier + badgeage par tâche

```
┌─────────────────────────────────────┐
│  ←  Rénovation ACME        🔔(3) ⚙️  │ ← Retour + actions
├─────────────────────────────────────┤
│                                     │
│  🏗️ Rénovation ACME                 │
│  📍 12 Rue de la Paix, 75001 Paris  │
│  ⏱️  3h20 aujourd'hui                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ STATUS PRÉSENCE             │   │
│  │                             │   │
│  │  ✅ Badgé depuis 08:15      │   │ ← Card verte
│  │                             │   │
│  │  [🚪 Badge sortie]          │   │ ← Bouton badge fin
│  └─────────────────────────────┘   │
│                                     │
│  📋 TÂCHES (badgeage détaillé)      │ ← Section tâches
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Démolition cloisons         │   │ ← Tâche en cours
│  │ 12 m²  •  ⏱️ 1h35 en cours   │   │
│  │                             │   │
│  │ [⏸️  Terminer (1h35)]        │   │ ← Bouton rouge
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✅ Pose cloisons BA13        │   │ ← Tâche terminée
│  │ 12 m²  •  ✓ 1h45 (terminé)  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Peinture                    │   │ ← Tâche non démarrée
│  │ 24 m²  •  Estimé: 2h00      │   │
│  │                             │   │
│  │ [▶️  Démarrer]               │   │ ← Bouton vert
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Nettoyage final             │   │
│  │ 1 u  •  Estimé: 0h30        │   │
│  │                             │   │
│  │ [ Démarrer ]                │   │ ← Gris = disabled
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  📷 PHOTOS (3)  📄 DOCUMENTS (1)    │ ← Section docs
│                                     │
│  [📸 Ajouter photo]                 │
│                                     │
└─────────────────────────────────────┘
```

**Annotations :**
- **Card présence** : Verte si badgé, grise sinon
- **Tâche en cours** : 1 seule à la fois, chrono visible
- **Bouton terminer** : Rouge pour attirer l'attention
- **Bouton démarrer** : Vert si dispo, gris si tâche en cours
- **Validation** : Impossible de démarrer 2 tâches simultanément
- **Photos/docs** : Section rapide pour upload sur chantier

**États des tâches :**
- ▶️ Démarrer (vert) = Disponible
- ⏸️ Terminer (rouge) = En cours
- ✅ + durée = Terminée
- Bouton gris désactivé = Bloqué (autre tâche en cours)

---

### Écran 1.3: Mes heures (vue employé)

```
┌─────────────────────────────────────┐
│  ←  MES HEURES           📊 Export  │
├─────────────────────────────────────┤
│                                     │
│  📅 Février 2026                ▼   │ ← Sélecteur mois
│                                     │
│  ┌─────────────────────────────┐   │
│  │  💼 120h / 151h67           │   │ ← Quota mensuel
│  │  ━━━━━━━━━━━━━━━░░░░░ 79%  │   │ ← Progress bar
│  │                             │   │
│  │  📌 Reste: 31h67            │   │
│  └─────────────────────────────┘   │
│                                     │
│  📊 PAR CHANTIER                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  🏗️ Rénovation ACME          68h30  │
│  🏗️ Extension SYLA           42h15  │
│  🏗️ Chantier Mairie           9h15  │
│                                     │
│  📅 DÉTAIL PAR JOUR                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Lundi 10 février             │   │
│  │                             │   │
│  │ 🏗️ Rénovation ACME           │   │
│  │ 08:15 - 12:00 → 3h45         │   │ ← Badge GPS
│  │ 13:00 - 17:30 → 4h30         │   │
│  │                             │   │
│  │ Total: 8h15                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Mardi 11 février             │   │
│  │                             │   │
│  │ 🏗️ Rénovation ACME           │   │
│  │ 08:00 - 12:15 → 4h15         │   │
│  │                             │   │
│  │   📌 Démolition (1h35)       │   │ ← Badge tâche
│  │   📌 Pose cloisons (1h45)    │   │
│  │   📌 Pause (0h55)            │   │
│  │                             │   │
│  │ 13:00 - 17:00 → 4h00         │   │
│  │                             │   │
│  │ Total: 8h15                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  [ Voir plus... ]                   │
│                                     │
└─────────────────────────────────────┘
```

**Annotations :**
- **Quota mensuel** : Si défini par manager, sinon masqué
- **Progress bar** : Verte si < 100%, orange si > 100%, rouge si > 120%
- **Répartition** : Heures par chantier + détail par jour
- **Badge type** : GPS auto vs manuel visible
- **Export** : PDF ou CSV pour l'employé

---

## 2. CRÉATION DEVIS (Desktop - Manager)

### Écran 2.1: Liste des devis

```
┌────────────────────────────────────────────────────────────────────────┐
│  AUTOBAT                    🔔(5)  ⚙️ Paramètres  👤 Marc Dupont       │
├────────────────────────────────────────────────────────────────────────┤
│  📋 Devis  |  🏗️ Chantiers  |  💰 Factures  |  👥 Employés            │
│  ━━━━━━━                                                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  DEVIS                                          [➕ Nouveau devis]     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  Filtres:  [Tous ▼]  [Tous clients ▼]  [🔍 Rechercher...]             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Numéro        │ Client      │ Date       │ Montant   │ Statut    │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ DEV-2026-0042 │ ACME        │ 10/02/2026 │ 15 450 €  │ ✅ ACCEPTÉ│ │
│  │               │ Construction│            │           │           │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ DEV-2026-0041 │ SYLA        │ 08/02/2026 │ 8 920 €   │ 📧 ENVOYÉ │ │
│  │               │             │            │           │ Exp: 10/03│ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ DEV-2026-0040 │ ACME        │ 05/02/2026 │ 3 200 €   │ 📝 BROUIL.│ │
│  │               │ Construction│            │           │           │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ DEV-2026-0039 │ Mairie      │ 03/02/2026 │ 22 500 €  │ ❌ REFUSÉ │ │
│  │               │             │            │           │           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ← Précédent    Page 1 / 3    Suivant →                               │
│                                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  📊 KPIs du mois                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │ 12 devis   │  │ 8 envoyés  │  │ 5 acceptés │  │ 65 450 €   │      │
│  │ créés      │  │            │  │ (62%)      │  │ Total HT   │      │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Annotations :**
- **Navigation principale** : Tabs pour modules (Devis, Chantiers, Factures, Employés)
- **Bouton CTA** : "Nouveau devis" bien visible en haut à droite
- **Filtres** : Par statut et par client
- **Statuts visibles** : Badges colorés (✅ vert, 📧 bleu, 📝 gris, ❌ rouge)
- **Date expiration** : Affichée pour devis envoyés
- **KPIs** : Résumé rapide du mois en cours
- **Hover ligne** : Actions apparaissent (👁️ Voir, ✏️ Modifier, 📧 Envoyer, 📄 PDF, 📋 Dupliquer)

---

### Écran 2.2: Création/Édition devis

```
┌────────────────────────────────────────────────────────────────────────┐
│  ←  Devis  /  DEV-2026-0043 (BROUILLON)           [💾 Sauvegarder]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  INFORMATIONS GÉNÉRALES                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  Client *          [ACME Construction          ▼]  [➕ Nouveau]        │
│  Date création     12/02/2026                                          │
│  Date validité     12/03/2026 (30 jours)       [________]              │
│  Notes             [________________________________]                  │
│                    [________________________________]                  │
│                                                                        │
│  LIGNES DU DEVIS                                   [➕ Ajouter ligne]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │     │ Description            │ Qté  │ Unité │ PU HT  │ Total HT │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ 🤖  │ Démolition cloisons    │ 12   │ m²    │ 45 €   │ 540 €   │⋮│ ← Icône = auto-appris
│  │     │ (Code: GO-DEM-001)     │      │       │        │         │ │
│  │     │ 🟢 Optimisé (8 chant.) │      │       │        │         │ │ ← Badge vert
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │     │ Pose cloisons BA13     │ 12   │ m²    │ 120 €  │ 1440 € │⋮│
│  │     │ (Code: GO-CLO-002)     │      │       │        │         │ │
│  │     │ 🟡 En apprentissage    │      │       │        │         │ │ ← Badge orange
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ ✏️  │ Peinture personnalisée │ 24   │ m²    │ 25 €   │ 600 €  │⋮│ ← Hors catalogue
│  │     │                        │      │       │        │         │ │
│  │     │ ⚪ Personnalisé        │      │       │        │         │ │ ← Badge gris
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  [ 🔍 Rechercher dans le catalogue ]                                  │
│                                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  TOTAUX                                              Aligné à droite  │
│                                                                        │
│                                              Total HT :    2 580,00 €  │
│                                              TVA (20%) :     516,00 €  │
│                                              Total TTC :  3 096,00 €  │
│                                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  [📄 Aperçu PDF]  [📧 Envoyer au client]  [💾 Sauvegarder brouillon]  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Annotations :**
- **Champ client** : Dropdown + bouton "Nouveau client" rapide
- **Calcul auto** : Total ligne calculé automatiquement (Qté × PU)
- **Totaux** : HT, TVA 20%, TTC calculés en temps réel
- **Badges auto-learning** :
  - 🟢 Optimisé (8+ chantiers) = Prix fiable
  - 🟡 En apprentissage (2-7 chantiers) = Prix en ajustement
  - ⚪ Non testé (0-1 chantier) = Prix catalogue initial
  - ⚪ Personnalisé = Hors catalogue
- **Icône 🤖** : Indique ouvrage du catalogue auto-appris
- **Menu ⋮** : Modifier, Supprimer, Voir historique prix
- **Modal catalogue** : S'ouvre avec recherche + filtres catégories

**Modal "Rechercher dans le catalogue" :**
```
┌─────────────────────────────────────────┐
│  CATALOGUE AUTOBAT           [✕ Fermer] │
├─────────────────────────────────────────┤
│                                         │
│  [🔍 Rechercher...]                     │
│                                         │
│  Catégories:                            │
│  ( ) Toutes                             │
│  ( ) Gros Oeuvre (243)                  │
│  ( ) Charpente (58)                     │
│  ( ) Electricité (89)                   │
│  ( ) Plomberie (102)                    │
│  ( ) Finition (67)                      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ GO-DEM-001                        │ │
│  │ Démolition cloisons               │ │
│  │ 45 €/m²  •  🟢 Optimisé (8 ch.)   │ │
│  │ [➕ Ajouter]                      │ │
│  ├───────────────────────────────────┤ │
│  │ GO-CLO-002                        │ │
│  │ Pose cloisons BA13                │ │
│  │ 120 €/m²  •  🟡 En apprent. (3ch.)│ │
│  │ [➕ Ajouter]                      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Ou [➕ Créer ouvrage personnalisé]    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 3. DASHBOARD MANAGER (Desktop)

```
┌────────────────────────────────────────────────────────────────────────┐
│  AUTOBAT                    🔔(5)  ⚙️ Paramètres  👤 Marc Dupont       │
├────────────────────────────────────────────────────────────────────────┤
│  🏠 Dashboard  |  📋 Devis  |  🏗️ Chantiers  |  💰 Factures  |  👥...  │
│  ━━━━━━━━━━                                                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  TABLEAU DE BORD                              📅 Février 2026     ▼   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  📊 VUE D'ENSEMBLE                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │ 💰 CA FACTURÉ   │  │ 💵 ENCAISSÉ     │  │ 📈 MARGE BRUTE  │       │
│  │                 │  │                 │  │                 │       │
│  │   45 680 €      │  │   38 920 €      │  │    +32%         │       │
│  │   +12% vs janv. │  │   85% du CA     │  │    +3pts        │       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │ 🏗️ CHANTIERS    │  │ 📋 DEVIS        │  │ ⏱️ HEURES       │       │
│  │                 │  │                 │  │                 │       │
│  │   5 en cours    │  │   8 en attente  │  │   1 240h        │       │
│  │   2 terminés    │  │   12 envoyés    │  │   +8% vs janv.  │       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  ⚠️ ALERTES                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 Facture FAC-2026-0038 en retard de 18 jours (ACME)            │ │
│  │    [📧 Relancer]  [💰 Enregistrer paiement]  [👁️ Voir]          │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ 🟡 Devis DEV-2026-0041 expire dans 5 jours (SYLA)                │ │
│  │    [📧 Relancer]  [📋 Dupliquer]  [👁️ Voir]                     │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ ⚪ Badge non clôturé: Jean Dupont sur "Démolition" (12h)         │ │
│  │    [✅ Clôturer manuellement]  [❌ Annuler badge]                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  CHANTIERS EN COURS                               [Voir tous →]       │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🏗️ Rénovation ACME          │ ACME Construction │ 👷 3 employés  │ │
│  │    12 Rue de la Paix, Paris │ Début: 03/02     │ ⏱️ 68h30      │ │
│  │    Progress: ████████░░ 80% │ [👁️ Voir]  [✅ Terminer]          │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ 🏗️ Extension SYLA            │ SYLA             │ 👷 2 employés  │ │
│  │    8 Av. Victor Hugo        │ Début: 10/02     │ ⏱️ 42h15      │ │
│  │    Progress: █████░░░░░ 50% │ [👁️ Voir]  [✅ Terminer]          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  ACTIVITÉ RÉCENTE                                                      │
│  • Il y a 5 min  - Jean Martin a badgé sur "Rénovation ACME"          │
│  • Il y a 23 min - Paiement reçu: 2 676€ pour FAC-2026-0042           │
│  • Il y a 1h     - Devis DEV-2026-0043 envoyé à ACME Construction     │
│  • Il y a 2h     - Paul Durand a terminé "Pose cloisons" (1h45)       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Annotations :**
- **KPIs en cards** : Métriques clés avec évolution vs mois précédent
- **Alertes prioritaires** : Rouge (urgent) > Orange (important) > Gris (info)
- **Chantiers en cours** : Progress bar visuelle + stats rapides
- **Actions rapides** : Boutons contextuels sur chaque alert/chantier
- **Activité** : Timeline temps réel des dernières actions
- **Navigation** : Tabs pour accéder aux modules

---

## 4. LISTE CHANTIERS

### Écran 4.1: Liste chantiers (Desktop - Manager)

```
┌────────────────────────────────────────────────────────────────────────┐
│  AUTOBAT                    🔔(5)  ⚙️ Paramètres  👤 Marc Dupont       │
├────────────────────────────────────────────────────────────────────────┤
│  🏠 Dashboard  |  📋 Devis  |  🏗️ Chantiers  |  💰 Factures  |  👥...  │
│                              ━━━━━━━━━━━                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  CHANTIERS                                      [➕ Nouveau chantier]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  Filtres:  [Tous ▼]  [Tous clients ▼]  [🔍 Rechercher...]             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Chantier            │ Client      │ Dates      │ Heures │ Statut │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ 🏗️ Rénovation ACME  │ ACME        │ 03/02 →    │ 68h30  │🟢 COURS│⋮│
│  │ 12 Rue de la Paix   │ Const.      │            │        │ 80%    │ │
│  │ 👷 J.Martin, P.Dur. │             │            │        │        │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ 🏗️ Extension SYLA   │ SYLA        │ 10/02 →    │ 42h15  │🟢 COURS│⋮│
│  │ 8 Av. Victor Hugo   │             │            │        │ 50%    │ │
│  │ 👷 J.Martin, A.Bert │             │            │        │        │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ 🏗️ Chantier Mairie  │ Mairie      │ 05/02 →    │  9h15  │🟢 COURS│⋮│
│  │ Place du Gal DeGaul.│             │            │        │ 10%    │ │
│  │ 👷 L.Petit          │             │            │        │        │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ 🏗️ Réno appartement │ M. Bernard  │ 28/01 →    │127h45  │✅ TERM.│⋮│
│  │ 45 Rue Pasteur      │             │ 08/02      │        │        │ │
│  │ 👷 P.Durand, A.Bert │             │            │ [💰]   │        │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ← Précédent    Page 1 / 2    Suivant →                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Annotations :**
- **Progress bar** : Calculée selon tâches terminées / tâches totales
- **Statuts** : 🟢 EN COURS, ✅ TERMINÉ, ❌ ANNULÉ
- **Employés** : Affichés directement (initiales si trop nombreux)
- **Bouton [💰]** : Chantier terminé = bouton "Créer facture" visible
- **Menu ⋮** : 👁️ Voir, ✏️ Modifier, 📸 Photos, 👷 Gérer employés, ❌ Annuler

---

### Écran 4.2: Liste chantiers (Mobile - Employé)

```
┌─────────────────────────────────────┐
│  ≡  MES CHANTIERS      🔔(3)  👤    │
├─────────────────────────────────────┤
│                                     │
│  [  EN COURS  ]  [ TERMINÉS ]       │ ← Tabs
│   ━━━━━━━━━━                        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏗️ Rénovation ACME           │ │
│  │ 12 Rue de la Paix, Paris     │ │
│  │                               │ │
│  │ 📍 150m • ✅ Badgé (3h20)     │ │
│  │                               │ │
│  │ Progress: ████████░░ 80%      │ │
│  │                               │ │
│  │ [Voir détails →]              │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏗️ Extension SYLA             │ │
│  │ 8 Avenue Victor Hugo          │ │
│  │                               │ │
│  │ 📍 2.3 km • ⚪ Non badgé       │ │
│  │                               │ │
│  │ Progress: █████░░░░░ 50%      │ │
│  │                               │ │
│  │ [Voir détails →]              │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏗️ Chantier Mairie            │ │
│  │ Place du Général de Gaulle    │ │
│  │                               │ │
│  │ 📍 8.5 km • ⚪ Non badgé       │ │
│  │                               │ │
│  │ Progress: █░░░░░░░░░ 10%      │ │
│  │                               │ │
│  │ [Voir détails →]              │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Annotations :**
- **Tabs** : EN COURS / TERMINÉS (historique)
- **Distance** : Temps réel avec GPS
- **Badge status** : ✅ Badgé (+ heures du jour) ou ⚪ Non badgé
- **Progress** : Visuelle pour voir avancement
- **CTA** : "Voir détails" mène à écran 1.2

---

## 5. COMPOSANTS RÉUTILISABLES

### 5.1 Badges de statut

```
Devis:
  📝 BROUILLON (gris)
  📧 ENVOYÉ (bleu)
  ✅ ACCEPTÉ (vert)
  ❌ REFUSÉ (rouge)
  ⏰ EXPIRÉ (orange)

Chantiers:
  🟢 EN COURS (vert)
  ✅ TERMINÉ (vert foncé)
  ❌ ANNULÉ (rouge)

Factures (statut facture):
  📝 BROUILLON (gris)
  📄 ÉMISE (bleu clair)
  📧 ENVOYÉE (bleu)
  ❌ ANNULÉE (rouge)

Factures (statut paiement):
  ⏳ EN ATTENTE (gris)
  💰 ACOMPTE REÇU (orange)
  💵 PART. PAYÉ (jaune)
  ✅ SOLDÉ (vert)

Auto-learning:
  ⚪ NON TESTÉ (gris)
  🟡 EN APPRENTISSAGE (orange)
  🟢 OPTIMISÉ (vert)
  ✏️ PERSONNALISÉ (bleu)
```

### 5.2 Boutons principaux

```
Primaire (action principale):
  [➕ Nouveau devis]     - Bleu, visible, CTA
  [💾 Sauvegarder]       - Bleu
  [📧 Envoyer]           - Bleu

Secondaire:
  [Annuler]              - Gris
  [Dupliquer]            - Gris bordure

Danger:
  [❌ Supprimer]         - Rouge
  [🗑️ Annuler]           - Rouge bordure

Success:
  [✅ Valider]           - Vert
  [▶️ Démarrer]          - Vert

Warning:
  [⏸️ Terminer]          - Orange/Rouge
```

### 5.3 Notifications toast

```
┌─────────────────────────────────┐
│ ✅ Devis créé avec succès      │ ← Success (vert)
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ⚠️ Badge GPS imprécis (120m)   │ ← Warning (orange)
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ❌ Erreur lors de l'envoi       │ ← Error (rouge)
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📡 5 badgeages synchronisés    │ ← Info (bleu)
└─────────────────────────────────┘
```

### 5.4 Indicateur offline/online

```
Header mobile:
  ┌─────────────────────────────────────┐
  │  ≡  AUTOBAT    📡 Hors ligne  🔔 👤│ ← Badge rouge
  └─────────────────────────────────────┘

  ┌─────────────────────────────────────┐
  │  ≡  AUTOBAT    ✅ En ligne    🔔 👤│ ← Badge vert
  └─────────────────────────────────────┘
```

---

## 6. DESIGN SYSTEM (Suggestions)

### 6.1 Palette de couleurs (BTP)

```
Primaire (Bleu construction):
  - Bleu foncé: #1E40AF (header, CTA)
  - Bleu moyen: #3B82F6 (liens, accents)
  - Bleu clair: #DBEAFE (backgrounds)

Secondaire (Orange chantier):
  - Orange: #F59E0B (warnings, badges en cours)
  - Orange clair: #FEF3C7 (backgrounds)

Succès (Vert):
  - Vert: #10B981 (validations, statuts OK)
  - Vert clair: #D1FAE5

Danger (Rouge):
  - Rouge: #EF4444 (erreurs, alertes)
  - Rouge clair: #FEE2E2

Neutre (Gris):
  - Gris foncé: #374151 (textes)
  - Gris moyen: #6B7280 (textes secondaires)
  - Gris clair: #F3F4F6 (backgrounds)
  - Blanc: #FFFFFF
```

### 6.2 Typographie

```
Titres:
  H1: 2.5rem (40px) - Bold
  H2: 2rem (32px) - Bold
  H3: 1.5rem (24px) - SemiBold
  H4: 1.25rem (20px) - SemiBold

Corps:
  Body: 1rem (16px) - Regular
  Small: 0.875rem (14px) - Regular
  Tiny: 0.75rem (12px) - Regular

Font:
  - Inter (clean, moderne, lisible)
  - ou System fonts (performance PWA)
```

### 6.3 Espacements (Tailwind)

```
Marges/Paddings:
  - xs: 0.25rem (4px)
  - sm: 0.5rem (8px)
  - md: 1rem (16px)
  - lg: 1.5rem (24px)
  - xl: 2rem (32px)
  - 2xl: 3rem (48px)

Border radius:
  - Cards: 0.5rem (8px)
  - Boutons: 0.375rem (6px)
  - Badges: 9999px (pill)
```

### 6.4 Ombres

```
Cards:
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)

Hover:
  box-shadow: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)

Modals:
  box-shadow: 0 10px 25px rgba(0,0,0,0.2)
```

---

## 7. INTERACTIONS & ANIMATIONS

### 7.1 Badgeage GPS (mobile)

**Animation d'entrée dans zone :**
```
1. Détection GPS (entrée zone)
2. Vibration mobile (200ms)
3. Animation badge vert "pulse" (1s)
4. Toast notification "Présence badgée : [Chantier]"
5. Card chantier passe en vert avec ✅
```

**Animation sortie de zone :**
```
1. Détection GPS (sortie zone)
2. Vibration mobile (200ms)
3. Toast "Sortie badgée : 3h20 enregistrées"
4. Card chantier passe en gris avec ⚪
```

### 7.2 Démarrer une tâche

**Workflow :**
```
1. Employé clique "▶️ Démarrer" sur tâche
2. Bouton devient "⏸️ Terminer" (rouge)
3. Chrono démarre visiblement (1h35 en cours)
4. Autres tâches passent en gris désactivé
5. Toast "Tâche démarrée"
```

### 7.3 Sync offline → online

**Animation :**
```
1. App détecte retour réseau
2. Badge "Hors ligne" → "Synchronisation..." (spinner)
3. Sync des badges en attente (1 par 1)
4. Progress bar si > 5 badges
5. Badge "En ligne" ✅ (vert)
6. Toast "5 badgeages synchronisés"
```

### 7.4 Ajout ligne devis (catalogue)

**Workflow :**
```
1. Manager clique "Rechercher catalogue"
2. Modal s'ouvre (fade in 200ms)
3. Focus auto sur champ recherche
4. Résultats filtrés en temps réel
5. Clic "➕ Ajouter"
6. Ligne ajoutée au tableau (slide down animation)
7. Totaux recalculés avec animation (count up)
8. Modal se ferme (fade out 200ms)
```

---

## 8. RESPONSIVE (Mobile vs Desktop)

### Navigation

**Desktop :**
- Tabs horizontales (Devis | Chantiers | Factures | Employés)
- Sidebar optionnelle (si beaucoup de modules)

**Mobile :**
- Bottom tabs (3-4 max)
- Menu hamburger pour actions secondaires

### Layouts

**Desktop :**
- Tableaux avec toutes les colonnes
- Sidebars pour filtres
- Modals pour formulaires

**Mobile :**
- Cards empilées (pas de tableaux)
- Filtres en accordéon
- Full-screen pour formulaires

---

## 9. PROCHAINES ÉTAPES

### Phase 1: Validation wireframes (maintenant)
- [ ] Tu review ces wireframes
- [ ] On ajuste si besoin
- [ ] Tu identifies les écrans manquants

### Phase 2: Mockups Figma (2-3 jours)
- [ ] Créer design system (couleurs, typo, composants)
- [ ] Mockup haute-fidélité écran badgeage (critique)
- [ ] Mockup création devis
- [ ] Mockup dashboard
- [ ] Reste peut être fait en wireframes

### Phase 3: Développement (après)
- [ ] Setup projet React + TypeScript
- [ ] Créer composants UI réutilisables
- [ ] Implémenter écrans avec mockups comme référence

---

**Statut:** Wireframes low-fi complets
**À valider:** Layouts, flows, composants manquants
**Prochaine étape:** Ton feedback puis mockups Figma

Qu'en penses-tu ? Des écrans à ajouter ? Des modifications à faire ?
