#!/bin/bash

# Configuration
BACKUP_DIR="/home/cima/Documentos/secretary-app/backups"
DB_CONTAINER="secretary-db-prod"
DB_NAME="clinical_management"
DB_USER="root"
# Idealmente usar variable de entorno
DB_PASSWORD="cima1255" 
DESKTOP_DIR="/home/cima/Escritorio"

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "💾 Iniciando backup de la base de datos de producción..."

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
