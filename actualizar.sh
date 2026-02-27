#!/bin/bash

# ==========================================
# SECRETARY APP - QUICK REMOTE UPDATE
# ==========================================

echo "🔄 Iniciando actualización remota..."

# 1. Obtener cambios de GitHub
echo "📡 Bajando cambios desde GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Error al bajar cambios de Git. Revisa tu conexión o conflictos."
    exit 1
fi

# 2. Ejecutar el despliegue automático
echo "🏗️  Reconstruyendo contenedores..."
./scripts/deploy-auto.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "🎉 ¡ACTUALIZACIÓN COMPLETADA CON ÉXITO!"
    echo "=========================================="
    echo "La app ya está corriendo con la última versión."
else
    echo "❌ Hubo un error durante la reconstrucción de Docker."
    exit 1
fi
