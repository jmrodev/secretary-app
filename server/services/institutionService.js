const institutionRepository = require('../repositories/institutionRepository');
const phoneRepository = require('../repositories/phoneRepository');
const { pool } = require('../db');

/**
 * InstitutionService
 * Handles business logic for medical institutions and their finances.
 */
class InstitutionService {
    async getAllInstitutions() {
        const rows = await institutionRepository.findAll();
        for (const row of rows) {
            row.phoneNumbers = await phoneRepository.findByEntity('institution', row.id);
        }
        return { institutions: rows, totalCount: rows.length };
    }

    async createInstitution(data) {
        const { name, description, status, base_price, phoneNumbers } = data;
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const instId = await institutionRepository.create({ name, description, status, base_price }, conn);

            if (Array.isArray(phoneNumbers)) {
                await phoneRepository.syncPhones('institution', instId, phoneNumbers, conn);
            }
            await conn.commit();
            return { id: instId, name };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async updateInstitution(id, data) {
        const { phoneNumbers, ...institutionUpdates } = data;
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            if (Object.keys(institutionUpdates).length > 0) {
                await institutionRepository.update(id, institutionUpdates, conn);
            }

            if (Array.isArray(phoneNumbers)) {
                await phoneRepository.syncPhones('institution', id, phoneNumbers, conn);
            }
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async getInstitutionFinances(id) {
        const rows = await institutionRepository.getInstitutionFinances(id);

        const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount), 0);
        const totalPending = rows.reduce((sum, r) => {
            const statusLower = (r.appointment_status || '').toLowerCase();
            const paymentLower = (r.payment_status || '').toLowerCase();
            
            const isPastPending = statusLower === 'pending' && r.appointment_date && new Date(r.appointment_date) <= new Date();
            const isValidStatus = ['completed', 'attended', 'arrived', 'absent'].includes(statusLower);

            if (paymentLower === 'pending' && (!r.appointment_id || isValidStatus || isPastPending)) {
                return sum + Number(r.amount);
            }
            if (paymentLower === 'paid' && r.description && r.description.includes('Pago Adelantado')) {
                return sum - Number(r.amount);
            }
            return sum;
        }, 0);

        return { institution_id: id, total_amount: totalAmount, total_pending: totalPending, transactions: rows };
    }

    async getInstitutionPatients(id) {
        return await institutionRepository.getPatientList(id);
    }

    async deleteInstitution(id) {
        return await institutionRepository.delete(id);
    }
}

module.exports = new InstitutionService();
