# Guide de démarrage rapide Autobat

## ✅ Ce qui a été créé

### Backend (Node.js + Express + Prisma)
- ✅ Structure projet complète (`src/controllers`, `middleware`, `routes`, `services`, `config`)
- ✅ Prisma schema avec 21 tables (multi-tenant)
- ✅ Auth JWT complet (register, login, refresh, logout)
- ✅ Middleware auth + tenant isolation automatique
- ✅ Error handling global
- ✅ Logging (Winston)
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ Configuration .env

**Fichiers backend :**
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Prisma + middleware tenant
│   │   └── logger.js         # Winston logger
│   ├── controllers/
│   │   └── authController.js # Register, login, refresh, logout, me
│   ├── middleware/
│   │   ├── auth.js           # JWT auth + requireRole
│   │   └── errorHandler.js   # Error handling global
│   ├── routes/
│   │   └── authRoutes.js     # Routes auth
│   ├── utils/
│   │   └── jwt.js            # Génération tokens
│   └── server.js             # Entry point Express
├── prisma/
│   └── schema.prisma         # 21 tables multi-tenant
├── package.json
├── .env                      # Config (créé)
├── .env.example
└── README.md
```

### Frontend (React + Vite + Tailwind)
- ✅ Structure projet React complète
- ✅ Vite configuré avec PWA
- ✅ Tailwind CSS + Design system
- ✅ React Router 6
- ✅ Zustand store (auth)
- ✅ Axios avec intercepteurs (refresh token auto)
- ✅ Pages Login + Register + Dashboard
- ✅ Protected routes
- ✅ Toast notifications
- ✅ Responsive design

**Fichiers frontend :**
```
frontend/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx # HOC routes protégées
│   ├── pages/
│   │   ├── Login.jsx          # Page connexion
│   │   ├── Register.jsx       # Page inscription
│   │   └── Dashboard.jsx      # Dashboard principal
│   ├── services/
│   │   ├── api.js             # Axios config + intercepteurs
│   │   └── authService.js     # Service auth
│   ├── stores/
│   │   └── authStore.js       # State Zustand auth
│   ├── styles/
│   │   └── index.css          # Tailwind + custom classes
│   ├── App.jsx                # Routes
│   └── main.jsx               # Entry point
├── public/
│   └── logo.svg
├── index.html
├── vite.config.js             # Vite + PWA
├── tailwind.config.js
├── package.json
├── .env                       # Config (créé)
└── README.md
```

### Infrastructure
- ✅ Docker Compose (PostgreSQL 16)
- ✅ README.md complet
- ✅ Documentation BMAD complète (18 fichiers)

---

## 🚀 Démarrage en 5 minutes

### Étape 1 : Démarrer Docker Desktop
Lancer Docker Desktop sur Windows avant de continuer.

### Étape 2 : Démarrer PostgreSQL
```bash
cd c:/Users/kevin/autobat
docker-compose up -d
```

Vérifier que le conteneur tourne :
```bash
docker ps
# Vous devez voir "autobat_postgres"
```

### Étape 3 : Initialiser la base de données
```bash
cd backend

# Générer Prisma Client
npm run prisma:generate

# Créer les tables
npm run migrate
```

Si vous voyez une erreur "Environment variable not found: DATABASE_URL", vérifiez que le fichier `backend/.env` existe.

### Étape 4 : Démarrer le backend
**Nouveau terminal :**
```bash
cd c:/Users/kevin/autobat/backend
npm run dev
```

Vous devriez voir :
```
🚀 Serveur Autobat démarré sur le port 3000
📦 Environnement: development
🔗 API: http://localhost:3000
```

### Étape 5 : Démarrer le frontend
**Nouveau terminal :**
```bash
cd c:/Users/kevin/autobat/frontend
npm run dev
```

Vous devriez voir :
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Étape 6 : Tester l'application

1. Ouvrir http://localhost:5173
2. Cliquer sur "Créer un compte"
3. Remplir le formulaire d'inscription
4. Se connecter au dashboard

---

## 🧪 Test API direct

### 1. Health check
```bash
curl http://localhost:3000/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T...",
  "uptime": 123.45,
  "environment": "development"
}
```

### 2. Register (Postman/curl)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "entreprise_nom": "Test BTP",
    "entreprise_siret": "12345678901234",
    "entreprise_adresse": "1 rue Test",
    "entreprise_code_postal": "75001",
    "entreprise_ville": "Paris",
    "entreprise_telephone": "0123456789",
    "entreprise_email": "contact@test.fr",
    "prenom": "John",
    "nom": "Doe",
    "email": "john@test.fr",
    "password": "password123",
    "telephone": "0612345678"
  }'
```

Réponse attendue :
```json
{
  "message": "Inscription réussie",
  "user": { ... },
  "tenant": { ... },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 86400
}
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.fr",
    "password": "password123"
  }'
```

### 4. Me (avec token)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🗄️ Accès base de données

### Prisma Studio (GUI)
```bash
cd backend
npm run prisma:studio
```

Ouvre http://localhost:5555 avec une interface graphique pour voir/éditer les données.

### psql (CLI)
```bash
docker exec -it autobat_postgres psql -U autobat_user -d autobat_db
```

Commandes utiles :
```sql
-- Lister les tables
\dt

-- Voir la structure d'une table
\d users

-- Voir les tenants
SELECT * FROM tenants;

-- Voir les users
SELECT id, email, role, tenant_id FROM users;
```

---

## 🐛 Troubleshooting

### Docker n'est pas démarré
**Erreur :** `error during connect: this error may indicate that the docker daemon is not running`

**Solution :** Démarrer Docker Desktop

### Port 3000 déjà utilisé
**Erreur :** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution :**
```bash
# Voir quel processus utilise le port
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F

# Ou changer le port dans backend/.env
PORT=3001
```

### Port 5173 déjà utilisé
Même solution que ci-dessus, ou modifier `vite.config.js` :
```js
server: {
  port: 5174
}
```

### Migration Prisma échoue
**Erreur :** `Can't reach database server`

**Solution :**
1. Vérifier que PostgreSQL tourne : `docker ps`
2. Vérifier DATABASE_URL dans `backend/.env`
3. Restart le conteneur : `docker-compose restart`

### Frontend ne peut pas joindre l'API
**Erreur :** `Network Error` dans la console

**Solutions :**
1. Vérifier que le backend tourne sur port 3000
2. Vérifier VITE_API_URL dans `frontend/.env`
3. Vérifier CORS dans `backend/src/server.js`

---

## 📊 Prochaine étape : Développement

Maintenant que le setup est complet, vous pouvez :

### 1. Créer le module Clients
**Backend :**
- `src/controllers/clientController.js`
- `src/routes/clientRoutes.js`

**Frontend :**
- `src/pages/Clients.jsx`
- `src/services/clientService.js`

### 2. Créer le module Catalogue
Voir [02-prd/module-devis.md](02-prd/module-devis.md) pour les specs auto-learning.

### 3. Développer progressivement
Ordre recommandé (MVP) :
1. Clients ✅
2. Catalogue Ouvrages ✅
3. Devis
4. Chantiers
5. Badgeages
6. Factures

---

## 📚 Documentation

- **README.md** - Vue d'ensemble projet
- **INDEX.md** - Index documentation complète
- **MEMORY.md** - Décisions critiques (auto-memory)
- **backend/README.md** - Doc backend
- **frontend/README.md** - Doc frontend

---

**Setup créé le :** 2026-02-12
**Temps de setup :** ~15 minutes
**Status :** ✅ Prêt pour développement
