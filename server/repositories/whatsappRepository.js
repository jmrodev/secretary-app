const { pool } = require('../db');

class WhatsappRepository {
    async createMessage(patientId, direction, body, whatsappId = null, status = 'sent', senderPhone = null, conn = pool) {
        const query = `
            INSERT INTO whatsapp_messages (patient_id, sender_phone, direction, body, whatsapp_id, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await conn.query(query, [patientId, senderPhone, direction, body, whatsappId, status]);
        return Number(result.insertId);
    }

    async getHistoryByPatient(patientId, phone = null, conn = pool) {
        let query = `SELECT * FROM whatsapp_messages WHERE `;
        let params = [];

        if (patientId) {
            query += `patient_id = ? `;
            params.push(patientId);
        } else if (phone) {
            query += `sender_phone = ? `;
            params.push(phone);
        } else {
            return [];
        }

        query += `ORDER BY created_at ASC`;
        return await conn.query(query, params);
    }

    async updateMessageStatus(whatsappId, status, conn = pool) {
        const query = `
            UPDATE whatsapp_messages 
            SET status = ? 
            WHERE whatsapp_id = ?
        `;
        return await conn.query(query, [status, whatsappId]);
    }

    async getRecentConversations(doctorId = null, conn = pool) {
        let query = `
            SELECT wm.*, 
                   COALESCE(p.full_name, wm.sender_phone) as patient_name, 
                   COALESCE(p.phone, wm.sender_phone) as patient_phone
            FROM whatsapp_messages wm
            INNER JOIN (
                SELECT COALESCE(patient_id, sender_phone) as identifier, MAX(created_at) as max_date
                FROM whatsapp_messages
                GROUP BY COALESCE(patient_id, sender_phone)
            ) latest ON (COALESCE(wm.patient_id, wm.sender_phone) = latest.identifier) AND wm.created_at = latest.max_date
            LEFT JOIN patients p ON wm.patient_id = p.id
        `;

        const params = [];
        if (doctorId) {
            query += `
                LEFT JOIN patient_doctors pd ON p.id = pd.patient_id
                WHERE (pd.doctor_id = ? OR wm.patient_id IS NULL)
            `;
            params.push(doctorId);
        }

        query += ` ORDER BY wm.created_at DESC`;
        
        return await conn.query(query, params);
    }

    async findPatientByPhone(phone, conn = pool) {
        const phoneSub = phone.length > 10 ? phone.slice(-10) : phone;
        const query = `
            SELECT id FROM patients 
            WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ?
            LIMIT 1
        `;
        const rows = await conn.query(query, [`%${phoneSub}%`]);
        return rows.length > 0 ? rows[0].id : null;
    }
}

module.exports = new WhatsappRepository();
