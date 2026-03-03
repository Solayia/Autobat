# 🏗️ Module Chantier & Badgeage Intelligent

**Parent :** [PRD.md](./PRD.md)
**Version :** 1.0
**Date :** 12 février 2026

---

## 🎯 Objectif du Module

Permettre la gestion complète des chantiers avec un **système de badgeage intelligent** (GPS + par tâche optionnel) qui capture les données réelles pour alimenter l'apprentissage du catalogue.

**Avantage concurrentiel #2 :** Badgeage automatique GPS + optionnel par tâche avec mode offline.

---

## 📊 Vue d'Ensemble

### Workflow Complet

```
1. CRÉATION CHANTIER
   ├─ Depuis devis accepté (automatique ou manuel)
   ├─ Ou création manuelle
   └─ Infos : Client, Adresse, Dates, Budget

2. DÉCOUPAGE EN TÂCHES
   ├─ Tâches depuis lignes de devis (auto)
   ├─ Ou création manuelle
   ├─ Assignation employés
   └─ Définition zone GPS

3. BADGEAGE - MODE SIMPLE
   ├─ GPS détecte arrivée employé
   ├─ Badge automatique "Début journée"
   ├─ GPS détecte départ
   └─ Badge automatique "Fin journée"

4. BADGEAGE - MODE DÉTAILLÉ (optionnel)
   ├─ Employé sélectionne tâche
   ├─ Badge "Démarre tâche"
   ├─ Chrono tourne
   ├─ Badge "Termine tâche"
   └─ Temps capturé par tâche

5. GESTION DOCUMENTAIRE
   ├─ Upload documents (PDF, contrats, PV)
   ├─ Upload photos (avant/pendant/après)
   └─ Centralisation par chantier

6. FIN DE CHANTIER
   ├─ Déclaration fin
   ├─ Récapitulatif temps estimé vs réel
   ├─ Déclenchement apprentissage catalogue
   └─ Passage à facturation
```

---

## 🗂️ Structure Chantier

### Modèle de Données

```typescript
interface Chantier {
  id: UUID
  tenant_id: UUID

  // Référence
  numero: string                  // Ex: "CHANT-2026-001"
  nom: string                     // Ex: "Rénovation Villa Dupont"

  // Client & Devis
  client_id: UUID
  devis_id: UUID | null          // Si créé depuis devis

  // Localisation
  adresse: string
  latitude: number               // Pour zone GPS
  longitude: number
  rayon_gps_metres: number       // Ex: 50m (zone détection)

  // Dates
  date_debut_prevue: Date
  date_fin_prevue: Date
  date_debut_reelle: Date | null
  date_fin_reelle: Date | null

  // Budget
  budget_estime_ht: number
  cout_reel_ht: number | null    // Calculé à la fin

  // Statuts
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'SUSPENDU' | 'ANNULE'

  // Configuration badgeage
  mode_badgeage: 'SIMPLE' | 'DETAILLE'

  // Métadonnées
  created_by: UUID               // User qui a créé
  created_at: Date
  updated_at: Date
}

interface Tache {
  id: UUID
  chantier_id: UUID

  // Référence ouvrage (si créée depuis devis)
  ouvrage_id: UUID | null
  ligne_devis_id: UUID | null

  // Description
  nom: string                    // Ex: "Pose carrelage cuisine"
  description: string | null

  // Quantité & Estimations
  quantite: number
  unite: string
  temps_estime_minutes: number   // Depuis catalogue
  temps_reel_minutes: number | null  // Badgé

  // Assignation
  employe_ids: UUID[]            // Employés assignés

  // Statuts
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINEE'
  date_debut: Date | null
  date_fin: Date | null

  ordre: number                  // Pour tri
  created_at: Date
  updated_at: Date
}

interface Badgeage {
  id: UUID
  tenant_id: UUID

  // Références
  chantier_id: UUID
  tache_id: UUID | null          // NULL si mode simple
  employe_id: UUID

  // Type
  type: 'PRESENCE_DEBUT' | 'PRESENCE_FIN' | 'TACHE_DEBUT' | 'TACHE_PAUSE' | 'TACHE_REPRISE' | 'TACHE_FIN'

  // Timestamp & Localisation
  timestamp: Date
  latitude: number | null
  longitude: number | null
  precision_metres: number | null

  // Méthode
  methode: 'GPS_AUTO' | 'MANUEL' | 'OFFLINE_SYNC'

  // Offline
  synced: boolean                // Si créé offline
  synced_at: Date | null

  created_at: Date
}
```

---

## 🏗️ Gestion des Chantiers

### Page Liste Chantiers

**URL :** `/chantiers`

**Tableau :**
| REF | Nom | Client | Dates | Budget | Facturé | Progression | Statut | Actions |
|-----|-----|--------|-------|--------|---------|-------------|--------|---------|
| CHANT-001 | Villa Dupont | M. Dupont | 10/02-15/03 | 45 000€ | 0€ | ████░░ 65% | En cours | ••• |
| CHANT-002 | Salle de bain | Mme Martin | 12/02-20/02 | 8 500€ | 8 500€ | ██████ 100% | Terminé | ••• |

**Calcul progression :**
```
Progression = (Nb tâches terminées / Nb tâches total) × 100
```

**Filtres :**
- Par statut (Planifié, En cours, Terminé, Suspendu)
- Par date
- Par client
- Par chef de chantier

**Actions rapides :**
- Voir détails
- Modifier
- Voir badgeages
- Terminer chantier
- Accéder dossier documentaire

### Créer un Chantier

#### Option 1 : Depuis Devis Accepté

**Déclenchement :** Devis passe en statut "Accepté"

**Modal :**
```
✓ Devis D-001 accepté !

Voulez-vous créer le chantier automatiquement ?

Nom : Rénovation Villa Dupont
Client : Mme Dupont
Budget HT : 45 000€

[Non merci]  [Créer le chantier →]
```

**Si acceptation :**
1. Chantier créé automatiquement
2. Tâches créées depuis lignes de devis :
   ```
   Ligne devis : "Pose carrelage 60x60" - 45 M² × 35€
   → Tâche : "Pose carrelage 60x60"
      quantite: 45
      unite: "M²"
      temps_estime_minutes: 45 × 30 min = 1350 min (22h30)
   ```
3. Redirection vers page chantier

#### Option 2 : Création Manuelle

**Bouton :** "Créer un chantier"

**Formulaire :**
```
=== Informations Générales ===

Numéro *            [Auto: CHANT-2026-XXX] (modifiable)
Nom du chantier *   [Input text]
Client *            [Autocomplete ou nouveau]

=== Localisation ===

Adresse *           [Input text + Autocomplete Google Places]
                    → Récupère automatiquement lat/long

Zone de détection GPS
Rayon (mètres)      [Number, défaut: 50m]
                    [Aperçu carte avec cercle]

=== Planning ===

Date début prévue * [Date picker]
Date fin prévue *   [Date picker]
Budget estimé HT    [Number, €]

=== Configuration ===

Mode badgeage :
  ○ Simple (GPS seulement - recommandé pour débuter)
  ○ Détaillé (GPS + badgeage par tâche)

[Annuler]  [Créer le chantier →]
```

### Détail d'un Chantier

**URL :** `/chantiers/:id`

**Layout :**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Retour    CHANT-001 : Rénovation Villa Dupont    [Menu] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│ │ En cours    │  │ 12 jours    │  │ Budget      │         │
│ │ Depuis 5j   │  │ restants    │  │ 45 000€     │         │
│ └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│ Tabs : [Tâches] [Badgeages] [Documents] [Infos]           │
│                                                             │
│ ─── TAB TÂCHES ───                                         │
│                                                             │
│ [+ Ajouter une tâche]  [Assigner employés]                │
│                                                             │
│ Tâche 1 : Pose carrelage cuisine           [EN_COURS]     │
│ ├─ Quantité : 45 M²                                        │
│ ├─ Temps estimé : 22h30                                    │
│ ├─ Temps badgé : 15h45 (70%)                              │
│ ├─ Assigné à : Ahmed, Sophie                              │
│ └─ [Voir badgeages]  [Terminer]                           │
│                                                             │
│ Tâche 2 : Joints carrelage                  [A_FAIRE]     │
│ ├─ Quantité : 45 M²                                        │
│ ├─ Temps estimé : 8h                                       │
│ └─ [Assigner]  [Démarrer]                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tab Badgeages :**
- Liste tous les badgeages du chantier
- Filtres par employé, par tâche, par date
- Timeline visuelle

**Tab Documents :**
- Upload docs + photos
- Organisation en dossiers
- Prévisualisation

**Tab Infos :**
- Adresse, carte GPS
- Dates, budget
- Configuration mode badgeage
- Historique modifications

---

## 📍 Système de Badgeage

### Configuration Zone GPS

**Lors création chantier :**
1. Adresse saisie → Géocodage (Google Maps API)
2. Latitude/Longitude récupérées
3. Rayon défini (défaut: 50m)
4. Zone GPS = Cercle(lat, long, rayon)

**Stockage :**
```typescript
chantier.latitude = 48.8566
chantier.longitude = 2.3522
chantier.rayon_gps_metres = 50
```

### Détection GPS (Automatique)

**Côté Mobile (PWA) :**

```typescript
// Service Worker en arrière-plan
setInterval(async () => {
  const position = await navigator.geolocation.getCurrentPosition()
  const { latitude, longitude } = position.coords

  // Récupérer chantiers actifs
  const chantiers = await fetchChantiersActifs()

  for (const chantier of chantiers) {
    const distance = calculerDistance(
      latitude, longitude,
      chantier.latitude, chantier.longitude
    )

    if (distance <= chantier.rayon_gps_metres) {
      // Employé dans la zone !
      const dernierBadgeage = await getDernierBadgeage(chantier.id)

      if (!dernierBadgeage || dernierBadgeage.type === 'PRESENCE_FIN') {
        // Badge automatique DEBUT
        await creerBadgeage({
          chantier_id: chantier.id,
          type: 'PRESENCE_DEBUT',
          methode: 'GPS_AUTO',
          latitude,
          longitude,
          precision_metres: position.coords.accuracy
        })

        // Notification
        showNotification(`Présence badgée : ${chantier.nom}`)
      }
    } else {
      // Employé hors zone
      const dernierBadgeage = await getDernierBadgeage(chantier.id)

      if (dernierBadgeage?.type === 'PRESENCE_DEBUT') {
        // Badge automatique FIN
        await creerBadgeage({
          chantier_id: chantier.id,
          type: 'PRESENCE_FIN',
          methode: 'GPS_AUTO',
          latitude,
          longitude
        })

        showNotification(`Départ badgé : ${chantier.nom}`)
      }
    }
  }
}, 60000) // Vérification toutes les 1 min
```

**Optimisations :**
- Géolocalisation uniquement pendant heures de travail (7h-19h)
- Désactivable par employé (paramètres app)
- Batterie : mode économie (précision réduite)

### Badgeage Par Tâche (Mode Détaillé)

**Activation :** Gérant active mode détaillé pour le chantier

**Interface Mobile Employé :**

```
┌─────────────────────────────────────┐
│  Chantier : Villa Dupont           │
├─────────────────────────────────────┤
│                                     │
│  Vous êtes sur le chantier ✓       │
│  Arrivée : 08:05                    │
│                                     │
│  ─── Mes Tâches ───                │
│                                     │
│  ○ Pose carrelage cuisine          │
│    45 M² - En cours                 │
│    ⏱️ 2h15 aujourd'hui              │
│    [Reprendre →]                    │
│                                     │
│  ○ Joints carrelage                │
│    45 M² - À faire                  │
│    [Démarrer →]                     │
│                                     │
└─────────────────────────────────────┘
```

**Workflow Badge Tâche :**

**1. Démarrer une tâche**
```
Tap [Démarrer] sur tâche
↓
Modal :
┌─────────────────────────────┐
│ Pose carrelage cuisine      │
│                             │
│ Chrono : 00:00:00          │
│                             │
│ [⏸ Pause]  [⏹ Terminer]   │
└─────────────────────────────┘

→ Badgeage créé : type=TACHE_DEBUT
→ Chrono démarre
```

**2. Pause**
```
Tap [Pause]
→ Badgeage créé : type=TACHE_PAUSE
→ Chrono arrêté
```

**3. Reprendre**
```
Tap [Reprendre]
→ Badgeage créé : type=TACHE_REPRISE
→ Chrono reprend
```

**4. Terminer**
```
Tap [Terminer]
→ Badgeage créé : type=TACHE_FIN
→ Chrono stop
→ Temps total calculé et stocké dans tache.temps_reel_minutes
```

**Calcul Temps Réel :**
```typescript
function calculerTempsReel(tache_id: UUID): number {
  const badgeages = getBadgeagesTache(tache_id).sort_by('timestamp')

  let tempsTotal = 0
  let debut: Date | null = null

  for (const badge of badgeages) {
    if (badge.type === 'TACHE_DEBUT' || badge.type === 'TACHE_REPRISE') {
      debut = badge.timestamp
    }

    if (badge.type === 'TACHE_PAUSE' || badge.type === 'TACHE_FIN') {
      if (debut) {
        const duree = badge.timestamp - debut
        tempsTotal += duree
        debut = null
      }
    }
  }

  return Math.round(tempsTotal / 60000) // Convertir ms en minutes
}
```

---

## 💾 Mode Offline & Synchronisation

### Problème

Sur chantier, réseau souvent absent ou faible.
→ Badgeages doivent fonctionner offline.

### Solution : Service Workers + IndexedDB

**Architecture :**
```
Mobile (PWA)
├─ Service Worker (background)
│  ├─ Intercepte requêtes API
│  └─ Gère mise en cache
│
├─ IndexedDB (local)
│  ├─ Store "badgeages_pending"
│  ├─ Store "chantiers_cache"
│  └─ Store "taches_cache"
│
└─ Sync Manager
   ├─ Détecte retour connexion
   └─ Envoie badgeages en attente
```

**Workflow Offline :**

1. **Employé badge (offline)**
   ```typescript
   async function badger(data: BadgeageData) {
     try {
       // Tentative envoi serveur
       const response = await fetch('/api/badgeages', {
         method: 'POST',
         body: JSON.stringify(data)
       })

       if (response.ok) {
         // Online : succès
         showNotification('Badge enregistré ✓')
       }
     } catch (error) {
       // Offline : stockage local
       await db.badgeages_pending.add({
         ...data,
         synced: false,
         created_at: new Date()
       })

       showNotification('Badge enregistré (sync en attente)')
     }
   }
   ```

2. **Retour connexion**
   ```typescript
   // Event listener connexion
   window.addEventListener('online', async () => {
     const pending = await db.badgeages_pending.where('synced').equals(false).toArray()

     for (const badge of pending) {
       try {
         await fetch('/api/badgeages', {
           method: 'POST',
           body: JSON.stringify(badge)
         })

         // Marquer comme synced
         await db.badgeages_pending.update(badge.id, { synced: true })

       } catch (error) {
         // Retry plus tard
       }
     }

     showNotification(`${pending.length} badgeages synchronisés ✓`)
   })
   ```

3. **Indicateur visuel**
   ```
   ┌─────────────────────────┐
   │ ⚠️ Mode Hors ligne      │
   │ 3 badgeages en attente  │
   └─────────────────────────┘

   ┌─────────────────────────┐
   │ ✓ Connecté              │
   │ Tout synchronisé        │
   └─────────────────────────┘
   ```

---

## 📁 Gestion Documentaire

### Structure Dossier Chantier

```
Chantier "Villa Dupont"
├── Documents contractuels/
│   ├── Devis signé.pdf
│   ├── Contrat.pdf
│   └── PV réception.pdf
│
├── Photos/
│   ├── Avant travaux/
│   │   ├── IMG_001.jpg
│   │   └── IMG_002.jpg
│   ├── En cours/
│   │   ├── IMG_010.jpg
│   │   └── IMG_011.jpg
│   └── Après travaux/
│       ├── IMG_050.jpg
│       └── IMG_051.jpg
│
└── Factures/
    ├── Facture fournisseur 1.pdf
    └── Facture client.pdf
```

### Upload Documents

**Page :** `/chantiers/:id/documents`

**Interface :**
```
┌─────────────────────────────────────────┐
│ Documents : Rénovation Villa Dupont     │
├─────────────────────────────────────────┤
│                                         │
│ [+ Upload fichier]  [+ Nouveau dossier]│
│                                         │
│ 📁 Documents contractuels (3)          │
│ 📁 Photos (15)                         │
│   ├─ 📁 Avant travaux (2)              │
│   ├─ 📁 En cours (8)                   │
│   └─ 📁 Après travaux (5)              │
│ 📁 Factures (2)                        │
│                                         │
└─────────────────────────────────────────┘
```

**Upload Mobile :**
- Bouton "Prendre une photo" (accès caméra)
- Bouton "Choisir fichier"
- Compression automatique photos (max 2Mo)
- Upload en arrière-plan
- Mode offline : upload en attente

**Métadonnées :**
```typescript
interface Document {
  id: UUID
  chantier_id: UUID

  nom: string
  type: 'PHOTO' | 'PDF' | 'DOCUMENT' | 'AUTRE'
  taille_octets: number

  dossier: string | null        // Ex: "Photos/Avant travaux"

  uploaded_by: UUID             // Employé
  uploaded_at: Date

  url: string                   // Stockage
}
```

---

## 🏁 Fin de Chantier

### Déclaration Fin

**Bouton :** "Terminer le chantier"

**Workflow :**

1. **Vérifications préalables**
   ```
   ✓ Toutes les tâches sont terminées
   ✗ 2 tâches en cours → Voulez-vous les marquer comme terminées ?
   ✓ Au moins 5 photos uploadées
   ```

2. **Récapitulatif**
   ```
   ┌───────────────────────────────────────────┐
   │ Récapitulatif Chantier CHANT-001         │
   ├───────────────────────────────────────────┤
   │                                           │
   │ Budget estimé HT : 45 000€               │
   │ Coût réel HT : 42 500€                   │
   │ Économie : 2 500€ (5.5%)                 │
   │                                           │
   │ Temps estimé : 180h                       │
   │ Temps badgé : 165h                        │
   │ Gain : 15h (8.3%)                        │
   │                                           │
   │ ─── Par Tâche ───                        │
   │                                           │
   │ Pose carrelage                            │
   │ Estimé : 22h30 | Réel : 20h15 (-10%)    │
   │                                           │
   │ Joints carrelage                          │
   │ Estimé : 8h | Réel : 9h30 (+18%)        │
   │                                           │
   │ [Annuler]  [Confirmer fin de chantier]  │
   └───────────────────────────────────────────┘
   ```

3. **Confirmation**
   - Chantier passe en statut `TERMINE`
   - Date fin réelle = aujourd'hui
   - **Déclenchement apprentissage catalogue** (voir module-devis.md)
   - Proposition créer facture

---

## ✅ Critères d'Acceptation

### Gestion Chantiers

- [ ] Création depuis devis accepté automatique
- [ ] Création manuelle fonctionnelle
- [ ] Tâches créées depuis lignes devis
- [ ] CRUD tâches manuel
- [ ] Assignation employés aux tâches
- [ ] Calcul progression correct (%)

### Badgeage GPS

- [ ] Détection zone GPS < 30s après arrivée
- [ ] Badge automatique DEBUT créé
- [ ] Détection sortie zone < 30s
- [ ] Badge automatique FIN créé
- [ ] Notifications push fonctionnelles
- [ ] Géolocalisation précise (<20m)

### Badgeage Par Tâche

- [ ] Mode détaillé activable par chantier
- [ ] Sélection tâche < 3 taps
- [ ] Chrono démarre/arrête correctement
- [ ] Pause/Reprise fonctionnelles
- [ ] Temps réel calculé avec précision
- [ ] Historique badgeages par employé

### Mode Offline

- [ ] Badgeages stockés localement si offline
- [ ] Synchronisation automatique au retour réseau
- [ ] Indicateur visuel "X badgeages en attente"
- [ ] Aucune perte de données

### Documents

- [ ] Upload photo depuis caméra mobile
- [ ] Upload fichiers multiples
- [ ] Compression photos automatique
- [ ] Organisation en dossiers
- [ ] Prévisualisation images

### Fin Chantier

- [ ] Vérifications préalables OK
- [ ] Récapitulatif temps estimé vs réel affiché
- [ ] Déclenchement apprentissage catalogue
- [ ] Passage statut TERMINE

### Performance

- [ ] Liste chantiers < 1s
- [ ] Détail chantier < 500ms
- [ ] Badge GPS < 2s (traitement)
- [ ] Upload photo < 5s (4G)

---

## 🔄 User Stories

**Voir :** [user-stories.md](./user-stories.md) - Section Module Chantier

---

**🏗️ Ce module est le COEUR OPÉRATIONNEL d'Autobat. Le badgeage doit être ULTRA SIMPLE !**
