require('dotenv').config();
const { google } = require('googleapis');
const mysql = require('mysql2/promise');
const fs = require('fs');

async function debugGoogle() {
    try {
        const pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            password: 'cima1255',
            database: 'clinical_management',
            port: 3307
        });

        // 1. Get Tokens (Global)
        const [settings] = await pool.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'google_%'");
        let globalTokens = {};
        settings.forEach(r => globalTokens[r.setting_key] = r.setting_value);

        // 2. Get Tokens (Doctors)
        const [doctorIntegrations] = await pool.query("SELECT * FROM doctor_integrations");

        const allSources = [];
        if (globalTokens.google_refresh_token) allSources.push({ type: 'Global', tokens: globalTokens });
        doctorIntegrations.forEach(d => {
            allSources.push({
                type: `Doctor ${d.doctor_id}`,
                tokens: {
                    google_refresh_token: d.refresh_token,
                    google_access_token: d.access_token,
                    google_token_expiry: d.token_expiry
                }
            });
        });

        if (allSources.length === 0) {
            console.log("No connected accounts found (Global or Doctor).");
            process.exit(0);
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );


        const timeMin = '2026-01-05T00:00:00-03:00';
        const timeMax = '2026-01-05T23:59:59-03:00';

        console.log(`Fetching Google Events for ${timeMin} to ${timeMax}...`);

        for (const source of allSources) {
            console.log(`\n--- Source: ${source.type} ---`);
            try {
                oauth2Client.setCredentials({
                    refresh_token: source.tokens.google_refresh_token,
                    access_token: source.tokens.google_access_token,
                    expiry_date: parseInt(source.tokens.google_token_expiry)
                });

                const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

                const res = await calendar.events.list({
                    calendarId: 'primary',
                    timeMin: timeMin,
                    timeMax: timeMax,
                    singleEvents: true,
                    orderBy: 'startTime'
                });

                const events = res.data.items || [];
                console.log(`Found ${events.length} events.`);

                const output = events.map(e => ({
                    id: e.id,
                    summary: e.summary,
                    start: e.start.dateTime || e.start.date,
                    description: e.description
                }));

                console.log(JSON.stringify(output, null, 2));
            } catch (err) {
                console.error(`Failed for ${source.type}:`, err.message);
            }
        }

        pool.end();

    } catch (e) {
        console.error(e);
    }
}

debugGoogle();
