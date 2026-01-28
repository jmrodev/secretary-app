const { google } = require('googleapis');
const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const bcrypt = require('bcrypt');

const SCOPES = [
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/calendar' // Added Calendar Scope
];

const getOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback';

    if (!clientId || !clientSecret) {
        throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

exports.getAuthUrl = (req, res) => {
    try {
        const oauth2Client = getOAuthClient();

        // Pass doctorId in state if provided
        const doctorId = req.query.doctorId;
        const state = doctorId ? JSON.stringify({ doctorId }) : undefined;

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Critical for refresh token
            scope: SCOPES,
            prompt: 'consent', // Force consent to ensure refresh token is returned
            state: state
        });
        res.json({ url });
    } catch (err) {
        console.error("Auth URL Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.oauthCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    let conn;
    try {
        const oauth2Client = getOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        console.log("GOOGLE AUTH DEBUG: Tokens received:", Object.keys(tokens));
        if (tokens.refresh_token) console.log("GOOGLE AUTH DEBUG: Refresh Token Present");
        else console.log("GOOGLE AUTH DEBUG: Refresh Token MISSING (User needs to revoke access or prompt=consent failed)");

        // Retrieve Doctor ID from State
        let doctorId = null;
        if (req.query.state) {
            try {
                const stateObj = JSON.parse(decodeURIComponent(req.query.state));
                doctorId = stateObj.doctorId;
            } catch (e) {
                console.error("Failed to parse state:", e);
            }
        }

        conn = await pool.getConnection();

        if (doctorId) {
            // ... (Doctor code omitted for brevity if no change, but let's keep it safe)
            const expiry = tokens.expiry_date || (Date.now() + 3500 * 1000);
            await conn.query(`
                INSERT INTO doctor_integrations (doctor_id, access_token, refresh_token, token_expiry)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                access_token = VALUES(access_token),
                refresh_token = IF(VALUES(refresh_token) IS NOT NULL AND VALUES(refresh_token) != '', VALUES(refresh_token), refresh_token),
                token_expiry = VALUES(token_expiry)
             `, [doctorId, tokens.access_token, tokens.refresh_token, expiry]);
            console.log(`Google Auth linked for Doctor ID: ${doctorId}`);
        } else {
            console.log("GOOGLE AUTH DEBUG: Saving Global Tokens to System Settings");
            // Fallback: System Global (Legacy/Backup)
            if (tokens.refresh_token) {
                await conn.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('google_refresh_token', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [tokens.refresh_token, tokens.refresh_token]);
                console.log("GOOGLE AUTH DEBUG: Refresh Token Saved to DB");
            } else {
                console.warn("GOOGLE AUTH WARNING: No refresh token to save!");
            }
            if (tokens.access_token) {
                await conn.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('google_access_token', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [tokens.access_token, tokens.access_token]);
            }
            if (tokens.expiry_date) {
                await conn.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('google_token_expiry', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [tokens.expiry_date.toString(), tokens.expiry_date.toString()]);
            }
        }

        // Determine redirect URL based on Referer or env, defaulting to standard dev port
        // Useful if dev server is on 5174, 5175, etc.
        // For now, let's try to be smart about the port if we can, or just stick to 5173.
        res.redirect('http://localhost:5173/config?status=success');

    } catch (err) {
        console.error("Callback Error:", err);
        res.redirect('http://localhost:5173/config?status=error');
    } finally {
        if (conn) conn.release();
    }
};

exports.getStatus = async (req, res) => {
    // If request has doctorId query param, check that specific doctor. 
    // Otherwise check global.
    const doctorId = req.query.doctorId;
    let conn;
    try {
        conn = await pool.getConnection();
        let connected = false;

        if (doctorId) {
            const [rows] = await conn.query("SELECT id FROM doctor_integrations WHERE doctor_id = ?", [doctorId]);
            connected = !!rows;
        } else {
            const [rows] = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'google_refresh_token'");
            connected = !!rows;
        }

        res.json({ connected });
    } catch (err) {
        console.error(err);
        res.status(500).json({ connected: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

exports.disconnect = async (req, res) => {
    const doctorId = req.body.doctorId;
    let conn;
    try {
        conn = await pool.getConnection();
        if (doctorId) {
            await conn.query("DELETE FROM doctor_integrations WHERE doctor_id = ?", [doctorId]);
            await logAction(req.user.user_id, 'GOOGLE_DISCONNECT', req.ip, `Disconnected Google Account for Doctor ${doctorId}`);
        } else {
            await conn.query("DELETE FROM system_settings WHERE setting_key IN ('google_refresh_token', 'google_access_token', 'google_token_expiry')");
            await logAction(req.user.user_id, 'GOOGLE_DISCONNECT', req.ip, 'Disconnected Global Google Account');
        }
        res.json({ message: "Disconnected" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

const getColorForStatus = (status, paymentStatus) => {
    // Google Calendar Colors (Standard):
    // 1: Lavender, 2: Sage, 3: Grape, 4: Flamingo, 5: Banana, 6: Tangerine, 
    // 7: Peacock (Blue), 8: Graphite, 9: Blueberry, 10: Basil (Green), 11: Tomato (Red)

    switch (status) {
        case 'confirmed':
            return '10'; // Basil (Green) - Confirmado

        case 'arrived':
            return '5'; // Banana (Yellow) - Llegó / En sala

        case 'completed':
            // For completed, payment status matters
            if (paymentStatus === 'paid') return '10'; // Basil (Green) - Pagado
            if (paymentStatus === 'debt' || paymentStatus === 'partial') return '11'; // Tomato (Red) - Deuda
            return '9'; // Blueberry (Blue) - Completado sin info de pago

        case 'absent':
            return '6'; // Tangerine (Orange) - Ausente

        case 'pending':
            return '2'; // Sage (soft green-gray) - Pendiente

        case 'cancelled':
            return null; // Cancelled appointments are not synced

        default:
            return null;
    }
};

const getTokens = async (conn, doctorId) => {
    let tokens = {};
    if (doctorId) {
        const [row] = await conn.query("SELECT * FROM doctor_integrations WHERE doctor_id = ?", [doctorId]);
        if (row) {
            tokens = {
                google_refresh_token: row.refresh_token,
                google_access_token: row.access_token,
                google_token_expiry: row.token_expiry
            };
        }
    } else {
        const rows = await conn.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('google_refresh_token', 'google_access_token', 'google_token_expiry')");
        if (rows && rows.length > 0) {
            rows.forEach(r => tokens[r.setting_key] = r.setting_value);
        }
    }
    return tokens;
};

exports.syncContact = async (patient) => {
    // Note: Contact sync is typically global (Patient Database). 
    // We will keep using Global Tokens for Contacts if available.
    // Or we could iterate all doctors? No, stick to Global or skip.
    try {
        let conn = await pool.getConnection();
        const tokens = await getTokens(conn, null); // Global
        conn.release();

        if (!tokens.google_refresh_token) {
            return;
        }

        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });

        // Auto-refresh handled by googleapis automatically if refresh_token is present

        const service = google.people({ version: 'v1', auth: oauth2Client });

        // 1. Search if contact exists (by email or phone? Patients might not have email. Let's use Name + Phone)
        // Note: Searching by phone is tricky in People API. Simplest backup strategy: Create if new.
        // Duplicate check is hard without storing the Google ResourceName in our DB.
        // TODO: For robust sync, we should store 'google_resource_name' in patients table.
        // For now, let's just create (Blind Backup) or Search by Name.

        const searchRes = await service.people.searchContacts({
            query: patient.full_name,
            readMask: 'names,phoneNumbers'
        });

        let resourceName = null;
        if (searchRes.data.results && searchRes.data.results.length > 0) {
            // Simple match: First result
            resourceName = searchRes.data.results[0].person.resourceName;
            console.log(`Google Sync: Found existing contact for ${patient.full_name} (${resourceName})`);
        }

        const names = patient.full_name.split(' ');
        const givenName = names.slice(0, -1).join(' ') || names[0];
        const familyName = names.length > 1 ? names[names.length - 1] : '';

        const contactBody = {
            names: [{ givenName: givenName, familyName: familyName }],
            phoneNumbers: patient.phone ? [{ value: patient.phone, type: 'mobile' }] : [],
            organizations: patient.insurance ? [{ name: patient.insurance, title: 'Obra Social' }] : [],
            biographies: [{ value: `DNI: ${patient.dni || 'N/A'}` }],
        };

        if (patient.dob) {
            const dob = new Date(patient.dob);
            if (!isNaN(dob)) {
                contactBody.birthdays = [{
                    date: {
                        year: dob.getFullYear(),
                        month: dob.getMonth() + 1,
                        day: dob.getDate()
                    }
                }];
            }
        }

        if (resourceName) {
            // Update
            // We need the etag to update.
            const getContact = await service.people.get({
                resourceName: resourceName,
                personFields: 'names,phoneNumbers,metadata,organizations,biographies,birthdays'
            });
            const etag = getContact.data.etag;

            await service.people.updateContact({
                resourceName: resourceName,
                updatePersonFields: 'names,phoneNumbers,organizations,biographies,birthdays',
                requestBody: { ...contactBody, etag }
            });
            await service.people.updateContact({
                resourceName: resourceName,
                updatePersonFields: 'names,phoneNumbers,organizations,biographies,birthdays',
                requestBody: { ...contactBody, etag }
            });
            console.log(`Google Sync: Updated contact ${patient.full_name}`);
            // Note: syncing is background, often no req.user available if called async from other controller.
            // If we want to log, we need the triggering user ID passed to syncContact.
        } else {
            // Create
            await service.people.createContact({
                requestBody: contactBody
            });
            console.log(`Google Sync: Created contact ${patient.full_name}`);
        }

    } catch (err) {
        console.error("Google Sync Failed:", err.message);
    }
};

exports.importContacts = async (req, res) => {
    const doctorId = req.body.doctorId;
    let conn;
    try {
        console.log(`Starting Google Import for Doctor ${doctorId || 'Global'}...`);
        conn = await pool.getConnection(); // Get connection first
        const tokens = await getTokens(conn, doctorId);

        if (!tokens.google_refresh_token) {
            return res.status(400).json({ error: "No Google account connected" });
        }

        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });

        const service = google.people({ version: 'v1', auth: oauth2Client });

        // Fetch all connections (looping through pages)
        let connections = [];
        let nextPageToken = undefined;

        do {
            const connectionsRes = await service.people.connections.list({
                resourceName: 'people/me',
                pageSize: 1000,
                pageToken: nextPageToken,
                personFields: 'names,phoneNumbers,organizations,biographies,birthdays,emailAddresses' // Added emailAddresses
            });
            const items = connectionsRes.data.connections || [];
            connections = connections.concat(items);
            nextPageToken = connectionsRes.data.nextPageToken;
            console.log(`Fetched page of ${items.length} contacts. Total so far: ${connections.length}`);
        } while (nextPageToken);

        console.log(`Finished fetching. Total contacts from Google: ${connections.length}`);

        // conn is already open
        const results = { created: 0, updated: 0, errors: 0 };

        for (const person of connections) {
            try {
                const name = person.names?.[0]?.displayName || '';
                if (!name) continue;

                const phone = person.phoneNumbers?.[0]?.value || '';

                // Extract Email
                const email = person.emailAddresses?.[0]?.value || null;

                // Extract Insurance from organizations first, then from bio if not found
                let insurance = person.organizations?.[0]?.name || '';

                let dob = null;

                if (person.birthdays?.[0]?.date) {
                    const d = person.birthdays[0].date;
                    if (d.year && d.month && d.day) {
                        dob = `${d.year}-${d.month}-${d.day}`;
                    }
                }

                // Format: "DNI: 1234..."
                let dni = '';
                const bio = person.biographies?.[0]?.value || '';
                const dniMatch = bio.match(/DNI:\s*(\w+)/i);
                if (dniMatch) dni = dniMatch[1];

                // Attempt to parse Insurance from notes as well if possible
                // (Assuming user might put it there)
                const osMatch = bio.match(/OS:\s*([^\n]+)/i);
                if (osMatch && !insurance) insurance = osMatch[1]; // Only set if insurance wasn't found in organizations

                // Logic: Search by Full Name in local DB
                const [existing] = await conn.query("SELECT id FROM patients WHERE full_name = ?", [name]);

                if (existing) {
                    // Update
                    await conn.query(`
                        UPDATE patients SET
                        phone = COALESCE(?, phone),
                        email = COALESCE(?, email),
                        insurance = COALESCE(?, insurance),
                        dob = COALESCE(?, dob),
                        dni = COALESCE(?, dni)
                        WHERE id = ?`,
                        [phone || null, email, insurance || null, dob || null, dni || null, existing.id]
                    );
                    results.updated++;
                } else {
                    // Create New Patient
                    // We need a user_id for the patient.
                    // Strategy: Create a 'ghost' user? Or standard user logic?
                    // Re-use createUser logic effectively:
                    const username = name.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 1000);
                    const password = Math.random().toString(36).slice(-8); // Random pwd
                    const hash = await bcrypt.hash(password, 10);

                    const resUser = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'patient')", [username, hash]);
                    const userId = resUser.insertId;

                    await conn.query("INSERT INTO patients (user_id, full_name, phone, email, insurance, dob, dni) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [userId, name, phone || null, email, insurance || null, dob || null, dni || null]);

                    results.created++;
                }

            } catch (err) {
                console.error("Error importing contact:", err);
                results.errors++;
            }
        }

        res.json({ message: "Import completed", results });
        await logAction(req, 'GOOGLE_IMPORT', `Imported/Synced: Created ${results.created}, Updated ${results.updated}, Errors ${results.errors}`);

    } catch (err) {
        console.error("Import Failed:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// --- Calendar Features ---

exports.listAppointments = async (req, res) => {
    const doctorId = req.query.doctorId;
    let conn;
    try {
        conn = await pool.getConnection(); // Get conn locally
        const tokens = await getTokens(conn, doctorId);

        if (!tokens.google_refresh_token) {
            // If checking specifically for a doctor and they aren't connected, return empty list (not error)
            // returning 400 caused frontend console spam. valid use case is "not connected" -> "no events".
            return res.json({ events: [] });
        }

        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // List events. Support range or default to next 10.
        const timeMin = req.query.start ? req.query.start : (new Date()).toISOString();
        const timeMax = req.query.end ? req.query.end : undefined;
        const maxResults = (req.query.start && req.query.end) ? 2500 : 10; // More results if range specified

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: maxResults,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items;
        res.json({ events });

    } catch (err) {
        console.error("Calendar List Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

exports.createAppointment = async (req, res) => {
    const { summary, description, startTime, endTime, doctorId } = req.body; // Expects doctorId
    let conn;
    try {
        conn = await pool.getConnection();
        const tokens = await getTokens(conn, doctorId);

        if (!tokens.google_refresh_token) {
            if (doctorId) return res.status(400).json({ error: "Doctor not connected to Google." });
            return res.status(400).json({ error: "No Google account connected" });
        }

        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const event = {
            summary: summary,
            description: description,
            start: {
                dateTime: startTime, // '2025-01-04T09:00:00-03:00'
                timeZone: 'America/Argentina/Buenos_Aires', // Hardcoded for now, or pass from frontend
            },
            end: {
                dateTime: endTime,
                timeZone: 'America/Argentina/Buenos_Aires',
            },
        };

        const result = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        res.json({ message: "Event created", eventId: result.data.id, link: result.data.htmlLink });
        // Use default username 'system' if req.user undefined (though verifyToken middleware should handle it)
        const userId = req.user ? req.user.user_id : null;
        if (userId) await logAction(req, 'CALENDAR_EVENT_CREATE', `Created Google Event: ${summary} for Doc ${doctorId || 'Global'}`);

    } catch (err) {
        console.error("Calendar Create Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }

};

exports.createEventHelper = async (doctorId, eventData, userId = null) => {
    let conn;
    try {
        conn = await pool.getConnection();

        // Check global sync setting
        const syncSetting = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'google_sync_enabled'");
        const isSyncEnabled = (syncSetting.length === 0) || (syncSetting[0].setting_value === 'true' || syncSetting[0].setting_value === '1');

        if (!isSyncEnabled) {
            console.log(`[Google] Sync PAUSED. Skipping createEvent for Doc ${doctorId}`);
            return null;
        }

        const tokens = await getTokens(conn, doctorId);

        if (!tokens.google_refresh_token) {
            console.log(`[Google] Doctor ${doctorId} not connected. Skipping event.`);
            return null;
        }

        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Ensure TimeZone is set if not provided
        if (!eventData.start.timeZone) eventData.start.timeZone = 'America/Argentina/Buenos_Aires';
        if (!eventData.end.timeZone) eventData.end.timeZone = 'America/Argentina/Buenos_Aires';

        const result = await calendar.events.insert({
            calendarId: 'primary',
            resource: eventData,
        });

        const mockReq = { user: { user_id: userId, username: 'System' }, ip: 'SYSTEM' };
        if (userId) await logAction(mockReq, 'CALENDAR_SYNC', `Synced Event ${result.data.id} to Doc ${doctorId}`);
        return result.data;

    } catch (err) {
        console.error("CreateHelper Error:", err);
        return null;
    } finally {
        if (conn) conn.release();
    }
};

exports.checkConflict = async (doctorId, startTime, endTime) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const tokens = await getTokens(conn, doctorId);

        if (!tokens.google_refresh_token) return false; // Not connected, can't check

        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const res = await calendar.freebusy.query({
            resource: {
                timeMin: startTime,
                timeMax: endTime,
                timeZone: 'America/Argentina/Buenos_Aires',
                items: [{ id: 'primary' }]
            }
        });

        const busy = res.data.calendars.primary.busy;
        return busy && busy.length > 0;
    } catch (err) {
        console.error("Conflict Check Error", err);
        return false;
    } finally {
        if (conn) conn.release();
    }
};

exports.getBusyIntervals = async (doctorId, startTime, endTime) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const tokens = await getTokens(conn, doctorId);

        if (!tokens.google_refresh_token) return []; // Not connected, can't check

        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const res = await calendar.freebusy.query({
            resource: {
                timeMin: startTime,
                timeMax: endTime,
                timeZone: 'America/Argentina/Buenos_Aires',
                items: [{ id: 'primary' }]
            }
        });

        return res.data.calendars.primary.busy || [];
    } catch (err) {
        console.error("Busy Intervals Error", err);
        return [];
    } finally {
        if (conn) conn.release();
    }
};

exports.updateEventHelper = async (doctorId, eventId, updates, userId = null) => {
    if (!eventId) return null;
    let conn;
    try {
        conn = await pool.getConnection();
        // Check global sync setting
        const syncSetting = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'google_sync_enabled'");
        const isSyncEnabled = (syncSetting.length === 0) || (syncSetting[0].setting_value === 'true' || syncSetting[0].setting_value === '1');

        if (!isSyncEnabled) {
            console.log(`[Google] Sync PAUSED. Skipping updateEvent for Doc ${doctorId}`);
            return null;
        }

        const tokens = await getTokens(conn, doctorId);

        if (!tokens.google_refresh_token) {
            console.log(`[Google] Doctor ${doctorId} not connected. Skipping update.`);
            return null;
        }

        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Build resource for patch
        const resource = {};
        if (updates.summary) resource.summary = updates.summary;
        if (updates.description) resource.description = updates.description;
        if (updates.start) resource.start = updates.start;
        if (updates.end) resource.end = updates.end;

        // Status/Payment based color
        const colorId = getColorForStatus(updates.status, updates.paymentStatus);
        resource.colorId = colorId || '0'; // '0' for default if no color defined

        const result = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            resource: resource,
        });

        const mockReq = { user: { user_id: userId, username: 'System' }, ip: 'SYSTEM' };
        if (userId) await logAction(mockReq, 'CALENDAR_SYNC_UPDATE', `Updated Google Event ${eventId} for Doc ${doctorId}`);
        return result.data;

    } catch (err) {
        console.error("UpdateHelper Error:", err.message);
        return null;
    } finally {
        if (conn) conn.release();
    }
};


exports.deleteEventHelper = async (doctorId, eventId, userId = null) => {
    if (!eventId) return null;
    let conn;
    try {
        conn = await pool.getConnection();
        // Check global sync setting
        const syncSetting = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'google_sync_enabled'");
        const isSyncEnabled = (syncSetting.length === 0) || (syncSetting[0].setting_value === 'true' || syncSetting[0].setting_value === '1');

        if (!isSyncEnabled) {
            console.log(`[Google] Sync PAUSED. Skipping deleteEvent for Doc ${doctorId}`);
            return true; // Return true to allow local deletion to proceed
        }

        const tokens = await getTokens(conn, doctorId);

        if (!tokens.google_refresh_token) {
            console.log(`[Google] Doctor ${doctorId} not connected. Skipping delete.`);
            return null;
        }

        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });

        const mockReq = { user: { user_id: userId, username: 'System' }, ip: 'SYSTEM' };
        if (userId) await logAction(mockReq, 'CALENDAR_SYNC_DELETE', `Deleted Google Event ${eventId} for Doc ${doctorId}`);
        return true;

    } catch (err) {
        // If 404 (Gone) or 410 (Deleted), consider it success
        if (err.code === 404 || err.code === 410) {
            return true;
        }
        console.error("DeleteEventHelper Error:", err.message);
        return false;
    } finally {
        if (conn) conn.release();
    }
};

exports.deleteEvent = async (req, res) => {
    const { eventId } = req.params;
    const { doctorId } = req.body; // Needs doctorId to find tokens
    let conn;
    try {
        if (!doctorId) {
            return res.status(400).json({ error: "Doctor ID required to delete Google Event" });
        }

        const success = await exports.deleteEventHelper(doctorId, eventId, req.user.user_id);

        if (success) {
            res.json({ message: "Google Event deleted" });
        } else {
            res.status(500).json({ error: "Failed to delete Google Event" });
        }

    } catch (err) {
        console.error("Delete Event Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.syncImportEvents = async (req, res) => {
    try {
        const { importFromGoogle } = require('../services/googleSyncImport');

        console.log("[GoogleImport] Manual sync triggered by user:", req.user.username);
        // await importFromGoogle(); // [DISABLED] 
        console.log("[GoogleImport] Skipped (One-Way Sync Configured)");

        res.json({ message: "Import is disabled (One-Way Sync Active). Uploads are processed automatically." });
        await logAction(req, 'GOOGLE_SYNC_IMPORT', 'Manual import skipped (One-Way Mode)');

    } catch (err) {
        console.error("Sync Import Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.retryFailedItems = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        // Reset retries for all pending or failed items, effectively putting them back in the queue
        // We set retries = 0. We can also reset status to 'pending' if it was 'failed'.
        await conn.query("UPDATE google_sync_queue SET retries = 0, status = 'pending', updated_at = NOW() WHERE retries >= 5"); // Focus on the stalled ones

        await logAction(req, 'GOOGLE_SYNC_RETRY', 'Reset retries for stalled sync items');
        res.json({ message: "Retry initiated for stalled items." });
    } catch (err) {
        console.error("Retry Failed Items Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// --- Sanitization Tool ---

exports.getAuditAppointments = async (req, res) => {
    let conn;
    try {
        const { start_date, end_date, doctor_id } = req.query;
        // Default range: From 'today' to 'today + 90 days' if not specified
        const start = start_date ? new Date(start_date) : new Date();
        const end = end_date ? new Date(end_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months

        // Format for SQL (YYYY-MM-DD)
        const sqlStart = start.toISOString().split('T')[0];
        const sqlEnd = end.toISOString().split('T')[0];

        conn = await pool.getConnection();

        // 1. Get Local Future Appointments
        let query = `
            SELECT a.id, a.appointment_date, a.reason, a.status, a.payment_status, a.type, a.google_event_id,
                   p.id as patient_id, p.full_name, p.dni, p.phone, p.email,
                   d.full_name as doctor_name, d.id as doctor_id
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE a.appointment_date >= ? AND a.appointment_date <= ?
        `;

        const queryParams = [sqlStart + ' 00:00:00', sqlEnd + ' 23:59:59'];

        if (doctor_id) {
            query += " AND a.doctor_id = ?";
            queryParams.push(doctor_id);
        }

        query += " ORDER BY a.appointment_date ASC";

        const localAppts = await conn.query(query, queryParams);

        // 2. [NEW] Fetch Google Events for comparison
        // We will do this per doctor to be safe, but mostly mainly one doctor active?
        // Let's optimize: Group by doctor.
        const doctors = [...new Set(localAppts.map(a => a.doctor_id))];
        // If doctor_id is filtered but NO local appointments found, we might still want to fetch Google Events for that doctor!
        // This is important for "Reverse Sync" (finding Google events that are NOT in App).
        if (doctor_id && !doctors.includes(parseInt(doctor_id))) {
            doctors.push(parseInt(doctor_id));
        }

        const googleEventsMap = {}; // Key: doctorId -> Array of events

        for (const docId of doctors) {
            try {
                const oauth2Client = getOAuthClient();
                const tokens = await getTokens(conn, docId);

                if (tokens.google_refresh_token) {
                    oauth2Client.setCredentials({
                        refresh_token: tokens.google_refresh_token,
                        access_token: tokens.google_access_token,
                        expiry_date: parseInt(tokens.google_token_expiry)
                    });
                    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

                    const listRes = await calendar.events.list({
                        calendarId: 'primary',
                        timeMin: start.toISOString(),
                        timeMax: end.toISOString(),
                        singleEvents: true,
                        orderBy: 'startTime'
                    });

                    // Simplify event structure for frontend
                    googleEventsMap[docId] = (listRes.data.items || []).map(ev => ({
                        id: ev.id,
                        summary: ev.summary,
                        description: ev.description,
                        start: ev.start.dateTime || ev.start.date,
                        end: ev.end.dateTime || ev.end.date,
                        status: ev.status
                    }));
                }
            } catch (gErr) {
                console.warn(`Audit Fetch Google Failed for Doc ${docId}:`, gErr.message);
            }
        }

        // 3. Merge Data for Frontend (Match by ID or Time)
        const combined = localAppts.map(local => {
            let googleMatch = null;
            const events = googleEventsMap[local.doctor_id] || [];

            // A. Match by ID
            if (local.google_event_id) {
                googleMatch = events.find(e => e.id === local.google_event_id);
            }

            // B. If not linked, finding potential "Ghost" match by time
            if (!googleMatch) {
                const localTime = new Date(local.appointment_date).getTime();
                // Custom Match Rule: Match if Google event is within the SAME HOUR block.
                // i.e., [11:00, 12:00). 11:00 is match, 11:59 is match. 12:00 is NOT match.
                // We assume user might have dragged the event within the slot block in Google.
                const oneHourMs = 60 * 60 * 1000;

                googleMatch = events.find(e => {
                    const gTime = new Date(e.start).getTime();
                    // Check if gTime is >= localTime AND gTime < (localTime + 1 hour)
                    return (gTime >= localTime && gTime < (localTime + oneHourMs));
                });

                if (googleMatch) {
                    local.suggested_match = true; // Flag to tell frontend "Found orphan at same time"
                }
            }

            return {
                ...local,
                google_data: googleMatch || null
            };
        });

        res.json(combined);

    } catch (err) {
        console.error("Get Audit Data Error:", err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.sanitizeAppointment = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const {
            patientName, patientDni, patientPhone, patientEmail, // Patient Data
            reason, status, paymentStatus, type // Appt Data
        } = req.body;

        conn = await pool.getConnection();

        // 1. Get Appointment to find Patient ID
        const [appt] = await conn.query("SELECT patient_id, doctor_id, appointment_date, google_event_id FROM appointments WHERE id = ?", [id]);
        if (!appt) return res.status(404).send("Appointment not found");

        const patientId = appt.patient_id;

        // 2. Update Patient Data (Clean the messy name)
        // Only update if provided
        if (patientId) {
            await conn.query(`
                UPDATE patients 
                SET full_name = ?, dni = ?, phone = ?, email = ?
                WHERE id = ?
            `, [patientName, patientDni || null, patientPhone || null, patientEmail || null, patientId]);
        }

        // 3. Update Appointment Data
        await conn.query(`
            UPDATE appointments 
            SET reason = ?, status = ?, payment_status = ?, type = ?
            WHERE id = ?
        `, [reason, status, paymentStatus, type, id]);

        // 4. Update Google Calendar (Sanitize Description)
        // Recalculate everything for the clean format
        // Duration
        const docData = await conn.query("SELECT appointment_duration FROM doctors WHERE id = ?", [appt.doctor_id]);
        const durationMinutes = (docData && docData.length > 0 && docData[0].appointment_duration) ? docData[0].appointment_duration : 60;

        const startTime = new Date(appt.appointment_date);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const newDescription = `Motivo: ${reason || 'Consulta'}\n` +
            `Paciente: ${patientName} (DNI: ${patientDni || 'N/A'})\n` +
            `Teléfono: ${patientPhone || 'N/A'}\n` +
            `Email: ${patientEmail || 'N/A'}\n` +
            `Tipo: ${type === 'virtual' ? 'VIRTUAL' : 'Presencial'}\n` +
            `Estado: ${status}\n` +
            `Pago: ${paymentStatus}\n` +
            `Creado por Aplicación de Secretaría`;

        const eventPayload = {
            summary: patientName, // Clean Name as Title
            description: newDescription,
            status: status,
            paymentStatus: paymentStatus, // For color helper
            // Ensure time is correct
            start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' }
        };

        if (appt.google_event_id) {
            // Update Existing Known Event
            try {
                const result = await exports.updateEventHelper(appt.doctor_id, appt.google_event_id, eventPayload, req.user.user_id);
                if (result) {
                    console.log(`[Sanitizer] Updated Google Event ${appt.google_event_id}`);
                } else {
                    console.warn(`[Sanitizer] Update returned null for ${appt.google_event_id}`);
                }
            } catch (e) {
                console.error("[Sanitizer] Google Update Failed:", e.message);
            }
        } else {
            // Case: No Google ID known locally.
            // Check if there is an event in Google at this time (Avoid Duplicates)
            let existingId = null;
            try {
                // We use checkConflict logic but we need the EVENT ID.
                // We iterate listed events for that window.
                // Window: slightly wider to capture start time matches
                const searchStart = new Date(startTime.getTime() - 60000).toISOString();
                const searchEnd = new Date(endTime.getTime() + 60000).toISOString();

                const oauth2Client = getOAuthClient();
                const tokens = await getTokens(conn, appt.doctor_id);
                if (tokens.google_refresh_token) {
                    oauth2Client.setCredentials({
                        refresh_token: tokens.google_refresh_token,
                        access_token: tokens.google_access_token,
                        expiry_date: parseInt(tokens.google_token_expiry)
                    });
                    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

                    const resList = await calendar.events.list({
                        calendarId: 'primary',
                        timeMin: searchStart,
                        timeMax: searchEnd,
                        singleEvents: true
                    });

                    const items = resList.data.items || [];
                    // Find strict overlap/match
                    const targetStartMs = startTime.getTime();

                    const match = items.find(ev => {
                        const evStart = new Date(ev.start.dateTime || ev.start.date).getTime();
                        // Tolerance of 1 minute
                        return Math.abs(evStart - targetStartMs) < 60000;
                    });

                    if (match) {
                        existingId = match.id;
                        console.log(`[Sanitizer] Found EXISTING Google Event ${existingId} at same time. Linking...`);
                    }
                }
            } catch (searchErr) {
                console.warn("[Sanitizer] Failed to search existing events:", searchErr.message);
            }

            if (existingId) {
                // Link and Update the OLD event with NEW clean data
                try {
                    const result = await exports.updateEventHelper(appt.doctor_id, existingId, eventPayload, req.user.user_id);
                    await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [existingId, id]);
                    console.log(`[Sanitizer] Linked and Updated Old Event ${existingId}`);
                } catch (e) {
                    console.error("[Sanitizer] Google Update (Link) Failed:", e.message);
                }
            } else {
                // Create New (Really new)
                try {
                    const result = await exports.createEventHelper(appt.doctor_id, eventPayload, req.user.user_id);
                    if (result && result.id) {
                        await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [result.id, id]);
                        console.log(`[Sanitizer] Created NEW Google Event ${result.id}`);
                    }
                } catch (e) {
                    console.error("[Sanitizer] Google Create Failed:", e.message);
                }
            }
        }

        res.json({ message: "Sanitized successfully" });
        await logAction(req, 'SANITIZE_APPOINTMENT', `Sanitized Appt ${id} - Patient: ${patientName}`);

    } catch (err) {
        console.error("Sanitization Error:", err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Sync Day to Google Calendar
 * Pushes all appointments from a specific date to Google Calendar
 * Creates new events or updates existing ones
 */
exports.syncDayToGoogle = async (req, res) => {
    const { doctorId, date } = req.body; // date: 'YYYY-MM-DD'
    let conn;

    try {
        if (!doctorId || !date) {
            return res.status(400).json({ error: "Doctor ID and date are required" });
        }

        conn = await pool.getConnection();

        // Check if sync is enabled globally
        const syncSetting = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'google_sync_enabled'");
        const isSyncEnabled = (syncSetting.length === 0) || (syncSetting[0].setting_value === 'true' || syncSetting[0].setting_value === '1');

        if (!isSyncEnabled) {
            return res.status(400).json({ error: "Google sync is currently disabled in system settings" });
        }

        // Check if doctor is connected to Google
        const tokens = await getTokens(conn, doctorId);
        if (!tokens.google_refresh_token) {
            return res.status(400).json({ error: "Doctor is not connected to Google Calendar" });
        }

        // Get all appointments for this doctor on this date (excluding cancelled)
        const appointments = await conn.query(`
            SELECT a.*, 
                   p.full_name as patient_name, 
                   p.phone as patient_phone,
                   COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END), 0) as amount_paid,
                   COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END), 0) as amount_debt
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN transactions t ON t.appointment_id = a.id
            WHERE a.doctor_id = ?
            AND DATE(a.appointment_date) = ?
            AND a.status != 'cancelled'
            GROUP BY a.id
            ORDER BY a.appointment_date ASC
        `, [doctorId, date]);

        console.log(`[SyncDay] Found ${appointments.length} appointments for doctor ${doctorId} on ${date}`);

        if (!appointments || appointments.length === 0) {
            console.log(`[SyncDay] No appointments to sync`);
            return res.json({
                message: "No appointments found for this date",
                created: 0,
                updated: 0,
                errors: 0,
                total: 0
            });
        }

        const results = { created: 0, updated: 0, errors: 0, total: appointments.length };
        console.log(`[SyncDay] Starting sync of ${appointments.length} appointments...`);

        // Process each appointment
        for (const appt of appointments) {
            try {
                console.log(`[SyncDay] Processing appt ${appt.id}: duration=${appt.duration}, amount_paid=${appt.amount_paid}, amount_debt=${appt.amount_debt}, payment_status=${appt.payment_status}`);
                const startTime = new Date(appt.appointment_date);
                const duration = appt.duration || 60; // Default to 60 minutes if not set
                const endTime = new Date(startTime.getTime() + duration * 60000); // duration in minutes

                // Build description in Spanish with all relevant info
                const statusLabels = {
                    'pending': 'Pendiente',
                    'confirmed': 'Confirmado',
                    'arrived': 'En sala',
                    'completed': 'Completado',
                    'absent': 'Ausente',
                    'cancelled': 'Cancelado'
                };

                const typeLabels = {
                    'consultation': 'Consulta',
                    'control': 'Control',
                    'procedure': 'Procedimiento',
                    'emergency': 'Emergencia'
                };

                let description = `Motivo: ${appt.reason || 'Consulta'}`;
                description += `\nEstado: ${statusLabels[appt.status] || appt.status}`;
                description += `\nTipo: ${typeLabels[appt.type] || appt.type || 'Consulta'}`;

                if (appt.patient_phone) {
                    description += `\nTeléfono: ${appt.patient_phone}`;
                }

                // Add payment information
                if (appt.payment_status === 'paid' && appt.amount_paid > 0) {
                    description += `\n💰 $${appt.amount_paid}`;
                } else if (appt.payment_status === 'debt' && appt.amount_debt > 0) {
                    description += `\n⚠️ $${appt.amount_debt}`;
                } else if (appt.payment_status === 'partial') {
                    if (appt.amount_paid > 0) description += `\n💰 $${appt.amount_paid}`;
                    if (appt.amount_debt > 0) description += `\n⚠️ $${appt.amount_debt}`;
                }

                const eventData = {
                    summary: appt.patient_name || 'Turno',
                    description: description,
                    start: {
                        dateTime: startTime.toISOString(),
                        timeZone: 'America/Argentina/Buenos_Aires'
                    },
                    end: {
                        dateTime: endTime.toISOString(),
                        timeZone: 'America/Argentina/Buenos_Aires'
                    }
                };

                // Add color based on status and payment
                const colorId = getColorForStatus(appt.status, appt.payment_status);
                eventData.colorId = colorId || '0'; // '0' for default if no color

                if (appt.google_event_id) {
                    // Update existing event
                    console.log(`[SyncDay] Updating existing event ${appt.google_event_id} for appointment ${appt.id}`);
                    const updateResult = await exports.updateEventHelper(
                        doctorId,
                        appt.google_event_id,
                        {
                            summary: eventData.summary,
                            description: eventData.description,
                            start: eventData.start,
                            end: eventData.end,
                            status: appt.status,
                            paymentStatus: appt.payment_status
                        },
                        req.user.user_id
                    );

                    if (updateResult) {
                        console.log(`[SyncDay] ✅ Successfully updated event ${appt.google_event_id}`);
                        results.updated++;
                    } else {
                        console.log(`[SyncDay] ⚠️ Update failed, trying to create new event for appointment ${appt.id}`);
                        // If update failed (maybe event was deleted), try creating new one
                        const createResult = await exports.createEventHelper(doctorId, eventData, req.user.user_id);
                        if (createResult) {
                            // Update appointment with new google_event_id
                            await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [createResult.id, appt.id]);
                            console.log(`[SyncDay] ✅ Created new event ${createResult.id} for appointment ${appt.id}`);
                            results.created++;
                        } else {
                            console.log(`[SyncDay] ❌ Failed to create event for appointment ${appt.id}`);
                            results.errors++;
                        }
                    }
                } else {
                    // Create new event
                    console.log(`[SyncDay] Creating new event for appointment ${appt.id} (${appt.patient_name})`);
                    const createResult = await exports.createEventHelper(doctorId, eventData, req.user.user_id);
                    if (createResult) {
                        // Save google_event_id to appointment
                        await conn.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [createResult.id, appt.id]);
                        console.log(`[SyncDay] ✅ Created event ${createResult.id} for appointment ${appt.id}`);
                        results.created++;
                    } else {
                        console.log(`[SyncDay] ❌ Failed to create event for appointment ${appt.id}`);
                        results.errors++;
                    }
                }
            } catch (err) {
                console.error(`Error syncing appointment ${appt.id}:`, err.message);
                results.errors++;
            }
        }

        console.log(`[SyncDay] Sync completed: ${results.created} created, ${results.updated} updated, ${results.errors} errors out of ${results.total} total`);

        await logAction(req, 'GOOGLE_SYNC_DAY', `Synced ${date} for Doctor ${doctorId}: ${results.created} created, ${results.updated} updated, ${results.errors} errors`);

        res.json({
            message: "Day sync completed",
            ...results
        });

    } catch (err) {
        console.error("Sync Day Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

