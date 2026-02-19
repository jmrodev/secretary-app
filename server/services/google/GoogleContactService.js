const { google } = require('googleapis');
const { pool } = require('../../db');
const googleAuthService = require('./GoogleAuthService');
const patientRepository = require('../../repositories/patientRepository');
const userRepository = require('../../repositories/userRepository');
const bcrypt = require('bcrypt');

/**
 * GoogleContactService
 * Handles contact synchronization and importing from Google People API.
 */
class GoogleContactService {
    /**
     * Sync a single patient to Google Contacts
     */
    async syncContact(patient) {
        try {
            const oauth2Client = await googleAuthService.getAuthorizedClient(null); // Global sync
            if (!oauth2Client) return;

            const service = google.people({ version: 'v1', auth: oauth2Client });

            const searchRes = await service.people.searchContacts({
                query: patient.full_name,
                readMask: 'names,phoneNumbers'
            });

            let resourceName = null;
            if (searchRes.data.results && searchRes.data.results.length > 0) {
                resourceName = searchRes.data.results[0].person.resourceName;
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
                        date: { year: dob.getFullYear(), month: dob.getMonth() + 1, day: dob.getDate() }
                    }];
                }
            }

            if (resourceName) {
                const getContact = await service.people.get({
                    resourceName: resourceName,
                    personFields: 'metadata'
                });
                await service.people.updateContact({
                    resourceName: resourceName,
                    updatePersonFields: 'names,phoneNumbers,organizations,biographies,birthdays',
                    requestBody: { ...contactBody, etag: getContact.data.etag }
                });
            } else {
                await service.people.createContact({ requestBody: contactBody });
            }
        } catch (err) {
            console.error("Google Contact Sync Failed:", err.message);
        }
    }

    /**
     * Import all contacts from Google
     */
    async importContacts(req, doctorId) {
        const oauth2Client = await googleAuthService.getAuthorizedClient(doctorId);
        if (!oauth2Client) throw new Error("No Google account connected");

        const service = google.people({ version: 'v1', auth: oauth2Client });

        let connections = [];
        let nextPageToken = undefined;
        do {
            const res = await service.people.connections.list({
                resourceName: 'people/me',
                pageSize: 1000,
                pageToken: nextPageToken,
                personFields: 'names,phoneNumbers,organizations,biographies,birthdays,emailAddresses'
            });
            connections = connections.concat(res.data.connections || []);
            nextPageToken = res.data.nextPageToken;
        } while (nextPageToken);

        const results = { created: 0, updated: 0, errors: 0 };
        for (const person of connections) {
            try {
                const name = person.names?.[0]?.displayName || '';
                if (!name) continue;

                const phone = person.phoneNumbers?.[0]?.value || '';
                const email = person.emailAddresses?.[0]?.value || null;
                let insurance = person.organizations?.[0]?.name || '';
                let dob = null;
                if (person.birthdays?.[0]?.date) {
                    const d = person.birthdays[0].date;
                    if (d.year && d.month && d.day) dob = `${d.year}-${d.month}-${d.day}`;
                }

                let dni = '';
                const bio = person.biographies?.[0]?.value || '';
                const dniMatch = bio.match(/DNI:\s*(\w+)/i);
                if (dniMatch) dni = dniMatch[1];
                const osMatch = bio.match(/OS:\s*([^\n]+)/i);
                if (osMatch && !insurance) insurance = osMatch[1];

                const existing = await patientRepository.findByFullName(name);

                if (existing) {
                    await patientRepository.update(existing.id, {
                        phone: phone || existing.phone,
                        email: email || existing.email,
                        insurance: insurance || existing.insurance,
                        dob: dob || existing.dob,
                        dni: dni || existing.dni
                    });
                    results.updated++;
                } else {
                    const username = name.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 1000);
                    const password = Math.random().toString(36).slice(-8);
                    const hash = await bcrypt.hash(password, 10);

                    // We need a transaction here? Multi-table insert.
                    // Since it's a loop and we don't want to fail everything if one fails,
                    // we can use a separate transaction per contact or just sequential.
                    const conn = await pool.getConnection();
                    try {
                        await conn.beginTransaction();
                        const userId = await userRepository.create({ username, password_hash: hash, role: 'patient' }, conn);
                        await patientRepository.create({
                            user_id: userId,
                            full_name: name,
                            phone: phone || null,
                            email: email,
                            insurance: insurance || null,
                            dob: dob || null,
                            dni: dni || null
                        }, conn);
                        await conn.commit();
                        results.created++;
                    } catch (err) {
                        await conn.rollback();
                        throw err;
                    } finally {
                        conn.release();
                    }
                }
            } catch (err) {
                results.errors++;
            }
        }
        return results;
    }
}

module.exports = new GoogleContactService();
