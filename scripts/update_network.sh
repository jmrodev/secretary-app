#!/bin/bash

# 1. Detect the Host's Primary LAN IP
IP=$(hostname -I | awk '{print $1}')

if [ -z "$IP" ]; then
  echo "❌ Error: Could not detect an IP address."
  exit 1
fi

echo "✅ New Network Detected: $IP"

# 2. Update the Database inside the Docker Container
echo "🔄 Updating Server Configuration..."

docker exec secretary-app-server-1 node -e "
const { pool } = require('./db');
const newUrl = 'http://$IP:5173';
pool.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (\"staff_base_url\", ?) ON DUPLICATE KEY UPDATE setting_value = ?', [newUrl, newUrl])
  .then(() => {
    console.log('✅ Database Updated: ' + newUrl);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error updating DB:', err);
    process.exit(1);
  });
"

echo "🎉 Done! Refresca la página de 'System Config' para ver el nuevo QR."
