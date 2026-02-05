const { spawn } = require('child_process');
const { pool } = require('../db');
const path = require('path');

/**
 * Tunnel Manager
 * Starts cloudflared tunnel and automatically updates the 'public_base_url'
 * in the system_settings table.
 */

let tunnelProcess = null;

function startTunnelManager() {
    if (tunnelProcess) {
        console.log('⚠️ Tunnel already running. Use refresh if needed.');
        return tunnelProcess;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const CLOUDFLARED_PATH = path.join(__dirname, '../cloudflared');
    const TARGET_URL = isProd ? 'http://client-prod:80' : 'http://client:5173';

    console.log(`🚀 Starting Tunnel Manager (${isProd ? 'PROD' : 'DEV'})...`);
    console.log(`📍 Targeting: ${TARGET_URL}`);

    // Check if binary exists
    const fs = require('fs');
    if (!fs.existsSync(CLOUDFLARED_PATH)) {
        console.error(`❌ Cloudflared binary not found at ${CLOUDFLARED_PATH}`);
        return;
    }

    tunnelProcess = spawn(CLOUDFLARED_PATH, ['tunnel', '--url', TARGET_URL]);

    tunnelProcess.stdout.on('data', (data) => {
        processData(data.toString());
    });

    tunnelProcess.stderr.on('data', (data) => {
        processData(data.toString());
    });

    async function processData(text) {
        // Look for the Cloudflare URL pattern
        const match = text.match(/https:\/\/(?!api)[a-z0-9-]+\.[a-z0-9-]+\.trycloudflare\.com/) || text.match(/https:\/\/(?!api)[a-z0-9-]{10,}\.trycloudflare\.com/);
        if (!match) {
            // Fallback to a slightly more specific one if needed
            const quickTunnelMatch = text.match(/https:\/\/[a-z0-9]+-[a-z0-9-]+\.trycloudflare\.com/);
            if (quickTunnelMatch && !quickTunnelMatch[0].includes('api.trycloudflare.com')) {
                const newUrl = quickTunnelMatch[0];
                updateUrl(newUrl);
            }
        } else {
            updateUrl(match[0]);
        }

        async function updateUrl(newUrl) {
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

    tunnelProcess.on('close', (code) => {
        console.log(`👋 Tunnel process exited with code ${code}`);
        tunnelProcess = null;
    });

    process.on('SIGINT', () => {
        if (tunnelProcess) tunnelProcess.kill();
    });

    return tunnelProcess;
}

function refreshTunnel() {
    console.log('🔄 Refreshing Tunnel...');
    if (tunnelProcess) {
        tunnelProcess.kill();
        tunnelProcess = null;
    }
    // Wait a bit before restarting to ensure port is free or clean exit
    setTimeout(() => {
        startTunnelManager();
    }, 2000);
}

module.exports = { startTunnelManager, refreshTunnel };
