# Règles Métier & Workflows - Autobat

## Vue d'ensemble
Ce document définit toutes les règles métier, workflows, validations et contraintes de l'application Autobat. Ces règles garantissent la cohérence des données et l'intégrité du système.

---

## 1. RÈGLES GÉNÉRALES MULTI-TENANT

### RG-01: Isolation des données par tenant
- ✅ Toutes les tables principales contiennent un champ `tenant_id`
- ✅ Toutes les requêtes doivent filtrer par `tenant_id` de l'utilisateur connecté
- ✅ Un utilisateur ne peut JAMAIS accéder aux données d'un autre tenant
- ⚠️ **Exception:** SUPER_ADMIN peut voir tous les tenants (en lecture seule)
- 🔒 **Validation:** Middleware vérifie `tenant_id` sur chaque requête API

### RG-02: Hiérarchie des rôles
```
SUPER_ADMIN (Autobat)
    ↓ Accès à tous les tenants en lecture
COMPANY_ADMIN (Patron entreprise)
    ↓ Tous les droits sur son tenant
MANAGER (Chef de chantier)
    ↓ Créer devis, chantiers, factures, gérer employés
EMPLOYEE (Ouvrier)
    ↓ Badger, voir ses heures, ajouter photos
```

**Règles:**
- ✅ Un rôle hérite des permissions des rôles inférieurs
- ✅ COMPANY_ADMIN peut promouvoir EMPLOYEE → MANAGER (mais pas MANAGER → COMPANY_ADMIN)
- ❌ EMPLOYEE ne peut pas accéder aux finances (devis, factures)
- ✅ MANAGER peut créer d'autres MANAGERS (avec approbation COMPANY_ADMIN)

### RG-03: Quota utilisateurs et facturation
- ✅ Abonnement = 130€ pour le 1er compte (COMPANY_ADMIN) + 30€ par utilisateur supplémentaire
- ✅ Nombre illimité d'utilisateurs (pas de limite technique)
- ✅ Facturation mensuelle automatique basée sur nombre d'utilisateurs actifs
- ⚠️ Si paiement échoue pendant 15 jours → Tenant suspendu (accès bloqué, données conservées)
- ✅ Réactivation immédiate après paiement

---

## 2. RÈGLES MODULE DEVIS

### RG-D01: Numérotation des devis
- ✅ Format: `DEV-{ANNEE}-{NUMERO}` (ex: DEV-2026-0001)
- ✅ Numéro auto-incrémenté par année et par tenant
- ✅ Commence à 0001 chaque 1er janvier
- ✅ Numérotation continue même si devis supprimés (pas de trous)
- 🔒 **Validation:** Le numéro est généré côté serveur (pas modifiable par le client)

### RG-D02: États d'un devis
```
BROUILLON → ENVOYE → ACCEPTE
                   → REFUSE
                   → EXPIRE
```

**Transitions autorisées:**
- BROUILLON → ENVOYE (envoi email)
- ENVOYE → ACCEPTE (validation client)
- ENVOYE → REFUSE (refus client)
- ENVOYE → EXPIRE (30 jours sans réponse)

**Règles:**
- ✅ Seul un devis BROUILLON peut être modifié
- ✅ Un devis ENVOYE ne peut plus être modifié (mais peut être dupliqué)
- ✅ Un devis ACCEPTE génère automatiquement un chantier (option à confirmer)
- ❌ Un devis REFUSE ou EXPIRE ne peut pas être réactivé (dupliquer pour renvoyer)

### RG-D03: Calcul des montants
```typescript
// Pour chaque ligne
montant_ligne_ht = quantite × prix_unitaire_ht

// Pour le devis
total_ht = Σ(montant_ligne_ht)
total_tva = total_ht × 0.20 // TVA fixe 20% BTP
total_ttc = total_ht + total_tva
```

**Règles:**
- ✅ Les montants sont arrondis à 2 décimales
- ✅ Le calcul est fait côté serveur (pas de confiance dans les calculs frontend)
- ✅ Si une ligne est modifiée, les totaux sont recalculés automatiquement
- ✅ TVA fixe à 20% (pas de paramétrage, c'est le taux BTP français standard)

### RG-D04: Validité d'un devis
- ✅ Date de validité = Date création + 30 jours (modifiable)
- ⚠️ Si dépassée et statut = ENVOYE → Passe automatiquement à EXPIRE
- ✅ Vérification quotidienne via CRON job à minuit
- ✅ Email automatique au client J-7 : "Votre devis expire dans 7 jours"

### RG-D05: Catalogue auto-apprenant
**Règles d'ajustement des prix:**
```
SI ouvrage.nb_chantiers_realises % 2 === 0 (multiples de 2)
ALORS:
  1. Calculer temps_reel_moyen = (ancien_temps_moyen + nouveau_temps_reel) / 2
  2. Calculer ecart_pourcent = (temps_reel_moyen - temps_estime) / temps_estime
  3. Appliquer ajustement: nouveau_prix = prix_actuel × (1 + ecart_pourcent)
  4. Mettre à jour derniere_maj_auto = NOW()
```

**Contraintes:**
- ✅ Ajustement uniquement tous les 2 chantiers (pas à chaque chantier)
- ✅ Ajustement max ±50% par itération (éviter les dérives)
- ✅ Si écart < 5%, pas d'ajustement (marge de tolérance)
- ✅ L'ancien prix est conservé dans `historique_prix` (traçabilité)
- ⚠️ Si ouvrage jamais réalisé (nb_chantiers_realises = 0), prix du catalogue initial

### RG-D06: Ouvrages personnalisés vs catalogue
- ✅ Manager peut ajouter ouvrage hors catalogue dans un devis
- ✅ Un ouvrage hors catalogue n'est PAS ajouté au catalogue global (sauf action manuelle)
- ✅ Un ouvrage hors catalogue ne bénéficie pas de l'auto-learning
- ✅ Les ouvrages hors catalogue sont marqués avec un badge "Personnalisé"

### RG-D07: Suppression de devis
- ✅ Seul un devis BROUILLON peut être supprimé
- ❌ Un devis ENVOYE/ACCEPTE/REFUSE ne peut pas être supprimé (intégrité comptable)
- ✅ Alternative: Archiver un devis (soft delete) pour le masquer

---

## 3. RÈGLES MODULE CHANTIER

### RG-C01: Création d'un chantier
**Prérequis:**
- ✅ Un chantier peut être créé depuis un devis ACCEPTE (recommandé)
- ✅ Un chantier peut être créé manuellement (sans devis)
- ✅ Champs obligatoires: nom, adresse, client_id, latitude, longitude, rayon_gps_metres
- ✅ Au moins 1 employé doit être assigné au chantier

**Valeurs par défaut:**
- Rayon GPS: 100 mètres (modifiable)
- Statut: EN_COURS
- Badgeage par tâche: Désactivé (activable par manager)

### RG-C02: États d'un chantier
```
EN_COURS → TERMINE → FACTURE (optionnel)
        → ANNULE
```

**Transitions:**
- EN_COURS → TERMINE (manager clique "Terminer chantier")
- TERMINE → FACTURE (automatique si facture créée)
- EN_COURS → ANNULE (manager annule, aucune facture possible)

**Règles:**
- ✅ Seul un chantier EN_COURS permet le badgeage
- ✅ Un chantier TERMINE déclenche l'auto-learning du catalogue
- ✅ Seul un chantier TERMINE permet la création de facture
- ❌ Un chantier ANNULE ne déclenche PAS l'auto-learning (données non fiables)

### RG-C03: Badgeage GPS automatique

**Conditions de badgeage:**
```typescript
if (
  position.latitude/longitude dans rayon du chantier &&
  heure actuelle entre 07:00 et 19:00 &&
  jour actuel = lundi à samedi &&
  employé assigné au chantier &&
  chantier.statut === 'EN_COURS'
) {
  → Créer badge PRESENCE_DEBUT ou PRESENCE_FIN
}
```

**Règles:**
- ✅ Vérification GPS toutes les 60 secondes (économie batterie)
- ✅ Si employé entre dans la zone → Badge PRESENCE_DEBUT
- ✅ Si employé sort de la zone (et était présent) → Badge PRESENCE_FIN
- ✅ Précision minimale requise: 50 mètres (si precision_metres > 50, alerte "GPS imprécis")
- ⚠️ Si pas de réseau: badge stocké localement, sync automatique au retour du réseau
- ❌ Pas de badgeage automatique le dimanche (jour de repos)
- ❌ Pas de badgeage avant 7h ou après 19h (heures non travaillées)

**Gestion des doublons:**
- ✅ Si badge PRESENCE_DEBUT déjà créé il y a < 15 min → Ignorer (éviter doublons)
- ✅ Si badge PRESENCE_FIN déjà créé il y a < 15 min → Ignorer

### RG-C04: Badgeage manuel par tâche

**Conditions:**
- ✅ Badgeage par tâche = activé sur le chantier
- ✅ Employé assigné au chantier
- ✅ Tâche existe et n'est pas terminée

**Règles:**
- ✅ Employé clique "Démarrer" sur une tâche → Badge TACHE_DEBUT
- ✅ Employé clique "Terminer" → Badge TACHE_FIN
- ✅ Durée calculée: tache_fin.timestamp - tache_debut.timestamp
- ⚠️ Si oubli de terminer après 12h → Alerte manager "Badge non terminé"
- ✅ Manager peut clôturer manuellement un badge oublié

**Validation:**
- ❌ Impossible de démarrer 2 tâches simultanément (même employé)
- ✅ Si tâche A en cours, bouton "Démarrer" désactivé sur tâche B
- ✅ Message: "Terminez [Tâche A] avant de démarrer une nouvelle tâche"

### RG-C05: Mode offline

**Règles:**
- ✅ Service Worker met en cache:
  - Liste des chantiers (de l'employé)
  - Liste des tâches (de chaque chantier)
  - Images et assets de l'app
- ✅ IndexedDB stocke les badgeages en attente de sync
- ✅ Quand le réseau revient:
  - Sync automatique de tous les badges en attente (FIFO)
  - Notification: "5 badgeages synchronisés"
  - Badge vert "En ligne" remplace badge rouge "Hors ligne"

**Gestion des conflits:**
- ⚠️ Si badge déjà existant avec même timestamp (±1 min) → Ignorer (doublon)
- ⚠️ Si chantier entre-temps marqué TERMINE → Badge refusé, notification employé

### RG-C06: Calcul des heures travaillées

**Par chantier:**
```sql
SELECT
  SUM(
    TIMESTAMPDIFF(MINUTE, debut, fin)
  ) / 60 as heures_totales
FROM badgeages
WHERE chantier_id = X
  AND type IN ('PRESENCE_DEBUT'/'PRESENCE_FIN' ou 'TACHE_DEBUT'/'TACHE_FIN')
  AND fin IS NOT NULL
```

**Règles d'arrondi:**
- ✅ Arrondi au quart d'heure supérieur par défaut (configurable)
  - Ex: 2h12 → 2h15
  - Ex: 3h47 → 3h45 (arrondi inférieur si < 8 min)
- ✅ Configuration par entreprise (quart d'heure, dixième, aucun)

### RG-C07: Fin de chantier et déclenchement auto-learning

**Workflow:**
```
Manager clique "Terminer chantier"
  ↓
Système calcule temps_reel pour chaque ouvrage/tâche
  ↓
Pour chaque ouvrage:
  - Incrémenter nb_chantiers_realises
  - Calculer temps_reel_moyen (moyenne mobile)
  - SI nb_chantiers_realises % 2 === 0 → Ajuster prix
  ↓
Afficher récapitulatif ajustements au manager
  ↓
Statut chantier → TERMINE
  ↓
Bouton "Créer facture" activé
```

**Règles:**
- ✅ Tous les badgeages doivent être terminés (pas de tâches en cours)
- ⚠️ Si badges non terminés → Alerte: "3 badgeages en cours, terminez-les d'abord"
- ✅ Manager peut forcer la clôture (ignore les badges non terminés)

---

## 4. RÈGLES MODULE FACTURATION

### RG-F01: Numérotation des factures
- ✅ Format: `FAC-{ANNEE}-{NUMERO}` (ex: FAC-2026-0042)
- ✅ Numéro auto-incrémenté par année et par tenant
- ✅ Séquence légale obligatoire (pas de trous, pas de renumérotation)
- 🔒 **Conservation:** Les factures sont conservées 10 ans (obligation légale française)

### RG-F02: Création d'une facture

**Prérequis:**
- ✅ Chantier avec statut TERMINE
- ✅ Utilisateur = MANAGER ou COMPANY_ADMIN
- ✅ Client avec email valide (pour envoi)

**Pré-remplissage automatique:**
1. Lignes depuis devis (si existe) OU depuis tâches réalisées
2. Informations entreprise (snapshot au moment de création)
3. Informations client (snapshot)
4. Acompte = 30% du TTC par défaut (modifiable)
5. Date d'échéance = Date émission + 30 jours (modifiable)

**Règle snapshot:**
- ✅ Les infos entreprise/client sont COPIÉES dans la facture (pas de référence)
- ✅ Si entreprise change son SIRET après → Les anciennes factures conservent l'ancien SIRET
- ✅ Garantit l'intégrité comptable et légale

### RG-F03: États d'une facture
```
BROUILLON → EMISE → ENVOYEE → [Statuts paiement]
                  → ANNULEE
```

**Statuts de paiement (parallèle):**
```
EN_ATTENTE → ACOMPTE_RECU → PARTIELLEMENT_PAYE → SOLDE
```

**Règles de transition:**
- ✅ BROUILLON → EMISE (validation manager)
- ✅ EMISE → ENVOYEE (envoi email)
- ✅ Tout statut → ANNULEE (crée facture d'avoir)
- ❌ SOLDE → Aucune modification/annulation possible (facture figée)

### RG-F04: Calcul automatique des statuts de paiement

```typescript
function calculerStatutPaiement(facture: Facture): string {
  const totalPaiements = getTotalPaiements(facture.id)
  const reste = facture.montant_ttc - totalPaiements

  if (reste <= 0) {
    return 'SOLDE' // Entièrement payé
  } else if (totalPaiements >= facture.acompte_demande) {
    return 'PARTIELLEMENT_PAYE' // Acompte reçu + autres paiements
  } else if (totalPaiements > 0) {
    return 'ACOMPTE_RECU' // Paiements partiels mais < acompte demandé
  } else {
    return 'EN_ATTENTE' // Aucun paiement
  }
}
```

**Règles:**
- ✅ Le statut se met à jour automatiquement à chaque paiement enregistré
- ✅ Si reste à payer <= 0 → date_paiement_complet = date du dernier paiement
- ✅ Les arrondis sont gérés (si reste = 0.01€ → considéré comme soldé)

### RG-F05: Gestion des paiements

**Règles d'ajout:**
- ✅ Un paiement ne peut être ajouté que par MANAGER ou COMPANY_ADMIN
- ✅ Montant > 0 obligatoire
- ✅ Date paiement <= date du jour (pas de paiements futurs)
- ✅ Type paiement déterminé automatiquement:
  - ACOMPTE si acompte_recu < acompte_demande
  - SOLDE si montant >= reste_a_payer
  - PARTIEL sinon
- ⚠️ Si montant > reste_a_payer → Alerte: "Attention, paiement supérieur au reste à payer"

**Modification/Suppression:**
- ❌ Un paiement validé ne peut PAS être modifié (intégrité comptable)
- ✅ Alternative: Créer un paiement négatif (avoir) pour annuler
- ✅ Manager peut marquer un paiement comme "Non validé" (avant validation finale)

### RG-F06: Relances automatiques

**Règles de déclenchement:**
```
J-7 avant échéance:
  SI statut_paiement != 'SOLDE'
  ALORS envoyer email "Rappel: facture arrive à échéance dans 7 jours"

J+0 (jour de l'échéance):
  SI statut_paiement != 'SOLDE'
  ALORS envoyer email "Relance: facture échue aujourd'hui"

J+15:
  SI statut_paiement != 'SOLDE'
  ALORS envoyer email "Mise en demeure: facture en retard de 15 jours"
```

**Règles:**
- ✅ Emails envoyés automatiquement via CRON job quotidien (00:00)
- ✅ Manager reçoit une copie de chaque relance
- ✅ Client reçoit l'email avec PDF facture en pièce jointe
- ✅ Historique des relances enregistré dans `notifications`
- ⚠️ Manager peut désactiver les relances auto pour une facture spécifique (litiges)

### RG-F07: Facture d'avoir (annulation)

**Processus:**
```
Manager clique "Annuler facture FAC-2026-0042"
  ↓
Système crée FAC-2026-0043 (nouvelle facture)
  ↓
Montants négatifs (annule la facture originale)
  ↓
Lien bidirectionnel:
  - FAC-0042.facture_avoir_id = FAC-0043.id
  - FAC-0043.facture_origine_id = FAC-0042.id
  ↓
Statut FAC-0042 → ANNULEE
```

**Règles:**
- ✅ Une facture d'avoir a les mêmes lignes mais montants négatifs
- ✅ La facture d'avoir apparaît dans la compta (transparence)
- ❌ Une facture SOLDE ne peut pas être annulée (paiements déjà reçus)
- ✅ Alternative si SOLDE: Créer facture d'avoir + créer facture de remboursement

### RG-F08: Mentions légales obligatoires (France)

**Sur chaque facture PDF:**
- ✅ Numéro unique et séquentiel
- ✅ Date d'émission et d'échéance
- ✅ Identité entreprise: nom, SIRET, adresse, tel, email
- ✅ Identité client: nom, adresse, SIRET (si pro)
- ✅ Description détaillée des prestations (avec quantités et unités)
- ✅ Montant HT, taux TVA (20%), montant TVA, montant TTC
- ✅ Conditions de paiement (ex: "30 jours fin de mois")
- ✅ Pénalités de retard: "Taux légal en vigueur + 40€ d'indemnité forfaitaire"
- ✅ Escompte: "Pas d'escompte pour paiement anticipé" (obligatoire même si aucun)

**Sanctions si non-respect:**
- ⚠️ Amende jusqu'à 75 000€ (entreprise)
- ⚠️ Facture peut être contestée par le client

---

## 5. RÈGLES MODULE EMPLOYÉS

### RG-E01: Création d'un employé

**Règles:**
- ✅ Email unique par tenant (2 tenants peuvent avoir même email)
- ✅ Rôle par défaut: EMPLOYEE
- ✅ Email d'invitation envoyé automatiquement
- ✅ Lien d'invitation valide 7 jours
- ✅ Employé doit créer son mot de passe (min 8 caractères, 1 majuscule, 1 chiffre)

**Quota horaire:**
- ✅ Quota mensuel optionnel (ex: 151h67 pour temps plein)
- ✅ Si quota dépassé → Alerte manager "Employé X a dépassé son quota de 10h"
- ⚠️ Le dépassement est informatif (pas de blocage)

### RG-E02: Assignation à un chantier

**Règles:**
- ✅ Un employé peut être assigné à plusieurs chantiers simultanément
- ✅ Un employé ne voit que ses chantiers assignés
- ✅ Un employé non assigné ne peut PAS badger sur le chantier (erreur: "Non autorisé")
- ✅ Retirer un employé du chantier:
  - ❌ Impossible si badges en cours
  - ✅ Possible si aucun badge en cours (badges passés conservés)

### RG-E03: Désactivation d'un employé

**Règles:**
- ✅ Statut employé → INACTIF
- ❌ Employé ne peut plus se connecter
- ❌ Employé n'apparaît plus dans les listes d'assignation
- ✅ Historique des badgeages conservé (intégrité comptable)
- ✅ Chantiers où il était assigné conservent ses données
- ⚠️ Réactivation possible à tout moment (statut → ACTIF)

### RG-E04: Export des heures pour la paie

**Format export CSV:**
```
Employé, Date, Chantier, Heures, Type badgeage
Dupont Jean, 2026-02-10, Rénovation ACME, 8.00, GPS Auto
Dupont Jean, 2026-02-11, Rénovation ACME, 7.50, GPS Auto
Martin Paul, 2026-02-10, Chantier SYLA, 8.25, Manuel
```

**Règles:**
- ✅ Période = date début → date fin (généralement 1 mois)
- ✅ Filtre par employé(s) optionnel
- ✅ Heures arrondies selon config entreprise (quart d'heure par défaut)
- ✅ Total par employé calculé automatiquement
- ✅ Compatible Excel et LibreOffice

---

## 6. RÈGLES MODULE CLIENTS

### RG-CL01: Création d'un client

**Champs obligatoires:**
- ✅ Nom (particulier ou entreprise)
- ✅ Email (pour envoi devis/factures)
- ✅ Téléphone

**Champs optionnels:**
- SIRET (uniquement si client pro)
- Adresse
- Notes

**Validation:**
- ✅ Email valide (regex)
- ✅ SIRET = 14 chiffres (si renseigné)
- ✅ Email unique par tenant (éviter doublons)

### RG-CL02: Suppression d'un client

**Règles:**
- ❌ Impossible de supprimer un client qui a:
  - Des devis (quel que soit le statut)
  - Des chantiers
  - Des factures
- ✅ Alternative: Marquer client comme INACTIF (soft delete)
- ✅ Clients inactifs n'apparaissent plus dans les listes de sélection

---

## 7. WORKFLOWS COMPLETS

### Workflow 1: Du devis à la facture (parcours complet)

```
1. Manager crée un client
   ↓
2. Manager crée un devis avec ouvrages du catalogue
   ↓ (statut: BROUILLON)
3. Manager envoie le devis par email au client
   ↓ (statut: ENVOYE)
4. Client clique "Accepter" dans l'email
   ↓ (statut: ACCEPTE)
5. Manager crée un chantier depuis le devis
   ↓ (statut chantier: EN_COURS)
6. Manager assigne des employés au chantier
   ↓
7. Employés badgent automatiquement (GPS) + manuellement (tâches)
   ↓ (plusieurs jours/semaines)
8. Manager marque le chantier comme TERMINE
   ↓ (statut chantier: TERMINE)
9. Système calcule temps réels et ajuste catalogue (si 2ème chantier)
   ↓
10. Manager crée une facture depuis le chantier
   ↓ (statut facture: BROUILLON)
11. Manager valide et envoie la facture par email
   ↓ (statut facture: ENVOYEE, statut paiement: EN_ATTENTE)
12. Client paie l'acompte (30%)
   ↓ (statut paiement: ACOMPTE_RECU)
13. Client paie le solde
   ↓ (statut paiement: SOLDE)
14. FIN ✅
```

### Workflow 2: Chantier sans devis (urgence)

```
1. Manager crée un chantier directement (sans devis)
   ↓
2. Manager crée des tâches manuellement
   ↓
3. Employés badgent comme workflow 1
   ↓
4. Manager termine le chantier
   ↓
5. Manager crée facture (lignes générées depuis tâches réalisées)
   ↓
6. Suite identique au workflow 1
```

### Workflow 3: Badgeage offline puis sync

```
1. Employé arrive sur chantier (pas de réseau)
   ↓
2. GPS détecte entrée dans zone → Badge PRESENCE_DEBUT stocké localement
   ↓ (IndexedDB: synced = false)
3. Employé badge tâches manuellement → Stockées localement
   ↓
4. Employé sort de la zone → Badge PRESENCE_FIN stocké localement
   ↓
5. Employé rentre chez lui (WiFi disponible)
   ↓
6. App détecte réseau → Sync automatique de tous les badges en attente
   ↓
7. Notification: "5 badgeages synchronisés"
   ↓
8. Badges visibles par le manager
```

### Workflow 4: Relance automatique facture impayée

```
J-7 avant échéance:
  → Email rappel client: "Votre facture arrive à échéance dans 7 jours"
  → Copie email au manager

J+0 (jour de l'échéance):
  SI statut != SOLDE
  → Email relance client: "Votre facture est échue"
  → Notification manager: "Facture FAC-2026-0042 échue"

J+15:
  SI statut != SOLDE
  → Email mise en demeure client
  → Notification manager: "Facture en retard de 15 jours"
  → Badge rouge "RETARD" sur la facture

J+30:
  SI statut != SOLDE
  → Notification manager: "Facture en retard de 30 jours - Actions recommandées"
  → (Manager décide de la suite: relance manuelle, avocat, etc.)
```

---

## 8. RÈGLES DE VALIDATION (Formulaires)

### Validation Devis

```typescript
interface ValidationDevis {
  client_id: string // Obligatoire
  lignes: LigneDevis[] // Min 1 ligne
  date_validite: Date // >= Date du jour

  // Chaque ligne:
  ligne.description: string // Min 3 caractères
  ligne.quantite: number // > 0
  ligne.prix_unitaire_ht: number // >= 0
}
```

### Validation Chantier

```typescript
interface ValidationChantier {
  nom: string // Min 3 caractères, max 100
  adresse: string // Obligatoire
  client_id: string // Obligatoire
  latitude: number // -90 à 90
  longitude: number // -180 à 180
  rayon_gps_metres: number // Min 10, max 1000
  employes_assignes: string[] // Min 1 employé
}
```

### Validation Facture

```typescript
interface ValidationFacture {
  chantier_id: string // Doit être TERMINE
  lignes: LigneFacture[] // Min 1 ligne
  acompte_pourcent: number // 0-100
  jours_echeance: number // > 0

  // Vérifications supplémentaires:
  client.email !== null // Client doit avoir email
  entreprise.siret !== null // Entreprise doit avoir SIRET
}
```

### Validation Paiement

```typescript
interface ValidationPaiement {
  facture_id: string
  montant: number // > 0
  date_paiement: Date // <= Date du jour
  moyen_paiement: string // Enum valide

  // Avertissements (non bloquants):
  if (montant > facture.reste_a_payer) {
    warning: "Paiement supérieur au reste à payer"
  }
}
```

---

## 9. RÈGLES DE SÉCURITÉ

### RG-S01: Authentification
- ✅ Mot de passe: min 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
- ✅ Hash: bcrypt avec salt (rounds = 10)
- ✅ Token JWT: expiration 24h (refresh token 7 jours)
- ✅ Limite tentatives login: 5 échecs → Blocage 15 minutes (par IP)

### RG-S02: Autorisation (middleware)
```typescript
function checkPermission(user: User, resource: string, action: string) {
  // 1. Vérifier tenant_id
  if (user.role !== 'SUPER_ADMIN' && resource.tenant_id !== user.tenant_id) {
    throw new Error('Accès interdit: tenant différent')
  }

  // 2. Vérifier rôle
  const permissions = {
    EMPLOYEE: ['read:own_badges', 'create:own_badges', 'read:own_hours'],
    MANAGER: ['*:devis', '*:chantiers', '*:factures', '*:employes'],
    COMPANY_ADMIN: ['*:*'], // Tous les droits sur son tenant
    SUPER_ADMIN: ['read:*:*'] // Lecture tous tenants
  }

  if (!permissions[user.role].includes(action)) {
    throw new Error('Accès interdit: permissions insuffisantes')
  }
}
```

### RG-S03: Validation des entrées (contre injections)
- ✅ Toutes les entrées utilisateur sont validées côté serveur (pas de confiance frontend)
- ✅ Utilisation de Prisma ORM (protection SQL injection)
- ✅ Sanitization des inputs HTML (contre XSS)
- ✅ Validation des uploads: types MIME autorisés, taille max 10 MB
- ✅ Rate limiting API: 100 req/min par IP

### RG-S04: RGPD et données personnelles
- ✅ Consentement explicite lors de l'inscription
- ✅ Droit d'accès: Export de toutes les données utilisateur
- ✅ Droit à l'oubli: Suppression compte + données (sauf factures = obligation légale 10 ans)
- ✅ Chiffrement des données sensibles (mots de passe, tokens)
- ✅ Logs d'accès conservés 6 mois

---

## 10. RÈGLES DE PERFORMANCE

### RG-P01: Cache et optimisation
- ✅ Liste des chantiers en cache 5 minutes (côté client)
- ✅ Catalogue des ouvrages en cache 1 heure
- ✅ Pagination: 20 items par page (devis, factures, chantiers)
- ✅ Images compressées automatiquement (max 1920px, qualité 80%)

### RG-P02: Mode offline (PWA)
- ✅ Service Worker met en cache:
  - Shell de l'app (HTML, CSS, JS)
  - Chantiers actifs de l'employé
  - Tâches des chantiers
- ✅ Cache invalidé toutes les 24h
- ✅ Synchronisation en arrière-plan (Background Sync API)

### RG-P03: Limits et quotas
- ✅ Upload fichiers: max 10 MB par fichier
- ✅ Nombre max de lignes devis/facture: 200 lignes
- ✅ Nombre max d'employés par chantier: illimité (mais warning si > 20)
- ✅ Historique badgeages: conservation 3 ans (archivage après)

---

## 11. RÈGLES MÉTIER SPÉCIFIQUES BTP

### RG-BTP01: Heures supplémentaires
⚠️ **V2 (pas dans MVP):**
- Heures normales: 0-8h/jour
- Heures supplémentaires 25%: 8h-10h/jour
- Heures supplémentaires 50%: au-delà de 10h/jour
- Heures dimanche/férié: +100%

### RG-BTP02: Intempéries
⚠️ **V2 (pas dans MVP):**
- Manager peut marquer un jour comme "Intempéries"
- Les heures sont comptabilisées mais marquées différemment
- Export paie indique "Heures intempéries" (caisse congés BTP)

### RG-BTP03: TVA réduite (5.5% ou 10%)
⚠️ **V2 (pas dans MVP):**
- Rénovation énergétique: TVA 5.5%
- Rénovation logement > 2 ans: TVA 10%
- Actuellement: TVA fixe 20% (simplifié pour MVP)

---

## 12. RÈGLES DE NOTIFICATION

### RG-N01: Notifications employés
- ✅ Badge GPS créé → Notification push "Présence badgée: [Chantier]"
- ✅ Assigné à un chantier → Notification "Vous êtes assigné à [Chantier]"
- ✅ Chantier terminé → Notification "Le chantier [X] est terminé"
- ⚠️ Quota dépassé → Notification "Vous avez dépassé votre quota de Xh"

### RG-N02: Notifications manager
- ✅ Devis accepté → "Le devis DEV-2026-0042 a été accepté"
- ✅ Facture payée → "Paiement reçu: 2 676 € pour FAC-2026-0042"
- ✅ Facture échue → "Facture en retard: FAC-2026-0041"
- ✅ Badge non terminé > 12h → "Badge non clôturé: [Employé] sur [Tâche]"
- ✅ Catalogue ajusté → "3 ouvrages ont été ajustés automatiquement"

### RG-N03: Emails clients
- ✅ Devis envoyé → Email avec PDF + lien acceptation
- ✅ Facture envoyée → Email avec PDF
- ✅ Rappel J-7 → Email rappel échéance
- ✅ Relance J+0 → Email relance
- ✅ Mise en demeure J+15 → Email formel

---

## 13. EXCEPTIONS ET CAS LIMITES

### Exception 1: Employé badge sur 2 chantiers simultanés
**Problème:** Employé assigné à chantier A et B, GPS détecte les 2 zones

**Règle:**
- ✅ Le système badge sur le chantier le plus proche (distance GPS)
- ⚠️ Notification: "Badgé sur [Chantier A] (le plus proche)"
- ✅ Employé peut manuellement switcher de chantier si erreur

### Exception 2: Chantier terminé mais badge non clôturé
**Problème:** Manager veut terminer chantier mais employé a oublié de terminer un badge

**Règle:**
- ⚠️ Alerte manager: "3 badgeages en cours, voulez-vous les clôturer ?"
- ✅ Manager peut:
  - Option 1: Clôturer automatiquement (fin = maintenant)
  - Option 2: Clôturer manuellement (définir heure de fin)
  - Option 3: Annuler ces badges (ne pas comptabiliser)

### Exception 3: Catalogue vide au démarrage
**Problème:** Nouveau tenant n'a pas de catalogue (base vide)

**Règle:**
- ✅ À la création du tenant, importer catalogue par défaut (bibliothèque SYLA nettoyée)
- ✅ Tous les ouvrages marqués comme "Non testés" (nb_chantiers_realises = 0)
- ✅ Les prix initiaux servent de base pour l'auto-learning

### Exception 4: Facture avec montant 0€
**Problème:** Chantier offert (geste commercial)

**Règle:**
- ✅ Montant 0€ est autorisé
- ✅ Statut paiement = SOLDE par défaut
- ✅ Aucune relance automatique
- ✅ Facture reste conforme légalement (mentions obligatoires)

---

## Résumé des règles critiques (TOP 20)

1. **Isolation tenant:** Toutes les requêtes filtrent par `tenant_id`
2. **Numérotation séquentielle:** Devis et factures = séquence annuelle sans trous
3. **Auto-learning tous les 2 chantiers:** Ajustement prix basé sur temps réel
4. **Badge GPS:** Uniquement 7h-19h, lun-sam, dans rayon défini
5. **Offline first:** Badges stockés localement si pas de réseau
6. **Facture = chantier TERMINE:** Impossible de facturer un chantier en cours
7. **Mentions légales factures:** Toutes les mentions obligatoires françaises
8. **TVA fixe 20%:** Pas de paramétrage (BTP standard)
9. **Relances auto J-7, J+0, J+15:** Si facture non soldée
10. **Statut paiement auto:** Calculé à chaque paiement enregistré
11. **Conservation 10 ans:** Factures conservées pour conformité légale
12. **Rôles hiérarchiques:** EMPLOYEE < MANAGER < COMPANY_ADMIN < SUPER_ADMIN
13. **Validation côté serveur:** Jamais de confiance dans le frontend
14. **Snapshots factures:** Infos entreprise/client copiées (pas de référence)
15. **Badges en doublon:** Ignorés si < 15 min d'écart
16. **Quota employés informatif:** Pas de blocage, juste alertes
17. **Devis expire après 30j:** Passage auto à EXPIRE si non répondu
18. **Ajustement prix max ±50%:** Éviter les dérives de l'auto-learning
19. **Email unique par tenant:** Pas de doublons dans un même tenant
20. **Pas de suppression factures/devis envoyés:** Intégrité comptable

---

**Statut:** Complet et prêt pour développement
**Utilisation:** Ce document doit être consulté par les développeurs à chaque implémentation de fonctionnalité
**Mise à jour:** À chaque évolution des règles métier (versionné avec Git)
