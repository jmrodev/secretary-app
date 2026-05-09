const LocalAfipService = require('./afipLocalService');
const googleIntegrationRepository = require('../repositories/googleIntegrationRepository');
const systemSettingsRepository = require('../repositories/systemSettingsRepository');
const doctorRepository = require('../repositories/doctorRepository');
const transactionRepository = require('../repositories/transactionRepository');
const invoiceRepository = require('../repositories/invoiceRepository');
const { pool } = require('../db');
const { formatAfipDate } = require('../utils/dateUtils');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * BillingService
 * Handles high-level logic for electronic invoicing (AFIP/ARCA).
 */
class BillingService {
    /**
     * Get Afip instance for a specific doctor
     */
    async getAfipInstance(conn, doctorId) {
        if (!doctorId) throw new Error("Doctor ID is required for billing.");

        const doctor = await doctorRepository.findAfipSettings(doctorId, conn);
        const sysSetting = await systemSettingsRepository.findByKey('afip_environment', conn);
        const production = sysSetting?.setting_value === 'production';

        // If doctor not found or fully disabled and not production, return mock
        if (!doctor || (!doctor.afip_enabled && !production && !doctor.afip_cert_path)) {
            return this.getMockAfip();
        }

        if (!doctor.afip_cuit) {
            if (!production && !doctor.afip_cert_path) return this.getMockAfip();
            throw new Error("El CUIT del médico no está configurado.");
        }

        const certPath = doctor.afip_cert_path ? path.resolve(__dirname, '..', doctor.afip_cert_path) : null;
        const keyPath = doctor.afip_key_path ? path.resolve(__dirname, '..', doctor.afip_key_path) : null;

        const certExists = certPath && fs.existsSync(certPath);
        const keyExists = keyPath && fs.existsSync(keyPath);

        if (!certExists || !keyExists) {
            if (!production) {
                console.warn(`[AFIP] Certs missing for Doctor ${doctorId}. Using MOCK mode.`);
                return this.getMockAfip();
            }
            throw new Error("Certificados AFIP no encontrados en el servidor.");
        }

        return new LocalAfipService({
            cuit: doctor.afip_cuit,
            production: production,
            cert: certPath,
            key: keyPath
        });
    }

    getMockAfip() {
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

    async generateCsr(doctorId, aliasSuffix) {
        const safeDoctorId = path.basename(String(doctorId));
        const certsDir = path.resolve(__dirname, `../certs/doctors/${safeDoctorId}`);
        const keyPath = path.join(certsDir, 'private.key');
        const csrPath = path.join(certsDir, 'request.csr');
        const safeAlias = String(aliasSuffix || 'test').replace(/[^a-zA-Z0-9_-]/g, '');
        const alias = `secretary-doc-${safeDoctorId}-${safeAlias}`;
        const subj = `/C=AR/ST=Buenos Aires/L=Ciudad Autonoma de Buenos Aires/O=Doctor${safeDoctorId}/OU=IT/CN=${alias}`;

        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir, { recursive: true });
        }

        const { execFile } = require('child_process');

        return new Promise((resolve, reject) => {
            // Step 1: Generate private key
            execFile('openssl', ['genrsa', '-out', keyPath, '2048'], async (error) => {
                if (error) return reject(new Error('Failed to generate key: ' + error.message));

                // Step 2: Generate CSR
                execFile('openssl', ['req', '-new', '-key', keyPath, '-out', csrPath, '-subj', subj], async (error2) => {
                    if (error2) return reject(new Error('Failed to generate CSR: ' + error2.message));

                    try {
                        const relativeKeyPath = `certs/doctors/${safeDoctorId}/private.key`;
                        const csrContent = fs.readFileSync(csrPath, 'utf8');

                        // Update DB
                        await doctorRepository.updateAfipSettings(safeDoctorId, { afip_key_path: relativeKeyPath });

                        resolve({ csr: csrContent, keyPath: relativeKeyPath });
                    } catch (readError) {
                        reject(new Error('Failed to read generated CSR: ' + readError.message));
                    }
                });
            });
        });
    }


    async createInvoice(transactionId, cbteTipo) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const tx = await transactionRepository.findById(transactionId, conn);
            if (!tx) throw new Error("Transaction not found");
            if (!tx.doctor_id) throw new Error("Transaction not linked to any doctor");

            const afip = await this.getAfipInstance(conn, tx.doctor_id);

            let patientDni = 0;
            let docTipo = 99; // Anonymous
            if (tx.appointment_id) {
                const patData = await doctorRepository.findDniByAppointmentId(tx.appointment_id, conn);
                if (patData?.dni && !isNaN(parseInt(patData.dni))) {
                    patientDni = parseInt(patData.dni);
                    docTipo = 96; // DNI
                }
            }

            const doctor = await doctorRepository.findAfipSettings(tx.doctor_id, conn);
            const ptoVta = doctor?.afip_pto_vta || 1;

            const lastCbte = await afip.getLastVoucher(ptoVta, cbteTipo);
            const nextCbte = parseInt(lastCbte) + 1;

            const argentinaDate = formatAfipDate();

            const data = {
                CantReg: 1,
                PtoVta: parseInt(ptoVta),
                CbteTipo: parseInt(cbteTipo),
                Concepto: 2,
                DocTipo: parseInt(docTipo),
                DocNro: parseInt(patientDni),
                CbteDesde: nextCbte,
                CbteHasta: nextCbte,
                CbteFch: argentinaDate,
                ImpTotal: parseFloat(tx.amount),
                ImpTotConc: 0,
                ImpNeto: parseFloat(tx.amount),
                ImpOpEx: 0,
                ImpIVA: 0,
                ImpTrib: 0,
                MonId: 'PES',
                MonCotiz: 1,
                FchServDesde: argentinaDate,
                FchServHasta: argentinaDate,
                FchVtoPago: argentinaDate,
                CondicionIVAReceptor: 5
            };

            const result = await afip.createVoucher(data);

            await invoiceRepository.create({
                transaction_id: transactionId,
                cbte_tipo: cbteTipo,
                punto_vta: ptoVta,
                cbte_nro: nextCbte,
                cae: result.CAE,
                cae_vto: result.CAEFchVto,
                imp_total: tx.amount
            }, conn);

            await conn.commit();

            return {
                number: `${String(ptoVta).padStart(4, '0')}-${String(nextCbte).padStart(8, '0')}`,
                cae: result.CAE,
                vto: result.CAEFchVto
            };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async uploadCert(doctorId, file) {
        const safeDoctorId = path.basename(String(doctorId));
        const certsDir = path.resolve(__dirname, `../certs/doctors/${safeDoctorId}`);
        if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

        const isKey = file.originalname.endsWith('.key');
        const targetName = isKey ? 'private.key' : 'cert.crt';
        const targetPath = path.join(certsDir, targetName);

        fs.renameSync(file.path, targetPath);

        const dbField = isKey ? 'afip_key_path' : 'afip_cert_path';
        const relativePath = `certs/doctors/${safeDoctorId}/${targetName}`;

        const updates = {};
        updates[dbField] = relativePath;
        await doctorRepository.updateAfipSettings(doctorId, updates);

        return relativePath;
    }

    async getAfipEnvironment() {
        return await googleIntegrationRepository.findAfipEnvironment();
    }
}

module.exports = new BillingService();
