#!/bin/bash

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
ENV_FILE="$PROJECT_DIR/.env"
DB_CONTAINER=""

# Input file
INPUT_FILE=$1
if [ -z "$INPUT_FILE" ]; then
    echo "❌ Uso: bash scripts/import_assets.sh <archivo.tar.gz.gpg>"
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: No se encontró el archivo $INPUT_FILE"
    exit 1
fi

echo "🔓 Iniciando descifrado y restauración..."

# 1. Descifrar
TEMP_DIR=$(mktemp -d)
gpg -d "$INPUT_FILE" | tar -xz -C "$TEMP_DIR"

if [ $? -ne 0 ]; then
    echo "❌ Error al descifrar el archivo. Asegúrate de que la contraseña sea correcta."
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 2. Restaurar .env
if [ -f "$TEMP_DIR/.env" ]; then
    cp "$TEMP_DIR/.env" "$ENV_FILE"
    echo "✅ Archivo .env restaurado."
fi

# 3. Importar Base de Datos
DUMP_FILE="$TEMP_DIR/database.sql.gz"
if [ -f "$DUMP_FILE" ]; then
<<<<<<< HEAD
    # Load restored .env to get credentials
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi

=======
>>>>>>> origin/add-holiday-service-error-test-2732673805038106600
    # Determinar contenedor
    if docker ps | grep -q "secretary-db-prod"; then
        DB_CONTAINER="secretary-db-prod"
    elif docker ps | grep -q "secretary-db-dev"; then
        DB_CONTAINER="secretary-db-dev"
    fi

    if [ -z "$DB_CONTAINER" ]; then
        echo "⚠️  No se encontró un contenedor de base de datos encendido."
        echo "   El volcado se encuentra en: $DUMP_FILE"
    else
        echo "📦 Importando volcado a $DB_CONTAINER..."
<<<<<<< HEAD
        gunzip -c "$DUMP_FILE" | docker exec -i "$DB_CONTAINER" /usr/bin/mysql -u "${DB_USER:-root}" -p"${DB_PASSWORD}" "${DB_NAME:-clinical_management}"
=======
        gunzip -c "$DUMP_FILE" | docker exec -i "$DB_CONTAINER" /usr/bin/mysql -u root -pcima1255 clinical_management
>>>>>>> origin/add-holiday-service-error-test-2732673805038106600
        echo "✅ Base de datos importada exitosamente."
    fi
fi

# Limpiar
rm -rf "$TEMP_DIR"
echo "✨ Proceso completado!"
