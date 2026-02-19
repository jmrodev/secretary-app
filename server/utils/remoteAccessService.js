const axios = require('axios');
const systemSettingsRepository = require('../repositories/systemSettingsRepository');
const { startTunnelManager, stopTunnelManager, refreshTunnel: refreshCFTunnel } = require('./tunnel-manager');

/**
 * Remote Access Service
 * Manages both Cloudflare Tunnel and DuckDNS updates.
 */

let duckDnsInterval = null;

async function updateDuckDNS() {
    try {
        const methodRow = await systemSettingsRepository.findByKey('remote_access_method');
        const method = methodRow ? methodRow.setting_value : 'cloudflare';

        if (method !== 'duckdns') {
            stopDuckDNS();
            return;
        }

        const rows = await systemSettingsRepository.findManyByKeys(['duckdns_domain', 'duckdns_token']);

        const settings = {};
        rows.forEach(r => settings[r.setting_key] = r.setting_value);

        const { duckdns_domain: domain, duckdns_token: token } = settings;

        if (!domain || !token) {
            console.log('⚠️ DuckDNS: Missing domain or token. Skipping update.');
            return;
        }

        console.log(`🦆 DuckDNS: Updating domain '${domain}'...`);
        const response = await axios.get(`https://www.duckdns.org/update?domains=${domain}&token=${token}`);

        // DuckDNS responds with 'OK' (sometimes with more text like 'OK (ip)')
        if (response.data.includes('OK')) {
            console.log('✅ DuckDNS: Update successful.');

            const publicUrl = `http://${domain}.duckdns.org`;

            await systemSettingsRepository.upsert('public_base_url', publicUrl);
        } else {
            console.error('❌ DuckDNS: Update failed -', response.data);
        }
    } catch (err) {
        console.error('❌ DuckDNS Error:', err.message);
    }
}

function startDuckDNS() {
    if (duckDnsInterval) return;
    console.log('🚀 Starting DuckDNS Worker (every 30 mins)...');
    updateDuckDNS();
    duckDnsInterval = setInterval(updateDuckDNS, 30 * 60 * 1000); // 30 mins
}

function stopDuckDNS() {
    if (duckDnsInterval) {
        clearInterval(duckDnsInterval);
        duckDnsInterval = null;
        console.log('🛑 DuckDNS Worker stopped.');
    }
}

async function initRemoteAccess() {
    try {
        const rows = await systemSettingsRepository.findByKey('remote_access_method');
        const method = rows ? rows.setting_value : 'cloudflare';

        if (method === 'cloudflare') {
            stopDuckDNS();
            startTunnelManager();
        } else if (method === 'duckdns') {
            stopTunnelManager();
            startDuckDNS();
        } else {
            console.log('🌐 Remote Access: Disabled in settings.');
            stopTunnelManager();
            stopDuckDNS();
        }
    } catch (err) {
        console.error('Failed to init remote access:', err);
    }
}

async function refreshRemoteAccess() {
    const rows = await systemSettingsRepository.findByKey('remote_access_method');
    const method = rows ? rows.setting_value : 'cloudflare';

    if (method === 'cloudflare') {
        refreshCFTunnel();
    } else if (method === 'duckdns') {
        updateDuckDNS();
    }
}

module.exports = { initRemoteAccess, refreshRemoteAccess };
