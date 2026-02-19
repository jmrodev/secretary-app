const { spawn } = require('child_process');
const systemSettingsRepository = require('../repositories/systemSettingsRepository');
const path = require('path');
const fs = require('fs');

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
                await updateUrlInDb(newUrl);
            }
        } else {
            await updateUrlInDb(match[0]);
        }

        async function updateUrlInDb(newUrl) {
            console.log(`✨ New Tunnel URL detected: ${newUrl}`);
            try {
                await systemSettingsRepository.upsert('public_base_url', newUrl);
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

function stopTunnelManager() {
    if (tunnelProcess) {
        console.log('🛑 Stopping Cloudflare Tunnel...');
        tunnelProcess.kill();
        tunnelProcess = null;
    }
}

function refreshTunnel() {
    console.log('🔄 Refreshing Tunnel...');
    stopTunnelManager();
    // Wait a bit before restarting to ensure port is free or clean exit
    setTimeout(() => {
        startTunnelManager();
    }, 2000);
}

module.exports = { startTunnelManager, stopTunnelManager, refreshTunnel };
