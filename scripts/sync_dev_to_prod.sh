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

echo "⚠️  ADVERTENCIA: Vas a sobrescribir la Base de Datos de PRODUCCIÓN con la de DESARROLLO."
echo "Pulse ENTER para continuar o Ctrl+C para cancelar..."
read

echo "🔄 Iniciando sincronización DESARROLLO -> PRODUCCIÓN..."

# --- 1. Sincronización de Base de Datos ---
echo "📦 [1/2] Sincronizando Base de Datos..."

# Backup de seguridad de la base de datos de PRODUCCIÓN actual
echo "  💾 Guardando backup de seguridad de PRODUCCIÓN..."
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
docker exec "$PROD_CONTAINER" /usr/bin/mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "${BACKUP_DIR}/pre_reverse_sync_prod_backup_$TIMESTAMP.sql"

# Volcado de datos desde DESARROLLO
echo "  ⚡ Extrayendo datos desde DESARROLLO..."
docker exec "$DEV_CONTAINER" /usr/bin/mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "${BACKUP_DIR}/dev_dump_for_sync.sql"

if [ $? -eq 0 ]; then
    echo "  ✅ Datos de desarrollo extraídos."
    
    # Restauración en PRODUCCIÓN
    echo "  🚀 Restaurando datos en PRODUCCIÓN..."
    docker exec -i "$PROD_CONTAINER" /usr/bin/mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "${BACKUP_DIR}/dev_dump_for_sync.sql"
    
    if [ $? -eq 0 ]; then
        echo "  🎉 Base de datos de Producción actualizada."
        rm "${BACKUP_DIR}/dev_dump_for_sync.sql"
    else
        echo "  ❌ Error al restaurar en Producción."
        exit 1
    fi
else
    echo "  ❌ Error al extraer datos de Desarrollo."
    exit 1
fi

# --- 2. Reinicio de Servicios de Producción ---
echo "🔄 [2/2] Reiniciando contenedores de producción para aplicar cambios..."
# Nota: Usamos el archivo compose de producción si existe
cd "$PROJECT_ROOT"
if [ -f "docker-compose.prod.yml" ]; then
    docker compose -f docker-compose.prod.yml restart server client
else
    docker restart secretary-server-prod secretary-client-prod 2>/dev/null || echo "⚠️ No se pudieron reiniciar los contenedores por nombre, verifique manualmente."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ¡SINCRONIZACIÓN INVERSA COMPLETADA!"
echo "✨ Producción ahora tiene los datos que la secretaria cargó en Desarrollo."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
