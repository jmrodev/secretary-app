#!/bin/bash

# ==========================================
# SECRETARY APP - DUCKDNS AUTO-UPDATE
# ==========================================

DB_USER="root"
DB_PASS="cima1255"
DB_NAME="clinical_management"
DB_HOST="127.0.0.1"
DB_PORT="3307"

echo "📡 Iniciando actualización de DuckDNS..."

# 1. Obtener configuración desde la base de datos
DOMAIN=$(mariadb -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASS" $DB_NAME -N -s -e "SELECT setting_value FROM system_settings WHERE setting_key = 'duckdns_domain';")
TOKEN=$(mariadb -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASS" $DB_NAME -N -s -e "SELECT setting_value FROM system_settings WHERE setting_key = 'duckdns_token';")

if [ -z "$DOMAIN" ] || [ -z "$TOKEN" ]; then
    echo "❌ Error: No se encontró configuración de DuckDNS en la base de datos."
    exit 1
fi

echo "🔄 Actualizando dominio: $DOMAIN.duckdns.org"

# 2. Llamada a la API de DuckDNS
RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=")

if [ "$RESPONSE" = "OK" ]; then
    echo "✅ DuckDNS actualizado correctamente."
    
    # Actualizar la URL pública en la base de datos para que la app lo sepa
    PUBLIC_URL="http://$DOMAIN.duckdns.org"
    mariadb -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASS" $DB_NAME -e "INSERT INTO system_settings (setting_key, setting_value) VALUES ('public_base_url', '$PUBLIC_URL') ON DUPLICATE KEY UPDATE setting_value = '$PUBLIC_URL';"
else
    echo "❌ Error al actualizar DuckDNS. Respuesta: $RESPONSE"
    exit 1
fi
