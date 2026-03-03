# API Contracts - Autobat

## Vue d'ensemble

Tous les types TypeScript utilisés pour les Request/Response de l'API.

**Convention de nommage:**
- `<Resource>CreateInput` - Request body pour POST
- `<Resource>UpdateInput` - Request body pour PATCH
- `<Resource>Response` - Response format
- `<Resource>ListResponse` - Response format liste avec pagination

---

## 1. TYPES COMMUNS

### Pagination

```typescript
interface PaginationQuery {
  page?: number        // Default: 1
  limit?: number       // Default: 20, Max: 100
}

interface PaginationMeta {
  page: number
  limit: number
  total: number        // Total items
  totalPages: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}
```

---

### Error Response

```typescript
interface ErrorResponse {
  error: {
    code: string           // Error code (ex: "INVALID_INPUT")
    message: string        // Human-readable message
    details?: any          // Additional details (validation errors, etc.)
  }
}

// Exemples d'error codes:
type ErrorCode =
  | 'UNAUTHORIZED'           // 401
  | 'FORBIDDEN'              // 403
  | 'NOT_FOUND'              // 404
  | 'INVALID_INPUT'          // 400
  | 'DUPLICATE_ENTRY'        // 409
  | 'INTERNAL_ERROR'         // 500
```

---

## 2. AUTHENTICATION

### Register Input

```typescript
interface RegisterInput {
  entreprise: {
    nom: string              // Min 2, Max 100
    siret: string            // Exactly 14 digits
    adresse: string
    code_postal: string      // 5 digits
    ville: string
    telephone: string        // Format: 0XXXXXXXXX
    email: string            // Valid email
  }
  admin: {
    prenom: string
    nom: string
    email: string            // Valid email
    password: string         // Min 8, 1 uppercase, 1 number, 1 special
  }
}

interface RegisterResponse {
  tenant: TenantResponse
  user: UserResponse
  accessToken: string
  refreshToken: string
}
```

---

### Login Input

```typescript
interface LoginInput {
  email: string
  password: string
}

interface LoginResponse {
  user: UserResponse
  tenant: TenantResponse
  accessToken: string
  refreshToken: string
}
```

---

### Refresh Token Input

```typescript
interface RefreshTokenInput {
  refreshToken: string
}

interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}
```

---

## 3. USERS

### User Response

```typescript
interface UserResponse {
  id: string
  email: string
  prenom: string
  nom: string
  role: Role
  telephone: string | null
  avatar_url: string | null
  actif: boolean
  email_verified: boolean
  created_at: string         // ISO 8601
  last_login: string | null

  // Relations
  tenant?: TenantResponse
}

enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}
```

---

### User Create Input

```typescript
interface UserCreateInput {
  email: string
  prenom: string
  nom: string
  role: Role
  telephone?: string
}
```

---

### User Update Input

```typescript
interface UserUpdateInput {
  prenom?: string
  nom?: string
  telephone?: string
  role?: Role              // Only COMPANY_ADMIN can change
  actif?: boolean          // Only COMPANY_ADMIN can change
}
```

---

### User List Response

```typescript
interface UserListResponse extends PaginatedResponse<UserResponse> {
  // Pagination included
}
```

---

## 4. CLIENTS

### Client Response

```typescript
interface ClientResponse {
  id: string
  nom: string
  email: string
  telephone: string
  adresse: string | null
  code_postal: string | null
  ville: string | null
  siret: string | null
  actif: boolean
  notes: string | null
  created_at: string

  // Stats (si détail)
  stats?: {
    nb_devis: number
    nb_devis_acceptes: number
    nb_chantiers: number
    nb_chantiers_termines: number
    ca_total: number
    ca_facture: number
    ca_encaisse: number
  }
}
```

---

### Client Create Input

```typescript
interface ClientCreateInput {
  nom: string              // Min 2, Max 100
  email: string            // Valid email, unique per tenant
  telephone: string        // Format: 0XXXXXXXXX
  adresse?: string
  code_postal?: string     // 5 digits
  ville?: string
  siret?: string           // 14 digits
  notes?: string
}
```

---

### Client Update Input

```typescript
interface ClientUpdateInput {
  nom?: string
  email?: string
  telephone?: string
  adresse?: string
  code_postal?: string
  ville?: string
  siret?: string
  actif?: boolean
  notes?: string
}
```

---

## 5. CATALOGUE (OUVRAGES)

### Ouvrage Response

```typescript
interface OuvrageResponse {
  id: string
  code: string
  categorie: string
  denomination: string
  unite: string
  prix_unitaire_ht: number

  // Auto-learning
  temps_estime_minutes: number | null
  temps_reel_moyen: number | null
  nb_chantiers_realises: number
  derniere_maj_auto: string | null

  notes: string | null
  badge: OuvrageBadge        // UI helper
  created_at: string
}

enum OuvrageBadge {
  NON_TESTE = 'NON_TESTE',                // 0-1 chantiers
  EN_APPRENTISSAGE = 'EN_APPRENTISSAGE',  // 2-7 chantiers
  OPTIMISE = 'OPTIMISE'                   // 8+ chantiers
}
```

---

### Ouvrage Detail Response

```typescript
interface OuvrageDetailResponse extends OuvrageResponse {
  historique_prix: HistoriquePrixResponse[]
  chantiers_utilises: ChantierOuvrageUsage[]
}

interface HistoriquePrixResponse {
  date: string
  ancien_prix: number
  nouveau_prix: number
  raison: string
  ecart_pourcent: number | null
}

interface ChantierOuvrageUsage {
  chantier_id: string
  chantier_nom: string
  date: string
  quantite: number
  temps_reel_total: number  // minutes
}
```

---

### Ouvrage Create Input

```typescript
interface OuvrageCreateInput {
  code: string              // Unique per tenant
  categorie: string
  denomination: string
  unite: string
  prix_unitaire_ht: number  // > 0
  temps_estime_minutes?: number
  notes?: string
}
```

---

### Ouvrage Update Input

```typescript
interface OuvrageUpdateInput {
  prix_unitaire_ht?: number
  temps_estime_minutes?: number
  notes?: string
  // Code, categorie, denomination, unite non modifiables (business rule)
}
```

---

## 6. DEVIS

### Devis Response

```typescript
interface DevisResponse {
  id: string
  numero_devis: string       // DEV-2026-0001
  client: ClientSummary
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  statut: StatutDevis
  date_creation: string
  date_validite: string
  date_envoi: string | null
  date_acceptation: string | null
  date_refus: string | null
  pdf_url: string | null
  notes: string | null

  // Détail uniquement
  lignes?: LigneDevisResponse[]
}

enum StatutDevis {
  BROUILLON = 'BROUILLON',
  ENVOYE = 'ENVOYE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EXPIRE = 'EXPIRE'
}

interface ClientSummary {
  id: string
  nom: string
  email: string
}
```

---

### Ligne Devis Response

```typescript
interface LigneDevisResponse {
  id: string
  ouvrage_id: string | null
  description: string
  quantite: number
  unite: string
  prix_unitaire_ht: number
  montant_ht: number
  tva_pourcent: number
  montant_ttc: number
  ordre: number

  // Relation
  ouvrage?: {
    code: string
    badge: OuvrageBadge
  }
}
```

---

### Devis Create Input

```typescript
interface DevisCreateInput {
  client_id: string
  date_validite: string      // ISO 8601 date
  notes?: string
  lignes: LigneDevisInput[]
}

interface LigneDevisInput {
  ouvrage_id?: string        // Null si ligne personnalisée
  description: string
  quantite: number           // > 0
  unite: string
  prix_unitaire_ht: number   // > 0
}
```

---

### Devis Update Input

```typescript
interface DevisUpdateInput {
  date_validite?: string
  notes?: string
  lignes?: LigneDevisInput[]

  // Règle: Seulement BROUILLON peut être modifié
}
```

---

### Devis List Response

```typescript
interface DevisListResponse extends PaginatedResponse<DevisResponse> {
  stats: {
    total_ce_mois: number
    total_envoyes: number
    total_acceptes: number
    taux_acceptation: number
    montant_total_ht: number
  }
}
```

---

## 7. CHANTIERS

### Chantier Response

```typescript
interface ChantierResponse {
  id: string
  nom: string
  client: ClientSummary
  devis_id: string | null
  adresse: string
  code_postal: string
  ville: string
  latitude: number
  longitude: number
  rayon_gps_metres: number
  badgeage_par_tache: boolean
  statut: StatutChantier
  date_debut: string
  date_fin_prevue: string | null
  date_fin_reelle: string | null
  notes: string | null

  // Liste uniquement
  nb_employes_assignes?: number
  heures_badgees?: number
  progression?: number

  // Détail uniquement
  employes_assignes?: EmployeSummary[]
  taches?: TacheResponse[]
  stats?: ChantierStats
}

enum StatutChantier {
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  FACTURE = 'FACTURE'
}

interface EmployeSummary {
  id: string
  prenom: string
  nom: string
  heures_badgees: number
}

interface ChantierStats {
  heures_totales: number
  progression: number
  nb_documents: number
  nb_photos: number
}
```

---

### Chantier Create Input

```typescript
interface ChantierCreateInput {
  nom: string
  client_id: string
  devis_id?: string
  adresse: string
  code_postal: string
  ville: string
  latitude: number          // -90 to 90
  longitude: number         // -180 to 180
  rayon_gps_metres: number  // Default: 100
  badgeage_par_tache: boolean
  date_debut: string        // ISO date
  date_fin_prevue?: string
  notes?: string

  employes_ids: string[]    // Min 1
  taches?: TacheInput[]
}
```

---

### Chantier Update Input

```typescript
interface ChantierUpdateInput {
  nom?: string
  adresse?: string
  code_postal?: string
  ville?: string
  rayon_gps_metres?: number
  badgeage_par_tache?: boolean
  date_fin_prevue?: string
  notes?: string
}
```

---

## 8. TÂCHES

### Tache Response

```typescript
interface TacheResponse {
  id: string
  nom: string
  description: string | null
  ouvrage?: OuvrageSummary
  quantite_prevue: number | null
  unite: string | null
  statut: StatutTache
  ordre: number
  heures_badgees: number
}

enum StatutTache {
  A_FAIRE = 'A_FAIRE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE'
}

interface OuvrageSummary {
  id: string
  code: string
  denomination: string
}
```

---

### Tache Input

```typescript
interface TacheInput {
  nom: string
  ouvrage_id?: string
  quantite_prevue?: number
  unite?: string
  ordre: number
}
```

---

## 9. BADGEAGES

### Badgeage Response

```typescript
interface BadgeageResponse {
  id: string
  chantier: {
    id: string
    nom: string
  }
  employe: {
    id: string
    prenom: string
    nom: string
  }
  tache?: {
    id: string
    nom: string
  }
  type: TypeBadgeage
  methode: MethodeBadgeage
  timestamp: string
  latitude: number | null
  longitude: number | null
  precision_metres: number | null
  synced: boolean
}

enum TypeBadgeage {
  PRESENCE_DEBUT = 'PRESENCE_DEBUT',
  PRESENCE_FIN = 'PRESENCE_FIN',
  TACHE_DEBUT = 'TACHE_DEBUT',
  TACHE_FIN = 'TACHE_FIN'
}

enum MethodeBadgeage {
  GPS_AUTO = 'GPS_AUTO',
  MANUEL = 'MANUEL'
}
```

---

### Badgeage Create Input

```typescript
interface BadgeageCreateInput {
  chantier_id: string
  tache_id?: string            // Required si type = TACHE_*
  type: TypeBadgeage
  methode: MethodeBadgeage
  latitude?: number
  longitude?: number
  precision_metres?: number
}
```

---

### Badgeage Stats Response

```typescript
interface BadgeageStatsResponse {
  employe: EmployeSummary
  mois: string                 // YYYY-MM
  quota_mensuel_heures: number | null
  heures_badgees: number
  heures_restantes: number
  pourcentage: number

  par_chantier: {
    chantier_id: string
    chantier_nom: string
    heures: number
  }[]

  par_jour: {
    date: string              // YYYY-MM-DD
    heures: number
    chantiers: string[]
  }[]
}
```

---

### Badgeage Sync Input

```typescript
interface BadgeageSyncInput {
  badgeages: BadgeageCreateInput[]
}

interface BadgeageSyncResponse {
  synced: number
  failed: number
  errors: {
    index: number
    message: string
  }[]
}
```

---

## 10. DOCUMENTS

### Document Response

```typescript
interface DocumentResponse {
  id: string
  nom: string
  type: TypeDocument
  url: string
  taille_bytes: number
  titre: string | null
  description: string | null
  uploaded_by: {
    prenom: string
    nom: string
  }
  created_at: string
}

enum TypeDocument {
  PHOTO = 'PHOTO',
  PDF = 'PDF',
  AUTRE = 'AUTRE'
}
```

---

### Document Upload Input

```typescript
// Multipart form-data
interface DocumentUploadInput {
  file: File               // Binary
  titre?: string
  description?: string
}
```

---

## 11. FACTURES

### Facture Response

```typescript
interface FactureResponse {
  id: string
  numero_facture: string     // FAC-2026-0001
  chantier: ChantierSummary
  client: ClientSummary
  devis_id: string | null

  // Snapshots (figés au moment création)
  entreprise: EntrepriseSnapshot
  client_snapshot: ClientSnapshot

  montant_ht: number
  montant_tva: number
  montant_ttc: number

  acompte_demande: number
  acompte_recu: number
  reste_a_payer: number

  statut_paiement: StatutPaiement
  statut_facture: StatutFacture

  date_emission: string
  date_echeance: string
  date_envoi: string | null
  date_paiement_complet: string | null

  pdf_url: string | null
  notes: string | null

  // Détail uniquement
  lignes?: LigneFactureResponse[]
  paiements?: PaiementFactureResponse[]
}

enum StatutPaiement {
  EN_ATTENTE = 'EN_ATTENTE',
  ACOMPTE_RECU = 'ACOMPTE_RECU',
  PARTIELLEMENT_PAYE = 'PARTIELLEMENT_PAYE',
  SOLDE = 'SOLDE'
}

enum StatutFacture {
  BROUILLON = 'BROUILLON',
  EMISE = 'EMISE',
  ENVOYEE = 'ENVOYEE',
  ANNULEE = 'ANNULEE'
}

interface EntrepriseSnapshot {
  nom: string
  siret: string
  adresse: string
  telephone: string
  email: string
}

interface ClientSnapshot {
  nom: string
  adresse: string
  siret: string | null
  telephone: string
  email: string
}

interface ChantierSummary {
  id: string
  nom: string
}
```

---

### Ligne Facture Response

```typescript
interface LigneFactureResponse {
  id: string
  ouvrage_id: string | null
  description: string
  quantite: number
  unite: string
  prix_unitaire_ht: number
  montant_ht: number
  tva_pourcent: number
  montant_ttc: number
  ordre: number
}
```

---

### Paiement Facture Response

```typescript
interface PaiementFactureResponse {
  id: string
  montant: number
  date_paiement: string
  moyen_paiement: MoyenPaiement
  reference: string | null
  type: TypePaiement
  valide: boolean
  notes: string | null
}

enum MoyenPaiement {
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
  ESPECES = 'ESPECES',
  CARTE = 'CARTE',
  AUTRE = 'AUTRE'
}

enum TypePaiement {
  ACOMPTE = 'ACOMPTE',
  SOLDE = 'SOLDE',
  PARTIEL = 'PARTIEL'
}
```

---

### Facture Create Input

```typescript
interface FactureCreateInput {
  chantier_id: string        // Must be TERMINE
  devis_id?: string
  acompte_pourcent: number   // 0-100, default: 30
  jours_echeance: number     // Default: 30
  notes?: string

  lignes?: LigneFactureInput[]  // Optional, auto-generated si absent
}

interface LigneFactureInput {
  ouvrage_id?: string
  description: string
  quantite: number
  unite: string
  prix_unitaire_ht: number
}
```

---

### Paiement Create Input

```typescript
interface PaiementCreateInput {
  montant: number            // > 0
  date_paiement: string      // <= today
  moyen_paiement: MoyenPaiement
  reference?: string
  notes?: string
}
```

---

### Facture List Response

```typescript
interface FactureListResponse extends PaginatedResponse<FactureResponse> {
  stats: {
    total_facture_ce_mois: number
    total_encaisse: number
    total_en_attente: number
    nb_en_retard: number
  }
}
```

---

## 12. DASHBOARD

### Dashboard Response

```typescript
interface DashboardResponse {
  periode: 'MOIS' | 'TRIMESTRE' | 'ANNEE'
  mois: string               // YYYY-MM

  kpis: {
    ca_facture_ht: number
    ca_encaisse: number
    marge_brute_pourcent: number
    nb_chantiers_en_cours: number
    nb_chantiers_termines: number
    nb_devis_envoyes: number
    taux_acceptation_devis: number
    heures_totales: number
  }

  alertes: AlerteResponse[]

  chantiers_en_cours: ChantierSummaryExtended[]

  evolution_mensuelle: {
    mois: string
    facture: number
    encaisse: number
  }[]
}

interface AlerteResponse {
  type: TypeAlerte
  gravite: 'HAUTE' | 'MOYENNE' | 'BASSE'
  message: string
  lien: string
  created_at: string
}

enum TypeAlerte {
  FACTURE_EN_RETARD = 'FACTURE_EN_RETARD',
  DEVIS_EXPIRE_BIENTOT = 'DEVIS_EXPIRE_BIENTOT',
  BADGE_NON_CLOTURE = 'BADGE_NON_CLOTURE'
}

interface ChantierSummaryExtended {
  id: string
  nom: string
  client_nom: string
  progression: number
  heures_badgees: number
  nb_employes: number
}
```

---

## 13. NOTIFICATIONS

### Notification Response

```typescript
interface NotificationResponse {
  id: string
  type: TypeNotification
  titre: string
  message: string
  lien_url: string | null
  lue: boolean
  created_at: string
}

enum TypeNotification {
  DEVIS_ACCEPTE = 'DEVIS_ACCEPTE',
  DEVIS_REFUSE = 'DEVIS_REFUSE',
  FACTURE_PAYEE = 'FACTURE_PAYEE',
  FACTURE_EN_RETARD = 'FACTURE_EN_RETARD',
  BADGEAGE_CREE = 'BADGEAGE_CREE',
  CHANTIER_TERMINE = 'CHANTIER_TERMINE',
  DOCUMENT_AJOUTE = 'DOCUMENT_AJOUTE',
  AUTRE = 'AUTRE'
}
```

---

### Notification List Response

```typescript
interface NotificationListResponse {
  data: NotificationResponse[]
  nb_non_lues: number
}
```

---

## 14. VALIDATION SCHEMAS (ZOD)

### Exemple: Devis Create Schema

```typescript
import { z } from 'zod'

export const DevisCreateSchema = z.object({
  client_id: z.string().uuid(),
  date_validite: z.string().datetime(),
  notes: z.string().optional(),
  lignes: z.array(
    z.object({
      ouvrage_id: z.string().uuid().optional(),
      description: z.string().min(3).max(200),
      quantite: z.number().positive(),
      unite: z.string().min(1).max(10),
      prix_unitaire_ht: z.number().positive()
    })
  ).min(1)
})

export type DevisCreateInput = z.infer<typeof DevisCreateSchema>
```

---

## RÉSUMÉ

**Types créés:** ~60 interfaces
**Validation:** Zod schemas
**Convention:** Suffixes Input/Response
**Enums:** TypeScript native enums

**Prochaine étape:** authentication.md (JWT, permissions, middleware)
