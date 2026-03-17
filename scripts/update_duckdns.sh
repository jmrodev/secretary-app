#!/bin/bash

# ==========================================
# SECRETARY APP - DUCKDNS AUTO-UPDATE (DEBUG)
# ==========================================

DB_USER="root"
DB_PASS="cima1255"
DB_NAME="clinical_management"
DB_HOST="127.0.0.1"
DB_PORT="3310" # Default for production

echo "📡 Iniciando actualización de DuckDNS..."

# 1. Determinar puerto activo
echo "🔍 Verificando conexión a Base de Datos..."
if mariadb -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASS" -e "status" > /dev/null 2>&1; then
    echo "✅ Conectado a base de datos en puerto $DB_PORT"
else
    echo "⚠️  Fallo conexión en puerto $DB_PORT. Probando puerto 3307..."
    DB_PORT="3307"
    if mariadb -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASS" -e "status" > /dev/null 2>&1; then
        echo "✅ Conectado a base de datos en puerto $DB_PORT"
    else
        echo "❌ Error: No se pudo conectar a la base de datos en los puertos 3310 ni 3307."
        exit 1
    fi
fi

# 2. Obtener configuración
echo "📡 Consultando configuración en la base de datos..."
DOMAIN=$(mariadb -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASS" $DB_NAME -N -s -e "SELECT setting_value FROM system_settings WHERE setting_key = 'duckdns_domain';")
TOKEN=$(mariadb -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASS" $DB_NAME -N -s -e "SELECT setting_value FROM system_settings WHERE setting_key = 'duckdns_token';")

if [ -z "$DOMAIN" ] || [ -z "$TOKEN" ]; then
    echo "❌ Error: Faltan datos de DuckDNS en 'system_settings'."
    echo "Asegúrate de haber configurado 'duckdns_domain' y 'duckdns_token' en la base de datos."
    exit 1
fi

echo "🔄 Actualizando dominio: $DOMAIN.duckdns.org"

# 3. Llamada a la API de DuckDNS
RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=")

if [ "$RESPONSE" = "OK" ]; then
    echo "✅ DuckDNS actualizado correctamente."
    PUBLIC_URL="http://$DOMAIN.duckdns.org"
    mariadb -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASS" $DB_NAME -e "INSERT INTO system_settings (setting_key, setting_value) VALUES ('public_base_url', '$PUBLIC_URL') ON DUPLICATE KEY UPDATE setting_value = '$PUBLIC_URL';"
else
    echo "❌ Error al actualizar DuckDNS. Respuesta: $RESPONSE"
    exit 1
fi
