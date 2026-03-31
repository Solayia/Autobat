# CLAUDE.md — Instructions permanentes pour Claude Code

## 1. Suivi des tâches sur Notion

**Toutes les tâches à réaliser sont tracées sur le Notion du projet Autobat.**

- Avant de commencer une session de dev, consulter le kanban Notion pour identifier les tickets à traiter.
- Chaque ticket a un statut : `À faire` → `En cours` → `Attente test en prod` → `Terminé`.
- **Après avoir implémenté une tâche** : changer son statut en `Attente test en prod`.
- **Après validation en prod** : changer son statut en `Terminé`.
- Ne jamais laisser un ticket en `À faire` si le code a été poussé en prod.

Pour changer un statut via le MCP Chrome DevTools :
1. Ouvrir la page Notion avec le kanban
2. Cliquer sur la carte du ticket pour ouvrir le panneau latéral
3. Cibler le panneau latéral (`[role="region"]` dont `aria-label` contient `"lat"`) via `evaluate_script`
4. Trouver le span du statut actuel dans ce panneau et cliquer dessus pour ouvrir le menu déroulant
5. Sélectionner le nouveau statut

---

## 2. Patch notes / "Quoi de neuf ?" pour les clients

**À chaque mise à jour significative du logiciel (nouvelle fonctionnalité, correction d'un bug impactant les utilisateurs), mettre à jour la modale `WhatsNewModal`.**

### Fichier à modifier
`frontend/src/components/WhatsNewModal.jsx`

### Procédure

1. **Incrémenter `CURRENT_VERSION`** (ex : `1.1.0` → `1.2.0`)
2. **Ajouter une nouvelle entrée en tête du tableau `CHANGELOG`** avec :
   - `version` : le nouveau numéro de version
   - `date` : mois et année (ex : `"Mai 2026"`)
   - `entries` : liste des changements, chacun avec :
     - `type` : `"new"` (nouveauté), `"improve"` (amélioration) ou `"fix"` (correction)
     - `icon` : un emoji représentatif
     - `title` : titre court
     - `desc` : description courte en français

### Comportement
- La modale s'affiche automatiquement 800ms après connexion si `localStorage['autobat_last_seen_version']` ≠ `CURRENT_VERSION`
- L'utilisateur la ferme via "Allons-y !" → la valeur est sauvegardée, elle ne réapparaît plus
- Les nouveaux clients et les anciens (qui n'ont pas vu la version) la verront à la prochaine connexion

### Types de changements qui déclenchent une mise à jour de la modale
- Nouvelle page ou module ajouté
- Refonte d'une fonctionnalité existante
- Correction d'un bug visible par les utilisateurs (PDF, formulaires, calculs…)
- Changement de tarification ou de conditions

### Types qui ne nécessitent PAS de mise à jour
- Refactoring interne sans impact utilisateur
- Corrections de sécurité silencieuses
- Ajustements de style mineurs

---

## 3. Déploiement

- Backend + Frontend déployés sur VPS Hostinger via GitHub Actions
- Après chaque push sur `main`, vérifier le bon déroulement du déploiement en prod sur `autobat.pro`
- Tester les fonctionnalités modifiées en prod après déploiement
- Mettre à jour les statuts Notion en conséquence
