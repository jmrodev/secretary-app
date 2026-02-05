const LocalAfipService = require('../services/afipLocalService');
const { pool } = require('../db');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * Billing Controller (Multi-Doctor Architecture)
 * Handles integration with AFIP (ARCA) for Electronic Invoicing per Doctor.
 */

// Helper to get Afip instance for a SPECIFIC doctor
async function getAfipInstance(conn, doctorId) {
    if (!doctorId) throw new Error("Doctor ID is required for billing.");

    const [doctor] = await conn.query(
        "SELECT afip_cuit, afip_pto_vta, afip_enabled, afip_cert_path, afip_key_path FROM doctors WHERE id = ?",
        [doctorId]
    );

    const [sysSetting] = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'afip_environment'");
    const production = sysSetting?.setting_value === 'production';

    // If doctor not found or fully disabled and not production, we can return mock for general UI
    if (!doctor || (!doctor.afip_enabled && !production && !doctor.afip_cert_path)) {
        return getMockAfip();
    }

    if (!doctor.afip_cuit) {
        if (!production && !doctor.afip_cert_path) return getMockAfip();
        throw new Error("El CUIT del médico no está configurado.");
    }

    const certPath = doctor.afip_cert_path ? path.resolve(__dirname, '..', doctor.afip_cert_path) : null;
    const keyPath = doctor.afip_key_path ? path.resolve(__dirname, '..', doctor.afip_key_path) : null;

    // Verify files exist
    const certExists = certPath && fs.existsSync(certPath);
    const keyExists = keyPath && fs.existsSync(keyPath);

    if (!certExists || !keyExists) {
        if (!production) {
            console.warn(`[AFIP] Certs missing for Doctor ${doctorId}. Using MOCK mode.`);
            return getMockAfip();
        }
        throw new Error("Certificados AFIP no encontrados en el servidor.");
    }

    console.log(`[AFIP] Initializing Local Service for Doctor ${doctorId} (Cuit: ${doctor.afip_cuit}, Prod: ${production})`);

    return new LocalAfipService({
        cuit: doctor.afip_cuit,
        production: production,
        cert: certPath,
        key: keyPath
    });
}

function getMockAfip() {
    return {
        getServerStatus: async () => ({
            AppServer: 'OK (Mock)',
            DbServer: 'OK (Mock)',
            AuthServer: 'OK (Mock)'
        }),
        getLastVoucher: async (pto, type) => 0,
        createVoucher: async (data) => ({
            CAE: '12345678901234',
            CAEFchVto: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
    };
}

exports.getServerStatus = async (req, res) => {
    let conn;
    try {
        const { doctor_id } = req.query;
        console.log(`[AFIP] Status check requested for doctor_id: ${doctor_id}`);
        conn = await pool.getConnection();

        let afip;
        if (doctor_id && doctor_id !== 'undefined') {
            afip = await getAfipInstance(conn, doctor_id);
        } else {
            console.warn("[AFIP] No valid doctor_id provided in status check. Using Mock.");
            afip = getMockAfip();
        }

        // Check WSFE status
        const status = await afip.getServerStatus();

        res.json({
            status: 'OK',
            afip_status: status,
            environment: (await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'afip_environment'"))[0]?.setting_value || 'testing'
        });
    } catch (err) {
        console.error("AFIP Status Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Generate CSR and Private Key for a Specific Doctor
 */
exports.generateCsr = async (req, res) => {
    const { doctor_id, alias_suffix } = req.body;
    if (!doctor_id) return res.status(400).json({ error: "Doctor ID required" });

    // Directory: server/certs/doctors/{id}/
    const certsDir = path.resolve(__dirname, `../certs/doctors/${doctor_id}`);
    const keyPath = path.join(certsDir, 'private.key');
    const csrPath = path.join(certsDir, 'request.csr');

    // Alias must be distinct? Usually yes. "secretary-doc-1"
    const alias = `secretary-doc-${doctor_id}-${alias_suffix || 'test'}`;

    // Ensure directory exists
    if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
    }

    const command = `openssl genrsa -out "${keyPath}" 2048 && openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "/C=AR/ST=Buenos Aires/L=Ciudad Autonoma de Buenos Aires/O=Doctor${doctor_id}/OU=IT/CN=${alias}"`;

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Failed to generate CSR', details: error.message });
        }

        try {
            const csrContent = fs.readFileSync(csrPath, 'utf8');
            const relativeKeyPath = `certs/doctors/${doctor_id}/private.key`;

            // Update DB with the key path, so checking status works later
            // We need a connection for this.
            // Since this is inside a callback, and we don't have 'conn' in scope or async easily here without refactor,
            // let's grab a fresh connection or use pool.
            // A better approach is to wrap exec in a promise, but for min diff:
            pool.query(`UPDATE doctors SET afip_key_path = ? WHERE id = ?`, [relativeKeyPath, doctor_id])
                .then(() => {
                    res.json({ csr: csrContent, keyPath: relativeKeyPath });
                })
                .catch(dbErr => {
                    console.error("DB Update Error on CSR:", dbErr);
                    // Still return CSR, user can manually upload key if needed, or retry
                    res.json({ csr: csrContent, keyPath: relativeKeyPath, warning: "Key path not saved to DB" });
                });

        } catch (readError) {
            res.status(500).json({ error: 'Failed to read generated CSR', details: readError.message });
        }
    });
};

/**
 * Upload Certificate for a specific doctor
 */
exports.uploadCert = async (req, res) => {
    let conn;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const { doctor_id } = req.body;
        if (!doctor_id) return res.status(400).json({ error: "Doctor ID required" });

        conn = await pool.getConnection();

        // Target Directory
        const certsDir = path.resolve(__dirname, `../certs/doctors/${doctor_id}`);
        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir, { recursive: true });
        }

        // Target Filename (always cert.crt or private.key depending on upload type)
        // For now assuming cert.crt, could deduce from extension
        const isKey = req.file.originalname.endsWith('.key');
        const targetName = isKey ? 'private.key' : 'cert.crt';
        const targetPath = path.join(certsDir, targetName);

        // Move file
        fs.renameSync(req.file.path, targetPath);

        // Update DB
        const dbField = isKey ? 'afip_key_path' : 'afip_cert_path';
        const relativePath = `certs/doctors/${doctor_id}/${targetName}`;

        await conn.query(`UPDATE doctors SET ${dbField} = ? WHERE id = ?`, [relativePath, doctor_id]);

        res.json({ message: "Certificate uploaded successfully", path: relativePath });
    } catch (err) {
        console.error("Upload Cert Error:", err);
        res.status(500).json({ error: err.message });
        // Cleanup temp file if exists
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Generate an invoice for a specific transaction
 */
exports.createInvoice = async (req, res) => {
    let conn;
    try {
        const { transactionId, cbteTipo } = req.body; // cbteTipo: 6 (B), 11 (C)
        conn = await pool.getConnection();

        // 1. Fetch transaction data
        const [tx] = await conn.query("SELECT * FROM transactions WHERE id = ?", [transactionId]);
        if (!tx) return res.status(404).json({ error: "Transaction not found" });

        // Validate Doctor
        if (!tx.doctor_id) return res.status(400).json({ error: "Transaction not linked to any doctor" });

        // 2. Prepare AFIP data (Using Doctor's Certs)
        const afip = await getAfipInstance(conn, tx.doctor_id);

        // Try to get patient info if transaction is linked to an appointment
        let patientDni = 0;
        let docTipo = 99; // Anonymous
        if (tx.appointment_id) {
            const [apt] = await conn.query(`
                SELECT p.dni FROM appointments a 
                JOIN patients p ON a.patient_id = p.id 
                WHERE a.id = ?
            `, [tx.appointment_id]);
            if (apt?.dni && !isNaN(parseInt(apt.dni))) {
                patientDni = parseInt(apt.dni);
                docTipo = 96; // DNI
            }
        }

        // Get Doctor's Pto Vta
        const [doctor] = await conn.query("SELECT afip_pto_vta FROM doctors WHERE id = ?", [tx.doctor_id]);
        const ptoVta = doctor?.afip_pto_vta || 1;

        const lastCbte = await afip.getLastVoucher(ptoVta, cbteTipo);
        const nextCbte = parseInt(lastCbte) + 1;

        // Use local Argentina date
        const now = new Date();
        const argentinaDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now).replace(/-/g, ''); // YYYYMMDD

        const data = {
            'CantReg': 1,
            'PtoVta': parseInt(ptoVta),
            'CbteTipo': parseInt(cbteTipo),
            'Concepto': 2, // 2 = Services (Medicine)
            'DocTipo': parseInt(docTipo),
            'DocNro': parseInt(patientDni),
            'CbteDesde': nextCbte,
            'CbteHasta': nextCbte,
            'CbteFch': argentinaDate,
            'ImpTotal': parseFloat(tx.amount),
            'ImpTotConc': 0,
            'ImpNeto': parseFloat(tx.amount),
            'ImpOpEx': 0,
            'ImpIVA': 0,
            'ImpTrib': 0,
            'MonId': 'PES',
            'MonCotiz': 1,
            // Mandatory for Concepto 2 (Services)
            'FchServDesde': argentinaDate,
            'FchServHasta': argentinaDate,
            'FchVtoPago': argentinaDate,
            // Mandatory new field for ARCA (RG 5616)
            'CondicionIVAReceptor': 5,
            'CondicionIvaReceptor': 5
        };

        // 3. Request CAE
        const result = await afip.createVoucher(data);

        // 4. Save to database
        // Need to store WHOSE invoice this is? The transaction link is enough, as transaction points to doctor.
        await conn.query(`
            INSERT INTO invoices (transaction_id, cbte_tipo, punto_vta, cbte_nro, cae, cae_vto, imp_total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [transactionId, cbteTipo, ptoVta, nextCbte, result.CAE, result.CAEFchVto, tx.amount]);

        res.json({
            message: "Invoice created successfully",
            invoice: {
                number: `${String(ptoVta).padStart(4, '0')}-${String(nextCbte).padStart(8, '0')}`,
                cae: result.CAE,
                vto: result.CAEFchVto
            }
        });

    } catch (err) {
        console.error("AFIP Invoice Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
