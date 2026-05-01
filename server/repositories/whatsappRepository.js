const { pool } = require('../db');

class WhatsappRepository {
    async createMessage(patientId, direction, body, whatsappId = null, status = 'sent', conn = pool) {
        const query = `
            INSERT INTO whatsapp_messages (patient_id, direction, body, whatsapp_id, status) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await conn.query(query, [patientId, direction, body, whatsappId, status]);
        return Number(result.insertId);
    }

    async getHistoryByPatient(patientId, conn = pool) {
        const query = `
            SELECT * FROM whatsapp_messages 
            WHERE patient_id = ? 
            ORDER BY created_at ASC
        `;
        return await conn.query(query, [patientId]);
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
            SELECT wm.*, p.full_name as patient_name, p.phone as patient_phone
            FROM whatsapp_messages wm
            INNER JOIN (
                SELECT patient_id, MAX(created_at) as max_date
                FROM whatsapp_messages
                GROUP BY patient_id
            ) latest ON wm.patient_id = latest.patient_id AND wm.created_at = latest.max_date
            LEFT JOIN patients p ON wm.patient_id = p.id
        `;

        const params = [];
        if (doctorId) {
            query += `
                INNER JOIN patient_doctors pd ON p.id = pd.patient_id
                WHERE pd.doctor_id = ?
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
