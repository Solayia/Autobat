#!/bin/bash
# ============================================================
# AUTOBAT — Setup VPS Hostinger Ubuntu 24.04
# Exécuter en root : bash setup-vps.sh
# ============================================================
set -e

DOMAIN="app.autobat.fr"
APP_USER="autobat"
APP_DIR="/var/www/autobat"
DB_NAME="autobat_prod"
DB_USER="autobat"
DB_PASS="CHANGER_CE_MOT_DE_PASSE"  # ← À changer avant d'exécuter

echo "=== [1/8] Mise à jour système ==="
apt-get update && apt-get upgrade -y
apt-get install -y curl git nginx certbot python3-certbot-nginx ufw

echo "=== [2/8] Installation Node.js 20 LTS ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version && npm --version

echo "=== [3/8] Installation PM2 ==="
npm install -g pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7

echo "=== [4/8] Installation PostgreSQL 16 ==="
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql && systemctl start postgresql

# Créer DB + user
sudo -u postgres psql << SQL
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SQL
echo "PostgreSQL : DB $DB_NAME créée"

echo "=== [5/8] Création user système + dossiers ==="
id -u $APP_USER &>/dev/null || useradd -m -s /bin/bash $APP_USER
mkdir -p $APP_DIR/{backend,frontend,uploads,logs}
chown -R $APP_USER:$APP_USER $APP_DIR

echo "=== [6/8] Configuration Nginx ==="
cat > /etc/nginx/sites-available/autobat << NGINX
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend (React build)
    location / {
        root $APP_DIR/frontend;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Uploads (fichiers statiques)
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 20M;
}
NGINX

ln -sf /etc/nginx/sites-available/autobat /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "=== [7/8] SSL Let's Encrypt ==="
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@autobat.fr

echo "=== [8/8] Firewall UFW ==="
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "============================================"
echo "VPS prêt ! Étapes suivantes :"
echo "1. Uploader le backend dans $APP_DIR/backend"
echo "2. Créer $APP_DIR/backend/.env (voir .env.example)"
echo "3. cd $APP_DIR/backend && npm ci --production"
echo "4. npx prisma migrate deploy"
echo "5. node seed-quick.js (si premier déploiement)"
echo "6. pm2 start ecosystem.config.js --env production"
echo "7. pm2 save && pm2 startup"
echo "8. Uploader le build frontend dans $APP_DIR/frontend"
echo "============================================"
