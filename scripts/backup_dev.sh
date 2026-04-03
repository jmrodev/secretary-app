#!/bin/bash

# Configuration
# Load .env file automatically
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

BACKUP_DIR="$PROJECT_DIR/backup_ddbb"
DATE=$(date +"%Y%m%d_%H%M%S")
# Updated to match docker-compose.yml dev container name
CONTAINER_NAME="secretary-db-dev" 
DB_USER=${DB_USER}
DB_PASS=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# Ensure directories exist
mkdir -p "$BACKUP_DIR/structure"
mkdir -p "$BACKUP_DIR/data"
mkdir -p "$BACKUP_DIR/full"

echo "[$(date)] Starting DEV backup..."

# 1. Structure only
echo "Backing up structure..."
docker exec "$CONTAINER_NAME" mysqldump -u "$DB_USER" -p"$DB_PASS" --no-data --skip-lock-tables "$DB_NAME" > "$BACKUP_DIR/structure/backup_schema_$DATE.sql"

# 2. Data only
echo "Backing up data..."
docker exec "$CONTAINER_NAME" mysqldump -u "$DB_USER" -p"$DB_PASS" --no-create-info --skip-lock-tables "$DB_NAME" > "$BACKUP_DIR/data/backup_data_$DATE.sql"

# 3. Full backup
echo "Backing up full database..."
docker exec "$CONTAINER_NAME" mysqldump -u "$DB_USER" -p"$DB_PASS" --skip-lock-tables "$DB_NAME" > "$BACKUP_DIR/full/backup_full_$DATE.sql"

# Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.sql" -type f -mtime +30 -delete

# Compress and Copy to Desktop
echo "Compressing and copying to Desktop..."
gzip -c "$BACKUP_DIR/full/backup_full_$DATE.sql" > "$BACKUP_DIR/full/backup_full_$DATE.sql.gz"
cp "$BACKUP_DIR/full/backup_full_$DATE.sql.gz" "/home/cima/Escritorio/BACKUP_SISTEMA_RECIENTE_DEV.sql.gz"

echo "[$(date)] DEV Backup completed successfully."
