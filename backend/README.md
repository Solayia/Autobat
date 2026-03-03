# Autobat Backend API

API Node.js pour Autobat SaaS construction management.

## Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Auth:** JWT (access + refresh tokens)

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer PostgreSQL avec Docker
docker-compose up -d

# 3. Copier .env.example vers .env
cp .env.example .env

# 4. Générer Prisma Client
npm run prisma:generate

# 5. Créer la première migration
npm run migrate

# 6. (Optionnel) Seed la base de données
npm run seed
```

## Scripts

- `npm run dev` - Démarrer en mode développement (nodemon)
- `npm start` - Démarrer en production
- `npm run migrate` - Créer/appliquer migrations Prisma (dev)
- `npm run migrate:deploy` - Appliquer migrations (production)
- `npm run prisma:generate` - Générer Prisma Client
- `npm run prisma:studio` - Ouvrir Prisma Studio (GUI DB)
- `npm run seed` - Seed la base de données

## Endpoints principaux

### Auth
- `POST /api/auth/register` - Inscription entreprise + admin
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir access token
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Info utilisateur connecté

### Health
- `GET /health` - Status API

## Architecture

```
src/
├── config/          # Configuration (DB, logger)
├── controllers/     # Logique métier
├── middleware/      # Auth, errors, etc.
├── routes/          # Définition routes
├── services/        # Services métier
├── utils/           # Utilitaires
└── server.js        # Entry point
```

## Sécurité

- **Multi-tenant:** Isolation automatique par tenant_id (Prisma middleware)
- **JWT:** Access token 24h + Refresh token 7j avec rotation
- **RBAC:** 4 rôles (SUPER_ADMIN, COMPANY_ADMIN, MANAGER, EMPLOYEE)
- **Rate limiting:** 100 req/min global, 5 login/15min
- **Helmet:** Headers sécurité
- **CORS:** Configuré pour frontend

## Variables d'environnement

Voir [.env.example](.env.example) pour la liste complète.

**Critique en production:**
- `DATABASE_URL`
- `JWT_SECRET` (générer avec `openssl rand -hex 64`)
- `JWT_REFRESH_SECRET`
- `NODE_ENV=production`

## Développement

```bash
# Watcher avec restart auto
npm run dev

# Prisma Studio (GUI base de données)
npm run prisma:studio

# Voir les logs
tail -f logs/combined.log
```

## Documentation complète

Voir la documentation BMAD dans le dossier racine:
- [05-api/endpoints.md](../05-api/endpoints.md) - Liste complète endpoints
- [05-api/contracts.md](../05-api/contracts.md) - Interfaces TypeScript
- [05-api/authentication.md](../05-api/authentication.md) - Auth détaillée
- [04-database/schema.md](../04-database/schema.md) - Documentation BDD
