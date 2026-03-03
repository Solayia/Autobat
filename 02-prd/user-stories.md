# User Stories - Autobat

## Vue d'ensemble
Ce document détaille toutes les user stories pour les différents modules d'Autobat. Chaque story suit le format standard : **En tant que [rôle], je veux [action] afin de [bénéfice]**.

---

## 1. MODULE DEVIS & CATALOGUE

### US-D01: Créer un nouveau devis
**En tant que** Manager
**Je veux** créer un nouveau devis pour un client
**Afin de** proposer une estimation de prix pour un projet de construction

**Critères d'acceptation:**
- [ ] Je peux sélectionner un client existant ou en créer un nouveau
- [ ] Je peux ajouter des ouvrages depuis le catalogue Autobat
- [ ] Je peux ajouter des ouvrages personnalisés hors catalogue
- [ ] Les montants HT/TVA/TTC se calculent automatiquement
- [ ] Je peux sauvegarder en brouillon
- [ ] Je peux prévisualiser le PDF avant envoi
- [ ] Le devis reçoit un numéro unique (DEV-2026-0001)

**Priorité:** 🔴 Critique (MVP)

---

### US-D02: Rechercher des ouvrages dans le catalogue
**En tant que** Manager
**Je veux** rechercher des ouvrages dans le catalogue par mot-clé ou catégorie
**Afin de** trouver rapidement les prestations à inclure dans mon devis

**Critères d'acceptation:**
- [ ] Je peux filtrer par catégorie (Gros Oeuvre, Charpente, etc.)
- [ ] Je peux rechercher par mot-clé dans la description
- [ ] Je peux rechercher par code ouvrage
- [ ] Les résultats affichent: code, description, unité, prix
- [ ] Je peux voir si l'ouvrage a été ajusté automatiquement (badge "Auto-appris")
- [ ] Je peux ajouter un ouvrage au devis en un clic

**Priorité:** 🔴 Critique (MVP)

---

### US-D03: Voir l'historique d'apprentissage d'un ouvrage
**En tant que** Manager
**Je veux** voir comment un ouvrage du catalogue a évolué avec l'auto-learning
**Afin de** comprendre si le prix est basé sur mes chantiers réels ou sur le catalogue initial

**Critères d'acceptation:**
- [ ] Je peux voir le prix initial de l'ouvrage
- [ ] Je peux voir le prix actuel
- [ ] Je peux voir le nombre de chantiers réalisés avec cet ouvrage
- [ ] Je peux voir la dernière date d'ajustement automatique
- [ ] Je peux voir l'écart temps estimé vs temps réel moyen
- [ ] Un badge indique si l'ouvrage est "Non testé", "En apprentissage" ou "Optimisé"

**Priorité:** 🟡 Important (MVP+)

---

### US-D04: Envoyer un devis par email
**En tant que** Manager
**Je veux** envoyer le devis au client par email avec PDF en pièce jointe
**Afin de** transmettre rapidement ma proposition commerciale

**Critères d'acceptation:**
- [ ] Le PDF est généré automatiquement
- [ ] L'email contient un message personnalisable
- [ ] Le PDF est en pièce jointe
- [ ] Le statut du devis passe à "ENVOYE"
- [ ] La date d'envoi est enregistrée
- [ ] Je reçois une confirmation d'envoi

**Priorité:** 🔴 Critique (MVP)

---

### US-D05: Dupliquer un devis existant
**En tant que** Manager
**Je veux** dupliquer un devis existant
**Afin de** créer rapidement un nouveau devis similaire pour un autre client

**Critères d'acceptation:**
- [ ] Je peux dupliquer un devis depuis la liste ou la vue détail
- [ ] Le nouveau devis a un nouveau numéro
- [ ] Toutes les lignes sont copiées
- [ ] Le statut est "BROUILLON"
- [ ] Je peux changer le client
- [ ] Les prix sont actualisés depuis le catalogue (si auto-learning a modifié)

**Priorité:** 🟡 Important (MVP+)

---

### US-D06: Accepter/Refuser un devis (Client)
**En tant que** Client
**Je veux** accepter ou refuser un devis
**Afin de** confirmer ou décliner une proposition

**Critères d'acceptation:**
- [ ] Je reçois le devis par email avec lien d'acceptation
- [ ] Je peux cliquer sur "Accepter" ou "Refuser"
- [ ] Si j'accepte, le statut passe à "ACCEPTE"
- [ ] Si je refuse, le statut passe à "REFUSE"
- [ ] Le manager reçoit une notification
- [ ] Si accepté, je peux créer le chantier directement depuis le devis

**Priorité:** 🟡 Important (MVP+)

---

## 2. MODULE CHANTIER & BADGEAGE

### US-C01: Créer un chantier depuis un devis accepté
**En tant que** Manager
**Je veux** créer un chantier depuis un devis accepté
**Afin de** démarrer l'exécution du projet

**Critères d'acceptation:**
- [ ] Je peux créer un chantier depuis un devis avec statut "ACCEPTE"
- [ ] Les informations client sont pré-remplies
- [ ] L'adresse du chantier est pré-remplie (modifiable)
- [ ] Je peux définir la zone GPS (rayon en mètres)
- [ ] Je peux assigner des employés au chantier
- [ ] Je peux activer/désactiver le badgeage par tâche
- [ ] Le chantier est créé avec statut "EN_COURS"

**Priorité:** 🔴 Critique (MVP)

---

### US-C02: Badger automatiquement via GPS (Employé)
**En tant qu'** Employé
**Je veux** que ma présence soit badgée automatiquement quand j'arrive sur le chantier
**Afin de** ne pas avoir à penser à badger manuellement

**Critères d'acceptation:**
- [ ] L'app vérifie ma position GPS toutes les 60 secondes
- [ ] Si je suis dans la zone GPS du chantier, un badge "PRESENCE_DEBUT" est créé automatiquement
- [ ] Je reçois une notification "Présence badgée : [Nom chantier]"
- [ ] Si je sors de la zone, un badge "PRESENCE_FIN" est créé
- [ ] Les badges fonctionnent uniquement entre 7h-19h (heures travaillées)
- [ ] Je peux voir mes badges du jour dans l'app

**Priorité:** 🔴 Critique (MVP)

---

### US-C03: Badger manuellement sur une tâche (Employé)
**En tant qu'** Employé
**Je veux** badger le début et la fin d'une tâche spécifique
**Afin de** permettre au système d'apprendre le temps réel de chaque prestation

**Critères d'acceptation:**
- [ ] Je vois la liste des tâches du chantier en cours
- [ ] Je peux cliquer "Démarrer" sur une tâche
- [ ] Le chrono démarre visuellement
- [ ] Je peux cliquer "Terminer" quand j'ai fini
- [ ] Le badge enregistre tâche_id, début, fin, durée
- [ ] Si pas de réseau, le badge est enregistré localement
- [ ] Synchronisation automatique quand le réseau revient

**Priorité:** 🔴 Critique (MVP)

---

### US-C04: Voir mes badgeages du jour (Employé)
**En tant qu'** Employé
**Je veux** voir tous mes badgeages de la journée
**Afin de** vérifier que tout a été correctement enregistré

**Critères d'acceptation:**
- [ ] Je vois une timeline de mes badgeages du jour
- [ ] Chaque badge affiche: heure, type, chantier, tâche (si applicable)
- [ ] Les badges GPS auto sont indiqués avec un badge "GPS"
- [ ] Les badges manuels sont indiqués avec un badge "Manuel"
- [ ] Les badges en attente de sync sont marqués "⏳ Sync en attente"
- [ ] Je peux filtrer par chantier

**Priorité:** 🟡 Important (MVP)

---

### US-C05: Gérer les tâches d'un chantier (Manager)
**En tant que** Manager
**Je veux** créer et gérer les tâches d'un chantier
**Afin de** organiser le travail et permettre le badgeage par tâche

**Critères d'acceptation:**
- [ ] Je peux créer une tâche avec: nom, description, ouvrage_id (référence catalogue)
- [ ] Je peux définir une quantité prévue (ex: 15 m²)
- [ ] Je peux assigner des employés à une tâche
- [ ] Je peux marquer une tâche comme terminée
- [ ] Je vois le total des heures badgées sur la tâche
- [ ] Je vois l'écart estimé vs réel

**Priorité:** 🔴 Critique (MVP)

---

### US-C06: Ajouter des documents/photos à un chantier (Manager/Employé)
**En tant que** Manager ou Employé
**Je veux** ajouter des photos ou documents à un chantier
**Afin de** garder une trace visuelle de l'avancement et des problèmes rencontrés

**Critères d'acceptation:**
- [ ] Je peux uploader des photos depuis mon mobile
- [ ] Je peux uploader des PDFs (plans, factures, etc.)
- [ ] Chaque document peut avoir un titre et une description
- [ ] Les documents sont listés chronologiquement
- [ ] Je peux filtrer par type (photos, PDFs)
- [ ] Les documents sont associés au chantier et visibles par toute l'équipe

**Priorité:** 🟡 Important (MVP+)

---

### US-C07: Terminer un chantier et déclencher l'auto-learning (Manager)
**En tant que** Manager
**Je veux** marquer un chantier comme terminé
**Afin de** déclencher l'apprentissage automatique du catalogue et permettre la facturation

**Critères d'acceptation:**
- [ ] Je peux marquer un chantier comme "TERMINE"
- [ ] Le système calcule automatiquement les temps réels vs estimés pour chaque ouvrage
- [ ] Si c'est le 2ème chantier (ou multiple de 2) avec un ouvrage, le prix est ajusté automatiquement
- [ ] Je vois un récapitulatif avant/après de l'ajustement
- [ ] Je peux créer une facture directement depuis le chantier terminé
- [ ] Les employés ne peuvent plus badger sur ce chantier

**Priorité:** 🔴 Critique (MVP)

---

### US-C08: Travailler hors ligne (Employé)
**En tant qu'** Employé
**Je veux** pouvoir badger même sans réseau
**Afin de** ne pas perdre mes heures de travail sur des chantiers isolés

**Critères d'acceptation:**
- [ ] L'app fonctionne en mode hors ligne (PWA)
- [ ] Je peux voir la liste des chantiers (données mises en cache)
- [ ] Je peux badger présence et tâches
- [ ] Les badgeages sont stockés localement (IndexedDB)
- [ ] Un indicateur "Hors ligne" est visible
- [ ] Quand le réseau revient, les badges se synchronisent automatiquement
- [ ] Je reçois une notification "X badgeages synchronisés"

**Priorité:** 🔴 Critique (MVP)

---

## 3. MODULE FACTURATION

### US-F01: Créer une facture depuis un chantier terminé
**En tant que** Manager
**Je veux** créer une facture depuis un chantier terminé
**Afin de** facturer le client pour le travail réalisé

**Critères d'acceptation:**
- [ ] Je peux créer une facture uniquement depuis un chantier "TERMINE"
- [ ] Les lignes sont pré-remplies depuis le devis (si existe)
- [ ] Les informations client/entreprise sont pré-remplies
- [ ] Le numéro de facture est généré automatiquement (FAC-2026-0001)
- [ ] L'acompte est pré-calculé à 30% (modifiable)
- [ ] La date d'échéance est calculée (date + 30 jours)
- [ ] Je peux modifier les lignes avant validation

**Priorité:** 🔴 Critique (MVP)

---

### US-F02: Générer et télécharger une facture PDF
**En tant que** Manager
**Je veux** générer un PDF de facture conforme aux obligations légales
**Afin de** l'envoyer au client ou l'imprimer

**Critères d'acceptation:**
- [ ] Le PDF contient toutes les mentions obligatoires françaises
- [ ] Le PDF affiche correctement: HT, TVA 20%, TTC
- [ ] Le PDF affiche acompte demandé et reste à payer
- [ ] Le design est professionnel et lisible
- [ ] Je peux télécharger le PDF en un clic
- [ ] Le PDF est stocké et accessible depuis la facture

**Priorité:** 🔴 Critique (MVP)

---

### US-F03: Envoyer une facture par email au client
**En tant que** Manager
**Je veux** envoyer la facture par email avec PDF en pièce jointe
**Afin de** transmettre rapidement la facture au client

**Critères d'acceptation:**
- [ ] Le PDF est automatiquement joint à l'email
- [ ] Le message email est pré-rempli et personnalisable
- [ ] L'email affiche montant TTC, acompte demandé, date d'échéance
- [ ] Le statut facture passe à "ENVOYEE"
- [ ] La date d'envoi est enregistrée
- [ ] Je reçois une confirmation d'envoi

**Priorité:** 🔴 Critique (MVP)

---

### US-F04: Enregistrer un paiement
**En tant que** Manager
**Je veux** enregistrer un paiement client (acompte ou solde)
**Afin de** suivre l'état des encaissements

**Critères d'acceptation:**
- [ ] Je peux entrer: montant, date, moyen de paiement, référence
- [ ] Le système calcule automatiquement le nouveau reste à payer
- [ ] Le statut paiement se met à jour automatiquement:
  - EN_ATTENTE → ACOMPTE_RECU (si acompte >= demandé)
  - ACOMPTE_RECU → PARTIELLEMENT_PAYE (si paiements > acompte)
  - PARTIELLEMENT_PAYE → SOLDE (si paiements >= total)
- [ ] Le paiement apparaît dans l'historique
- [ ] Si c'est le dernier paiement, la date de paiement complet est enregistrée

**Priorité:** 🔴 Critique (MVP)

---

### US-F05: Voir le tableau de bord financier
**En tant que** Manager
**Je veux** voir un dashboard de mes finances
**Afin de** suivre mon chiffre d'affaires et mes encaissements

**Critères d'acceptation:**
- [ ] Je vois le total facturé ce mois (HT et TTC)
- [ ] Je vois le total encaissé ce mois
- [ ] Je vois le total en attente de paiement
- [ ] Je vois le nombre de factures en retard
- [ ] Je vois un graphique d'évolution mensuelle
- [ ] Je vois mon top 5 clients par montant
- [ ] Je peux filtrer par période (mois, trimestre, année)

**Priorité:** 🟡 Important (MVP+)

---

### US-F06: Recevoir des alertes de factures en retard
**En tant que** Manager
**Je veux** recevoir des alertes pour les factures non payées
**Afin de** relancer les clients et éviter les impayés

**Critères d'acceptation:**
- [ ] Je reçois une notification J-7 avant échéance
- [ ] Je reçois une notification J+0 (jour de l'échéance)
- [ ] Je reçois une notification J+15 (retard significatif)
- [ ] Les notifications sont visibles dans l'app et par email
- [ ] Je peux désactiver les notifications par facture
- [ ] Un badge "En retard" est visible sur la facture

**Priorité:** 🟡 Important (MVP+)

---

### US-F07: Exporter les factures pour la comptabilité
**En tant que** Manager ou Comptable
**Je veux** exporter toutes les factures d'une période en CSV/Excel
**Afin de** les importer dans mon logiciel comptable

**Critères d'acceptation:**
- [ ] Je peux sélectionner une période (du ... au ...)
- [ ] Je peux choisir le format (CSV ou Excel)
- [ ] L'export contient: Date, Numéro, Client, HT, TVA, TTC, Statut paiement
- [ ] L'export respecte le format compatible avec les logiciels comptables courants
- [ ] Le fichier se télécharge automatiquement

**Priorité:** 🟢 Nice to have (V2)

---

## 4. MODULE EMPLOYÉS

### US-E01: Ajouter un nouvel employé (Manager)
**En tant que** Manager
**Je veux** ajouter un nouvel employé à mon entreprise
**Afin de** lui créer un compte et lui permettre de badger

**Critères d'acceptation:**
- [ ] Je peux entrer: nom, prénom, email, téléphone
- [ ] Je peux définir son rôle (EMPLOYEE ou MANAGER)
- [ ] Un email d'invitation est envoyé automatiquement
- [ ] L'employé peut créer son mot de passe via le lien
- [ ] L'employé apparaît dans ma liste d'employés
- [ ] Je peux définir un quota horaire mensuel (ex: 151h67)

**Priorité:** 🔴 Critique (MVP)

---

### US-E02: Assigner des employés à un chantier (Manager)
**En tant que** Manager
**Je veux** assigner des employés à un chantier
**Afin de** définir qui peut badger sur ce chantier

**Critères d'acceptation:**
- [ ] Je peux sélectionner plusieurs employés depuis une liste
- [ ] Les employés assignés voient le chantier dans leur app mobile
- [ ] Les employés non assignés ne peuvent pas badger sur ce chantier
- [ ] Je peux retirer un employé du chantier
- [ ] Les employés reçoivent une notification quand ils sont assignés

**Priorité:** 🔴 Critique (MVP)

---

### US-E03: Voir mes heures travaillées (Employé)
**En tant qu'** Employé
**Je veux** voir mes heures travaillées du mois
**Afin de** suivre mon temps et vérifier mon quota

**Critères d'acceptation:**
- [ ] Je vois mes heures totales du mois en cours
- [ ] Je vois mon quota mensuel (si défini)
- [ ] Je vois le pourcentage réalisé (ex: 120h / 151h67 = 79%)
- [ ] Je peux voir le détail par chantier
- [ ] Je peux voir le détail par jour
- [ ] Un indicateur visuel m'alerte si je dépasse mon quota

**Priorité:** 🟡 Important (MVP)

---

### US-E04: Voir le tableau de bord de mes employés (Manager)
**En tant que** Manager
**Je veux** voir un dashboard des heures de mes employés
**Afin de** suivre leur activité et détecter les anomalies

**Critères d'acceptation:**
- [ ] Je vois la liste de tous mes employés
- [ ] Pour chaque employé: heures ce mois, quota, pourcentage
- [ ] Je peux voir le détail des badgeages par employé
- [ ] Je peux filtrer par chantier
- [ ] Je vois les employés qui dépassent leur quota en rouge
- [ ] Je vois les employés inactifs (pas de badge depuis X jours)

**Priorité:** 🟡 Important (MVP+)

---

### US-E05: Exporter les heures pour la paie
**En tant que** Manager ou Comptable
**Je veux** exporter les heures travaillées de tous les employés
**Afin de** préparer la paie du mois

**Critères d'acceptation:**
- [ ] Je peux sélectionner une période (généralement 1 mois)
- [ ] L'export contient: Employé, Total heures, Détail par jour, Chantier
- [ ] Je peux exporter en CSV ou Excel
- [ ] Les heures sont arrondies selon les règles configurées (15min par défaut)
- [ ] Le fichier se télécharge automatiquement

**Priorité:** 🟡 Important (MVP+)

---

### US-E06: Désactiver un employé (Manager)
**En tant que** Manager
**Je veux** désactiver le compte d'un employé qui a quitté l'entreprise
**Afin de** lui retirer l'accès sans perdre l'historique

**Critères d'acceptation:**
- [ ] Je peux marquer un employé comme "Inactif"
- [ ] L'employé ne peut plus se connecter
- [ ] L'employé n'apparaît plus dans les listes d'assignation
- [ ] L'historique de ses badgeages est conservé
- [ ] Je peux réactiver l'employé si besoin
- [ ] Les chantiers où il était assigné conservent ses données

**Priorité:** 🟡 Important (MVP+)

---

## 5. MODULE CLIENT

### US-CL01: Ajouter un nouveau client (Manager)
**En tant que** Manager
**Je veux** créer une fiche client
**Afin de** garder ses informations pour les devis et factures

**Critères d'acceptation:**
- [ ] Je peux entrer: nom, email, téléphone, adresse
- [ ] Je peux entrer SIRET (optionnel, pour clients professionnels)
- [ ] Je peux ajouter des notes
- [ ] Le client apparaît dans ma liste de clients
- [ ] Je peux rechercher un client par nom ou SIRET
- [ ] Les informations sont utilisées pour pré-remplir devis/factures

**Priorité:** 🔴 Critique (MVP)

---

### US-CL02: Voir l'historique d'un client (Manager)
**En tant que** Manager
**Je veux** voir tous les devis, chantiers et factures d'un client
**Afin de** avoir une vue d'ensemble de la relation commerciale

**Critères d'acceptation:**
- [ ] Je vois la liste de tous les devis (statuts, montants, dates)
- [ ] Je vois la liste de tous les chantiers (statuts, dates)
- [ ] Je vois la liste de toutes les factures (statuts paiement, montants)
- [ ] Je vois le CA total généré avec ce client
- [ ] Je vois le nombre de projets réalisés
- [ ] Je peux naviguer directement vers chaque élément

**Priorité:** 🟡 Important (MVP+)

---

## 6. MODULE AUTHENTIFICATION & ONBOARDING

### US-A01: Créer mon compte entreprise (Nouveau utilisateur)
**En tant que** Nouveau utilisateur
**Je veux** créer mon compte entreprise Autobat
**Afin de** commencer à utiliser l'application

**Critères d'acceptation:**
- [ ] Je peux entrer: nom entreprise, SIRET, adresse, téléphone, email
- [ ] Je peux créer mon mot de passe (min 8 caractères)
- [ ] Je reçois un email de confirmation
- [ ] Mon compte est créé avec le rôle COMPANY_ADMIN
- [ ] Je suis redirigé vers le dashboard après création
- [ ] Un tenant_id unique est créé pour mon entreprise

**Priorité:** 🔴 Critique (MVP)

---

### US-A02: Me connecter à mon compte (Utilisateur existant)
**En tant qu'** Utilisateur existant
**Je veux** me connecter à mon compte
**Afin de** accéder à l'application

**Critères d'acceptation:**
- [ ] Je peux entrer mon email et mot de passe
- [ ] Si identifiants incorrects, je vois un message d'erreur clair
- [ ] Si succès, je suis redirigé vers le dashboard
- [ ] Ma session reste active pendant 7 jours (Remember me)
- [ ] Je peux réinitialiser mon mot de passe si oublié

**Priorité:** 🔴 Critique (MVP)

---

### US-A03: Réinitialiser mon mot de passe
**En tant qu'** Utilisateur
**Je veux** réinitialiser mon mot de passe si je l'ai oublié
**Afin de** retrouver l'accès à mon compte

**Critères d'acceptation:**
- [ ] Je clique sur "Mot de passe oublié ?"
- [ ] Je reçois un email avec un lien de réinitialisation
- [ ] Le lien est valide pendant 1 heure
- [ ] Je peux définir un nouveau mot de passe
- [ ] Je peux me connecter avec le nouveau mot de passe
- [ ] L'ancien mot de passe ne fonctionne plus

**Priorité:** 🟡 Important (MVP)

---

## 7. MODULE SUPER ADMIN (Gestion multi-tenant)

### US-SA01: Voir la liste de tous les tenants (Super Admin)
**En tant que** Super Admin Autobat
**Je veux** voir la liste de toutes les entreprises clientes
**Afin de** gérer la plateforme

**Critères d'acceptation:**
- [ ] Je vois: nom entreprise, SIRET, date création, nb utilisateurs, statut
- [ ] Je peux rechercher par nom ou SIRET
- [ ] Je peux filtrer par statut (Actif, Inactif, Essai)
- [ ] Je vois le nombre total de tenants
- [ ] Je peux accéder au détail d'un tenant

**Priorité:** 🟡 Important (Post-MVP)

---

### US-SA02: Désactiver un tenant (Super Admin)
**En tant que** Super Admin Autobat
**Je veux** désactiver un tenant qui ne paie plus son abonnement
**Afin de** bloquer l'accès tout en conservant les données

**Critères d'acceptation:**
- [ ] Je peux marquer un tenant comme "Inactif"
- [ ] Tous les utilisateurs de ce tenant ne peuvent plus se connecter
- [ ] Un message "Compte suspendu - contactez support" s'affiche
- [ ] Les données sont conservées (pas de suppression)
- [ ] Je peux réactiver le tenant à tout moment
- [ ] Les utilisateurs reçoivent un email de notification

**Priorité:** 🟡 Important (Post-MVP)

---

### US-SA03: Voir les statistiques globales de la plateforme (Super Admin)
**En tant que** Super Admin Autobat
**Je veux** voir des KPIs globaux de la plateforme
**Afin de** suivre la croissance et détecter les problèmes

**Critères d'acceptation:**
- [ ] Je vois le nombre total de tenants actifs
- [ ] Je vois le nombre total d'utilisateurs
- [ ] Je vois le nombre total de chantiers en cours
- [ ] Je vois le CA total généré (toutes entreprises confondues)
- [ ] Je vois l'évolution mensuelle des inscriptions
- [ ] Je vois le taux de rétention (tenants actifs après 3 mois)

**Priorité:** 🟢 Nice to have (Post-MVP)

---

## 8. MODULE NOTIFICATIONS

### US-N01: Recevoir des notifications in-app (Tous utilisateurs)
**En tant qu'** Utilisateur
**Je veux** recevoir des notifications dans l'application
**Afin de** être alerté des événements importants

**Critères d'acceptation:**
- [ ] Je vois un badge rouge avec le nombre de notifications non lues
- [ ] Je peux ouvrir le centre de notifications
- [ ] Chaque notification affiche: icône, titre, message, date
- [ ] Je peux marquer une notification comme lue
- [ ] Je peux marquer toutes les notifications comme lues
- [ ] Les notifications sont triées par date (plus récentes en premier)

**Priorité:** 🟡 Important (MVP+)

---

### US-N02: Configurer mes préférences de notification (Utilisateur)
**En tant qu'** Utilisateur
**Je veux** choisir quelles notifications je veux recevoir
**Afin de** ne pas être spammé par des alertes non pertinentes

**Critères d'acceptation:**
- [ ] Je peux activer/désactiver les notifications par email
- [ ] Je peux activer/désactiver les notifications push (mobile)
- [ ] Je peux choisir les types de notifications:
  - Nouveau devis créé
  - Devis accepté/refusé
  - Badgeage effectué
  - Facture payée
  - Facture en retard
  - Nouveau document ajouté
- [ ] Mes préférences sont sauvegardées automatiquement

**Priorité:** 🟢 Nice to have (V2)

---

## 9. MODULE PARAMÈTRES

### US-P01: Configurer les informations de mon entreprise (Manager)
**En tant que** Manager
**Je veux** modifier les informations de mon entreprise
**Afin de** les mettre à jour sur les devis et factures

**Critères d'acceptation:**
- [ ] Je peux modifier: nom, SIRET, adresse, téléphone, email
- [ ] Je peux uploader un logo (pour les PDF)
- [ ] Je peux définir des conditions de paiement par défaut
- [ ] Je peux définir un RIB pour affichage sur factures
- [ ] Les modifications s'appliquent aux futurs devis/factures
- [ ] Les anciens documents conservent les anciennes valeurs

**Priorité:** 🟡 Important (MVP)

---

### US-P02: Gérer mon abonnement (Manager)
**En tant que** Manager
**Je veux** voir et gérer mon abonnement Autobat
**Afin de** contrôler mes coûts et ajouter/retirer des utilisateurs

**Critères d'acceptation:**
- [ ] Je vois mon plan actuel: 130€ + (nb utilisateurs - 1) × 30€
- [ ] Je vois le nombre d'utilisateurs actifs
- [ ] Je vois la prochaine date de facturation
- [ ] Je peux ajouter un utilisateur (calcul auto du nouveau prix)
- [ ] Je peux retirer un utilisateur (calcul auto du nouveau prix)
- [ ] Je vois l'historique de mes paiements Autobat

**Priorité:** 🟢 Nice to have (V2)

---

## Récapitulatif par priorité

### 🔴 Critiques (MVP - 20 user stories)
- US-D01, US-D02, US-D04 (Devis)
- US-C01, US-C02, US-C03, US-C05, US-C07, US-C08 (Chantier)
- US-F01, US-F02, US-F03, US-F04 (Facturation)
- US-E01, US-E02 (Employés)
- US-CL01 (Clients)
- US-A01, US-A02 (Authentification)

### 🟡 Importants (MVP+ - 15 user stories)
- US-D03, US-D05, US-D06 (Devis)
- US-C04, US-C06 (Chantier)
- US-F05, US-F06 (Facturation)
- US-E03, US-E04, US-E05, US-E06 (Employés)
- US-CL02 (Clients)
- US-A03 (Authentification)
- US-N01 (Notifications)
- US-P01 (Paramètres)

### 🟢 Nice to have (V2 - 7 user stories)
- US-F07 (Export comptable)
- US-SA01, US-SA02, US-SA03 (Super Admin)
- US-N02 (Préférences notifications)
- US-P02 (Gestion abonnement)

---

**Total:** 42 user stories
**MVP:** 20 stories critiques
**Prêt pour développement sprint par sprint**
