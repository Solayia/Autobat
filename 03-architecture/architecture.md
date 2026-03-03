# Architecture Technique - Autobat

## Vue d'ensemble

Autobat est une application SaaS multi-tenant avec architecture moderne :
- **Frontend** : PWA React (mobile-first)
- **Backend** : API REST Node.js
- **Database** : PostgreSQL (multi-tenant)
- **Hosting** : VPS Hostinger

---

## 1. ARCHITECTURE GLOBALE

### 1.1 Diagramme d'architecture système

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │   Mobile     │    │   Tablet     │    │   Desktop    │     │
│   │   (PWA)      │    │   (PWA)      │    │   (PWA)      │     │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│          │                   │                   │              │
│          └───────────────────┴───────────────────┘              │
│                              │                                  │
│                              │ HTTPS                            │
│                              ▼                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    VPS HOSTINGER (UBUNTU)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────────────────────────────────────────┐      │
│   │                  NGINX (Reverse Proxy)               │      │
│   │  - SSL/TLS (Let's Encrypt)                          │      │
│   │  - Load balancing                                    │      │
│   │  - Static files serving                              │      │
│   │  - Gzip compression                                  │      │
│   └────────────────────┬─────────────────────────────────┘      │
│                        │                                         │
│                        ▼                                         │
│   ┌──────────────────────────────────────────────────────┐      │
│   │          FRONTEND (React PWA)                        │      │
│   │  - Build static files                                │      │
│   │  - Service Worker                                    │      │
│   │  - IndexedDB (offline storage)                       │      │
│   └──────────────────────────────────────────────────────┘      │
│                        │                                         │
│                        │ API Calls                               │
│                        ▼                                         │
│   ┌──────────────────────────────────────────────────────┐      │
│   │       BACKEND API (Node.js + Express)                │      │
│   │  - Process Manager: PM2 (cluster mode)               │      │
│   │  - Instances: 2-4 (selon RAM)                        │      │
│   │  - Port: 3000 (interne)                              │      │
│   │                                                       │      │
│   │  Middlewares:                                         │      │
│   │  ┌─────────────────────────────────────────────┐     │      │
│   │  │ 1. CORS                                     │     │      │
│   │  │ 2. Helmet (security headers)                │     │      │
│   │  │ 3. Rate Limiting                            │     │      │
│   │  │ 4. JWT Authentication                       │     │      │
│   │  │ 5. Tenant Isolation (tenant_id)             │     │      │
│   │  │ 6. Request Validation (Zod)                 │     │      │
│   │  │ 7. Error Handler                            │     │      │
│   │  └─────────────────────────────────────────────┘     │      │
│   │                                                       │      │
│   │  Routes:                                              │      │
│   │  /api/auth       - Authentication                    │      │
│   │  /api/devis      - Devis CRUD                        │      │
│   │  /api/chantiers  - Chantiers CRUD                    │      │
│   │  /api/factures   - Factures CRUD                     │      │
│   │  /api/badgeages  - Badgeages                         │      │
│   │  /api/employes   - Employés                          │      │
│   │  /api/clients    - Clients                           │      │
│   │  /api/catalogue  - Catalogue ouvrages                │      │
│   └────────────────────┬──────────────────────────────────┘      │
│                        │                                         │
│                        │ Prisma ORM                              │
│                        ▼                                         │
│   ┌──────────────────────────────────────────────────────┐      │
│   │         POSTGRESQL 16                                │      │
│   │  - Multi-tenant avec tenant_id                       │      │
│   │  - Row Level Security (RLS)                          │      │
│   │  - Indexes optimisés                                 │      │
│   │  - Backups quotidiens (pg_dump)                      │      │
│   │  - Port: 5432 (interne)                              │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
│   ┌──────────────────────────────────────────────────────┐      │
│   │         CRON JOBS (node-cron)                        │      │
│   │  - Expiration devis (quotidien 00:00)                │      │
│   │  - Relances factures (quotidien 00:00)               │      │
│   │  - Backup DB (quotidien 02:00)                       │      │
│   │  - Cleanup logs (hebdomadaire)                       │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
│   ┌──────────────────────────────────────────────────────┐      │
│   │         FILE STORAGE                                 │      │
│   │  - PDF (devis, factures): /var/www/autobat/storage  │      │
│   │  - Photos chantiers: /var/www/autobat/uploads       │      │
│   │  - Logs: /var/www/autobat/logs                      │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SERVICES EXTERNES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │  SendGrid    │    │  Stripe      │    │  Sentry      │     │
│   │  (Emails)    │    │  (Paiements) │    │  (Monitoring)│     │
│   └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 1.2 Architecture Multi-Tenant

```
┌─────────────────────────────────────────────────────────────────┐
│                     STRATÉGIE: SHARED DATABASE                   │
│                  (1 base de données, isolation par tenant_id)    │
└─────────────────────────────────────────────────────────────────┘

TENANT 1 (ACME Construction)
tenant_id = "550e8400-e29b-41d4-a716-446655440001"
├── Users (3 users)
│   ├── marc@acme.com (COMPANY_ADMIN)
│   ├── jean@acme.com (MANAGER)
│   └── paul@acme.com (EMPLOYEE)
├── Devis (42 devis)
├── Chantiers (18 chantiers)
├── Factures (35 factures)
└── Catalogue (324 ouvrages personnalisés)

TENANT 2 (SYLA)
tenant_id = "550e8400-e29b-41d4-a716-446655440002"
├── Users (5 users)
├── Devis (67 devis)
├── Chantiers (32 chantiers)
├── Factures (58 factures)
└── Catalogue (324 ouvrages personnalisés)

┌─────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TABLE: users                                                    │
│  ┌──────────┬──────────────┬──────────┬───────────────────┐     │
│  │ id       │ tenant_id    │ email    │ role              │     │
│  ├──────────┼──────────────┼──────────┼───────────────────┤     │
│  │ uuid-1   │ tenant-001   │ marc@... │ COMPANY_ADMIN     │     │
│  │ uuid-2   │ tenant-001   │ jean@... │ MANAGER           │     │
│  │ uuid-3   │ tenant-002   │ syla@... │ COMPANY_ADMIN     │     │
│  └──────────┴──────────────┴──────────┴───────────────────┘     │
│                                                                  │
│  INDEX: idx_users_tenant_id (B-tree)                             │
│  CONSTRAINT: unique(tenant_id, email)                            │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  MIDDLEWARE: Tenant Isolation                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ async function tenantMiddleware(req, res, next) {       │    │
│  │   const user = req.user // From JWT                     │    │
│  │   req.tenantId = user.tenant_id                         │    │
│  │                                                          │    │
│  │   // Inject tenant_id dans toutes les queries Prisma    │    │
│  │   prisma.$use(async (params, next) => {                 │    │
│  │     if (params.model) {                                 │    │
│  │       params.args.where = {                             │    │
│  │         ...params.args.where,                           │    │
│  │         tenant_id: req.tenantId                         │    │
│  │       }                                                  │    │
│  │     }                                                    │    │
│  │     return next(params)                                 │    │
│  │   })                                                     │    │
│  │                                                          │    │
│  │   next()                                                 │    │
│  │ }                                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Avantages de cette approche :**
- ✅ Simple à gérer (1 seule DB)
- ✅ Économique (pas de DB par tenant)
- ✅ Migrations faciles
- ✅ Backups centralisés

**Sécurité :**
- ✅ Middleware vérifie tenant_id sur chaque requête
- ✅ Index sur tenant_id pour performance
- ✅ Row Level Security PostgreSQL (optionnel)

---

### 1.3 Architecture Frontend (PWA)

```
┌─────────────────────────────────────────────────────────────────┐
│                      REACT PWA ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

/src
├── /components               # Composants réutilisables
│   ├── /ui                   # Composants UI basiques
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   └── Input.tsx
│   │
│   ├── /layout               # Layout app
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── MobileNav.tsx
│   │
│   └── /features             # Composants métier
│       ├── DevisForm.tsx
│       ├── CatalogueModal.tsx
│       ├── BadgeageCard.tsx
│       └── ChantierList.tsx
│
├── /pages                    # Pages (routes)
│   ├── /auth
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ResetPassword.tsx
│   │
│   ├── /devis
│   │   ├── DevisList.tsx
│   │   ├── DevisCreate.tsx
│   │   └── DevisDetail.tsx
│   │
│   ├── /chantiers
│   │   ├── ChantiersList.tsx
│   │   ├── ChantierDetail.tsx
│   │   └── Badgeage.tsx      # Mobile
│   │
│   ├── /factures
│   │   ├── FacturesList.tsx
│   │   └── FactureDetail.tsx
│   │
│   └── Dashboard.tsx
│
├── /hooks                    # Custom hooks
│   ├── useAuth.ts
│   ├── useGeolocation.ts     # GPS pour badgeage
│   ├── useOffline.ts         # Détection online/offline
│   ├── useBadgeage.ts
│   └── useDevis.ts
│
├── /contexts                 # React Context
│   ├── AuthContext.tsx       # User, tenant, permissions
│   ├── OfflineContext.tsx    # Sync queue, online status
│   └── NotificationContext.tsx
│
├── /services                 # Services API
│   ├── api.ts                # Axios instance
│   ├── authService.ts
│   ├── devisService.ts
│   ├── chantierService.ts
│   ├── badgeageService.ts
│   └── offlineService.ts     # IndexedDB sync
│
├── /utils
│   ├── formatters.ts         # formatEuro, formatDate
│   ├── validators.ts         # Validation forms
│   └── constants.ts
│
├── /types
│   ├── api.types.ts          # Types API responses
│   ├── models.types.ts       # Devis, Chantier, etc.
│   └── auth.types.ts
│
├── /lib
│   ├── db.ts                 # IndexedDB setup (Dexie)
│   └── sw.ts                 # Service Worker registration
│
├── App.tsx                   # Root component + Router
├── index.tsx                 # Entry point
├── service-worker.ts         # Service Worker (offline)
└── manifest.json             # PWA manifest
```

**Architecture pattern : Feature-based**

Chaque feature (Devis, Chantier, etc.) a :
- Composants UI
- Hooks métier
- Services API
- Types TypeScript

---

### 1.4 Flux de données (Data Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXEMPLE: BADGEAGE GPS                         │
└─────────────────────────────────────────────────────────────────┘

1. DÉTECTION GPS (Frontend)
   ↓
   Component: Badgeage.tsx
   ↓
   Hook: useGeolocation()
   → navigator.geolocation.watchPosition()
   → Check toutes les 60s
   ↓
   Hook: useBadgeage()
   → Calcul distance vs chantiers
   → Si dans zone + conditions OK → Créer badge
   ↓
   Service: badgeageService.createBadge()

2. TENTATIVE SYNC (avec réseau)
   ↓
   POST /api/badgeages
   Headers: { Authorization: Bearer <JWT> }
   Body: {
     chantier_id: "uuid",
     type: "PRESENCE_DEBUT",
     latitude: 48.8566,
     longitude: 2.3522,
     precision_metres: 15
   }
   ↓
   Backend: Middleware JWT → Extract user + tenant_id
   ↓
   Controller: badgeageController.create()
   ↓
   Validation: Zod schema
   ↓
   Business Logic:
   - Vérifier employé assigné au chantier
   - Vérifier pas de doublon (< 15 min)
   - Vérifier heures travaillées (7h-19h)
   ↓
   Prisma: prisma.badgeage.create({
     data: {
       ...body,
       tenant_id: req.tenantId
     }
   })
   ↓
   Response: 201 Created + badge créé
   ↓
   Frontend: Notification toast "Présence badgée"

3. MODE OFFLINE (pas de réseau)
   ↓
   Service: offlineService.queueBadge()
   ↓
   IndexedDB: db.badgeages_pending.add({
     ...badge,
     synced: false,
     created_at: new Date()
   })
   ↓
   Notification: "Badge enregistré (sync en attente)"
   ↓
   [... employé récupère réseau ...]
   ↓
   Service Worker: Background Sync Event
   ↓
   offlineService.syncPendingBadges()
   → GET tous les badges synced=false
   → Pour chaque badge: POST /api/badgeages
   → Si success: Marquer synced=true
   ↓
   Notification: "5 badgeages synchronisés"
```

---

### 1.5 Sécurité - Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHES DE SÉCURITÉ                           │
└─────────────────────────────────────────────────────────────────┘

NIVEAU 1: RÉSEAU
├── HTTPS obligatoire (Let's Encrypt)
├── HSTS header (Strict-Transport-Security)
├── Firewall VPS (UFW)
│   ├── Port 80 (HTTP) → Redirect 443
│   ├── Port 443 (HTTPS) → Ouvert
│   ├── Port 22 (SSH) → IP whitelist uniquement
│   └── Port 5432 (PostgreSQL) → Localhost uniquement
└── DDoS protection (Cloudflare optionnel)

NIVEAU 2: APPLICATION (NGINX)
├── Rate limiting (100 req/min par IP)
├── Request size limit (10MB)
├── Gzip compression
├── Security headers
│   ├── X-Frame-Options: DENY
│   ├── X-Content-Type-Options: nosniff
│   ├── X-XSS-Protection: 1; mode=block
│   └── Content-Security-Policy

NIVEAU 3: BACKEND (Express)
├── Helmet.js (security headers)
├── CORS (whitelist origins)
├── Rate limiting (express-rate-limit)
│   ├── Login: 5 tentatives / 15 min
│   ├── API: 100 req / min
│   └── Upload: 10 req / heure
├── JWT Authentication
│   ├── Access token: 24h
│   ├── Refresh token: 7 jours
│   ├── Secret: 256-bit random (env)
│   └── Algorithm: HS256
└── Input validation (Zod)

NIVEAU 4: DATABASE
├── Prisma ORM (SQL injection protection)
├── Row Level Security (RLS) PostgreSQL
├── Parameterized queries only
├── Least privilege principle
│   ├── App user: SELECT, INSERT, UPDATE, DELETE
│   ├── Backup user: SELECT only
│   └── Admin user: ALL (pas utilisé par app)
└── Encryption at rest (LUKS)

NIVEAU 5: CODE
├── No secrets in code (dotenv)
├── Password hashing (bcrypt, rounds=10)
├── XSS prevention
│   ├── React escapes by default
│   ├── DOMPurify pour HTML custom
│   └── CSP headers
├── CSRF protection
│   ├── SameSite cookies
│   └── CSRF tokens (si cookies)
└── Dependency scanning (npm audit)
```

**Checklist sécurité avant prod :**
- [ ] Tous les secrets dans .env (jamais dans Git)
- [ ] JWT secret = 256-bit random
- [ ] HTTPS activé avec redirection
- [ ] Rate limiting configuré
- [ ] Helmet.js activé
- [ ] CORS whitelist correcte
- [ ] PostgreSQL accessible uniquement en local
- [ ] Backups chiffrés
- [ ] Logs ne contiennent pas de données sensibles
- [ ] npm audit sans vulnérabilités critiques

---

### 1.6 Performance & Scalabilité

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRATÉGIES DE PERFORMANCE                     │
└─────────────────────────────────────────────────────────────────┘

FRONTEND
├── Code splitting (React.lazy)
│   ├── /devis → chunk-devis.js
│   ├── /chantiers → chunk-chantiers.js
│   └── /factures → chunk-factures.js
├── Lazy loading images
├── Service Worker cache
│   ├── App shell (HTML, CSS, JS)
│   ├── API responses (5 min)
│   └── Images (1 jour)
├── Bundle size
│   ├── Gzip compression
│   ├── Tree shaking
│   └── Target: < 200KB initial bundle
└── Progressive rendering

BACKEND
├── PM2 Cluster mode
│   ├── Instances: Math.ceil(CPU_COUNT * 0.75)
│   ├── Load balancing: Round-robin
│   └── Restart on crash
├── Database pooling
│   ├── Pool size: 20 connections
│   ├── Idle timeout: 30s
│   └── Max lifetime: 1h
├── Query optimization
│   ├── Indexes sur tenant_id, foreign keys
│   ├── EXPLAIN ANALYZE sur queries lentes
│   ├── Pagination (20 items/page)
│   └── Select only needed fields
└── Caching (optionnel V2)
    ├── Redis pour sessions
    ├── Cache catalogue (1h)
    └── Cache KPIs dashboard (5 min)

DATABASE
├── Indexes
│   ├── tenant_id (B-tree) sur toutes les tables
│   ├── created_at (B-tree) pour ORDER BY
│   ├── Foreign keys automatiques (Prisma)
│   └── Composite: (tenant_id, email) UNIQUE
├── Partitioning (V2)
│   ├── Par tenant (si > 100 tenants)
│   └── Par date (badgeages anciens)
├── Vacuum auto (PostgreSQL)
└── Connection pooling (PgBouncer en V2)

NGINX
├── Gzip compression (HTML, CSS, JS, JSON)
├── Brotli compression (si supporté)
├── Static files caching
│   ├── Images: 1 an
│   ├── JS/CSS: 1 an (hash dans nom)
│   └── HTML: No cache
└── HTTP/2 enabled
```

**Objectifs de performance :**
- Time to First Byte (TTFB): < 200ms
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Lighthouse Score: > 90

---

### 1.7 Monitoring & Observabilité

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                              │
└─────────────────────────────────────────────────────────────────┘

LOGS
├── Winston (backend)
│   ├── Format: JSON
│   ├── Levels: error, warn, info, debug
│   ├── Rotation: 1 fichier/jour
│   ├── Retention: 30 jours
│   └── Location: /var/www/autobat/logs/
│
├── PM2 logs
│   ├── pm2-out.log (stdout)
│   ├── pm2-error.log (stderr)
│   └── pm2 logs --lines 100
│
└── Nginx logs
    ├── access.log
    └── error.log

MÉTRIQUES
├── PM2 Monitoring (basique)
│   ├── CPU usage
│   ├── Memory usage
│   ├── Requests/min
│   └── pm2 monit
│
└── Custom metrics (API)
    ├── Response times
    ├── Error rates
    ├── Badgeages/jour
    └── Tenants actifs

ALERTES (V2)
├── Sentry (errors tracking)
│   ├── Frontend errors
│   ├── Backend exceptions
│   └── Email alerts
│
└── Uptime monitoring
    ├── UptimeRobot (gratuit)
    ├── Check toutes les 5 min
    └── Alert si down > 2 min

HEALTH CHECKS
├── /api/health → { status: "ok", db: "ok", uptime: 12345 }
├── /api/metrics → Prometheus format (V2)
└── Vérifié par PM2 ecosystem
```

---

## 2. ARCHITECTURE DÉTAILLÉE PAR MODULE

### 2.1 Module Authentification (JWT)

```typescript
// Flow de login

1. POST /api/auth/login
   Body: { email, password }
   ↓
2. Validation (Zod)
   ↓
3. Recherche user en DB
   const user = await prisma.user.findUnique({
     where: { email },
     include: { tenant: true }
   })
   ↓
4. Vérification password
   const valid = await bcrypt.compare(password, user.password_hash)
   ↓
5. Génération JWT
   const accessToken = jwt.sign(
     {
       user_id: user.id,
       tenant_id: user.tenant_id,
       role: user.role,
       email: user.email
     },
     process.env.JWT_SECRET,
     { expiresIn: '24h' }
   )

   const refreshToken = jwt.sign(
     { user_id: user.id },
     process.env.JWT_REFRESH_SECRET,
     { expiresIn: '7d' }
   )
   ↓
6. Stockage refresh token en DB
   await prisma.refreshToken.create({
     data: {
       user_id: user.id,
       token: refreshToken,
       expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
     }
   })
   ↓
7. Response
   {
     accessToken,
     refreshToken,
     user: {
       id, email, role, tenant_id,
       tenant: { nom, ... }
     }
   }
   ↓
8. Frontend stocke tokens
   localStorage.setItem('accessToken', accessToken)
   localStorage.setItem('refreshToken', refreshToken)
```

**Middleware d'authentification :**
```typescript
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { user_id, tenant_id, role, email }
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

---

### 2.2 Module Badgeage Offline

```
┌─────────────────────────────────────────────────────────────────┐
│               ARCHITECTURE OFFLINE-FIRST (PWA)                   │
└─────────────────────────────────────────────────────────────────┘

COMPOSANTS:
1. Service Worker (sw.ts)
2. IndexedDB (Dexie.js)
3. Background Sync API
4. Geolocation API

┌──────────────────────────────────────────────────────────────┐
│  SERVICE WORKER                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  // Cache strategy                                           │
│  self.addEventListener('fetch', (event) => {                 │
│    const { request } = event                                 │
│                                                              │
│    // App shell: Cache-first                                 │
│    if (request.url.match(/\.(js|css|html|png)$/)) {         │
│      event.respondWith(                                      │
│        caches.match(request)                                 │
│          .then(cached => cached || fetch(request))          │
│      )                                                        │
│    }                                                          │
│                                                              │
│    // API: Network-first, fallback cache                     │
│    if (request.url.includes('/api/')) {                      │
│      event.respondWith(                                      │
│        fetch(request)                                        │
│          .then(response => {                                 │
│            // Cache response                                 │
│            const clone = response.clone()                    │
│            caches.open('api-cache').then(cache => {          │
│              cache.put(request, clone)                       │
│            })                                                 │
│            return response                                   │
│          })                                                   │
│          .catch(() => caches.match(request))                 │
│      )                                                        │
│    }                                                          │
│  })                                                           │
│                                                              │
│  // Background Sync                                          │
│  self.addEventListener('sync', (event) => {                  │
│    if (event.tag === 'sync-badgeages') {                     │
│      event.waitUntil(syncPendingBadgeages())                 │
│    }                                                          │
│  })                                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  INDEXEDDB (Dexie.js)                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  const db = new Dexie('AutobatDB')                           │
│                                                              │
│  db.version(1).stores({                                      │
│    badgeages_pending: '++id, synced, created_at',           │
│    chantiers: 'id, tenant_id',                              │
│    taches: 'id, chantier_id'                                │
│  })                                                           │
│                                                              │
│  // Ajouter badge offline                                    │
│  async function createBadgeOffline(badge) {                  │
│    await db.badgeages_pending.add({                          │
│      ...badge,                                               │
│      synced: false,                                          │
│      created_at: new Date()                                  │
│    })                                                         │
│  }                                                            │
│                                                              │
│  // Sync quand réseau revient                                │
│  async function syncPendingBadgeages() {                     │
│    const pending = await db.badgeages_pending                │
│      .where('synced').equals(false)                          │
│      .toArray()                                              │
│                                                              │
│    for (const badge of pending) {                            │
│      try {                                                   │
│        await fetch('/api/badgeages', {                       │
│          method: 'POST',                                     │
│          headers: {                                          │
│            'Authorization': `Bearer ${getToken()}`,          │
│            'Content-Type': 'application/json'                │
│          },                                                   │
│          body: JSON.stringify(badge)                         │
│        })                                                     │
│                                                              │
│        // Marquer comme synced                               │
│        await db.badgeages_pending.update(badge.id, {         │
│          synced: true                                        │
│        })                                                     │
│      } catch (error) {                                       │
│        console.error('Sync failed:', error)                  │
│        // Retry plus tard                                    │
│      }                                                        │
│    }                                                          │
│  }                                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. CHOIX TECHNIQUES JUSTIFIÉS

### 3.1 Pourquoi React (et pas Vue/Angular) ?

**Avantages :**
- ✅ Écosystème mature (librairies, tooling)
- ✅ PWA support excellent (Workbox)
- ✅ Performance (Virtual DOM, React 18 concurrent features)
- ✅ TypeScript first-class support
- ✅ Communauté énorme (solutions aux problèmes)
- ✅ Vous connaissez déjà (fullstack)

**Inconvénients :**
- ❌ Plus verbeux que Vue
- ❌ Pas de solution state management officielle (mais Context API suffit pour MVP)

---

### 3.2 Pourquoi Node.js (et pas Django/Laravel) ?

**Avantages :**
- ✅ JavaScript fullstack (même langage frontend/backend)
- ✅ NPM ecosystem énorme
- ✅ Performance (async I/O)
- ✅ Vous connaissez déjà
- ✅ TypeScript support natif

**Inconvénients :**
- ❌ Moins "batteries included" que Django
- ❌ Nécessite discipline (structure projet)

---

### 3.3 Pourquoi PostgreSQL (et pas MySQL/MongoDB) ?

**Avantages :**
- ✅ ACID compliance (transactions fiables)
- ✅ JSON support (flexible si besoin)
- ✅ Row Level Security (multi-tenant)
- ✅ Performance sur relations complexes
- ✅ Open source (pas de licensing Oracle)
- ✅ Extensions (PostGIS si géolocalisation avancée)

**Inconvénients :**
- ❌ Setup légèrement plus complexe que MySQL

---

### 3.4 Pourquoi Prisma (et pas Sequelize/TypeORM) ?

**Avantages :**
- ✅ Type-safety total (generated types)
- ✅ Migrations faciles
- ✅ Studio pour debug DB
- ✅ Excellent DX (developer experience)
- ✅ Query performance optimisée

**Inconvénients :**
- ❌ Moins mature que Sequelize
- ❌ Abstraction peut être limitante (raw queries possibles)

---

## 4. DIAGRAMME DE DÉPLOIEMENT

```
┌─────────────────────────────────────────────────────────────────┐
│                    VPS HOSTINGER (Ubuntu 24.04)                  │
│                    2 vCPU, 4 GB RAM, 50 GB SSD                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /var/www/autobat/                                               │
│  ├── frontend/                      (React build)                │
│  │   ├── build/                                                  │
│  │   │   ├── index.html                                          │
│  │   │   ├── static/                                             │
│  │   │   └── service-worker.js                                   │
│  │   └── .env.production                                         │
│  │                                                                │
│  ├── backend/                       (Node.js API)                │
│  │   ├── dist/                      (TypeScript compiled)        │
│  │   ├── node_modules/                                           │
│  │   ├── prisma/                                                 │
│  │   │   └── schema.prisma                                       │
│  │   ├── .env                                                    │
│  │   ├── package.json                                            │
│  │   └── ecosystem.config.js       (PM2 config)                  │
│  │                                                                │
│  ├── storage/                       (Files)                      │
│  │   ├── pdf/                       (Devis, Factures)            │
│  │   └── uploads/                   (Photos chantiers)           │
│  │                                                                │
│  └── logs/                          (Application logs)           │
│      ├── 2026-02-12.log                                          │
│      └── pm2/                                                    │
│                                                                  │
│  /etc/nginx/                                                     │
│  ├── nginx.conf                                                  │
│  ├── sites-available/                                            │
│  │   └── autobat.conf                                            │
│  └── sites-enabled/                                              │
│      └── autobat.conf -> ../sites-available/autobat.conf         │
│                                                                  │
│  /etc/postgresql/16/                                             │
│  └── main/                                                       │
│      └── postgresql.conf                                         │
│                                                                  │
│  /etc/letsencrypt/                  (SSL certificates)           │
│  └── live/autobat.fr/                                            │
│      ├── fullchain.pem                                           │
│      └── privkey.pem                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. CONVENTIONS & BEST PRACTICES

### 5.1 Git Workflow

```
main (production)
  ↑
  merge via PR
  ↑
develop (staging)
  ↑
  merge features
  ↑
feature/DEV-123-add-badgeage
feature/DEV-124-fix-devis-pdf
```

**Commit messages :**
```
feat: Add GPS badgeage auto-detection
fix: Correct devis PDF generation
refactor: Extract badgeage logic to service
docs: Update architecture.md
```

### 5.2 Code Style

**TypeScript :**
- Strict mode enabled
- No implicit any
- Explicit return types functions
- Interface > Type (pour objets)

**Naming :**
- camelCase: variables, functions
- PascalCase: Components, Classes, Types
- UPPER_SNAKE_CASE: Constants, Env vars
- kebab-case: Files, folders

**Exemple :**
```typescript
// ✅ Good
const badgeageService = new BadgeageService()
const MAX_RETRY_ATTEMPTS = 3

interface DevisCreateInput {
  client_id: string
  lignes: LigneDevis[]
}

// ❌ Bad
const BadgeageService = new badgeageservice()
const max_retry = 3
```

---

**Statut :** Complet
**Prochaine étape :** tech-stack.md (détails des packages NPM, versions, config)
