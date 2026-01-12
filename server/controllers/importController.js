const fs = require('fs');
const csv = require('csv-parser');
const { pool } = require('../db');
const bcrypt = require('bcrypt');
const { logAction } = require('../utils/audit');

exports.importCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    // Enable Streaming Response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const writeLog = (msg) => {
        res.write(`[LOG] ${msg}\n`);
    };

    const results = {
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0
    };

    const filePath = req.file.path;
    const records = [];

    try {
        writeLog("Reading CSV file...");

        // Read CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => records.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        results.total = records.length;
        writeLog(`Processing ${records.length} records...`);

        const conn = await pool.getConnection();

        try {
            for (let i = 0; i < records.length; i++) {
                const row = records[i];
                try {
                    // Headers Debug - Log only first row
                    if (i === 0) {
                        writeLog(`Detected Headers: ${Object.keys(row).join(', ')}`);
                    }

                    // Periodic Progress Log
                    if ((i + 1) % 50 === 0) {
                        writeLog(`Processed ${i + 1}/${records.length} records...`);
                    }

                    // Flexible Header Mapping (English/Spanish/Generic)
                    // Google Contacts Header Variations:
                    // EN: Name, Given Name, Family Name, Phone 1 - Value, E-mail 1 - Value, Notes
                    // ES: Nombre, Nombre de pila, Apellidos, Teléfono 1 - Valor, Correo 1 - Valor, Notas
                    // Legacy/Outlook: First Name, Middle Name, Last Name

                    const firstName = row['First Name'] || row['Given Name'] || row['Nombre de pila'] || row['Nombre'] || '';
                    const middleName = row['Middle Name'] || '';
                    const lastName = row['Last Name'] || row['Family Name'] || row['Apellidos'] || '';

                    // Construct Full Name if 'Name' column is missing or empty
                    let name = row['Name'] || row['Nombre'] || '';
                    if (!name.trim()) {
                        name = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
                    }

                    // Skip if no name
                    if (!name || name.trim() === '') {
                        results.skipped++;
                        continue;
                    }

                    // Extract Phone
                    // Common: 'Phone 1 - Value', 'Mobile Phone', 'Phone 1', 'Teléfono 1 - Valor', 'Teléfono 1', 'Móvil'
                    let phone = row['Phone 1 - Value'] || row['Phone 1'] || row['Mobile Phone'] ||
                        row['Teléfono 1 - Valor'] || row['Teléfono 1'] || row['Celular'] || row['Móvil'] || null;

                    // Truncate Phone if too long (max 100 as per new schema)
                    if (phone && phone.length > 100) {
                        phone = phone.substring(0, 100);
                    }

                    // Extract Email
                    const email = row['E-mail 1 - Value'] || row['E-mail 1'] || row['Email'] ||
                        row['Correo 1 - Valor'] || row['Correo 1'] || row['Correo electrónico'] || null;

                    // Extract Notes
                    const notes = row['Notes'] || row['Description'] || row['Notas'] || row['Descripción'] || '';

                    // Logic from googleController: Parse DNI and OS from notes
                    let dni = null;
                    const dniMatch = notes.match(/DNI:\s*(\w+)/i) || name.match(/DNI:\s*(\w+)/i);
                    if (dniMatch) dni = dniMatch[1];

                    let insurance = null;
                    const osMatch = notes.match(/OS:\s*([^\n]+)/i) || notes.match(/Obra Social:\s*([^\n]+)/i);
                    if (osMatch) insurance = osMatch[1];

                    // Check if patient exists by Full Name or DNI
                    // Use normalized comparison to catch variations in spacing/case
                    let existing = null;

                    if (dni) {
                        const rows = await conn.query("SELECT id FROM patients WHERE dni = ?", [dni]);
                        if (rows && rows.length > 0) existing = rows[0];
                    }

                    if (!existing) {
                        // Try exact match first
                        let rows = await conn.query("SELECT id FROM patients WHERE full_name = ?", [name]);

                        // If no exact match, try case-insensitive with normalized whitespace
                        if (!rows || rows.length === 0) {
                            rows = await conn.query(
                                "SELECT id FROM patients WHERE LOWER(TRIM(REGEXP_REPLACE(full_name, '[[:space:]]+', ' '))) = LOWER(TRIM(REGEXP_REPLACE(?, '[[:space:]]+', ' ')))",
                                [name]
                            );
                        }

                        if (rows && rows.length > 0) existing = rows[0];
                    }

                    if (existing) {
                        // Update
                        await conn.query(`
                            UPDATE patients SET
                            phone = COALESCE(?, phone),
                            email = COALESCE(?, email),
                            insurance = COALESCE(?, insurance),
                            dni = COALESCE(?, dni)
                            WHERE id = ?`,
                            [phone, email, insurance, dni, existing.id]
                        );
                        results.updated++;
                        // writeLog(`Updated: ${name}`); // Too verbose for large files
                    } else {
                        // Create New
                        // FIX: Safer username generation (max 20 chars base + random) to avoid ER_DATA_TOO_LONG
                        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
                        const username = `pac.${cleanName.slice(0, 20)}.${Math.floor(Math.random() * 10000)}`;

                        const password = Math.random().toString(36).slice(-8);
                        const hash = await bcrypt.hash(password, 10);

                        const resUser = await conn.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'patient') RETURNING id", [username, hash]);

                        // MariaDB 'RETURNING id' or 'insertId' property
                        // With mariadb driver, insert result has 'insertId'
                        // If we use RETURNING, it returns rows. Let's use standard INSERT and check result.insertId
                        // Actually, standard INSERT in mariadb driver returns an object with insertId (BigInt or Number)

                        let userId;
                        if (resUser && resUser[0] && resUser[0].id) {
                            userId = resUser[0].id; // If RETURNING used
                        } else if (resUser.insertId) {
                            userId = Number(resUser.insertId);
                        } else {
                            // Fallback fetch if needed, but INSERT should work
                            throw new Error("Failed to retrieve insertId");
                        }

                        await conn.query("INSERT INTO patients (user_id, full_name, phone, email, insurance, dni) VALUES (?, ?, ?, ?, ?, ?)",
                            [userId, name, phone, email, insurance, dni]);

                        results.created++;
                        // writeLog(`Created: ${name}`);
                    }

                } catch (rowErr) {
                    console.error("Error processing row:", rowErr);
                    writeLog(`ERROR Row ${i + 1}: ${rowErr.message}`);
                    results.errors++;
                }
            }
        } finally {
            if (conn) conn.release();
        }

        // Cleanup
        fs.unlinkSync(filePath);

        writeLog("Import completed successfully.");
        await logAction(req, 'CSV_IMPORT', `Imported CSV: ${results.created} created, ${results.updated} updated.`);

        // Send final JSON result as a special line for frontend parsing
        res.write(`JSON_RESULT:${JSON.stringify(results)}`);
        res.end();

    } catch (err) {
        console.error("CSV Import Error:", err);
        // Try cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        writeLog(`FATAL ERROR: ${err.message}`);
        res.end(); // End stream
    }
};
