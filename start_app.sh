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

# 3. Wait for Database (Optional but good for first run)
echo "⏳ Waiting for server..."
sleep 5

# 4. Inject IP into Running Server
# We do this AFTER start so we don't need to rebuild or restart just for a config change
echo "🔄 Configuring Network..."
docker exec secretary-app-server-1 node -e "
const { pool } = require('./db');
const newUrl = 'http://$HOST_IP:5173';
pool.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (\"staff_base_url\", ?) ON DUPLICATE KEY UPDATE setting_value = ?', [newUrl, newUrl])
  .then(() => process.exit(0))
  .catch(() => process.exit(0)); // Fail silent, don't stop boot
"

echo "✅ App is Running!"
echo "👉 Open: http://localhost:5173"
echo "👉 Staff QR Link: http://$HOST_IP:5173"

# Optional: Open Browser automatically
# xdg-open "http://localhost:5173"
