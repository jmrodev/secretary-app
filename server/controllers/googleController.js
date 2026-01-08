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
            const expiry = tokens.expiry_date || (Date.now() + 3500 * 1000);
            // Per-Doctor Save
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
            // Fallback: System Global (Legacy/Backup)
            if (tokens.refresh_token) {
                await conn.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('google_refresh_token', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [tokens.refresh_token, tokens.refresh_token]);
            }
            if (tokens.access_token) {
                await conn.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('google_access_token', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [tokens.access_token, tokens.access_token]);
            }
            if (tokens.expiry_date) {
                await conn.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('google_token_expiry', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [tokens.expiry_date.toString(), tokens.expiry_date.toString()]);
            }
        }

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

    if (paymentStatus === 'paid') return '10'; // Basil (Green) for Paid
    if (paymentStatus === 'debt' || paymentStatus === 'partial') return '11'; // Tomato (Red) for Debt

    switch (status) {
        case 'confirmed': return '7'; // Peacock (Blue)
        case 'completed': return '10'; // Basil (Green)
        case 'cancelled': return '8'; // Graphite (Gray)
        case 'absent': return '4'; // Flamingo (Pink/Red)
        case 'pending': return '5'; // Banana (Yellow)
        default: return null;
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
            // or return 400 if user specifically asked to list.
            // Let's return error to UI so user knows to connect.
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

exports.updateEventHelper = async (doctorId, eventId, updates, userId = null) => {
    if (!eventId) return null;
    let conn;
    try {
        conn = await pool.getConnection();
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
        if (colorId) resource.colorId = colorId;

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
