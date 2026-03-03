#!/bin/bash
# ============================================================
# AUTOBAT — Backup PostgreSQL quotidien
# Cron : 0 2 * * * /var/www/autobat/scripts/backup-db.sh
# ============================================================
set -e

DB_NAME="autobat_prod"
BACKUP_DIR="/var/backups/autobat"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Dump + compression
pg_dump $DB_NAME | gzip > "$BACKUP_DIR/autobat_${DATE}.sql.gz"

# Nettoyage anciens backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup créé : autobat_${DATE}.sql.gz"
