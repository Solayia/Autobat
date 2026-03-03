# Autobat - SaaS Gestion BTP

Application de gestion intelligente pour entreprises BTP avec **catalogue auto-apprenant**.

## 🎯 Fonctionnalités clés

- **Catalogue auto-apprenant** : Ajustement automatique des prix tous les 2 chantiers
- **Badgeage GPS automatique** : Présence employés avec géolocalisation (60s, 7h-19h, lun-sam)
- **Offline-first PWA** : Fonctionne sans connexion (Service Workers + IndexedDB)
- **Multi-tenant** : Architecture partagée avec isolation tenant_id
- **Facturation conforme** : Mentions légales France, TVA 20%, conservation 10 ans

## 📦 Stack technique

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Auth:** JWT (access 24h + refresh 7j)

### Frontend
- **Framework:** React 18
- **Build:** Vite
- **Styling:** Tailwind CSS
- **State:** Zustand
- **PWA:** Workbox + Service Workers

## 🚀 Installation

### Prérequis
- Node.js >= 20.0.0
- Docker Desktop (pour PostgreSQL)
- Git

### 1. Cloner le projet

```bash
git clone <url>
cd autobat
```

### 2. Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configuration

**Backend** : Copier `.env.example` vers `.env`
```bash
cd backend
cp .env.example .env
```

Variables importantes :
- `DATABASE_URL` : Connection PostgreSQL
- `JWT_SECRET` : Secret pour tokens (générer avec `openssl rand -hex 64`)
- `PORT` : Port API (défaut: 3000)

**Frontend** : Créer `.env`
```bash
cd frontend
echo "VITE_API_URL=http://localhost:3000/api" > .env
```

### 4. Démarrer PostgreSQL

```bash
# À la racine du projet
docker-compose up -d

# Vérifier que le conteneur tourne
docker ps
```

### 5. Créer la base de données

```bash
cd backend

# Générer Prisma Client
npm run prisma:generate

# Créer la première migration
npm run migrate

# (Optionnel) Seed avec catalogue Graneet
npm run seed
```

### 6. Démarrer les serveurs

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev

# API disponible sur http://localhost:3000
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev

# App disponible sur http://localhost:5173
```

## 🎨 Utilisation

1. Ouvrir http://localhost:5173
2. Cliquer sur "Créer un compte"
3. Remplir les informations entreprise + admin
4. Se connecter au dashboard

## 📁 Structure du projet

```
autobat/
├── backend/              # API Node.js
│   ├── src/
│   │   ├── controllers/  # Logique métier
│   │   ├── middleware/   # Auth, errors
│   │   ├── routes/       # Définition routes
│   │   ├── services/     # Services métier
│   │   ├── config/       # DB, logger
│   │   └── server.js     # Entry point
│   ├── prisma/
│   │   └── schema.prisma # Schema DB
│   └── package.json
│
├── frontend/             # App React PWA
│   ├── src/
│   │   ├── components/   # Composants UI
│   │   ├── pages/        # Pages
│   │   ├── services/     # API calls
│   │   ├── stores/       # State Zustand
│   │   └── main.jsx      # Entry point
│   └── package.json
│
├── 01-brainstorming/     # Vision & analyse
├── 02-prd/               # PRD, user stories, wireframes
├── 03-architecture/      # Architecture, tech stack
├── 04-database/          # Schema DB, migrations
├── 05-api/               # Endpoints, contracts
├── INDEX.md              # Index documentation complète
├── docker-compose.yml    # PostgreSQL
└── README.md             # Ce fichier
```

## 📚 Documentation

La documentation complète est disponible dans :

- **[INDEX.md](INDEX.md)** - Index général avec accès rapide
- **[MEMORY.md](C:\Users\kevin\.claude\projects\c--Users-kevin-autobat\memory\MEMORY.md)** - Décisions critiques

### Modules documentés

| Module | Fichier | Description |
|--------|---------|-------------|
| Vision | [01-brainstorming/recap-final.md](01-brainstorming/recap-final.md) | Vision produit, USP |
| PRD | [02-prd/PRD.md](02-prd/PRD.md) | Product Requirements |
| User Stories | [02-prd/user-stories.md](02-prd/user-stories.md) | 42 user stories MVP |
| Règles métier | [02-prd/regles-metier.md](02-prd/regles-metier.md) | 100+ business rules |
| Wireframes | [02-prd/wireframes.md](02-prd/wireframes.md) | Maquettes ASCII |
| Architecture | [03-architecture/architecture.md](03-architecture/architecture.md) | Archi système |
| Tech Stack | [03-architecture/tech-stack.md](03-architecture/tech-stack.md) | Technologies |
| Déploiement | [03-architecture/deployment.md](03-architecture/deployment.md) | VPS Hostinger |
| Database | [04-database/schema.md](04-database/schema.md) | 21 tables + indexes |
| Migrations | [04-database/migrations.md](04-database/migrations.md) | Prisma migrate |
| API | [05-api/endpoints.md](05-api/endpoints.md) | ~80 endpoints REST |
| Contracts | [05-api/contracts.md](05-api/contracts.md) | Interfaces TS |
| Auth | [05-api/authentication.md](05-api/authentication.md) | JWT + RBAC |

## 🔧 Scripts disponibles

### Backend
```bash
npm run dev           # Dev avec nodemon
npm start             # Production
npm run migrate       # Migrations dev
npm run migrate:deploy # Migrations prod
npm run prisma:studio # GUI base de données
npm run seed          # Seed catalogue
```

### Frontend
```bash
npm run dev           # Dev avec Vite
npm run build         # Build production
npm run preview       # Preview build
```

## 🔐 Authentification

### Endpoints
- `POST /api/auth/register` - Inscription entreprise
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - User connecté

### Rôles
1. **SUPER_ADMIN** - Accès tous tenants (read-only)
2. **COMPANY_ADMIN** - Admin entreprise (tout)
3. **MANAGER** - Gestion chantiers/devis (pas users)
4. **EMPLOYEE** - Badge soi + voir chantiers assignés

## 🗄️ Base de données

### Modèles principaux
- **Tenant** - Entreprises clientes (multi-tenant)
- **User** - Utilisateurs (auth + RBAC)
- **Client** - Clients finaux
- **Ouvrage** - Catalogue auto-apprenant
- **Devis** - Devis avec lignes
- **Chantier** - Chantiers avec GPS
- **Badgeage** - Présence GPS/Manuel
- **Facture** - Facturation légale France

### Particularités
- **Auto-learning** : `ouvrages.nb_chantiers_realises`, `temps_reel_moyen`
- **Snapshots factures** : Données figées (pas FK)
- **Offline** : `badgeages.synced = false` si créé offline
- **Multi-tenant** : `tenant_id` sur toutes tables + index

## 🚢 Déploiement

Voir [03-architecture/deployment.md](03-architecture/deployment.md) pour :
- Setup VPS Hostinger
- Configuration Nginx + SSL
- GitHub Actions CI/CD
- Backup quotidien base

## 📊 Prochaines étapes

### MVP (Phase 1)
- [ ] Module Clients (CRUD)
- [ ] Module Catalogue Ouvrages
- [ ] Module Devis (création + envoi PDF)
- [ ] Module Chantiers (création + assignation)
- [ ] Module Badgeages (GPS + manuel)
- [ ] Module Factures (création + envoi)
- [ ] Dashboard stats

### MVP+ (Phase 2)
- [ ] Historique prix auto-learning
- [ ] Exports Excel/PDF
- [ ] Notifications système
- [ ] Documents chantier (photos)

### V2 (Phase 3)
- [ ] Super admin panel
- [ ] Gestion abonnements
- [ ] Plans PRO/ENTERPRISE
- [ ] API publique

## 🤝 Contribution

Ce projet suit la méthodologie **BMAD** (Brainstorming → Méthodologie → Architecture → Database).

Voir [INDEX.md](INDEX.md) pour comprendre la structure complète.

## 📄 Licence

Propriétaire - Autobat © 2026

---

**Développé avec** ❤️ **pour les entreprises BTP françaises**
