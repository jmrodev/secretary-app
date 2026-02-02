#!/bin/bash

# Configuration
BACKUP_DIR="/home/cima/Documentos/secretary-app/backups"
DEV_CONTAINER="secretary-db-dev"
PROD_CONTAINER="secretary-db-prod"
DB_NAME="clinical_management"
DB_USER="root"
DB_PASSWORD="cima1255"

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

echo "📦 Iniciando MIGRACIÓN de datos de Desarrollo a Producción..."

# 1. Backup de los datos reales (que están en el contenedor de dev)
echo "🔍 Extrayendo datos reales desde el contenedor de desarrollo..."
docker exec "$DEV_CONTAINER" /usr/bin/mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "${BACKUP_DIR}/REAL_DATA_MIGRATION_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    echo "✅ Datos reales extraídos correctamente."
    
    # 2. Restaurar en el contenedor de producción
    echo "🚀 Restaurando datos en el contenedor de PRODUCCIÓN..."
    cat "${BACKUP_DIR}/REAL_DATA_MIGRATION_${TIMESTAMP}.sql" | docker exec -i "$PROD_CONTAINER" /usr/bin/mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
    
    if [ $? -eq 0 ]; then
        echo "🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE."
        echo "✨ Ahora tu base de datos de producción tiene todos los pacientes y turnos reales."
        
        # Copia de seguridad al escritorio
        gzip -c "${BACKUP_DIR}/REAL_DATA_MIGRATION_${TIMESTAMP}.sql" > "/home/cima/Escritorio/BACKUP_DATOS_REALES_$(date +%d-%m-%y).sql.gz"
        echo "📁 Se ha guardado una copia de seguridad COMPLETA con tus datos en el Escritorio."
    else
        echo "❌ Error al restaurar datos en producción."
    fi
else
    echo "❌ Error al extraer datos de desarrollo."
fi
