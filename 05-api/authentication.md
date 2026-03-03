# Authentication & Authorization - Autobat

## Vue d'ensemble

**Strategy:** JWT (JSON Web Tokens)
**Token Type:** Bearer
**Refresh Strategy:** Refresh Token Rotation
**Session Storage:** PostgreSQL (refresh tokens only)

---

## 1. JWT STRUCTURE

### Access Token Payload

```typescript
interface JWTPayload {
  // Standard claims
  iat: number           // Issued at (timestamp)
  exp: number           // Expiration (timestamp)

  // Custom claims
  user_id: string       // User UUID
  tenant_id: string     // Tenant UUID (multi-tenant isolation)
  role: Role            // User role
  email: string         // User email
}

// Exemple decoded:
{
  "iat": 1707739200,
  "exp": 1707825600,  // 24h après iat
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
  "role": "MANAGER",
  "email": "marc@acme.fr"
}
```

**Durée de vie:** 24 heures

---

### Refresh Token Payload

```typescript
interface RefreshTokenPayload {
  iat: number
  exp: number
  user_id: string
  jti: string           // JWT ID (unique token identifier)
}

// Exemple decoded:
{
  "iat": 1707739200,
  "exp": 1708344000,  // 7 jours après iat
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "jti": "refresh-token-uuid"
}
```

**Durée de vie:** 7 jours

---

## 2. TOKEN GENERATION

### Generate Access Token

```typescript
import jwt from 'jsonwebtoken'

function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    user_id: user.id,
    tenant_id: user.tenant_id,
    role: user.role,
    email: user.email
  }

  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    {
      expiresIn: '24h',
      algorithm: 'HS256'
    }
  )
}
```

---

### Generate Refresh Token

```typescript
import { v4 as uuidv4 } from 'uuid'

async function generateRefreshToken(userId: string): Promise<string> {
  const jti = uuidv4()

  const payload: RefreshTokenPayload = {
    user_id: userId,
    jti
  }

  const token = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: '7d',
      algorithm: 'HS256'
    }
  )

  // Stocker en DB pour invalidation possible
  await prisma.refreshToken.create({
    data: {
      id: jti,
      user_id: userId,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  return token
}
```

---

## 3. AUTHENTICATION MIDDLEWARE

### JWT Verification Middleware

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      tenantId?: string
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      })
    }

    const token = authHeader.split(' ')[1]

    // 2. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JWTPayload

    // 3. Check user still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.user_id },
      select: { actif: true }
    })

    if (!user || !user.actif) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User inactive or deleted'
        }
      })
    }

    // 4. Attach to request
    req.user = decoded
    req.tenantId = decoded.tenant_id

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired'
        }
      })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      })
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed'
      }
    })
  }
}
```

---

## 4. AUTHORIZATION MIDDLEWARE

### Role-Based Access Control

```typescript
type Permission = Role | Role[]

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      })
    }

    next()
  }
}

// Usage:
// router.post('/devis', authMiddleware, requireRole('MANAGER', 'COMPANY_ADMIN'), createDevis)
```

---

### Resource Ownership Check

```typescript
export async function requireOwnership(
  resourceType: 'devis' | 'chantier' | 'facture',
  paramName: string = 'id'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params[paramName]
    const tenantId = req.tenantId!

    // Vérifier que la ressource appartient au tenant
    const resource = await prisma[resourceType].findUnique({
      where: { id: resourceId },
      select: { tenant_id: true }
    })

    if (!resource) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `${resourceType} not found`
        }
      })
    }

    if (resource.tenant_id !== tenantId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access to this resource is forbidden'
        }
      })
    }

    next()
  }
}

// Usage:
// router.get('/devis/:id', authMiddleware, requireOwnership('devis'), getDevis)
```

---

## 5. TENANT ISOLATION MIDDLEWARE

### Automatic Tenant Filtering

```typescript
export function tenantIsolation() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Tenant context missing'
        }
      })
    }

    // Inject tenant_id dans toutes les queries Prisma
    // Via Prisma middleware (global)
    next()
  }
}

// Prisma middleware global (dans prisma.ts)
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

prisma.$use(async (params, next) => {
  // Récupérer tenant_id depuis context (AsyncLocalStorage)
  const tenantId = getCurrentTenantId()

  if (!tenantId) {
    throw new Error('Tenant context missing')
  }

  // Ajouter where condition sur toutes les queries
  if (params.model && params.action === 'findMany') {
    params.args.where = {
      ...params.args.where,
      tenant_id: tenantId
    }
  }

  if (params.model && params.action === 'findUnique') {
    params.args.where = {
      ...params.args.where,
      tenant_id: tenantId
    }
  }

  if (params.model && params.action === 'create') {
    params.args.data = {
      ...params.args.data,
      tenant_id: tenantId
    }
  }

  return next(params)
})
```

---

## 6. PERMISSION MATRIX

### Permissions par Rôle

| Action | EMPLOYEE | MANAGER | COMPANY_ADMIN | SUPER_ADMIN |
|--------|----------|---------|---------------|-------------|
| **Users** |
| Voir son profil | ✅ | ✅ | ✅ | ✅ |
| Modifier son profil | ✅ | ✅ | ✅ | ✅ |
| Lister users | ❌ | ✅ | ✅ | ✅ (all tenants) |
| Créer user | ❌ | ✅ | ✅ | ❌ |
| Modifier user | ❌ | ❌ | ✅ | ❌ |
| Supprimer user | ❌ | ❌ | ✅ | ❌ |
| **Clients** |
| Lister clients | ❌ | ✅ | ✅ | ✅ |
| Créer client | ❌ | ✅ | ✅ | ❌ |
| Modifier client | ❌ | ✅ | ✅ | ❌ |
| Supprimer client | ❌ | ✅ | ✅ | ❌ |
| **Devis** |
| Lister devis | ❌ | ✅ | ✅ | ✅ |
| Créer devis | ❌ | ✅ | ✅ | ❌ |
| Modifier devis | ❌ | ✅ | ✅ | ❌ |
| Envoyer devis | ❌ | ✅ | ✅ | ❌ |
| **Chantiers** |
| Lister chantiers (assignés) | ✅ | ✅ (tous) | ✅ (tous) | ✅ |
| Voir détail chantier | ✅ | ✅ | ✅ | ✅ |
| Créer chantier | ❌ | ✅ | ✅ | ❌ |
| Modifier chantier | ❌ | ✅ | ✅ | ❌ |
| Terminer chantier | ❌ | ✅ | ✅ | ❌ |
| **Badgeages** |
| Créer badge (soi) | ✅ | ✅ | ✅ | ❌ |
| Voir badges (soi) | ✅ | ✅ (tous) | ✅ (tous) | ✅ |
| Modifier badge | ❌ | ✅ | ✅ | ❌ |
| **Factures** |
| Lister factures | ❌ | ✅ | ✅ | ✅ |
| Créer facture | ❌ | ✅ | ✅ | ❌ |
| Enregistrer paiement | ❌ | ✅ | ✅ | ❌ |
| **Dashboard** |
| Voir dashboard | ❌ | ✅ | ✅ | ✅ (global) |

---

## 7. AUTHENTICATION FLOWS

### 7.1 Login Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ POST /api/auth/login
     │ { email, password }
     ▼
┌─────────────────┐
│   Backend API   │
└────┬────────────┘
     │
     │ 1. Validate credentials
     │ 2. Hash password check (bcrypt)
     │ 3. Generate Access Token (24h)
     │ 4. Generate Refresh Token (7d)
     │ 5. Store Refresh Token in DB
     │
     ▼
┌─────────┐
│ Client  │ Stores tokens in localStorage
└─────────┘
```

---

### 7.2 Authenticated Request Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ GET /api/devis
     │ Authorization: Bearer <accessToken>
     ▼
┌─────────────────┐
│ Auth Middleware │
└────┬────────────┘
     │
     │ 1. Extract token
     │ 2. Verify signature
     │ 3. Check expiration
     │ 4. Check user active
     │ 5. Attach user to req
     │
     ▼
┌─────────────────┐
│ Route Handler   │
└────┬────────────┘
     │
     │ Access req.user, req.tenantId
     │ Execute business logic
     │
     ▼
┌─────────┐
│ Response│
└─────────┘
```

---

### 7.3 Token Refresh Flow

```
┌─────────┐
│ Client  │ Access token expired
└────┬────┘
     │
     │ POST /api/auth/refresh
     │ { refreshToken }
     ▼
┌─────────────────┐
│   Backend API   │
└────┬────────────┘
     │
     │ 1. Verify refresh token
     │ 2. Check in DB (not revoked)
     │ 3. Generate new access token
     │ 4. Generate new refresh token (rotation)
     │ 5. Revoke old refresh token
     │ 6. Store new refresh token
     │
     ▼
┌─────────┐
│ Client  │ Updates stored tokens
└─────────┘
```

---

### 7.4 Logout Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ POST /api/auth/logout
     │ Authorization: Bearer <accessToken>
     ▼
┌─────────────────┐
│   Backend API   │
└────┬────────────┘
     │
     │ 1. Extract user_id from JWT
     │ 2. Revoke all refresh tokens for user
     │ 3. (Access token auto-expires, no blacklist)
     │
     ▼
┌─────────┐
│ Client  │ Removes tokens from localStorage
└─────────┘
```

---

## 8. PASSWORD SECURITY

### Password Hashing

```typescript
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

// Hash password (lors de l'inscription)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Verify password (lors du login)
async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

---

### Password Requirements

```typescript
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

function validatePassword(password: string): boolean {
  return PASSWORD_REGEX.test(password)
}

// Requirements:
// - Min 8 caractères
// - Au moins 1 minuscule
// - Au moins 1 majuscule
// - Au moins 1 chiffre
// - Au moins 1 caractère spécial (@$!%*?&)
```

---

## 9. RATE LIMITING

### Global Rate Limit

```typescript
import rateLimit from 'express-rate-limit'

// Global limiter: 100 req/min par IP
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 100,                 // Max 100 requests
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Usage: app.use(globalLimiter)
```

---

### Login Rate Limit

```typescript
// Login limiter: 5 tentatives / 15 min
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                    // Max 5 login attempts
  skipSuccessfulRequests: true,
  message: {
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Too many login attempts, please try again in 15 minutes'
    }
  }
})

// Usage: router.post('/login', loginLimiter, loginController)
```

---

### Upload Rate Limit

```typescript
// Upload limiter: 10 uploads / heure
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 heure
  max: 10,
  message: {
    error: {
      code: 'TOO_MANY_UPLOADS',
      message: 'Upload limit exceeded'
    }
  }
})
```

---

## 10. SECURITY HEADERS

### Helmet Configuration

```typescript
import helmet from 'helmet'

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.autobat.fr"]
    }
  },

  // HSTS (Strict-Transport-Security)
  hsts: {
    maxAge: 31536000,       // 1 an
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true
}))
```

---

## 11. CORS CONFIGURATION

```typescript
import cors from 'cors'

const allowedOrigins = [
  'https://autobat.fr',
  'https://www.autobat.fr',
  'http://localhost:5173'  // Dev only
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

---

## 12. SECURITY CHECKLIST

### Pre-Production

- [ ] **Secrets**
  - [ ] JWT_SECRET = 256-bit random (pas de valeur par défaut)
  - [ ] JWT_REFRESH_SECRET = 256-bit random
  - [ ] Aucun secret dans le code (tout dans .env)
  - [ ] .env dans .gitignore

- [ ] **Tokens**
  - [ ] Access token: 24h expiration
  - [ ] Refresh token: 7j expiration
  - [ ] Refresh token stored in DB (revocable)
  - [ ] Refresh token rotation enabled

- [ ] **Passwords**
  - [ ] bcrypt avec salt rounds = 10
  - [ ] Validation regex stricte
  - [ ] Reset password avec token expiration 1h

- [ ] **Rate Limiting**
  - [ ] Global: 100 req/min
  - [ ] Login: 5 attempts/15min
  - [ ] Upload: 10 files/hour

- [ ] **Headers**
  - [ ] Helmet configuré
  - [ ] HSTS enabled
  - [ ] CSP configured
  - [ ] CORS whitelist

- [ ] **Multi-tenant**
  - [ ] Middleware tenant isolation
  - [ ] Prisma middleware inject tenant_id
  - [ ] Vérification ownership sur toutes ressources

- [ ] **Audit**
  - [ ] npm audit sans vulnérabilités critiques
  - [ ] Dependencies à jour
  - [ ] Tests sécurité (injection SQL, XSS)

---

## RÉSUMÉ

**Authentication:** JWT Bearer Token
**Authorization:** Role-based + Resource ownership
**Multi-tenant:** tenant_id injection automatique
**Security:** Helmet + CORS + Rate Limiting + bcrypt

**Dossier 05-api complet !**
- ✅ endpoints.md (~80 routes)
- ✅ contracts.md (~60 types TypeScript)
- ✅ authentication.md (JWT, permissions, security)

**Prochaine étape:** Prêt pour le développement ! 🚀
