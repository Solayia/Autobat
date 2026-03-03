# API Endpoints - Autobat

## Vue d'ensemble

**Base URL:** `https://api.autobat.fr`
**Protocol:** REST
**Format:** JSON
**Authentication:** JWT Bearer Token

---

## 1. AUTHENTICATION

### POST /api/auth/register
Créer un nouveau compte entreprise

**Auth:** None (public)

**Request:**
```json
{
  "entreprise": {
    "nom": "ACME Construction",
    "siret": "12345678900001",
    "adresse": "123 Rue Example",
    "code_postal": "75001",
    "ville": "Paris",
    "telephone": "0123456789",
    "email": "contact@acme.fr"
  },
  "admin": {
    "prenom": "Marc",
    "nom": "Dupont",
    "email": "marc@acme.fr",
    "password": "SecurePass123!"
  }
}
```

**Response:** `201 Created`
```json
{
  "tenant": {
    "id": "uuid",
    "nom": "ACME Construction",
    "siret": "12345678900001"
  },
  "user": {
    "id": "uuid",
    "email": "marc@acme.fr",
    "prenom": "Marc",
    "nom": "Dupont",
    "role": "COMPANY_ADMIN"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### POST /api/auth/login
Connexion utilisateur

**Auth:** None (public)

**Request:**
```json
{
  "email": "marc@acme.fr",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "marc@acme.fr",
    "prenom": "Marc",
    "nom": "Dupont",
    "role": "COMPANY_ADMIN",
    "tenant_id": "uuid"
  },
  "tenant": {
    "id": "uuid",
    "nom": "ACME Construction"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Errors:**
- `401 Unauthorized` - Email/password invalide
- `403 Forbidden` - Compte désactivé

---

### POST /api/auth/refresh
Rafraîchir l'access token

**Auth:** None

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### POST /api/auth/logout
Déconnexion (invalide refresh token)

**Auth:** Bearer Token

**Request:** Empty body

**Response:** `204 No Content`

---

### POST /api/auth/forgot-password
Demander reset password

**Auth:** None

**Request:**
```json
{
  "email": "marc@acme.fr"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email de réinitialisation envoyé"
}
```

---

### POST /api/auth/reset-password
Réinitialiser password

**Auth:** None

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Mot de passe réinitialisé avec succès"
}
```

---

## 2. USERS

### GET /api/users/me
Récupérer profil utilisateur connecté

**Auth:** Bearer Token

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "marc@acme.fr",
  "prenom": "Marc",
  "nom": "Dupont",
  "role": "COMPANY_ADMIN",
  "telephone": "0612345678",
  "avatar_url": "https://...",
  "tenant": {
    "id": "uuid",
    "nom": "ACME Construction"
  }
}
```

---

### PATCH /api/users/me
Mettre à jour profil

**Auth:** Bearer Token

**Request:**
```json
{
  "prenom": "Marc",
  "nom": "Dupont",
  "telephone": "0612345678"
}
```

**Response:** `200 OK` (même format que GET /users/me)

---

### GET /api/users
Lister utilisateurs de l'entreprise

**Auth:** Bearer Token (MANAGER+)

**Query params:**
- `role` - Filtrer par rôle
- `actif` - true/false
- `page` - Pagination (default: 1)
- `limit` - Items par page (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "jean@acme.fr",
      "prenom": "Jean",
      "nom": "Martin",
      "role": "EMPLOYEE",
      "actif": true,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### POST /api/users
Créer nouvel utilisateur (inviter)

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "email": "nouveau@acme.fr",
  "prenom": "Paul",
  "nom": "Durand",
  "role": "EMPLOYEE",
  "telephone": "0623456789"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "nouveau@acme.fr",
  "prenom": "Paul",
  "nom": "Durand",
  "role": "EMPLOYEE",
  "invitation_sent": true
}
```

---

### PATCH /api/users/:id
Mettre à jour utilisateur

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "role": "MANAGER",
  "actif": false
}
```

**Response:** `200 OK`

---

### DELETE /api/users/:id
Désactiver utilisateur

**Auth:** Bearer Token (COMPANY_ADMIN)

**Response:** `204 No Content`

---

## 3. CLIENTS

### GET /api/clients
Lister clients

**Auth:** Bearer Token

**Query params:**
- `actif` - true/false
- `search` - Recherche par nom/email
- `page`, `limit`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "nom": "Client SYLA",
      "email": "contact@syla.fr",
      "telephone": "0145678901",
      "adresse": "8 Avenue Victor Hugo",
      "ville": "Paris",
      "siret": "98765432100001",
      "actif": true,
      "nb_devis": 5,
      "nb_chantiers": 3,
      "ca_total": 45680.00
    }
  ],
  "pagination": { ... }
}
```

---

### GET /api/clients/:id
Détail client

**Auth:** Bearer Token

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "nom": "Client SYLA",
  "email": "contact@syla.fr",
  "telephone": "0145678901",
  "adresse": "8 Avenue Victor Hugo",
  "code_postal": "75016",
  "ville": "Paris",
  "siret": "98765432100001",
  "actif": true,
  "notes": "Client fidèle depuis 2024",
  "created_at": "2024-03-15T10:00:00Z",

  "stats": {
    "nb_devis": 5,
    "nb_devis_acceptes": 3,
    "nb_chantiers": 3,
    "nb_chantiers_termines": 2,
    "ca_total": 45680.00,
    "ca_facture": 35000.00,
    "ca_encaisse": 30000.00
  },

  "derniers_devis": [ ... ],
  "derniers_chantiers": [ ... ],
  "dernieres_factures": [ ... ]
}
```

---

### POST /api/clients
Créer client

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "nom": "Nouveau Client",
  "email": "nouveau@client.fr",
  "telephone": "0156789012",
  "adresse": "123 Rue Example",
  "code_postal": "75001",
  "ville": "Paris",
  "siret": "12312312300001",
  "notes": "Prospect recommandé"
}
```

**Response:** `201 Created`

---

### PATCH /api/clients/:id
Mettre à jour client

**Auth:** Bearer Token (MANAGER+)

**Response:** `200 OK`

---

### DELETE /api/clients/:id
Désactiver client

**Auth:** Bearer Token (MANAGER+)

**Response:** `204 No Content`

**Errors:**
- `400 Bad Request` - Client a des devis/chantiers/factures

---

## 4. CATALOGUE (OUVRAGES)

### GET /api/catalogue
Lister ouvrages du catalogue

**Auth:** Bearer Token

**Query params:**
- `categorie` - Filtrer par catégorie
- `search` - Recherche par code/description
- `page`, `limit`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "GO-DEM-001",
      "categorie": "Gros Oeuvre",
      "denomination": "Démolition cloisons",
      "unite": "m²",
      "prix_unitaire_ht": 45.00,
      "temps_estime_minutes": 30,
      "temps_reel_moyen": 35.50,
      "nb_chantiers_realises": 8,
      "derniere_maj_auto": "2026-01-20T10:00:00Z",
      "badge": "OPTIMISE"  // OPTIMISE | EN_APPRENTISSAGE | NON_TESTE
    }
  ],
  "pagination": { ... },
  "categories": [
    { "nom": "Gros Oeuvre", "count": 101 },
    { "nom": "Charpente", "count": 20 },
    { "nom": "Electricité", "count": 26 }
  ]
}
```

---

### GET /api/catalogue/:id
Détail ouvrage avec historique

**Auth:** Bearer Token

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "code": "GO-DEM-001",
  "categorie": "Gros Oeuvre",
  "denomination": "Démolition cloisons",
  "unite": "m²",
  "prix_unitaire_ht": 45.00,
  "temps_estime_minutes": 30,
  "temps_reel_moyen": 35.50,
  "nb_chantiers_realises": 8,
  "derniere_maj_auto": "2026-01-20T10:00:00Z",
  "notes": "Inclut évacuation gravats",

  "historique_prix": [
    {
      "date": "2026-01-20T10:00:00Z",
      "ancien_prix": 40.00,
      "nouveau_prix": 45.00,
      "raison": "Auto-learning (chantier #8)",
      "ecart_pourcent": 12.50
    },
    {
      "date": "2025-11-15T10:00:00Z",
      "ancien_prix": 38.00,
      "nouveau_prix": 40.00,
      "raison": "Auto-learning (chantier #4)",
      "ecart_pourcent": 5.26
    }
  ],

  "chantiers_utilises": [
    {
      "chantier_nom": "Rénovation ACME",
      "date": "2026-01-10",
      "quantite": 12.0,
      "temps_reel_total": 420
    }
  ]
}
```

---

### POST /api/catalogue
Créer ouvrage personnalisé

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "code": "CUSTOM-001",
  "categorie": "Personnalisé",
  "denomination": "Prestation spécifique",
  "unite": "u",
  "prix_unitaire_ht": 150.00,
  "temps_estime_minutes": 120,
  "notes": "Description détaillée"
}
```

**Response:** `201 Created`

---

### PATCH /api/catalogue/:id
Mettre à jour ouvrage

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "prix_unitaire_ht": 50.00,
  "notes": "Prix ajusté manuellement"
}
```

**Response:** `200 OK`

**Note:** L'historique est mis à jour automatiquement

---

### DELETE /api/catalogue/:id
Supprimer ouvrage

**Auth:** Bearer Token (MANAGER+)

**Response:** `204 No Content`

**Errors:**
- `400 Bad Request` - Ouvrage utilisé dans devis/factures

---

## 5. DEVIS

### GET /api/devis
Lister devis

**Auth:** Bearer Token

**Query params:**
- `statut` - BROUILLON | ENVOYE | ACCEPTE | REFUSE | EXPIRE
- `client_id` - Filtrer par client
- `search` - Recherche par numéro/client
- `date_debut`, `date_fin` - Filtrer par date création
- `page`, `limit`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "numero_devis": "DEV-2026-0042",
      "client": {
        "id": "uuid",
        "nom": "Client ACME"
      },
      "montant_ht": 3500.00,
      "montant_ttc": 4200.00,
      "statut": "ENVOYE",
      "date_creation": "2026-02-10T10:00:00Z",
      "date_validite": "2026-03-12T23:59:59Z",
      "date_envoi": "2026-02-10T14:30:00Z",
      "nb_lignes": 5
    }
  ],
  "pagination": { ... },
  "stats": {
    "total_ce_mois": 12,
    "total_envoyes": 8,
    "total_acceptes": 5,
    "taux_acceptation": 62.5,
    "montant_total_ht": 65000.00
  }
}
```

---

### GET /api/devis/:id
Détail devis

**Auth:** Bearer Token

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "numero_devis": "DEV-2026-0042",
  "client": {
    "id": "uuid",
    "nom": "Client ACME",
    "email": "contact@acme.fr",
    "adresse": "123 Rue Example, 75001 Paris"
  },
  "montant_ht": 3500.00,
  "montant_tva": 700.00,
  "montant_ttc": 4200.00,
  "statut": "ENVOYE",
  "date_creation": "2026-02-10T10:00:00Z",
  "date_validite": "2026-03-12T23:59:59Z",
  "date_envoi": "2026-02-10T14:30:00Z",
  "pdf_url": "https://storage.../DEV-2026-0042.pdf",
  "notes": "Inclut fourniture matériaux",

  "lignes": [
    {
      "id": "uuid",
      "ouvrage_id": "uuid",
      "description": "Démolition cloisons",
      "quantite": 12.00,
      "unite": "m²",
      "prix_unitaire_ht": 45.00,
      "montant_ht": 540.00,
      "tva_pourcent": 20.00,
      "montant_ttc": 648.00,
      "ordre": 1,
      "ouvrage": {
        "code": "GO-DEM-001",
        "badge": "OPTIMISE"
      }
    }
  ]
}
```

---

### POST /api/devis
Créer devis

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "client_id": "uuid",
  "date_validite": "2026-03-15",
  "notes": "Notes du devis",
  "lignes": [
    {
      "ouvrage_id": "uuid",  // ou null si personnalisé
      "description": "Démolition cloisons",
      "quantite": 12.0,
      "unite": "m²",
      "prix_unitaire_ht": 45.00
    }
  ]
}
```

**Response:** `201 Created` (même format que GET)

**Notes:**
- Montants calculés automatiquement
- Numéro devis généré automatiquement

---

### PATCH /api/devis/:id
Mettre à jour devis

**Auth:** Bearer Token (MANAGER+)

**Request:** (mêmes champs que POST, partiels)

**Response:** `200 OK`

**Errors:**
- `400 Bad Request` - Devis non BROUILLON (cannot edit)

---

### POST /api/devis/:id/send
Envoyer devis par email

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "email": "client@example.fr",  // Optionnel, défaut = client email
  "message": "Message personnalisé optionnel"
}
```

**Response:** `200 OK`
```json
{
  "message": "Devis envoyé avec succès",
  "sent_to": "client@example.fr",
  "sent_at": "2026-02-12T14:30:00Z"
}
```

**Side effects:**
- Statut → ENVOYE
- date_envoi updated
- Email envoyé avec PDF attaché

---

### POST /api/devis/:id/duplicate
Dupliquer devis

**Auth:** Bearer Token (MANAGER+)

**Response:** `201 Created` (nouveau devis avec nouveau numéro)

---

### POST /api/devis/:id/accept
Accepter devis (action client)

**Auth:** Token spécial ou public link

**Response:** `200 OK`

**Side effects:**
- Statut → ACCEPTE
- date_acceptation updated
- Notification manager

---

### POST /api/devis/:id/refuse
Refuser devis (action client)

**Auth:** Token spécial ou public link

**Request:**
```json
{
  "raison": "Prix trop élevé"
}
```

**Response:** `200 OK`

---

### GET /api/devis/:id/pdf
Télécharger PDF devis

**Auth:** Bearer Token

**Response:** `200 OK` (application/pdf)

---

## 6. CHANTIERS

### GET /api/chantiers
Lister chantiers

**Auth:** Bearer Token

**Query params:**
- `statut` - EN_COURS | TERMINE | ANNULE | FACTURE
- `client_id`
- `employe_id` - Filtrer chantiers assignés à un employé
- `page`, `limit`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "nom": "Rénovation ACME",
      "client": {
        "id": "uuid",
        "nom": "Client ACME"
      },
      "adresse": "12 Rue de la Paix, 75001 Paris",
      "statut": "EN_COURS",
      "date_debut": "2026-02-03T00:00:00Z",
      "date_fin_prevue": "2026-02-28T23:59:59Z",
      "nb_employes_assignes": 3,
      "heures_badgees": 68.5,
      "progression": 80
    }
  ],
  "pagination": { ... }
}
```

---

### GET /api/chantiers/:id
Détail chantier

**Auth:** Bearer Token

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "nom": "Rénovation ACME",
  "client": {
    "id": "uuid",
    "nom": "Client ACME",
    "telephone": "0123456789"
  },
  "devis_id": "uuid",
  "adresse": "12 Rue de la Paix",
  "code_postal": "75001",
  "ville": "Paris",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "rayon_gps_metres": 100,
  "badgeage_par_tache": true,
  "statut": "EN_COURS",
  "date_debut": "2026-02-03T00:00:00Z",
  "date_fin_prevue": "2026-02-28T23:59:59Z",
  "notes": "Accès code 1234",

  "employes_assignes": [
    {
      "id": "uuid",
      "prenom": "Jean",
      "nom": "Martin",
      "heures_badgees": 42.5
    }
  ],

  "taches": [
    {
      "id": "uuid",
      "nom": "Démolition cloisons",
      "statut": "TERMINEE",
      "quantite_prevue": 12.0,
      "unite": "m²",
      "ordre": 1,
      "heures_badgees": 8.5
    }
  ],

  "stats": {
    "heures_totales": 68.5,
    "progression": 80,
    "nb_documents": 12,
    "nb_photos": 10
  }
}
```

---

### POST /api/chantiers
Créer chantier

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "nom": "Nouveau chantier",
  "client_id": "uuid",
  "devis_id": "uuid",  // Optionnel
  "adresse": "123 Rue Example",
  "code_postal": "75001",
  "ville": "Paris",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "rayon_gps_metres": 100,
  "badgeage_par_tache": true,
  "date_debut": "2026-02-15",
  "date_fin_prevue": "2026-03-15",
  "notes": "Instructions spéciales",

  "employes_ids": ["uuid1", "uuid2"],

  "taches": [
    {
      "nom": "Démolition",
      "ouvrage_id": "uuid",
      "quantite_prevue": 12.0,
      "unite": "m²",
      "ordre": 1
    }
  ]
}
```

**Response:** `201 Created`

---

### PATCH /api/chantiers/:id
Mettre à jour chantier

**Auth:** Bearer Token (MANAGER+)

**Response:** `200 OK`

---

### POST /api/chantiers/:id/assign-employes
Assigner/retirer employés

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "employes_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:** `200 OK`

---

### POST /api/chantiers/:id/complete
Terminer chantier

**Auth:** Bearer Token (MANAGER+)

**Response:** `200 OK`
```json
{
  "message": "Chantier terminé",
  "chantier_id": "uuid",
  "date_fin_reelle": "2026-02-12T18:30:00Z",
  "auto_learning_triggered": true,
  "ouvrages_ajustes": [
    {
      "ouvrage_id": "uuid",
      "code": "GO-DEM-001",
      "ancien_prix": 40.00,
      "nouveau_prix": 45.00
    }
  ]
}
```

**Side effects:**
- Statut → TERMINE
- date_fin_reelle updated
- Auto-learning déclenché si conditions remplies
- Catalogue mis à jour

---

### DELETE /api/chantiers/:id
Annuler chantier

**Auth:** Bearer Token (MANAGER+)

**Response:** `204 No Content`

**Side effects:**
- Statut → ANNULE
- Ne déclenche PAS auto-learning

---

## 7. BADGEAGES

### GET /api/badgeages
Lister badgeages

**Auth:** Bearer Token

**Query params:**
- `chantier_id`
- `employe_id`
- `date_debut`, `date_fin`
- `type` - PRESENCE_DEBUT | PRESENCE_FIN | TACHE_DEBUT | TACHE_FIN
- `page`, `limit`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "chantier": {
        "id": "uuid",
        "nom": "Rénovation ACME"
      },
      "employe": {
        "id": "uuid",
        "prenom": "Jean",
        "nom": "Martin"
      },
      "tache": {
        "id": "uuid",
        "nom": "Démolition cloisons"
      },
      "type": "TACHE_DEBUT",
      "methode": "MANUEL",
      "timestamp": "2026-02-12T08:15:00Z",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "precision_metres": 15
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/badgeages
Créer badgeage

**Auth:** Bearer Token (EMPLOYEE+)

**Request:**
```json
{
  "chantier_id": "uuid",
  "tache_id": "uuid",  // Optionnel (si badgeage tâche)
  "type": "PRESENCE_DEBUT",
  "methode": "GPS_AUTO",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "precision_metres": 15
}
```

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Employé non assigné au chantier
- `400 Bad Request` - Badge doublon (< 15 min)
- `400 Bad Request` - Hors heures travaillées (7h-19h)

---

### GET /api/badgeages/pending
Lister badgeages en attente sync (offline)

**Auth:** Bearer Token (EMPLOYEE)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid-local",  // ID temporaire local
      "chantier_id": "uuid",
      "type": "PRESENCE_DEBUT",
      "timestamp": "2026-02-12T08:15:00Z",
      "synced": false
    }
  ]
}
```

---

### POST /api/badgeages/sync
Synchroniser badgeages offline

**Auth:** Bearer Token (EMPLOYEE)

**Request:**
```json
{
  "badgeages": [
    {
      "chantier_id": "uuid",
      "type": "PRESENCE_DEBUT",
      "methode": "GPS_AUTO",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "timestamp": "2026-02-12T08:15:00Z"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "synced": 5,
  "failed": 0,
  "errors": []
}
```

---

### GET /api/badgeages/stats
Stats badgeages employé

**Auth:** Bearer Token

**Query params:**
- `employe_id` - Requis si MANAGER, optionnel si EMPLOYEE (défaut = moi)
- `mois` - Format YYYY-MM (défaut = mois actuel)

**Response:** `200 OK`
```json
{
  "employe": {
    "id": "uuid",
    "prenom": "Jean",
    "nom": "Martin"
  },
  "mois": "2026-02",
  "quota_mensuel_heures": 151.67,
  "heures_badgees": 120.50,
  "heures_restantes": 31.17,
  "pourcentage": 79.4,

  "par_chantier": [
    {
      "chantier_id": "uuid",
      "chantier_nom": "Rénovation ACME",
      "heures": 68.5
    }
  ],

  "par_jour": [
    {
      "date": "2026-02-10",
      "heures": 8.25,
      "chantiers": ["Rénovation ACME"]
    }
  ]
}
```

---

## 8. TÂCHES

### GET /api/chantiers/:chantier_id/taches
Lister tâches d'un chantier

**Auth:** Bearer Token

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "nom": "Démolition cloisons",
      "description": "Inclut évacuation gravats",
      "ouvrage": {
        "id": "uuid",
        "code": "GO-DEM-001",
        "denomination": "Démolition cloisons"
      },
      "quantite_prevue": 12.0,
      "unite": "m²",
      "statut": "TERMINEE",
      "ordre": 1,
      "heures_badgees": 8.5
    }
  ]
}
```

---

### POST /api/chantiers/:chantier_id/taches
Créer tâche

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "nom": "Peinture",
  "ouvrage_id": "uuid",
  "quantite_prevue": 24.0,
  "unite": "m²",
  "ordre": 3
}
```

**Response:** `201 Created`

---

### PATCH /api/taches/:id
Mettre à jour tâche

**Auth:** Bearer Token (MANAGER+)

**Response:** `200 OK`

---

### DELETE /api/taches/:id
Supprimer tâche

**Auth:** Bearer Token (MANAGER+)

**Response:** `204 No Content`

**Errors:**
- `400 Bad Request` - Tâche a des badgeages

---

## 9. DOCUMENTS

### GET /api/chantiers/:chantier_id/documents
Lister documents d'un chantier

**Auth:** Bearer Token

**Query params:**
- `type` - PHOTO | PDF | AUTRE

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "nom": "IMG_20260212_143055.jpg",
      "type": "PHOTO",
      "url": "https://storage.../uuid.jpg",
      "taille_bytes": 2048576,
      "titre": "Avancement démolition",
      "uploaded_by": {
        "prenom": "Jean",
        "nom": "Martin"
      },
      "created_at": "2026-02-12T14:30:55Z"
    }
  ]
}
```

---

### POST /api/chantiers/:chantier_id/documents
Uploader document

**Auth:** Bearer Token

**Request:** `multipart/form-data`
```
file: <binary>
titre: "Avancement démolition"
description: "Vue d'ensemble après démolition"
```

**Response:** `201 Created`

**Limits:**
- Max file size: 10 MB
- Formats acceptés: JPG, PNG, PDF

---

### DELETE /api/documents/:id
Supprimer document

**Auth:** Bearer Token (MANAGER+)

**Response:** `204 No Content`

---

## 10. FACTURES

### GET /api/factures
Lister factures

**Auth:** Bearer Token

**Query params:**
- `statut_paiement` - EN_ATTENTE | ACOMPTE_RECU | PARTIELLEMENT_PAYE | SOLDE
- `statut_facture` - BROUILLON | EMISE | ENVOYEE | ANNULEE
- `client_id`
- `en_retard` - true/false (échéance dépassée + non soldé)
- `page`, `limit`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "numero_facture": "FAC-2026-0042",
      "client": {
        "id": "uuid",
        "nom": "Client ACME"
      },
      "chantier": {
        "id": "uuid",
        "nom": "Rénovation ACME"
      },
      "montant_ttc": 15450.00,
      "reste_a_payer": 0.00,
      "statut_paiement": "SOLDE",
      "statut_facture": "ENVOYEE",
      "date_emission": "2026-01-20T00:00:00Z",
      "date_echeance": "2026-02-20T23:59:59Z",
      "en_retard": false
    }
  ],
  "pagination": { ... },
  "stats": {
    "total_facture_ce_mois": 45680.00,
    "total_encaisse": 38920.00,
    "total_en_attente": 6760.00,
    "nb_en_retard": 2
  }
}
```

---

### GET /api/factures/:id
Détail facture

**Auth:** Bearer Token

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "numero_facture": "FAC-2026-0042",
  "chantier_id": "uuid",
  "devis_id": "uuid",

  "entreprise": {
    "nom": "ACME Construction",
    "siret": "12345678900001",
    "adresse": "123 Rue Example, 75001 Paris",
    "telephone": "0123456789",
    "email": "contact@acme.fr"
  },

  "client": {
    "nom": "Client SYLA",
    "adresse": "8 Avenue Victor Hugo, 75016 Paris",
    "siret": "98765432100001",
    "telephone": "0145678901",
    "email": "contact@syla.fr"
  },

  "montant_ht": 7433.33,
  "montant_tva": 1486.67,
  "montant_ttc": 8920.00,

  "acompte_demande": 2676.00,
  "acompte_recu": 2676.00,
  "reste_a_payer": 6244.00,

  "statut_paiement": "ACOMPTE_RECU",
  "statut_facture": "ENVOYEE",

  "date_emission": "2026-02-10T00:00:00Z",
  "date_echeance": "2026-03-12T23:59:59Z",
  "date_envoi": "2026-02-10T14:30:00Z",

  "pdf_url": "https://storage.../FAC-2026-0042.pdf",
  "notes": "Inclut fourniture matériaux",

  "lignes": [
    {
      "id": "uuid",
      "description": "Démolition cloisons",
      "quantite": 12.00,
      "unite": "m²",
      "prix_unitaire_ht": 45.00,
      "montant_ht": 540.00,
      "tva_pourcent": 20.00,
      "montant_ttc": 648.00,
      "ordre": 1
    }
  ],

  "paiements": [
    {
      "id": "uuid",
      "montant": 2676.00,
      "date_paiement": "2026-02-15T00:00:00Z",
      "moyen_paiement": "VIREMENT",
      "reference": "VIR-123456",
      "type": "ACOMPTE"
    }
  ]
}
```

---

### POST /api/factures
Créer facture

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "chantier_id": "uuid",
  "devis_id": "uuid",  // Optionnel
  "acompte_pourcent": 30,
  "jours_echeance": 30,
  "notes": "Notes facture",

  "lignes": [
    {
      "ouvrage_id": "uuid",
      "description": "Démolition cloisons",
      "quantite": 12.0,
      "unite": "m²",
      "prix_unitaire_ht": 45.00
    }
  ]
}
```

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Chantier pas TERMINE

---

### POST /api/factures/:id/send
Envoyer facture par email

**Auth:** Bearer Token (MANAGER+)

**Response:** `200 OK`

**Side effects:**
- Statut facture → ENVOYEE
- Email envoyé avec PDF

---

### POST /api/factures/:id/paiements
Enregistrer paiement

**Auth:** Bearer Token (MANAGER+)

**Request:**
```json
{
  "montant": 6244.00,
  "date_paiement": "2026-02-20",
  "moyen_paiement": "VIREMENT",
  "reference": "VIR-789012",
  "notes": "Solde facture"
}
```

**Response:** `201 Created`

**Side effects:**
- statut_paiement recalculé automatiquement
- Si soldé → date_paiement_complet updated

---

### GET /api/factures/:id/pdf
Télécharger PDF facture

**Auth:** Bearer Token

**Response:** `200 OK` (application/pdf)

---

## 11. DASHBOARD

### GET /api/dashboard
KPIs dashboard manager

**Auth:** Bearer Token (MANAGER+)

**Query params:**
- `periode` - MOIS | TRIMESTRE | ANNEE (défaut: MOIS)

**Response:** `200 OK`
```json
{
  "periode": "MOIS",
  "mois": "2026-02",

  "kpis": {
    "ca_facture_ht": 45680.00,
    "ca_encaisse": 38920.00,
    "marge_brute_pourcent": 32.5,
    "nb_chantiers_en_cours": 5,
    "nb_chantiers_termines": 2,
    "nb_devis_envoyes": 8,
    "taux_acceptation_devis": 62.5,
    "heures_totales": 1240
  },

  "alertes": [
    {
      "type": "FACTURE_EN_RETARD",
      "gravite": "HAUTE",
      "message": "Facture FAC-2026-0038 en retard de 18 jours",
      "lien": "/factures/uuid",
      "created_at": "2026-02-12T10:00:00Z"
    }
  ],

  "chantiers_en_cours": [
    {
      "id": "uuid",
      "nom": "Rénovation ACME",
      "client_nom": "Client ACME",
      "progression": 80,
      "heures_badgees": 68.5,
      "nb_employes": 3
    }
  ],

  "evolution_mensuelle": [
    {
      "mois": "2025-12",
      "facture": 38500.00,
      "encaisse": 35000.00
    },
    {
      "mois": "2026-01",
      "facture": 42300.00,
      "encaisse": 39500.00
    },
    {
      "mois": "2026-02",
      "facture": 45680.00,
      "encaisse": 38920.00
    }
  ]
}
```

---

## 12. NOTIFICATIONS

### GET /api/notifications
Lister notifications

**Auth:** Bearer Token

**Query params:**
- `lue` - true/false
- `type`
- `limit` - Default: 50

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "DEVIS_ACCEPTE",
      "titre": "Devis accepté",
      "message": "Le devis DEV-2026-0043 a été accepté par Client ACME",
      "lien_url": "/devis/uuid",
      "lue": false,
      "created_at": "2026-02-12T14:30:00Z"
    }
  ],
  "nb_non_lues": 3
}
```

---

### PATCH /api/notifications/:id/read
Marquer comme lue

**Auth:** Bearer Token

**Response:** `200 OK`

---

### POST /api/notifications/read-all
Marquer toutes comme lues

**Auth:** Bearer Token

**Response:** `204 No Content`

---

## RÉSUMÉ

**Total endpoints:** ~80
**Groupes:** 12 modules
**Auth:** JWT Bearer Token
**Format:** JSON
**Pagination:** Standard (page, limit, total)
**Errors:** Standard HTTP + JSON

**Prochaine étape:** contracts.md (Request/Response types)
