#!/bin/bash

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"

PROD_CONTAINER="secretary-db-prod"
DEV_CONTAINER="secretary-db-dev"
DB_NAME="clinical_management"
DB_USER="root"
DB_PASSWORD="cima1255"

echo "🔄 Iniciando sincronización de DATOS (Base de Datos) PRODUCCIÓN -> DESARROLLO..."

# --- 1. Sincronización de Base de Datos ---
echo "📦 [1/3] Sincronizando Base de Datos..."

# Backup de seguridad de la base de datos de desarrollo actual
echo "  💾 Guardando backup de seguridad de la base de datos de desarrollo..."
mkdir -p "$BACKUP_DIR"
docker exec "$DEV_CONTAINER" /usr/bin/mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "${BACKUP_DIR}/pre_sync_dev_backup.sql"

# Volcado de datos desde PRODUCCIÓN
echo "  ⚡ Extrayendo datos reales desde PRODUCCIÓN..."
docker exec "$PROD_CONTAINER" /usr/bin/mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "${BACKUP_DIR}/prod_dump_for_sync.sql"

if [ $? -eq 0 ]; then
    echo "  ✅ Datos de producción extraídos."
    
    # Restauración en DESARROLLO
    echo "  🚀 Restaurando datos en DESARROLLO..."
    docker exec -i "$DEV_CONTAINER" /usr/bin/mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "${BACKUP_DIR}/prod_dump_for_sync.sql"
    
    if [ $? -eq 0 ]; then
        echo "  🎉 Base de datos sincronizada."
        rm "${BACKUP_DIR}/prod_dump_for_sync.sql"
    else
        echo "  ❌ Error al restaurar en Desarrollo."
        exit 1
    fi
else
    echo "  ❌ Error al extraer datos de Producción."
    exit 1
fi

# --- 2. Sincronización de Código (OPCIONAL/MANUAL) ---
# Se ha eliminado la sincronización automática de código para proteger la rama 'development'.
# Si deseas igualar el código a producción, hazlo manualmente con 'git pull origin main'.
echo "🖥️ [2/3] Sincronización de Código: Saltando (Protección de rama activa)..."

# --- 3. Reinicio de Servicios ---
echo "🔄 [3/3] Reiniciando contenedores de desarrollo..."
docker compose restart server client

if [ $? -eq 0 ]; then
    echo "  ✅ Servicios reiniciados correctamente."
else
    echo "  ⚠️ Error al reiniciar servicios, verifica manualmente con 'docker ps'."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ¡DATOS SINCRONIZADOS EXITOSAMENTE!"
echo "✨ Tu entorno de desarrollo ahora tiene datos reales de producción."
echo "⚠️  Nota: Tu código fue preservado (no se realizó git reset)."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
