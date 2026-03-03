# Stack Technique Détaillé - Autobat

## Vue d'ensemble

Stack moderne JavaScript/TypeScript fullstack :
- **Frontend** : React 18 + TypeScript + Tailwind CSS
- **Backend** : Node.js 20 + Express + TypeScript
- **Database** : PostgreSQL 16 + Prisma ORM
- **Tooling** : Vite, ESLint, Prettier

---

## 1. FRONTEND

### 1.1 Core Dependencies

```json
{
  "dependencies": {
    // ═══════════════════════════════════════════════
    // REACT CORE
    // ═══════════════════════════════════════════════
    "react": "^18.3.1",
    "react-dom": "^18.3.1",

    // ═══════════════════════════════════════════════
    // ROUTING
    // ═══════════════════════════════════════════════
    "react-router-dom": "^6.22.0",
    // Routing côté client avec code splitting

    // ═══════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════
    // Context API (built-in React) suffit pour MVP
    // Si besoin: "zustand": "^4.5.0" (alternative légère à Redux)

    // ═══════════════════════════════════════════════
    // HTTP CLIENT
    // ═══════════════════════════════════════════════
    "axios": "^1.6.7",
    // Interceptors pour JWT, error handling

    // ═══════════════════════════════════════════════
    // FORMS & VALIDATION
    // ═══════════════════════════════════════════════
    "react-hook-form": "^7.50.1",
    // Forms performants avec validation

    "zod": "^3.22.4",
    // Schema validation TypeScript-first

    "@hookform/resolvers": "^3.3.4",
    // Bridge react-hook-form + zod

    // ═══════════════════════════════════════════════
    // UI FRAMEWORK
    // ═══════════════════════════════════════════════
    "tailwindcss": "^3.4.1",
    "@tailwindcss/forms": "^0.5.7",
    // Styling utility-first

    "clsx": "^2.1.0",
    // Conditional classNames utility

    "tailwind-merge": "^2.2.1",
    // Merge Tailwind classes intelligently

    // ═══════════════════════════════════════════════
    // UI COMPONENTS (Headless)
    // ═══════════════════════════════════════════════
    "@headlessui/react": "^1.7.18",
    // Modals, Dropdowns, Tabs (accessible)

    "@heroicons/react": "^2.1.1",
    // Icônes SVG optimisées

    // ═══════════════════════════════════════════════
    // DATE & TIME
    // ═══════════════════════════════════════════════
    "date-fns": "^3.3.1",
    // Date manipulation (alternative à moment.js)

    // ═══════════════════════════════════════════════
    // PWA & OFFLINE
    // ═══════════════════════════════════════════════
    "workbox-core": "^7.0.0",
    "workbox-precaching": "^7.0.0",
    "workbox-routing": "^7.0.0",
    "workbox-strategies": "^7.0.0",
    // Service Worker utilities

    "dexie": "^3.2.5",
    // IndexedDB wrapper (offline storage)

    // ═══════════════════════════════════════════════
    // GEOLOCATION
    // ═══════════════════════════════════════════════
    // Navigator API (built-in browser)
    // Pas de lib externe nécessaire

    // ═══════════════════════════════════════════════
    // PDF GENERATION
    // ═══════════════════════════════════════════════
    "@react-pdf/renderer": "^3.3.8",
    // Générer PDFs côté client (preview)
    // Production PDFs générés côté backend

    // ═══════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════
    "react-hot-toast": "^2.4.1",
    // Toast notifications élégantes

    // ═══════════════════════════════════════════════
    // CHARTS (Dashboard)
    // ═══════════════════════════════════════════════
    "recharts": "^2.12.0",
    // Charts React-friendly

    // ═══════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════
    "lodash-es": "^4.17.21"
    // Utility functions (debounce, throttle, etc.)
  },

  "devDependencies": {
    // ═══════════════════════════════════════════════
    // BUILD TOOL
    // ═══════════════════════════════════════════════
    "vite": "^5.1.0",
    "@vitejs/plugin-react": "^4.2.1",
    // Build ultra-rapide

    "vite-plugin-pwa": "^0.19.0",
    // PWA manifest + service worker generation

    // ═══════════════════════════════════════════════
    // TYPESCRIPT
    // ═══════════════════════════════════════════════
    "typescript": "^5.3.3",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@types/lodash-es": "^4.17.12",

    // ═══════════════════════════════════════════════
    // LINTING & FORMATTING
    // ═══════════════════════════════════════════════
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",

    "prettier": "^3.2.5",
    "prettier-plugin-tailwindcss": "^0.5.11",
    // Auto-sort Tailwind classes

    // ═══════════════════════════════════════════════
    // TESTING (V2)
    // ═══════════════════════════════════════════════
    "vitest": "^1.2.2",
    "@testing-library/react": "^14.2.1",
    "@testing-library/jest-dom": "^6.4.2"
  }
}
```

---

### 1.2 Configuration Vite

**vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'logo.png'],
      manifest: {
        name: 'Autobat',
        short_name: 'Autobat',
        description: 'Logiciel BTP qui apprend de vos chantiers',
        theme_color: '#1E40AF',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Cache API responses
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.autobat\.fr\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],

  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'utils-vendor': ['axios', 'date-fns', 'lodash-es']
        }
      }
    }
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

---

### 1.3 Configuration Tailwind

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette BTP
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1E40AF',
          900: '#1E3A8A'
        },
        secondary: {
          50: '#FEF3C7',
          500: '#F59E0B',
          700: '#B45309'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
```

---

### 1.4 Configuration TypeScript

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "strictNullChecks": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 2. BACKEND

### 2.1 Core Dependencies

```json
{
  "dependencies": {
    // ═══════════════════════════════════════════════
    // NODE.js & FRAMEWORK
    // ═══════════════════════════════════════════════
    "express": "^4.18.2",
    // Fast, minimalist web framework

    "cors": "^2.8.5",
    // Cross-Origin Resource Sharing

    "helmet": "^7.1.0",
    // Security headers middleware

    "compression": "^1.7.4",
    // Gzip compression

    // ═══════════════════════════════════════════════
    // DATABASE & ORM
    // ═══════════════════════════════════════════════
    "@prisma/client": "^5.9.1",
    // Prisma ORM client

    // ═══════════════════════════════════════════════
    // AUTHENTICATION
    // ═══════════════════════════════════════════════
    "jsonwebtoken": "^9.0.2",
    // JWT generation & verification

    "bcrypt": "^5.1.1",
    // Password hashing

    // ═══════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════
    "zod": "^3.22.4",
    // Schema validation (partagé avec frontend)

    "express-validator": "^7.0.1",
    // Request validation middleware

    // ═══════════════════════════════════════════════
    // RATE LIMITING & SECURITY
    // ═══════════════════════════════════════════════
    "express-rate-limit": "^7.1.5",
    // Rate limiting middleware

    "express-slow-down": "^2.0.1",
    // Slow down repeated requests

    // ═══════════════════════════════════════════════
    // FILE HANDLING
    // ═══════════════════════════════════════════════
    "multer": "^1.4.5-lts.1",
    // Multipart/form-data (file uploads)

    "sharp": "^0.33.2",
    // Image processing (resize, compress)

    // ═══════════════════════════════════════════════
    // PDF GENERATION
    // ═══════════════════════════════════════════════
    "puppeteer": "^22.2.0",
    // Headless Chrome (PDF from HTML)

    "handlebars": "^4.7.8",
    // Template engine pour PDFs

    // ═══════════════════════════════════════════════
    // EMAIL
    // ═══════════════════════════════════════════════
    "@sendgrid/mail": "^8.1.0",
    // SendGrid email service

    "nodemailer": "^6.9.9",
    // Alternative email (SMTP)

    // ═══════════════════════════════════════════════
    // CRON JOBS
    // ═══════════════════════════════════════════════
    "node-cron": "^3.0.3",
    // Schedule tasks

    // ═══════════════════════════════════════════════
    // LOGGING
    // ═══════════════════════════════════════════════
    "winston": "^3.11.0",
    // Logging library

    "winston-daily-rotate-file": "^4.7.1",
    // Rotate log files daily

    // ═══════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════
    "dotenv": "^16.4.1",
    // Environment variables

    "dayjs": "^1.11.10",
    // Date manipulation (lightweight)

    "uuid": "^9.0.1"
    // UUID generation
  },

  "devDependencies": {
    // ═══════════════════════════════════════════════
    // TYPESCRIPT
    // ═══════════════════════════════════════════════
    "typescript": "^5.3.3",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.16",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/uuid": "^9.0.8",

    // ═══════════════════════════════════════════════
    // BUILD TOOLS
    // ═══════════════════════════════════════════════
    "tsx": "^4.7.1",
    // Run TypeScript directly (dev)

    "tsup": "^8.0.1",
    // Bundle TypeScript (production)

    // ═══════════════════════════════════════════════
    // DATABASE
    // ═══════════════════════════════════════════════
    "prisma": "^5.9.1",
    // Prisma CLI (migrations, studio)

    // ═══════════════════════════════════════════════
    // LINTING & FORMATTING
    // ═══════════════════════════════════════════════
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",

    "prettier": "^3.2.5",

    // ═══════════════════════════════════════════════
    // DEVELOPMENT
    // ═══════════════════════════════════════════════
    "nodemon": "^3.0.3",
    // Auto-restart on file changes

    // ═══════════════════════════════════════════════
    // TESTING (V2)
    // ═══════════════════════════════════════════════
    "vitest": "^1.2.2",
    "supertest": "^6.3.4",
    "@types/supertest": "^6.0.2"
  }
}
```

---

### 2.2 Configuration TypeScript

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "lib": ["ES2022"],
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    /* Strict checks */
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/controllers/*": ["./src/controllers/*"],
      "@/services/*": ["./src/services/*"],
      "@/middleware/*": ["./src/middleware/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### 2.3 Package.json Scripts

```json
{
  "scripts": {
    // ═══════════════════════════════════════════════
    // DEVELOPMENT
    // ═══════════════════════════════════════════════
    "dev": "tsx watch src/index.ts",

    // ═══════════════════════════════════════════════
    // BUILD
    // ═══════════════════════════════════════════════
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "typecheck": "tsc --noEmit",

    // ═══════════════════════════════════════════════
    // PRODUCTION
    // ═══════════════════════════════════════════════
    "start": "node dist/index.js",

    // ═══════════════════════════════════════════════
    // DATABASE (Prisma)
    // ═══════════════════════════════════════════════
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:prod": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts",

    // ═══════════════════════════════════════════════
    // LINTING & FORMATTING
    // ═══════════════════════════════════════════════
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",

    // ═══════════════════════════════════════════════
    // TESTING (V2)
    // ═══════════════════════════════════════════════
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

---

### 2.4 PM2 Ecosystem Config

**ecosystem.config.js**
```javascript
module.exports = {
  apps: [{
    name: 'autobat-api',
    script: './dist/index.js',
    instances: 'max', // Utilise tous les CPU cores
    exec_mode: 'cluster',

    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // Logs
    error_file: './logs/pm2/error.log',
    out_file: './logs/pm2/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Monitoring
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,

    // Performance
    max_memory_restart: '500M',

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
}
```

---

## 3. DATABASE

### 3.1 PostgreSQL Configuration

**postgresql.conf (principales modifications)**
```conf
# CONNECTIONS
max_connections = 100
shared_buffers = 256MB

# PERFORMANCE
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# LOGGING
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# AUTOVACUUM (important pour performance)
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
```

---

### 3.2 Prisma Schema (extrait)

**prisma/schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [uuid_ossp]
}

// ═══════════════════════════════════════════════
// TENANTS
// ═══════════════════════════════════════════════
model Tenant {
  id                String   @id @default(uuid()) @db.Uuid
  nom               String
  siret             String   @unique
  adresse           String
  telephone         String
  email             String
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  // Relations
  users             User[]
  devis             Devis[]
  chantiers         Chantier[]
  factures          Facture[]
  catalogue         Ouvrage[]

  @@map("tenants")
}

// ═══════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════
model User {
  id            String   @id @default(uuid()) @db.Uuid
  tenant_id     String   @db.Uuid
  email         String
  password_hash String
  role          Role
  prenom        String
  nom           String
  telephone     String?
  actif         Boolean  @default(true)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  // Relations
  tenant        Tenant   @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  badgeages     Badgeage[]

  @@unique([tenant_id, email])
  @@index([tenant_id])
  @@index([email])
  @@map("users")
}

enum Role {
  SUPER_ADMIN
  COMPANY_ADMIN
  MANAGER
  EMPLOYEE
}

// Voir 04-database/schema.prisma pour le schéma complet
```

---

## 4. ENVIRONMENT VARIABLES

### 4.1 Backend (.env)

```bash
# ═══════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════
NODE_ENV=production
PORT=3000
APP_URL=https://autobat.fr
API_URL=https://api.autobat.fr

# ═══════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════
DATABASE_URL=postgresql://autobat_user:SECURE_PASSWORD@localhost:5432/autobat_prod?schema=public

# ═══════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════
JWT_SECRET=256_BIT_RANDOM_SECRET_HERE
JWT_REFRESH_SECRET=256_BIT_RANDOM_SECRET_HERE
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ═══════════════════════════════════════════════
# EMAIL (SendGrid)
# ═══════════════════════════════════════════════
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@autobat.fr
EMAIL_FROM_NAME=Autobat

# ═══════════════════════════════════════════════
# FILE STORAGE
# ═══════════════════════════════════════════════
UPLOAD_DIR=/var/www/autobat/storage/uploads
PDF_DIR=/var/www/autobat/storage/pdf
MAX_FILE_SIZE=10485760  # 10 MB

# ═══════════════════════════════════════════════
# MONITORING (Sentry - V2)
# ═══════════════════════════════════════════════
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# ═══════════════════════════════════════════════
# RATE LIMITING
# ═══════════════════════════════════════════════
RATE_LIMIT_WINDOW_MS=60000  # 1 minute
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.2 Frontend (.env.production)

```bash
# ═══════════════════════════════════════════════
# API
# ═══════════════════════════════════════════════
VITE_API_URL=https://api.autobat.fr
VITE_APP_URL=https://autobat.fr

# ═══════════════════════════════════════════════
# GEOLOCATION
# ═══════════════════════════════════════════════
VITE_GPS_CHECK_INTERVAL=60000  # 60 secondes

# ═══════════════════════════════════════════════
# PWA
# ═══════════════════════════════════════════════
VITE_APP_NAME=Autobat
VITE_APP_SHORT_NAME=Autobat
```

---

## 5. VERSIONING & COMPATIBILITY

### 5.1 Node.js & npm

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

**Pourquoi Node 20+ ?**
- ✅ Support natif fetch() API
- ✅ Performance améliorée (V8 engine)
- ✅ LTS jusqu'en avril 2026
- ✅ Support Top-level await

---

### 5.2 Navigateurs supportés

**Browserslist (package.json)**
```json
{
  "browserslist": [
    "defaults",
    "not IE 11",
    "maintained node versions",
    "> 0.5%",
    "last 2 versions",
    "Firefox ESR",
    "iOS >= 13",
    "Android >= 8"
  ]
}
```

**PWA Features :**
- ✅ Service Worker : Chrome 40+, Firefox 44+, Safari 11.1+
- ✅ IndexedDB : Tous navigateurs modernes
- ✅ Geolocation : Tous navigateurs modernes (HTTPS requis)

---

## 6. TOOLING

### 6.1 ESLint Configuration

**.eslintrc.json (backend)**
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

---

### 6.2 Prettier Configuration

**.prettierrc**
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

---

## 7. ALTERNATIVES CONSIDÉRÉES

### 7.1 Pourquoi pas Next.js ?

**Raisons :**
- ❌ Overkill pour notre use case (pas de SSR nécessaire)
- ❌ Complexité supplémentaire
- ❌ PWA support moins straightforward
- ✅ Vite + React suffit pour une SPA PWA

**Quand choisir Next.js :**
- Si besoin de SEO (pages publiques)
- Si besoin de SSR (server-side rendering)
- Si besoin d'API routes intégrées

---

### 7.2 Pourquoi pas tRPC ?

**Raisons :**
- ❌ Locking dans l'écosystème TypeScript
- ❌ Moins flexible pour API publique future
- ✅ REST API plus universel (mobile app future)

**Quand choisir tRPC :**
- Si fullstack TypeScript uniquement
- Si pas d'API publique prévue
- Si type-safety end-to-end critique

---

## Résumé

**Stack validé :**
- ✅ React 18 + Vite + TypeScript + Tailwind
- ✅ Node.js 20 + Express + TypeScript + Prisma
- ✅ PostgreSQL 16
- ✅ PWA avec Workbox + Dexie
- ✅ PM2 cluster mode

**Prochaine étape :** deployment.md (CI/CD, scripts déploiement)
