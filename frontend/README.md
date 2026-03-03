# Autobat Frontend

Application React PWA pour Autobat SaaS construction management.

## Stack

- **Framework:** React 18
- **Build tool:** Vite
- **Routing:** React Router 6
- **State management:** Zustand
- **Styling:** Tailwind CSS
- **HTTP client:** Axios
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Offline:** Dexie (IndexedDB) + Service Workers
- **PWA:** vite-plugin-pwa (Workbox)

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer en dev
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

## Structure

```
src/
├── components/      # Composants réutilisables
├── pages/          # Pages principales
├── services/       # Services API
├── stores/         # State management (Zustand)
├── hooks/          # Custom hooks
├── utils/          # Utilitaires
├── styles/         # CSS global + Tailwind
├── App.jsx         # Composant racine
└── main.jsx        # Entry point
```

## Composants créés

### Pages
- `Login` - Page de connexion
- `Register` - Inscription entreprise
- `Dashboard` - Tableau de bord principal

### Services
- `api.js` - Instance Axios configurée (JWT, refresh token)
- `authService.js` - Service d'authentification

### Stores
- `authStore.js` - State global auth (Zustand)

### Components
- `ProtectedRoute` - HOC pour routes protégées

## Variables d'environnement

Créer un fichier `.env` :

```env
VITE_API_URL=http://localhost:3000/api
```

## Développement

```bash
# Dev server avec hot reload
npm run dev

# L'app sera disponible sur http://localhost:5173
# Le proxy redirige /api vers le backend (port 3000)
```

## Build & Déploiement

```bash
# Build production
npm run build

# Les fichiers optimisés sont dans dist/
# Upload sur Hostinger ou serveur web
```

## PWA

L'application fonctionne en mode Progressive Web App :
- ✅ Installable sur mobile/desktop
- ✅ Fonctionne offline (Service Worker)
- ✅ Cache intelligent (Workbox)
- ✅ Icônes et splash screens

## Fonctionnalités implémentées

- ✅ Login / Register
- ✅ JWT auth avec refresh token automatique
- ✅ Logout
- ✅ Protected routes
- ✅ Dashboard de base
- ✅ Design system Tailwind
- ✅ Toast notifications
- ✅ Responsive design

## TODO

- [ ] Module Clients (CRUD)
- [ ] Module Catalogue Ouvrages
- [ ] Module Devis
- [ ] Module Chantiers
- [ ] Module Badgeages (GPS)
- [ ] Module Factures
- [ ] IndexedDB pour offline badgeages
- [ ] Background Sync
- [ ] Notifications push

## Documentation

Voir la documentation complète dans le dossier racine :
- [02-prd/wireframes.md](../02-prd/wireframes.md) - Maquettes ASCII
- [03-architecture/tech-stack.md](../03-architecture/tech-stack.md) - Stack technique
- [05-api/endpoints.md](../05-api/endpoints.md) - Liste endpoints API
