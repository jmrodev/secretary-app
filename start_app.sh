#!/bin/bash

# ==========================================
# SECRETARY APP - AUTO STARTUP
# ==========================================

echo "🚀 Starting Secretary App..."

# 1. Detect LAN IP
HOST_IP=$(hostname -I | awk '{print $1}')
if [ -z "$HOST_IP" ]; then
  HOST_IP="localhost"
fi

echo "📍 Network Detected: $HOST_IP"

# 2. Start Services (Background)
# We assume docker-compose is installed and user has permission
echo "🐳 Starting Docker Services..."
docker compose up -d

# 3. Wait for Services
echo "⏳ Waiting for services to be ready (this may take a moment)..."
# Wait for port 5173 (client) to be active
for i in {1..30}; do
  if curl -s http://localhost:5173 > /dev/null; then
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

# 4. Inject IP into Running Server
# We do this AFTER start so we don't need to rebuild or restart just for a config change
echo "🔄 Configuring Network..."
# Wait for server container to be reachable to run the command
sleep 2 
docker exec secretary-app-server-1 node -e "
const { pool } = require('./db');
const newUrl = 'http://$HOST_IP:5173';
pool.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (\"staff_base_url\", ?) ON DUPLICATE KEY UPDATE setting_value = ?', [newUrl, newUrl])
  .then(() => process.exit(0))
  .catch(() => process.exit(0)); 
"

echo "✅ App is Running!"
echo "👉 Staff Portal: http://localhost:5173"
echo "👉 Staff QR Link: http://$HOST_IP:5173"

# 5. Open Browser automatically
echo "🌐 Opening Browser..."
google-chrome "http://localhost:5173" > /dev/null 2>&1 &

# Keep terminal open so user can see status
echo ""
echo "Esta ventana se cerrará en 10 segundos..."
sleep 10
