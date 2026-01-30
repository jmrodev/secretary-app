#!/bin/bash

# Configuration
PROJECT_DIR="/home/cima/Documentos/secretary-app"
BACKUP_DIR="$PROJECT_DIR/backup_ddbb"
DATE=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="secretary-app-db-1"
DB_USER="root"
DB_PASS="cima1255"
DB_NAME="clinical_management"

# Ensure directories exist
mkdir -p "$BACKUP_DIR/structure"
mkdir -p "$BACKUP_DIR/data"
mkdir -p "$BACKUP_DIR/full"

echo "[$(date)] Starting backup..."

# 1. Structure only
echo "Backing up structure..."
docker exec "$CONTAINER_NAME" mysqldump -u "$DB_USER" -p"$DB_PASS" --no-data --skip-lock-tables "$DB_NAME" > "$BACKUP_DIR/structure/backup_schema_$DATE.sql"

# 2. Data only
echo "Backing up data..."
docker exec "$CONTAINER_NAME" mysqldump -u "$DB_USER" -p"$DB_PASS" --no-create-info --skip-lock-tables "$DB_NAME" > "$BACKUP_DIR/data/backup_data_$DATE.sql"

# 3. Full backup
echo "Backing up full database..."
docker exec "$CONTAINER_NAME" mysqldump -u "$DB_USER" -p"$DB_PASS" --skip-lock-tables "$DB_NAME" > "$BACKUP_DIR/full/backup_full_$DATE.sql"

# 4. Update the "latest" files used by Docker (optional, but requested by user to keep "latest version")
cp "$BACKUP_DIR/structure/backup_schema_$DATE.sql" "$PROJECT_DIR/server/01-schema.sql"
cp "$BACKUP_DIR/data/backup_data_$DATE.sql" "$PROJECT_DIR/server/02-seed.sql"

# Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.sql" -type f -mtime +30 -delete

echo "[$(date)] Backup completed successfully."
