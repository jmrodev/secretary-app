#!/bin/bash

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
ENV_FILE="$PROJECT_DIR/.env"
BUNDLE_NAME="secretary-assets-$(date +%Y%m%d)"
OUTPUT_FILE="$PROJECT_DIR/$BUNDLE_NAME.tar.gz.gpg"

echo "🔐 Iniciando proceso de empaquetado seguro..."

# 1. Determinar si usar backup dev o prod
if [ -f "$SCRIPTS_DIR/backup_prod.sh" ] && grep -q "secretary-db-prod" "$SCRIPTS_DIR/backup_prod.sh"; then
    echo "📦 Detectado entorno de producción. Ejecutando backup_prod.sh..."
    bash "$SCRIPTS_DIR/backup_prod.sh"
    # Buscar el último .gz en el directorio de backups de prod
    BACKUP_DIR=$(grep "BACKUP_DIR=" "$SCRIPTS_DIR/backup_prod.sh" | cut -d'"' -f2)
    LATEST_DUMP=$(ls -t "$BACKUP_DIR"/*.sql.gz | head -n1)
else
    echo "📦 Detectado entorno de desarrollo. Ejecutando backup_dev.sh..."
    bash "$SCRIPTS_DIR/backup_dev.sh"
    # Buscar el último .gz en el directorio de backups de dev
    BACKUP_DIR=$(grep "BACKUP_DIR=" "$SCRIPTS_DIR/backup_dev.sh" | cut -d'"' -f2)
    LATEST_DUMP=$(ls -t "$BACKUP_DIR/full"/*.sql.gz | head -n1)
fi

if [ ! -f "$LATEST_DUMP" ]; then
    echo "❌ Error: No se encontró el volcado de base de datos reciente."
    exit 1
fi

# 2. Crear bundle temporal
TEMP_DIR=$(mktemp -d)
cp "$ENV_FILE" "$TEMP_DIR/.env"
cp "$LATEST_DUMP" "$TEMP_DIR/database.sql.gz"

echo "📝 Archivos incluidos: .env y database.sql.gz"

# 3. Comprimir y cifrar
echo "🔑 Cifrando archivos... Se te pedirá una contraseña."
tar -cz -C "$TEMP_DIR" . | gpg -c --batch --yes --passphrase-fd 0 > "$OUTPUT_FILE" 2>/dev/null

# Limpiar
rm -rf "$TEMP_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Éxito! Archivo cifrado creado en: $OUTPUT_FILE"
    echo "⚠️  Recuerda la contraseña que usaste, la necesitarás para descifrarlo."
else
    echo "❌ Error al cifrar el archivo."
    exit 1
fi
