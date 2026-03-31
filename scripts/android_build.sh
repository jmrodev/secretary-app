#!/bin/bash
echo "🏗️ Iniciando compilación de Android..."

cd /home/cima/Documentos/secretary-app/android_native

# Usar gradlew para compilar una versión Debug
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "🎉 ¡COMPILACIÓN EXITOSA!"
    echo "=========================================="
    # El APK ya se copia a la carpeta raíz de secretary-app vía android_native/..
    cp app/build/outputs/apk/debug/app-debug.apk ../secretary-app-v1.9.4-debug.apk
    echo "✅ APK disponible en la raíz del proyecto."
else
    echo "❌ Error en la compilación de Android."
    exit 1
fi
