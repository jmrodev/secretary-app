#!/bin/bash
# Script para actualizar el archivo server/01-schema.sql desde la base de datos en ejecución (Docker)

echo "📦 Exportando el esquema actualizado de la base de datos..."

# Ejecutar mysqldump sin datos (--no-data), con procedimientos (--routines) y disparadores (--triggers)
docker exec secretary-db-dev mysqldump -u root -pcima1255 --no-data --routines --triggers clinical_management > server/01-schema.sql

if [ $? -eq 0 ]; then
  echo "✅ Archivo server/01-schema.sql actualizado con éxito!"
else
  echo "❌ Error al exportar el esquema de la base de datos."
fi
