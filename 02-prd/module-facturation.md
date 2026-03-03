# Module FACTURATION - Spécifications Détaillées

## Vue d'ensemble
Le module Facturation gère l'émission de factures à partir des chantiers terminés, le suivi des paiements (acomptes et soldes), et la génération de documents PDF conformes aux obligations légales françaises.

---

## 1. Modèles de données

### Interface Facture
```typescript
interface Facture {
  id: string
  tenant_id: string // Multi-tenant isolation
  numero_facture: string // Format: FAC-2026-0001 (auto-increment par année)

  // Relations
  chantier_id: string
  devis_id: string | null // Reference au devis d'origine
  client_id: string

  // Informations entreprise (snapshot au moment de la facture)
  entreprise_nom: string
  entreprise_siret: string
  entreprise_adresse: string
  entreprise_tel: string
  entreprise_email: string

  // Informations client (snapshot)
  client_nom: string
  client_adresse: string
  client_siret: string | null
  client_tel: string
  client_email: string

  // Montants
  montant_ht: number // Total HT
  montant_tva: number // Montant TVA (20% pour BTP)
  montant_ttc: number // Total TTC

  // Paiements
  acompte_demande: number // Acompte demandé (30% généralement)
  acompte_recu: number // Acompte effectivement reçu
  reste_a_payer: number // Calculé: montant_ttc - acompte_recu

  // Statuts
  statut_paiement: 'EN_ATTENTE' | 'ACOMPTE_RECU' | 'PARTIELLEMENT_PAYE' | 'SOLDE'
  statut_facture: 'BROUILLON' | 'EMISE' | 'ENVOYEE' | 'ANNULEE'

  // Dates
  date_emission: Date
  date_echeance: Date // Généralement emission + 30 jours
  date_envoi: Date | null
  date_paiement_complet: Date | null

  // Documents
  pdf_url: string | null // Lien vers PDF généré

  // Métadonnées
  notes: string | null
  created_at: Date
  updated_at: Date
}
```

### Interface LigneFacture
```typescript
interface LigneFacture {
  id: string
  facture_id: string

  // Référence catalogue
  ouvrage_id: string | null

  // Détails ligne
  description: string
  quantite: number
  unite: string // m², ml, u, h, etc.
  prix_unitaire_ht: number
  montant_ht: number // quantite * prix_unitaire_ht
  tva_pourcent: number // Généralement 20%
  montant_ttc: number

  // Ordre d'affichage
  ordre: number

  created_at: Date
}
```

### Interface PaiementFacture
```typescript
interface PaiementFacture {
  id: string
  facture_id: string
  tenant_id: string

  // Détails paiement
  montant: number
  date_paiement: Date
  moyen_paiement: 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'CARTE' | 'AUTRE'
  reference: string | null // Numéro de chèque, référence virement, etc.

  // Type
  type: 'ACOMPTE' | 'SOLDE' | 'PARTIEL'

  // Validation
  valide: boolean // Permet de marquer un paiement en attente de validation
  valide_par: string | null // user_id
  valide_le: Date | null

  // Notes
  notes: string | null

  created_at: Date
  updated_at: Date
}
```

---

## 2. Fonctionnalités principales

### 2.1 Création de facture depuis un chantier terminé

**Workflow:**
1. Manager clique "Créer facture" depuis un chantier avec statut `TERMINE`
2. Système pré-remplit la facture:
   - Récupère les lignes du devis d'origine (si existe)
   - Ou crée lignes basées sur les tâches réalisées
   - Calcule montants HT/TVA/TTC
   - Propose acompte à 30% par défaut (modifiable)
3. Manager peut modifier:
   - Lignes (ajouter, supprimer, ajuster prix)
   - Acompte demandé
   - Date d'échéance
   - Notes
4. Système génère automatiquement:
   - Numéro de facture (séquence annuelle)
   - Date d'émission
   - Date d'échéance (émission + 30 jours par défaut)

**Interface création:**
```typescript
interface CreateFactureInput {
  chantier_id: string
  devis_id?: string

  // Options
  acompte_pourcent: number // 30 par défaut
  jours_echeance: number // 30 par défaut
  notes?: string

  // Lignes personnalisées (optionnel)
  lignes?: Array<{
    description: string
    quantite: number
    unite: string
    prix_unitaire_ht: number
  }>
}

async function creerFacture(input: CreateFactureInput) {
  // 1. Vérifier que chantier est TERMINE
  const chantier = await getChantier(input.chantier_id)
  if (chantier.statut !== 'TERMINE') {
    throw new Error('Le chantier doit être terminé pour créer une facture')
  }

  // 2. Récupérer les données
  const entreprise = await getEntreprise(chantier.tenant_id)
  const client = await getClient(chantier.client_id)

  // 3. Générer numéro facture
  const annee = new Date().getFullYear()
  const dernierNumero = await getLastFactureNumero(annee)
  const numeroFacture = `FAC-${annee}-${String(dernierNumero + 1).padStart(4, '0')}`

  // 4. Récupérer ou créer les lignes
  let lignes: LigneFacture[]
  if (input.lignes) {
    lignes = input.lignes
  } else if (input.devis_id) {
    lignes = await getLignesFromDevis(input.devis_id)
  } else {
    lignes = await generateLignesFromTaches(chantier.id)
  }

  // 5. Calculer montants
  const montant_ht = lignes.reduce((sum, l) => sum + l.montant_ht, 0)
  const montant_tva = montant_ht * 0.20 // TVA 20%
  const montant_ttc = montant_ht + montant_tva
  const acompte_demande = montant_ttc * (input.acompte_pourcent / 100)

  // 6. Créer facture
  const facture = await db.factures.create({
    numero_facture: numeroFacture,
    tenant_id: chantier.tenant_id,
    chantier_id: input.chantier_id,
    devis_id: input.devis_id,
    client_id: chantier.client_id,

    // Snapshots
    entreprise_nom: entreprise.nom,
    entreprise_siret: entreprise.siret,
    entreprise_adresse: entreprise.adresse,
    entreprise_tel: entreprise.telephone,
    entreprise_email: entreprise.email,

    client_nom: client.nom,
    client_adresse: client.adresse,
    client_siret: client.siret,
    client_tel: client.telephone,
    client_email: client.email,

    // Montants
    montant_ht,
    montant_tva,
    montant_ttc,
    acompte_demande,
    acompte_recu: 0,
    reste_a_payer: montant_ttc,

    // Statuts
    statut_paiement: 'EN_ATTENTE',
    statut_facture: 'BROUILLON',

    // Dates
    date_emission: new Date(),
    date_echeance: addDays(new Date(), input.jours_echeance),

    notes: input.notes
  })

  // 7. Créer lignes
  for (const [index, ligne] of lignes.entries()) {
    await db.lignes_facture.create({
      facture_id: facture.id,
      ...ligne,
      ordre: index
    })
  }

  return facture
}
```

---

### 2.2 Gestion des paiements

**Ajouter un paiement:**
```typescript
async function ajouterPaiement(input: {
  facture_id: string
  montant: number
  date_paiement: Date
  moyen_paiement: string
  reference?: string
  notes?: string
}) {
  const facture = await getFacture(input.facture_id)

  // 1. Créer paiement
  const paiement = await db.paiements_facture.create({
    facture_id: input.facture_id,
    tenant_id: facture.tenant_id,
    montant: input.montant,
    date_paiement: input.date_paiement,
    moyen_paiement: input.moyen_paiement,
    reference: input.reference,
    notes: input.notes,
    valide: true, // Auto-validé par défaut
    type: determinerTypePaiement(facture, input.montant)
  })

  // 2. Mettre à jour facture
  const totalPaiements = await getTotalPaiements(facture.id)
  const acompte_recu = Math.min(totalPaiements, facture.acompte_demande)
  const reste_a_payer = facture.montant_ttc - totalPaiements

  let statut_paiement: string
  if (reste_a_payer <= 0) {
    statut_paiement = 'SOLDE'
  } else if (acompte_recu >= facture.acompte_demande) {
    statut_paiement = 'PARTIELLEMENT_PAYE'
  } else if (acompte_recu > 0) {
    statut_paiement = 'ACOMPTE_RECU'
  } else {
    statut_paiement = 'EN_ATTENTE'
  }

  await db.factures.update({
    where: { id: facture.id },
    data: {
      acompte_recu,
      reste_a_payer: Math.max(0, reste_a_payer),
      statut_paiement,
      date_paiement_complet: reste_a_payer <= 0 ? new Date() : null
    }
  })

  return paiement
}

function determinerTypePaiement(facture: Facture, montant: number): string {
  if (facture.acompte_recu < facture.acompte_demande) {
    return 'ACOMPTE'
  } else if (montant >= facture.reste_a_payer) {
    return 'SOLDE'
  } else {
    return 'PARTIEL'
  }
}
```

**Interface suivi des paiements:**
- Liste tous les paiements reçus avec dates et montants
- Affiche clairement:
  - Montant total TTC
  - Acompte demandé / reçu
  - Reste à payer
  - Statut (badges colorés)
- Timeline visuelle des paiements

---

### 2.3 Génération PDF conforme

**Mentions obligatoires légales (France):**
```typescript
interface PDFFactureData {
  // En-tête entreprise
  entreprise: {
    nom: string
    siret: string
    adresse: string
    tel: string
    email: string
    capital?: string
    rcs?: string
    tva_intracommunautaire?: string
  }

  // Informations client
  client: {
    nom: string
    adresse: string
    siret?: string // Si client pro
  }

  // Facture
  numero: string
  date_emission: string
  date_echeance: string

  // Lignes
  lignes: Array<{
    description: string
    quantite: number
    unite: string
    prix_unitaire_ht: string
    montant_ht: string
  }>

  // Totaux
  total_ht: string
  tva_taux: string // "20%"
  tva_montant: string
  total_ttc: string

  // Paiements
  acompte_demande: string
  acompte_recu: string
  reste_a_payer: string

  // Pied de page
  conditions_paiement: string // "Paiement à 30 jours"
  penalites_retard: string // "Taux légal en vigueur"
  escompte: string // "Pas d'escompte pour paiement anticipé"

  // Optionnel
  notes?: string
}

async function genererPDFFacture(factureId: string): Promise<string> {
  const facture = await getFactureComplete(factureId)
  const lignes = await getLignesFacture(factureId)

  const pdfData: PDFFactureData = {
    entreprise: {
      nom: facture.entreprise_nom,
      siret: facture.entreprise_siret,
      adresse: facture.entreprise_adresse,
      tel: facture.entreprise_tel,
      email: facture.entreprise_email
    },
    client: {
      nom: facture.client_nom,
      adresse: facture.client_adresse,
      siret: facture.client_siret
    },
    numero: facture.numero_facture,
    date_emission: formatDate(facture.date_emission),
    date_echeance: formatDate(facture.date_echeance),
    lignes: lignes.map(l => ({
      description: l.description,
      quantite: l.quantite,
      unite: l.unite,
      prix_unitaire_ht: formatEuro(l.prix_unitaire_ht),
      montant_ht: formatEuro(l.montant_ht)
    })),
    total_ht: formatEuro(facture.montant_ht),
    tva_taux: "20%",
    tva_montant: formatEuro(facture.montant_tva),
    total_ttc: formatEuro(facture.montant_ttc),
    acompte_demande: formatEuro(facture.acompte_demande),
    acompte_recu: formatEuro(facture.acompte_recu),
    reste_a_payer: formatEuro(facture.reste_a_payer),
    conditions_paiement: "Paiement à 30 jours fin de mois",
    penalites_retard: "Taux légal en vigueur + 40€ d'indemnité forfaitaire",
    escompte: "Pas d'escompte pour paiement anticipé",
    notes: facture.notes
  }

  // Utiliser une lib comme PDFKit ou Puppeteer
  const pdf = await generatePDF(pdfData, 'template-facture.html')

  // Upload vers stockage
  const pdfUrl = await uploadFile(pdf, `factures/${facture.numero_facture}.pdf`)

  // Mettre à jour facture
  await db.factures.update({
    where: { id: factureId },
    data: { pdf_url: pdfUrl }
  })

  return pdfUrl
}
```

**Template HTML (Tailwind CSS):**
```html
<div class="max-w-4xl mx-auto p-8 bg-white">
  <!-- En-tête entreprise -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold">{{ entreprise.nom }}</h1>
    <p class="text-gray-600">{{ entreprise.adresse }}</p>
    <p class="text-gray-600">SIRET: {{ entreprise.siret }}</p>
    <p class="text-gray-600">{{ entreprise.tel }} - {{ entreprise.email }}</p>
  </div>

  <!-- Client -->
  <div class="mb-8">
    <h2 class="font-semibold mb-2">Facturé à:</h2>
    <p class="font-medium">{{ client.nom }}</p>
    <p class="text-gray-600">{{ client.adresse }}</p>
    {{#if client.siret}}
    <p class="text-gray-600">SIRET: {{ client.siret }}</p>
    {{/if}}
  </div>

  <!-- Numéro et dates -->
  <div class="mb-8 flex justify-between">
    <div>
      <h2 class="text-xl font-bold">FACTURE {{ numero }}</h2>
      <p>Date d'émission: {{ date_emission }}</p>
      <p>Date d'échéance: {{ date_echeance }}</p>
    </div>
  </div>

  <!-- Tableau lignes -->
  <table class="w-full mb-8">
    <thead class="bg-gray-100">
      <tr>
        <th class="text-left p-2">Description</th>
        <th class="text-right p-2">Qté</th>
        <th class="text-right p-2">Unité</th>
        <th class="text-right p-2">PU HT</th>
        <th class="text-right p-2">Total HT</th>
      </tr>
    </thead>
    <tbody>
      {{#each lignes}}
      <tr class="border-b">
        <td class="p-2">{{ description }}</td>
        <td class="text-right p-2">{{ quantite }}</td>
        <td class="text-right p-2">{{ unite }}</td>
        <td class="text-right p-2">{{ prix_unitaire_ht }}</td>
        <td class="text-right p-2">{{ montant_ht }}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- Totaux -->
  <div class="flex justify-end mb-8">
    <div class="w-64">
      <div class="flex justify-between py-2">
        <span>Total HT:</span>
        <span class="font-semibold">{{ total_ht }}</span>
      </div>
      <div class="flex justify-between py-2">
        <span>TVA ({{ tva_taux }}):</span>
        <span class="font-semibold">{{ tva_montant }}</span>
      </div>
      <div class="flex justify-between py-2 border-t-2 border-black text-lg font-bold">
        <span>Total TTC:</span>
        <span>{{ total_ttc }}</span>
      </div>
      <div class="flex justify-between py-2 mt-4 bg-blue-50 px-2">
        <span>Acompte demandé:</span>
        <span class="font-semibold">{{ acompte_demande }}</span>
      </div>
      <div class="flex justify-between py-2 bg-green-50 px-2">
        <span>Acompte reçu:</span>
        <span class="font-semibold">{{ acompte_recu }}</span>
      </div>
      <div class="flex justify-between py-2 bg-orange-50 px-2 font-bold">
        <span>Reste à payer:</span>
        <span>{{ reste_a_payer }}</span>
      </div>
    </div>
  </div>

  <!-- Conditions -->
  <div class="text-xs text-gray-600 border-t pt-4">
    <p class="mb-1"><strong>Conditions de paiement:</strong> {{ conditions_paiement }}</p>
    <p class="mb-1"><strong>Pénalités de retard:</strong> {{ penalites_retard }}</p>
    <p><strong>Escompte:</strong> {{ escompte }}</p>
  </div>

  {{#if notes}}
  <div class="mt-6 p-4 bg-gray-50 rounded">
    <p class="text-sm"><strong>Notes:</strong></p>
    <p class="text-sm">{{ notes }}</p>
  </div>
  {{/if}}
</div>
```

---

### 2.4 Envoi de facture par email

```typescript
async function envoyerFacture(factureId: string) {
  const facture = await getFacture(factureId)

  // 1. Générer PDF si pas déjà fait
  if (!facture.pdf_url) {
    await genererPDFFacture(factureId)
  }

  // 2. Envoyer email
  await sendEmail({
    to: facture.client_email,
    from: facture.entreprise_email,
    subject: `Facture ${facture.numero_facture} - ${facture.entreprise_nom}`,
    html: `
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint la facture ${facture.numero_facture} d'un montant de <strong>${formatEuro(facture.montant_ttc)}</strong>.</p>
      <p>Acompte demandé: ${formatEuro(facture.acompte_demande)}</p>
      <p>Date d'échéance: ${formatDate(facture.date_echeance)}</p>
      <p>Cordialement,<br>${facture.entreprise_nom}</p>
    `,
    attachments: [{
      filename: `${facture.numero_facture}.pdf`,
      path: facture.pdf_url
    }]
  })

  // 3. Mettre à jour statut
  await db.factures.update({
    where: { id: factureId },
    data: {
      statut_facture: 'ENVOYEE',
      date_envoi: new Date()
    }
  })
}
```

---

## 3. Règles métier

### 3.1 Création de facture
- ✅ Seul un chantier avec statut `TERMINE` peut générer une facture
- ✅ Une facture ne peut être créée que par un MANAGER ou COMPANY_ADMIN
- ✅ Le numéro de facture est auto-incrémenté par année (FAC-2026-0001, FAC-2026-0002, etc.)
- ✅ Acompte par défaut = 30% du montant TTC (modifiable)
- ✅ Date d'échéance par défaut = date d'émission + 30 jours (modifiable)
- ✅ TVA fixe à 20% (taux normal BTP)

### 3.2 Modification de facture
- ✅ Une facture en statut `BROUILLON` peut être modifiée librement
- ✅ Une facture `EMISE` ou `ENVOYEE` peut être annulée (génère une facture d'avoir)
- ❌ Une facture `SOLDE` ne peut plus être modifiée ni annulée
- ✅ Modification des lignes recalcule automatiquement tous les montants

### 3.3 Paiements
- ✅ Les paiements sont toujours ajoutés (jamais modifiés après validation)
- ✅ Statut paiement se met à jour automatiquement:
  - `EN_ATTENTE`: Aucun paiement reçu
  - `ACOMPTE_RECU`: Acompte >= acompte_demande
  - `PARTIELLEMENT_PAYE`: Paiements > acompte mais < total
  - `SOLDE`: Paiements >= montant TTC
- ✅ Date de paiement complet = date du dernier paiement qui solde la facture

### 3.4 Relances automatiques
- ⚠️ Si facture non payée 7 jours avant échéance → Email de rappel automatique
- ⚠️ Si facture non payée à l'échéance → Email de relance
- ⚠️ Si facture non payée 15 jours après échéance → Email de mise en demeure

---

## 4. Interfaces utilisateur

### 4.1 Liste des factures

**Filtres:**
- Par statut paiement (Toutes, En attente, Acompte reçu, Soldées)
- Par statut facture (Toutes, Brouillons, Émises, Envoyées, Annulées)
- Par client
- Par période (mois/année)
- Recherche par numéro

**Affichage tableau:**
| Numéro | Client | Date | Montant TTC | Reste à payer | Statut | Actions |
|--------|--------|------|-------------|---------------|--------|---------|
| FAC-2026-0042 | SYLA | 12/02/26 | 15 450 € | 0 € | ✅ Soldé | 👁️ PDF |
| FAC-2026-0041 | ACME | 10/02/26 | 8 920 € | 6 244 € | 🟡 Acompte reçu | ✏️ 📧 💰 |

**Indicateurs KPI:**
- Total facturé ce mois
- Total encaissé ce mois
- Total en attente
- Nombre de factures en retard

---

### 4.2 Détail d'une facture

**Structure:**
```
┌─────────────────────────────────────────┐
│ FACTURE FAC-2026-0041          [ACOMPTE REÇU] │
├─────────────────────────────────────────┤
│ Client: ACME Construction               │
│ Chantier: Rénovation bureau 3ème étage │
│ Date émission: 10/02/2026               │
│ Date échéance: 12/03/2026 (dans 28j)   │
├─────────────────────────────────────────┤
│ LIGNES                                   │
│ - Démolition cloisons (12 m²)  1200€    │
│ - Pose cloisons BA13 (12 m²)   2400€    │
│ - Peinture (24 m²)             1200€    │
│ - etc.                                   │
├─────────────────────────────────────────┤
│ Total HT:        7 433,33 €             │
│ TVA (20%):       1 486,67 €             │
│ Total TTC:       8 920,00 €             │
├─────────────────────────────────────────┤
│ PAIEMENTS                                │
│ Acompte demandé: 2 676,00 € (30%)       │
│ Acompte reçu:    2 676,00 € ✅          │
│ Reste à payer:   6 244,00 € 🟡          │
├─────────────────────────────────────────┤
│ HISTORIQUE PAIEMENTS                     │
│ 15/02/26 - Virement - 2 676,00 € (Acompte) │
├─────────────────────────────────────────┤
│ [📥 Télécharger PDF]  [📧 Envoyer]      │
│ [💰 Ajouter paiement] [❌ Annuler]      │
└─────────────────────────────────────────┘
```

---

### 4.3 Formulaire ajout paiement

```typescript
interface FormulairePaiement {
  montant: number
  date_paiement: Date
  moyen_paiement: 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'CARTE' | 'AUTRE'
  reference?: string // Numéro chèque, ref virement
  notes?: string
}
```

**Affichage:**
- Auto-suggère le reste à payer comme montant par défaut
- Affiche clairement:
  - Reste à payer actuel
  - Nouveau reste après ce paiement
  - Type de paiement (Acompte/Solde/Partiel) calculé automatiquement

---

## 5. Notifications

### 5.1 Notifications internes (app)
- 📬 **Nouvelle facture créée** → Client et Manager
- 💰 **Paiement reçu** → Manager
- ✅ **Facture soldée** → Manager
- ⚠️ **Facture bientôt échue** (J-7) → Manager
- 🔴 **Facture en retard** (J+1) → Manager

### 5.2 Emails clients
- **Envoi facture** → Email avec PDF en pièce jointe
- **Rappel J-7** → "Votre facture arrive à échéance dans 7 jours"
- **Relance J+0** → "Votre facture est arrivée à échéance"
- **Mise en demeure J+15** → "Votre facture est en retard de 15 jours"

---

## 6. Sécurité et permissions

### EMPLOYEE
- ❌ Aucun accès au module facturation

### MANAGER
- ✅ Créer factures pour ses chantiers
- ✅ Voir toutes les factures de son tenant
- ✅ Ajouter paiements
- ✅ Envoyer factures par email
- ✅ Télécharger PDF
- ✅ Annuler factures (crée facture d'avoir)

### COMPANY_ADMIN
- ✅ Tous les droits MANAGER
- ✅ Modifier paramètres de facturation (conditions, RIB, etc.)
- ✅ Accès statistiques financières avancées

### SUPER_ADMIN
- ✅ Voir toutes les factures de tous les tenants (admin global)
- ❌ Ne peut pas créer/modifier factures clients

---

## 7. Analytics et rapports

### 7.1 Tableau de bord financier
```typescript
interface DashboardFinancier {
  periode: 'MOIS' | 'TRIMESTRE' | 'ANNEE'

  // Chiffres clés
  total_facture_ht: number
  total_facture_ttc: number
  total_encaisse: number
  total_en_attente: number

  // Répartition
  nb_factures_soldees: number
  nb_factures_en_attente: number
  nb_factures_en_retard: number

  // Moyennes
  montant_moyen_facture: number
  delai_moyen_paiement_jours: number

  // Top clients
  top_clients: Array<{
    client_nom: string
    montant_total: number
    nb_factures: number
  }>

  // Évolution mensuelle
  evolution_mensuelle: Array<{
    mois: string // "2026-01"
    facture: number
    encaisse: number
  }>
}
```

### 7.2 Export comptable
- Export CSV/Excel de toutes les factures d'une période
- Format compatible avec logiciels comptables (Ciel, EBP, etc.)
- Colonnes: Date, Numéro, Client, HT, TVA, TTC, Statut

---

## 8. Intégration avec les autres modules

### 8.1 Module Devis
- ✅ Facture peut référencer un devis (lien bidirectionnel)
- ✅ Lignes facture pré-remplies depuis lignes devis accepté
- ✅ Comparaison devis estimé vs facture réelle

### 8.2 Module Chantier
- ✅ Chantier doit être `TERMINE` pour créer facture
- ✅ Bouton "Créer facture" visible sur chantier terminé
- ✅ Lien facture visible depuis page chantier
- ✅ Peut générer lignes depuis tâches réalisées (si pas de devis)

### 8.3 Module Employés
- ℹ️ Aucune intégration directe (facturation = côté client)
- ℹ️ Mais les données de badgeage influencent les prix du catalogue

---

## 9. Évolutions futures (V2)

### Phase 2 (après MVP)
- 🔄 Factures récurrentes (abonnements chantiers au forfait)
- 💳 Paiement en ligne (Stripe/PayPal)
- 📊 Prévisionnel de trésorerie
- 🤖 Relances automatiques intelligentes
- 📄 Factures d'avoir automatiques
- 🌍 Multi-devises
- 📱 Signature électronique client

### Phase 3
- 🧾 Intégration comptable (Sage, QuickBooks, etc.)
- 📈 Analyse prédictive des délais de paiement
- 💼 Affacturage / financement factures
- 🔗 API webhooks pour ERP externes

---

## 10. Conformité légale (France)

### Mentions obligatoires sur facture
✅ Numéro unique et séquentiel
✅ Date d'émission
✅ Identité entreprise (nom, SIRET, adresse)
✅ Identité client (nom, adresse, SIRET si pro)
✅ Description détaillée des prestations
✅ Montant HT, taux TVA, montant TTC
✅ Date d'échéance
✅ Conditions de paiement
✅ Pénalités de retard (taux légal + 40€)
✅ Escompte pour paiement anticipé (ou mention "Pas d'escompte")

### Conservation
- ✅ Factures conservées 10 ans (obligation légale)
- ✅ Archivage automatique des PDF
- ✅ Backup quotidien de la base de données

---

## Résumé des flux

```
CHANTIER TERMINÉ
    ↓
[Créer facture] ← Lignes depuis devis OU tâches réalisées
    ↓
FACTURE BROUILLON
    ↓ (Validation)
FACTURE ÉMISE
    ↓ (Envoi email)
FACTURE ENVOYÉE
    ↓
[Client paie acompte] → ACOMPTE_REÇU
    ↓
[Client paie solde] → PARTIELLEMENT_PAYÉ
    ↓
[Paiement final] → SOLDÉ ✅
```

---

**Statut:** Prêt pour développement
**Priorité:** Haute (MVP)
**Dépendances:** Module Chantier terminé
**Estimation:** 3 semaines développement
