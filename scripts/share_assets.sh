#!/bin/bash

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
ENV_FILE="$PROJECT_DIR/.env"
BUNDLE_NAME="secretary-assets-$(date +%Y%m%d)"
OUTPUT_FILE="$PROJECT_DIR/$BUNDLE_NAME.tar.gz.gpg"

echo "🔐 Iniciando proceso de empaquetado seguro..."

# 1. Determinar si usar backup dev o prod
LATEST_DUMP=""
if [ -f "$SCRIPTS_DIR/backup_prod.sh" ] && grep -q "secretary-db-prod" "$SCRIPTS_DIR/backup_prod.sh"; then
    echo "📦 Detectado entorno de producción. Ejecutando backup_prod.sh..."
    bash "$SCRIPTS_DIR/backup_prod.sh" || { echo "❌ Error al ejecutar backup_prod.sh"; exit 1; }
    
    # Buscar el último .gz en el directorio de backups de prod
    BACKUP_DIR=$(grep "BACKUP_DIR=" "$SCRIPTS_DIR/backup_prod.sh" | cut -d'"' -f2)
    LATEST_DUMP=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -n1)
else
    echo "📦 Detectado entorno de desarrollo. Ejecutando backup_dev.sh..."
    bash "$SCRIPTS_DIR/backup_dev.sh" || { echo "❌ Error al ejecutar backup_dev.sh"; exit 1; }
    LATEST_DUMP=$(ls -t "$PROJECT_DIR/backups"/*.sql.gz "$PROJECT_DIR/backup_ddbb"/*.sql.gz 2>/dev/null | head -n1)
fi

if [ -z "$LATEST_DUMP" ] || [ ! -f "$LATEST_DUMP" ]; then
    echo "❌ Error: No se encontró el volcado de base de datos reciente en ninguna de las rutas esperadas."
    exit 1
fi

# 2. Crear bundle temporal
TEMP_DIR=$(mktemp -d)
cp "$ENV_FILE" "$TEMP_DIR/.env"
cp "$LATEST_DUMP" "$TEMP_DIR/database.sql.gz"

echo "📝 Archivos incluidos: .env y $(basename "$LATEST_DUMP")"

# 3. Comprimir y cifrar
echo "🔑 Cifrando archivos... Se te pedirá una contraseña en la terminal."
# Eliminamos --batch para permitir la entrada interactiva de la contraseña
tar -cz -C "$TEMP_DIR" . | gpg -c --pinentry-mode loopback > "$OUTPUT_FILE"

# Limpiar
rm -rf "$TEMP_DIR"

if [ $? -eq 0 ] && [ -s "$OUTPUT_FILE" ]; then
    echo "✅ Éxito! Archivo cifrado creado en: $OUTPUT_FILE"
    echo "⚠️  Recuerda la contraseña que usaste, la necesitarás para descifrarlo."
else
    echo "❌ Error al cifrar el archivo o el archivo resultante está vacío."
    [ -f "$OUTPUT_FILE" ] && rm "$OUTPUT_FILE"
    exit 1
fi
