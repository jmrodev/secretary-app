#!/bin/bash
echo "🏗️ Iniciando compilación de Android..."

cd /home/cima/Documentos/secretary-app/android_native

# Usar gradle del sistema para compilar una versión Debug
gradle assembleDebug

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "🎉 ¡COMPILACIÓN EXITOSA!"
    echo "=========================================="
    # Copiar el APK creado a la carpeta raíz para fácil acceso
    cp app/build/outputs/apk/debug/app-debug.apk ../secretary-app-v1.9.4-debug.apk
    echo "✅ APK disponible en: secretary-app-v1.9.4-debug.apk"
else
    echo "❌ Error en la compilación de Android."
    exit 1
fi
