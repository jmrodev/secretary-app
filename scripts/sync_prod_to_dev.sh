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

echo "🔄 Iniciando sincronización TOTAL de PRODUCCIÓN -> DESARROLLO..."

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

# --- 2. Sincronización de Código (Git) ---
echo "🖥️ [2/3] Sincronizando Código con Producción (main)..."
cd "$PROJECT_ROOT" || exit 1

# Estacionar cambios locales por seguridad
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "  📥 Guardando cambios locales en stash (por si acaso)..."
git stash save "Sync auto-backup $TIMESTAMP"

# Traer cambios de origin y resetear al estado de producción
echo "  📡 Obteniendo última versión de origin/main..."
git fetch origin
git reset --hard origin/main

if [ $? -eq 0 ]; then
    echo "  ✅ Código igualado a producción (main)."
else
    echo "  ❌ Error al sincronizar el código."
    exit 1
fi

# --- 3. Reinicio de Servicios ---
echo "🔄 [3/3] Reiniciando contenedores de desarrollo..."
docker compose restart server client

if [ $? -eq 0 ]; then
    echo "  ✅ Servicios reiniciados correctamente."
else
    echo "  ⚠️ Error al reiniciar servicios, verifica manualmente con 'docker ps'."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ¡SINCRONIZACIÓN COMPLETADA EXITOSAMENTE!"
echo "✨ Tu entorno de desarrollo ahora es un espejo de producción."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
