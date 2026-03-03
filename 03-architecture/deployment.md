# Déploiement & CI/CD - Autobat

## Vue d'ensemble

Déploiement sur **VPS Hostinger** avec :
- **OS** : Ubuntu 24.04 LTS
- **Web Server** : Nginx
- **Process Manager** : PM2
- **SSL** : Let's Encrypt (Certbot)
- **CI/CD** : GitHub Actions

---

## 1. CONFIGURATION VPS

### 1.1 Prérequis Serveur

**Specs minimales :**
- 2 vCPU
- 4 GB RAM
- 50 GB SSD
- Ubuntu 24.04 LTS

**Utilisateur :**
```bash
# Créer utilisateur non-root
sudo adduser autobat
sudo usermod -aG sudo autobat

# Se connecter avec cet utilisateur
su - autobat
```

---

### 1.2 Installation des dépendances

```bash
#!/bin/bash
# setup-vps.sh - À exécuter sur le VPS

set -e  # Exit on error

echo "🚀 Installation des dépendances Autobat"

# ═══════════════════════════════════════════════
# UPDATE SYSTEM
# ═══════════════════════════════════════════════
echo "📦 Mise à jour système..."
sudo apt update && sudo apt upgrade -y

# ═══════════════════════════════════════════════
# INSTALL NODE.JS 20 LTS
# ═══════════════════════════════════════════════
echo "📦 Installation Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Vérifier version

# ═══════════════════════════════════════════════
# INSTALL POSTGRESQL 16
# ═══════════════════════════════════════════════
echo "📦 Installation PostgreSQL 16..."
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Démarrer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql

# ═══════════════════════════════════════════════
# INSTALL NGINX
# ═══════════════════════════════════════════════
echo "📦 Installation Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# ═══════════════════════════════════════════════
# INSTALL PM2
# ═══════════════════════════════════════════════
echo "📦 Installation PM2..."
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd -u autobat --hp /home/autobat
# Copier et exécuter la commande retournée

# ═══════════════════════════════════════════════
# INSTALL CERTBOT (Let's Encrypt)
# ═══════════════════════════════════════════════
echo "📦 Installation Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# ═══════════════════════════════════════════════
# INSTALL GIT
# ═══════════════════════════════════════════════
echo "📦 Installation Git..."
sudo apt install -y git

# ═══════════════════════════════════════════════
# FIREWALL (UFW)
# ═══════════════════════════════════════════════
echo "🔒 Configuration firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status

echo "✅ Installation terminée !"
echo "Next steps:"
echo "  1. Configurer PostgreSQL (voir section 2)"
echo "  2. Configurer Nginx (voir section 3)"
echo "  3. Déployer l'application (voir section 4)"
```

**Rendre le script exécutable et lancer :**
```bash
chmod +x setup-vps.sh
./setup-vps.sh
```

---

## 2. CONFIGURATION POSTGRESQL

### 2.1 Créer base de données et utilisateur

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans psql:
```

```sql
-- Créer utilisateur
CREATE USER autobat_user WITH PASSWORD 'VOTRE_MOT_DE_PASSE_SECURISE';

-- Créer database
CREATE DATABASE autobat_prod OWNER autobat_user;

-- Accorder privilèges
GRANT ALL PRIVILEGES ON DATABASE autobat_prod TO autobat_user;

-- Activer extension UUID
\c autobat_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Quitter
\q
```

### 2.2 Sécuriser PostgreSQL

**Éditer pg_hba.conf :**
```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

**Modifier :**
```conf
# TYPE  DATABASE        USER            ADDRESS         METHOD

# Local connections
local   all             postgres                        peer
local   autobat_prod    autobat_user                    md5

# IPv4 local connections (localhost uniquement)
host    autobat_prod    autobat_user    127.0.0.1/32    md5

# Bloquer accès externe
# host    all             all             0.0.0.0/0       reject
```

**Redémarrer PostgreSQL :**
```bash
sudo systemctl restart postgresql
```

**Tester connexion :**
```bash
psql -h localhost -U autobat_user -d autobat_prod
# Entrer mot de passe
# Si connexion OK → \q pour quitter
```

---

## 3. CONFIGURATION NGINX

### 3.1 Configuration initiale (HTTP)

```bash
sudo nano /etc/nginx/sites-available/autobat
```

**Contenu :**
```nginx
# /etc/nginx/sites-available/autobat

# Redirect HTTP to HTTPS (après SSL configuré)
server {
    listen 80;
    listen [::]:80;
    server_name autobat.fr www.autobat.fr;

    # Temporairement servir l'app (avant SSL)
    # Cette section sera remplacée par redirect HTTPS après Certbot

    location / {
        root /var/www/autobat/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Activer le site :**
```bash
sudo ln -s /etc/nginx/sites-available/autobat /etc/nginx/sites-enabled/
sudo nginx -t  # Tester config
sudo systemctl restart nginx
```

---

### 3.2 Configuration SSL (Let's Encrypt)

**Obtenir certificat SSL :**
```bash
sudo certbot --nginx -d autobat.fr -d www.autobat.fr

# Suivre les instructions:
# - Entrer email
# - Accepter terms
# - Choisir redirect HTTP -> HTTPS (option 2)
```

**Certbot va automatiquement modifier la config Nginx.**

**Résultat (/etc/nginx/sites-available/autobat) :**
```nginx
# HTTP -> HTTPS redirect (généré par Certbot)
server {
    listen 80;
    listen [::]:80;
    server_name autobat.fr www.autobat.fr;

    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name autobat.fr www.autobat.fr;

    # SSL certificates (généré par Certbot)
    ssl_certificate /etc/letsencrypt/live/autobat.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autobat.fr/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Frontend (React build)
    location / {
        root /var/www/autobat/frontend/build;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # No cache HTML
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting (100 req/min)
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
    }

    # File uploads (photos chantiers)
    location /uploads {
        alias /var/www/autobat/storage/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    # PDF files (devis, factures)
    location /pdf {
        alias /var/www/autobat/storage/pdf;
        expires 1y;
        add_header Cache-Control "public";

        # Sécurité: vérifier que l'utilisateur est authentifié
        # (Géré par backend via signed URLs)
    }

    # Max upload size (photos)
    client_max_body_size 10M;
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
```

**Auto-renouvellement SSL :**
```bash
# Certbot crée automatiquement un cron job pour renouveler
sudo certbot renew --dry-run  # Tester renouvellement

# Vérifier cron:
sudo systemctl status certbot.timer
```

---

## 4. STRUCTURE DOSSIERS SERVEUR

```bash
# Créer structure
sudo mkdir -p /var/www/autobat/{frontend/build,backend,storage/{uploads,pdf},logs}
sudo chown -R autobat:autobat /var/www/autobat

# Structure finale:
/var/www/autobat/
├── frontend/
│   └── build/              (React build files)
│       ├── index.html
│       ├── assets/
│       └── service-worker.js
│
├── backend/
│   ├── dist/               (TypeScript compiled)
│   ├── node_modules/
│   ├── prisma/
│   ├── .env
│   ├── package.json
│   └── ecosystem.config.js
│
├── storage/
│   ├── uploads/            (Photos chantiers)
│   └── pdf/                (Devis, Factures)
│
└── logs/
    ├── 2026-02-12.log
    └── pm2/
```

---

## 5. DÉPLOIEMENT MANUEL (PREMIÈRE FOIS)

### 5.1 Backend

```bash
# Se connecter au VPS
ssh autobat@votre-ip

# Aller dans le dossier backend
cd /var/www/autobat/backend

# Cloner le repo (ou copier les fichiers)
git clone https://github.com/votre-username/autobat-backend.git .

# Installer dépendances
npm install --production

# Créer .env
nano .env
# Copier les variables d'environnement (voir tech-stack.md)

# Build TypeScript
npm run build

# Générer Prisma Client
npm run prisma:generate

# Lancer migrations
npm run prisma:migrate:prod

# (Optionnel) Seed data
npm run prisma:seed

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder PM2 config
pm2 save

# Vérifier
pm2 status
pm2 logs autobat-api
```

---

### 5.2 Frontend

```bash
# Sur votre machine locale (pas sur VPS):

# Build production
cd frontend
npm run build

# Résultat dans frontend/dist/

# Upload vers VPS (depuis local)
rsync -avz --delete dist/ autobat@votre-ip:/var/www/autobat/frontend/build/

# Ou via SCP:
scp -r dist/* autobat@votre-ip:/var/www/autobat/frontend/build/
```

---

## 6. CI/CD AVEC GITHUB ACTIONS

### 6.1 Secrets GitHub

**Ajouter dans Settings > Secrets and variables > Actions :**
- `VPS_HOST` - IP du VPS
- `VPS_USER` - autobat
- `VPS_SSH_KEY` - Clé SSH privée
- `DATABASE_URL` - URL PostgreSQL production
- `JWT_SECRET` - Secret JWT
- `JWT_REFRESH_SECRET` - Secret refresh token
- `SENDGRID_API_KEY` - API key SendGrid

---

### 6.2 Workflow Backend

**.github/workflows/deploy-backend.yml**
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # ═══════════════════════════════════════════
      # CHECKOUT CODE
      # ═══════════════════════════════════════════
      - name: Checkout code
        uses: actions/checkout@v4

      # ═══════════════════════════════════════════
      # SETUP NODE.JS
      # ═══════════════════════════════════════════
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      # ═══════════════════════════════════════════
      # INSTALL & BUILD
      # ═══════════════════════════════════════════
      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run linter
        working-directory: backend
        run: npm run lint

      - name: Build TypeScript
        working-directory: backend
        run: npm run build

      # ═══════════════════════════════════════════
      # DEPLOY TO VPS
      # ═══════════════════════════════════════════
      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "backend/dist,backend/package.json,backend/package-lock.json,backend/ecosystem.config.js,backend/prisma"
          target: "/var/www/autobat/"
          strip_components: 1

      # ═══════════════════════════════════════════
      # RESTART PM2
      # ═══════════════════════════════════════════
      - name: Restart Backend
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/autobat/backend
            npm ci --production
            npm run prisma:generate
            npm run prisma:migrate:prod
            pm2 reload ecosystem.config.js
            pm2 save
```

---

### 6.3 Workflow Frontend

**.github/workflows/deploy-frontend.yml**
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # ═══════════════════════════════════════════
      # CHECKOUT CODE
      # ═══════════════════════════════════════════
      - name: Checkout code
        uses: actions/checkout@v4

      # ═══════════════════════════════════════════
      # SETUP NODE.JS
      # ═══════════════════════════════════════════
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      # ═══════════════════════════════════════════
      # INSTALL & BUILD
      # ═══════════════════════════════════════════
      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run linter
        working-directory: frontend
        run: npm run lint

      - name: Build production
        working-directory: frontend
        run: npm run build
        env:
          VITE_API_URL: https://api.autobat.fr

      # ═══════════════════════════════════════════
      # DEPLOY TO VPS
      # ═══════════════════════════════════════════
      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "frontend/dist/*"
          target: "/var/www/autobat/frontend/build/"
          strip_components: 2
          rm: true  # Supprime anciens fichiers

      # ═══════════════════════════════════════════
      # RELOAD NGINX
      # ═══════════════════════════════════════════
      - name: Reload Nginx
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            sudo systemctl reload nginx
```

---

## 7. SCRIPTS UTILITAIRES

### 7.1 Backup Database

**backup-db.sh**
```bash
#!/bin/bash
# Backup PostgreSQL database

set -e

# Config
DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_DIR="/var/www/autobat/backups"
DB_NAME="autobat_prod"
DB_USER="autobat_user"
RETENTION_DAYS=30

# Create backup dir
mkdir -p $BACKUP_DIR

# Backup
echo "🗄️  Sauvegarde base de données..."
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > "$BACKUP_DIR/autobat-$DATE.sql.gz"

echo "✅ Backup créé: autobat-$DATE.sql.gz"

# Cleanup old backups (> 30 jours)
find $BACKUP_DIR -name "autobat-*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "🧹 Anciens backups supprimés (> $RETENTION_DAYS jours)"
```

**Automatiser avec cron :**
```bash
# Ouvrir crontab
crontab -e

# Ajouter (backup quotidien à 2h du matin)
0 2 * * * /var/www/autobat/scripts/backup-db.sh >> /var/www/autobat/logs/backup.log 2>&1
```

---

### 7.2 Restore Database

**restore-db.sh**
```bash
#!/bin/bash
# Restore PostgreSQL database from backup

set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore-db.sh <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1
DB_NAME="autobat_prod"
DB_USER="autobat_user"

echo "⚠️  ATTENTION: Cette opération va écraser la base actuelle."
read -p "Continuer ? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Annulé."
  exit 0
fi

# Drop & recreate DB
echo "🗑️  Suppression base actuelle..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Restore
echo "📥 Restauration backup..."
gunzip -c $BACKUP_FILE | psql -U $DB_USER -h localhost $DB_NAME

echo "✅ Base restaurée avec succès !"
```

---

### 7.3 Health Check

**health-check.sh**
```bash
#!/bin/bash
# Vérifier que tous les services fonctionnent

set -e

echo "🏥 Health Check Autobat"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# PostgreSQL
if sudo systemctl is-active --quiet postgresql; then
  echo "✅ PostgreSQL: Running"
else
  echo "❌ PostgreSQL: Down"
fi

# Nginx
if sudo systemctl is-active --quiet nginx; then
  echo "✅ Nginx: Running"
else
  echo "❌ Nginx: Down"
fi

# PM2
if pm2 list | grep -q "autobat-api.*online"; then
  echo "✅ Backend API: Running"
else
  echo "❌ Backend API: Down"
fi

# Disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
  echo "✅ Disk: ${DISK_USAGE}% used"
else
  echo "⚠️  Disk: ${DISK_USAGE}% used (high)"
fi

# Memory
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ $MEM_USAGE -lt 90 ]; then
  echo "✅ Memory: ${MEM_USAGE}% used"
else
  echo "⚠️  Memory: ${MEM_USAGE}% used (high)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## 8. MONITORING & LOGS

### 8.1 Consulter les logs

```bash
# Logs PM2
pm2 logs autobat-api
pm2 logs autobat-api --lines 100
pm2 logs autobat-api --err  # Errors only

# Logs applicatifs (Winston)
tail -f /var/www/autobat/logs/$(date +%Y-%m-%d).log

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

---

### 8.2 Métriques PM2

```bash
# Monitoring en temps réel
pm2 monit

# Dashboard web (optionnel)
pm2 install pm2-server-monit
# Ouvrir http://votre-ip:9000

# Générer rapport
pm2 report
```

---

## 9. ROLLBACK EN CAS D'ERREUR

### 9.1 Rollback Backend

```bash
# Se connecter au VPS
ssh autobat@votre-ip

# Aller dans le repo
cd /var/www/autobat/backend

# Revenir au commit précédent
git log --oneline  # Trouver le commit hash
git checkout <commit-hash>

# Rebuild
npm run build

# Reload PM2
pm2 reload ecosystem.config.js
```

---

### 9.2 Rollback Database

```bash
# Lister backups disponibles
ls -lh /var/www/autobat/backups/

# Restaurer
./scripts/restore-db.sh /var/www/autobat/backups/autobat-2026-02-11-020000.sql.gz
```

---

## 10. CHECKLIST AVANT DÉPLOIEMENT

### MVP Launch

- [ ] **Sécurité**
  - [ ] Secrets dans .env (pas dans Git)
  - [ ] JWT secrets = 256-bit random
  - [ ] PostgreSQL accessible uniquement localhost
  - [ ] Firewall (UFW) configuré
  - [ ] SSL/HTTPS activé (Let's Encrypt)
  - [ ] CORS whitelist configurée
  - [ ] Rate limiting activé

- [ ] **Performance**
  - [ ] Gzip activé (Nginx)
  - [ ] Static files cached (1 an)
  - [ ] PM2 cluster mode
  - [ ] Database indexes créés

- [ ] **Monitoring**
  - [ ] Logs rotation configurée
  - [ ] Backup DB quotidien (cron)
  - [ ] Health check script
  - [ ] Uptime monitoring (UptimeRobot)

- [ ] **Tests**
  - [ ] Backend API accessible (curl)
  - [ ] Frontend chargé (navigateur)
  - [ ] PWA installable (mobile)
  - [ ] Badgeage GPS fonctionne
  - [ ] PDFs générés correctement
  - [ ] Emails envoyés (SendGrid)

---

## Résumé

**Infrastructure prête :**
- ✅ VPS configuré (Ubuntu + Node + PostgreSQL + Nginx)
- ✅ SSL automatique (Let's Encrypt)
- ✅ CI/CD automatisé (GitHub Actions)
- ✅ Backups quotidiens
- ✅ Monitoring basique

**Prochaine étape :** 04-database/ (schéma complet)
