const insuranceRepository = require('../repositories/insuranceRepository');
const phoneModel = require('../models/PhoneModel');
const { pool } = require('../db');

/**
 * InsuranceService
 * Handles business logic for health insurances (obras sociales).
 */
class InsuranceService {
    async getAllInsurances() {
        const rows = await insuranceRepository.findAll();
        for (const row of rows) {
            const phoneNumbers = await phoneModel.findByEntity('insurance', row.id);
            row.phoneNumbers = phoneNumbers;
        }
        return rows;
    }

    async getInsuranceById(id) {
        const row = await insuranceRepository.findById(id);
        if (!row) return null;
        row.phoneNumbers = await phoneModel.findByEntity('insurance', id);
        return row;
    }

    async createInsurance(data) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const insId = await insuranceRepository.create(data, conn);

            if (Array.isArray(data.phoneNumbers)) {
                const primaryPhone = await phoneModel.syncPhones('insurance', insId, data.phoneNumbers, conn);
                if (primaryPhone) {
                    await insuranceRepository.update(insId, { phone: primaryPhone }, conn);
                }
            }

            await conn.commit();
            return { id: insId };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async updateInsurance(id, data) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const { phoneNumbers, ...insuranceUpdates } = data;

            if (Object.keys(insuranceUpdates).length > 0) {
                await insuranceRepository.update(id, insuranceUpdates, conn);
            }

            if (phoneNumbers !== undefined && Array.isArray(phoneNumbers)) {
                const primaryPhone = await phoneModel.syncPhones('insurance', id, phoneNumbers, conn);
                if (primaryPhone) {
                    await insuranceRepository.update(id, { phone: primaryPhone }, conn);
                }
            }

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async deleteInsurance(id) {
        return await insuranceRepository.delete(id);
    }
}

module.exports = new InsuranceService();
