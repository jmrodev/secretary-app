
const fs = require('fs');
const mariadb = require('mariadb');
const { google } = require('googleapis');
require('dotenv').config({ path: './server/.env' });

const EXTRACTED_DATA_FILE = 'extracted_patients.json';
const REPORT_FILE = 'server/merge_report.json';

const getOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback';
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// Sync Function Logic within the script
const syncContact = async (conn, patient) => {
    // 1. Get Tokens from system_settings using the active connection
    const rows = await conn.execute("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('google_refresh_token', 'google_access_token', 'google_token_expiry')");
    let tokens = {};
    if (rows && rows.length > 0) {
        rows.forEach(r => tokens[r.setting_key] = r.setting_value);
    }

    if (!tokens.google_refresh_token) {
        console.log("Skipping sync: No refresh token found.");
        return;
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
        refresh_token: tokens.google_refresh_token,
        access_token: tokens.google_access_token,
        expiry_date: parseInt(tokens.google_token_expiry)
    });

    const service = google.people({ version: 'v1', auth: oauth2Client });

    // 2. Search Existing
    // Wait a bit to avoid rate limits
    await new Promise(r => setTimeout(r, 200));

    const searchRes = await service.people.searchContacts({
        query: patient.full_name,
        readMask: 'names,phoneNumbers,metadata'
    });

    let resourceName = null;
    let etag = null;

    if (searchRes.data.results && searchRes.data.results.length > 0) {
        resourceName = searchRes.data.results[0].person.resourceName;
        // Need to fetch etag
        const getContact = await service.people.get({
            resourceName: resourceName,
            personFields: 'names,metadata'
        });
        etag = getContact.data.etag;
        console.log(`  Found existing Google Contact: ${resourceName}`);
    }

    // 3. Prepare Body
    const names = patient.full_name.split(' ');
    const givenName = names.slice(0, -1).join(' ') || names[0];
    const familyName = names.length > 1 ? names[names.length - 1] : '';

    const contactBody = {
        names: [{ givenName: givenName, familyName: familyName }],
        phoneNumbers: patient.phone ? [{ value: patient.phone, type: 'mobile' }] : [],
        organizations: patient.insurance ? [{ name: patient.insurance, title: 'Obra Social' }] : [],
        biographies: [{ value: `DNI: ${patient.dni || 'N/A'}` }],
        // Address
        addresses: patient.address ? [{ formattedValue: patient.address, type: 'home' }] : []
    };

    // Add DOB
    if (patient.dob) {
        const d = new Date(patient.dob);
        if (!isNaN(d)) {
            contactBody.birthdays = [{
                date: {
                    year: d.getFullYear(),
                    month: d.getMonth() + 1,
                    day: d.getDate()
                }
            }];
        }
    }

    // 4. Update or Create
    if (resourceName && etag) {
        await service.people.updateContact({
            resourceName: resourceName,
            updatePersonFields: 'names,phoneNumbers,organizations,biographies,addresses,birthdays',
            requestBody: { ...contactBody, etag }
        });
        console.log(`  Updated Google Contact: ${patient.full_name}`);
    } else {
        await service.people.createContact({
            requestBody: contactBody
        });
        console.log(`  Created new Google Contact: ${patient.full_name}`);
    }
};

async function mergePatients() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mariadb.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: 3307
        });
        console.log('Connected.');

        // 1. Load extracted data
        if (!fs.existsSync(EXTRACTED_DATA_FILE)) {
            console.error(`File ${EXTRACTED_DATA_FILE} not found.`);
            return;
        }
        const extractedPatients = JSON.parse(fs.readFileSync(EXTRACTED_DATA_FILE, 'utf8'));
        console.log(`Loaded ${extractedPatients.length} extracted patient records.`);

        // 2. Fetch all existing patients
        const records = await connection.execute('SELECT id, full_name, dni, address, insurance, phone, dob, email FROM patients');
        console.log(`Fetched ${records.length} existing patients from DB.`);

        // Helper to clean DB names
        const cleanName = (name) => {
            if (!name) return '';
            let cleaned = name.toLowerCase();
            // Remove 'pac' prefix variants
            cleaned = cleaned.replace(/^pac[\s.]+/i, '');
            // Remove content in parentheses
            cleaned = cleaned.replace(/\([^)]+\)/g, '');
            // Remove common noise words if any?
            // Remove accents
            cleaned = cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return cleaned.trim().replace(/\s+/g, ' '); // Normalize spaces
        };

        const dbPatientsMap = new Map();
        records.forEach(p => {
            if (p.full_name) {
                // We map the CLEANED name to the patient record
                const cleaned = cleanName(p.full_name);
                if (cleaned) {
                    // Note: Potential collision if two patients have same cleaned name 
                    // (e.g. "Juan Perez (Ceci)" and "Juan Perez (Carlos)")
                    // We'll keep the first one or maybe array? 
                    // For now, simple map.
                    if (!dbPatientsMap.has(cleaned)) {
                        dbPatientsMap.set(cleaned, p);
                    }
                }
            }
        });

        let matchedCount = 0;
        let updatedCount = 0;
        let unmatchedPatients = [];
        let updatesLog = [];

        // 3. Iterate and merge
        for (const extracted of extractedPatients) {
            let originalName = extracted.name || extracted.name_from_file || '';
            let nameToSearch = cleanName(originalName);

            if (!nameToSearch) {
                unmatchedPatients.push({ reason: 'No name found', data: extracted });
                continue;
            }

            // Attempt match on cleaned name
            let dbPatient = dbPatientsMap.get(nameToSearch);

            // Fuzzy match fallback (e.g. if one has middle name and other doesn't?)
            // "Adriana Alejandra Viscoimi" vs "Adriana Viscoimi"
            if (!dbPatient) {
                // Try to find if one contains the other?
                for (const [key, val] of dbPatientsMap.entries()) {
                    // Check if key contains nameToSearch or vice versa
                    // Be careful with short names
                    if (key.length > 4 && nameToSearch.length > 4) {
                        if (key.includes(nameToSearch) || nameToSearch.includes(key)) {
                            dbPatient = val;
                            break;
                        }
                    }
                }
            }

            if (dbPatient) {
                matchedCount++;
                let updates = [];
                let updateValues = [];
                let sqlParts = [];

                const checkUpdate = (field, extractedVal) => {
                    // Only update if DB field is null/empty/default and we have a value
                    // Check specifically if phone is just "+" or similar garbage?
                    // Assuming empty or null.
                    if ((!dbPatient[field] || dbPatient[field] === '') && extractedVal) {
                        sqlParts.push(`${field} = ?`);
                        updateValues.push(extractedVal);
                        updates.push(`${field}: ${extractedVal}`);
                    }
                };

                checkUpdate('dni', extracted.dni);
                checkUpdate('address', extracted.address);
                checkUpdate('insurance', extracted.insurance);
                checkUpdate('phone', extracted.phone);

                if ((!dbPatient.dob) && extracted.dob) {
                    // Try robust date parsing
                    // Expected format: DD/MM/YYYY
                    const dobMatch = extracted.dob.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                    if (dobMatch) {
                        const day = dobMatch[1].padStart(2, '0');
                        const month = dobMatch[2].padStart(2, '0');
                        const year = dobMatch[3];
                        const isoDate = `${year}-${month}-${day}`;

                        // Check if valid date
                        const d = new Date(isoDate);
                        if (!isNaN(d.getTime())) {
                            sqlParts.push(`dob = ?`);
                            updateValues.push(isoDate);
                            updates.push(`dob: ${isoDate}`);
                        }
                    } else {
                        updatesLog.push({
                            patient: dbPatient.full_name,
                            warning: `Invalid DOB format ignored: ${extracted.dob}`
                        });
                    }
                }

                if (updates.length > 0) {
                    const sql = `UPDATE patients SET ${sqlParts.join(', ')} WHERE id = ?`;
                    updateValues.push(dbPatient.id);

                    try {
                        await connection.execute(sql, updateValues);
                        updatedCount++;
                        updatesLog.push({
                            patient: dbPatient.full_name,
                            matchType: 'Cleaned/Fuzzy',
                            updates: updates
                        });

                        // --- SYNC ---
                        try {
                            // console.log(`Syncing ${dbPatient.full_name} to Google...`);
                            const [fullPatient] = await connection.execute('SELECT * FROM patients WHERE id = ?', [dbPatient.id]);
                            if (fullPatient) {
                                await syncContact(connection, fullPatient);
                                // Rate Limit Protection: Sleep 1s
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        } catch (syncErr) {
                            console.error(`Failed to sync ${dbPatient.full_name}:`, syncErr.message);
                            updatesLog[updatesLog.length - 1].syncError = syncErr.message;
                            // Sleep even on error to be safe
                            await new Promise(resolve => setTimeout(resolve, 1500));
                        }

                    } catch (sqlErr) {
                        console.error(`Failed to update DB for ${dbPatient.full_name}:`, sqlErr.message);
                        updatesLog.push({
                            patient: dbPatient.full_name,
                            error: `SQL Update Failed: ${sqlErr.message}`
                        });
                    }
                }

            } else {
                unmatchedPatients.push({
                    reason: 'Name Not Found',
                    searchedName: nameToSearch,
                    originalName: originalName,
                    sourceFile: extracted.source_file
                });
            }
        }

        console.log('--- Merge Complete ---');
        console.log(`Matched: ${matchedCount}`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Unmatched: ${unmatchedPatients.length}`);

        fs.writeFileSync(REPORT_FILE, JSON.stringify({
            stats: {
                total_extracted: extractedPatients.length,
                matched: matchedCount,
                updated: updatedCount,
                unmatched: unmatchedPatients.length
            },
            updates: updatesLog,
            unmatched: unmatchedPatients
        }, null, 2));

        console.log(`Report saved to ${REPORT_FILE}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

mergePatients();
