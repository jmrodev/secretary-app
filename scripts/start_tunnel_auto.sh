#!/bin/bash

# Configuration
LOG_FILE="/tmp/cloudflared_tunnel.log"
DB_USER="root"
DB_PASS="cima1255"
DB_NAME="clinical_management"

# Containers
DEV_CONTAINER="secretary-db-dev"
PROD_CONTAINER="secretary-db-prod"

echo "🚀 Iniciando Cloudflare Tunnel automatizado..."

# 1. Define Binary Path
CLOUDFLARED_BIN="/home/cima/Documentos/secretary-app/client/cloudflared"

if [ ! -f "$CLOUDFLARED_BIN" ]; then
    echo "❌ Error: No se encontró el binario en $CLOUDFLARED_BIN"
    # Fallback to server folder
    CLOUDFLARED_BIN="/home/cima/Documentos/secretary-app/server/cloudflared"
fi

if [ ! -f "$CLOUDFLARED_BIN" ]; then
    echo "❌ Error: No se encontró cloudflared en client/ ni server/."
    exit 1
fi

echo "✅ Usando binario: $CLOUDFLARED_BIN"

# 2. Kill existing cloudflared processes
pkill cloudflared 2>/dev/null

# 3. Start Tunnel
echo "📡 Conectando túnel..."
nohup "$CLOUDFLARED_BIN" tunnel --url http://localhost:8080 > "$LOG_FILE" 2>&1 &
PID=$!

# 4. Wait for URL
echo "⏳ Esperando URL pública..."
URL=""
MAX_RETRIES=20
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    sleep 1
    # Look for line like: https://cool-name-here.trycloudflare.com
    URL=$(grep -o 'https://[-a-zA-Z0-9]*\.trycloudflare\.com' "$LOG_FILE" | head -n 1)
    
    if [ ! -z "$URL" ]; then
        break
    fi
    echo -n "."
    COUNT=$((COUNT+1))
done

echo ""

if [ -z "$URL" ]; then
    echo "❌ No se pudo obtener la URL del túnel. Revisa el log: $LOG_FILE"
    kill $PID
    exit 1
fi

echo "✅ TÚNEL ACTIVO: $URL"
echo "---------------------------------------------------"

# 5. Helper Function to Update DB
update_db() {
    local CONTAINER=$1
    local ENV_NAME=$2
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
        echo "🔄 Actualizando $ENV_NAME ($CONTAINER)..."
        docker exec "$CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
            INSERT INTO system_settings (setting_key, setting_value) 
            VALUES ('public_base_url', '$URL') 
            ON DUPLICATE KEY UPDATE setting_value = '$URL';
        "
        
        if [ $? -eq 0 ]; then
            echo "   ✅ $ENV_NAME actualizado correctamente."
        else
            echo "   ❌ Error al actualizar $ENV_NAME."
        fi
    else
        echo "⚠️  Contenedor $ENV_NAME ($CONTAINER) no está corriendo. Omitido."
    fi
}

# 6. Apply to both environments
update_db "$DEV_CONTAINER" "DESARROLLO"
update_db "$PROD_CONTAINER" "PRODUCCIÓN"

echo "---------------------------------------------------"
echo "🎉 Proceso completado. La URL pública ha sido actualizada en las bases de datos activas."
echo "⚠️  No cierres esta terminal para mantener el túnel vivo (o usa nohup/background)."
echo "Presiona [CTRL+C] para detener el túnel."

# Wait indefinitely so the user can keep the tunnel running
wait $PID
