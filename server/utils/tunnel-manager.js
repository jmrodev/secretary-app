const { spawn } = require('child_process');
const { pool } = require('../db');
const path = require('path');

/**
 * Tunnel Manager
 * Starts cloudflared tunnel and automatically updates the 'public_base_url'
 * in the system_settings table.
 */

function startTunnelManager() {
    const CLOUDFLARED_PATH = path.join(__dirname, '../cloudflared');
    const TARGET_URL = 'http://client:5173';

    console.log('🚀 Starting Tunnel Manager...');
    console.log(`📍 Targeting: ${TARGET_URL}`);

    // Check if binary exists
    const fs = require('fs');
    if (!fs.existsSync(CLOUDFLARED_PATH)) {
        console.error(`❌ Cloudflared binary not found at ${CLOUDFLARED_PATH}`);
        return;
    }

    const child = spawn(CLOUDFLARED_PATH, ['tunnel', '--url', TARGET_URL]);

    child.stdout.on('data', (data) => {
        processData(data.toString());
    });

    child.stderr.on('data', (data) => {
        processData(data.toString());
    });

    async function processData(text) {
        // Look for the Cloudflare URL pattern
        const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (match) {
            const newUrl = match[0];
            console.log(`✨ New Tunnel URL detected: ${newUrl}`);

            try {
                const key = 'public_base_url';
                await pool.query(
                    'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                    [key, newUrl, newUrl]
                );
                console.log('✅ Database updated successfully.');
            } catch (err) {
                console.error('❌ Failed to update database:', err.message);
            }
        }
    }

    child.on('close', (code) => {
        console.log(`👋 Tunnel process exited with code ${code}`);
    });

    process.on('SIGINT', () => {
        child.kill();
    });

    return child;
}

module.exports = { startTunnelManager };
