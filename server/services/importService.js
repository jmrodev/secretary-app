const fs = require('fs');
const csv = require('csv-parser');
const { pool } = require('../db');
const bcrypt = require('bcrypt');
const { logAction } = require('../utils/audit');
const patientRepository = require('../repositories/patientRepository');
const userRepository = require('../repositories/userRepository');

/**
 * ImportService
 * Handles bulk data imports from CSV files.
 */
class ImportService {
    async importCsv(req, res) {
        if (!req.file) throw new Error("No file uploaded");

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const writeLog = (msg) => res.write(`[LOG] ${msg}\n`);
        const results = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
        const filePath = req.file.path;
        const records = [];

        try {
            writeLog("Reading CSV file...");
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath).pipe(csv())
                    .on('data', (data) => records.push(data))
                    .on('end', resolve).on('error', reject);
            });

            results.total = records.length;
            writeLog(`Processing ${records.length} records...`);

            const conn = await pool.getConnection();
            try {
                for (let i = 0; i < records.length; i++) {
                    const row = records[i];
                    try {
                        if (i === 0) writeLog(`Detected Headers: ${Object.keys(row).join(', ')}`);
                        if ((i + 1) % 50 === 0) writeLog(`Processed ${i + 1}/${records.length} records...`);

                        const patientData = this._parsePatientRow(row);
                        if (!patientData.name) { results.skipped++; continue; }

                        await this._upsertPatient(conn, patientData, results);
                    } catch (rowErr) {
                        writeLog(`ERROR Row ${i + 1}: ${rowErr.message}`);
                        results.errors++;
                    }
                }
            } finally { conn.release(); }

            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            writeLog("Import completed successfully.");
            await logAction(req, 'CSV_IMPORT', `Imported CSV: ${results.created} created, ${results.updated} updated.`);
            res.write(`JSON_RESULT:${JSON.stringify(results)}`);
            res.end();
        } catch (err) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            writeLog(`FATAL ERROR: ${err.message}`);
            res.end();
        }
    }

    _parsePatientRow(row) {
        const firstName = row['First Name'] || row['Given Name'] || row['Nombre de pila'] || row['Nombre'] || '';
        const middleName = row['Middle Name'] || '';
        const lastName = row['Last Name'] || row['Family Name'] || row['Apellidos'] || '';

        let name = row['Name'] || row['Nombre'] || '';
        if (!name.trim()) name = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();

        const phone = (row['Phone 1 - Value'] || row['Phone 1'] || row['Mobile Phone'] ||
            row['Teléfono 1 - Valor'] || row['Teléfono 1'] || row['Celular'] || row['Móvil'] || '').substring(0, 100);

        const email = row['E-mail 1 - Value'] || row['E-mail 1'] || row['Email'] ||
            row['Correo 1 - Valor'] || row['Correo 1'] || row['Correo electrónico'] || null;

        const notes = row['Notes'] || row['Description'] || row['Notas'] || row['Descripción'] || '';
        let dni = (notes.match(/DNI:\s*(\w+)/i) || name.match(/DNI:\s*(\w+)/i))?.[1] || null;
        let insurance = (notes.match(/OS:\s*([^\n]+)/i) || notes.match(/Obra Social:\s*([^\n]+)/i))?.[1] || null;

        return { name, phone, email, dni, insurance };
    }

    async _upsertPatient(conn, data, results) {
        let existing = null;
        if (data.dni) {
            existing = await patientRepository.findByDni(data.dni, conn);
        }
        if (!existing) {
            existing = await patientRepository.findByFuzzyName(data.name, conn);
        }

        if (existing) {
            await patientRepository.update(existing.id, {
                phone: data.phone || null,
                email: data.email,
                insurance: data.insurance,
                dni: data.dni
            }, conn);
            results.updated++;
        } else {
            const cleanName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '.');
            const username = `pac.${cleanName.slice(0, 20)}.${Math.floor(Math.random() * 10000)}`;
            const hash = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

            const userId = await userRepository.create({
                username,
                password_hash: hash,
                role: 'patient'
            }, conn);

            await patientRepository.create({
                user_id: userId,
                full_name: data.name,
                phone: data.phone || null,
                email: data.email,
                insurance: data.insurance,
                dni: data.dni
            }, conn);
            results.created++;
        }
    }
}

module.exports = new ImportService();
