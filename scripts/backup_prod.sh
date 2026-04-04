#!/bin/bash

# Configuration
# Load .env file automatically
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

BACKUP_DIR="$PROJECT_DIR/backups"
# Autodetect production database container
if docker ps --format '{{.Names}}' | grep -q "^secretary-db-prod$"; then
    DB_CONTAINER="secretary-db-prod"
elif docker ps --format '{{.Names}}' | grep -q "^secretary-db$"; then
    DB_CONTAINER="secretary-db"
else
    DB_CONTAINER="secretary-db-prod" # Fallback
fi

DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DESKTOP_DIR="$HOME/Escritorio"

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^$DB_CONTAINER$"; then
    echo "❌ Error: El contenedor de base de datos $DB_CONTAINER no está corriendo."
    exit 1
fi

echo "💾 Iniciando backup de la base de datos de producción ($DB_CONTAINER)..."


# Execute dump inside container and save to local disk
docker exec "$DB_CONTAINER" /usr/bin/mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "${BACKUP_DIR}/${FILENAME}"

# Check if success
if [ $? -eq 0 ]; then
    echo "✅ Backup local guardado en: ${BACKUP_DIR}/${FILENAME}"
    
    # Compress for space
    gzip "${BACKUP_DIR}/${FILENAME}"
    GZ_FILENAME="${FILENAME}.gz"
    
    # Copy a copy to Desktop as requested for visibility
    cp "${BACKUP_DIR}/${GZ_FILENAME}" "${DESKTOP_DIR}/BACKUP_SISTEMA_RECIENTE.sql.gz"
    
    echo "🚀 Copia de seguridad enviada al Escritorio: BACKUP_SISTEMA_RECIENTE.sql.gz"
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -type f -mtime +7 -delete
    echo "🧹 Backups antiguos eliminados (retenemos últimos 7 días)."
else
    echo "❌ Error al realizar el backup."
    exit 1
fi
