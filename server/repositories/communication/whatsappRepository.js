

class WhatsappRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async createMessage(patientId, direction, body, whatsappId = null, status = 'sent', senderPhone = null, conn = this.pool) {
        let resolvedPatientId = patientId;
        let resolvedPhone = senderPhone ? senderPhone.toString().replace(/\D/g, '') : null;

        // Si tenemos telefono pero no patientId, intentar resolver paciente
        if (!resolvedPatientId && resolvedPhone) {
            resolvedPatientId = await this.findPatientByPhone(resolvedPhone, conn);
        }

        // Si tenemos patientId pero no telefono, intentar traer el telefono del paciente
        if (resolvedPatientId && !resolvedPhone) {
            const rows = await conn.query('SELECT phone FROM patients WHERE id = ?', [resolvedPatientId]);
            if (rows.length > 0 && rows[0].phone) {
                resolvedPhone = rows[0].phone.toString().replace(/\D/g, '');
            }
        }

        // Si ahora tenemos patientId y phone, vincular mensajes anteriores huérfanos con ese mismo teléfono
        if (resolvedPatientId && resolvedPhone) {
            const cleanDigits = resolvedPhone.slice(-8);
            if (cleanDigits) {
                await conn.query(`
                    UPDATE whatsapp_messages 
                    SET patient_id = ? 
                    WHERE patient_id IS NULL AND REPLACE(REPLACE(sender_phone, '+', ''), ' ', '') LIKE ?
                `, [resolvedPatientId, `%${cleanDigits}%`]);
            }
        }

        const query = `
            INSERT INTO whatsapp_messages (patient_id, sender_phone, direction, body, whatsapp_id, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await conn.query(query, [resolvedPatientId, resolvedPhone, direction, body, whatsappId, status]);
        return Number(result.insertId);
    }

    async getHistoryByPatient(patientId, phone = null, conn = this.pool) {
        const initialDigits = phone ? phone.toString().replace(/\D/g, '').slice(-8) : null;
        const patientDigits = patientId ? await (async () => {
            const patientRows = await conn.query('SELECT phone FROM patients WHERE id = ?', [patientId]);
            if (patientRows.length > 0 && patientRows[0].phone) {
                const pDigits = patientRows[0].phone.toString().replace(/\D/g, '').slice(-8);
                return pDigits || null;
            }
            return null;
        })() : null;
        const cleanDigits = patientDigits || initialDigits;
        
        if (patientId) {

            if (cleanDigits) {
                const query = `
                    SELECT * FROM whatsapp_messages 
                    WHERE patient_id = ? OR REPLACE(REPLACE(sender_phone, '+', ''), ' ', '') LIKE ?
                    ORDER BY created_at ASC
                `;
                return await conn.query(query, [patientId, `%${cleanDigits}%`]);
            } else {
                const query = `SELECT * FROM whatsapp_messages WHERE patient_id = ? ORDER BY created_at ASC`;
                return await conn.query(query, [patientId]);
            }
        } else if (cleanDigits) {
            const query = `
                SELECT * FROM whatsapp_messages 
                WHERE REPLACE(REPLACE(sender_phone, '+', ''), ' ', '') LIKE ? 
                ORDER BY created_at ASC
            `;
            return await conn.query(query, [`%${cleanDigits}%`]);
        }

        return [];
    }

    async updateMessageStatus(whatsappId, status, conn = this.pool) {
        const query = `
            UPDATE whatsapp_messages 
            SET status = ? 
            WHERE whatsapp_id = ?
        `;
        return await conn.query(query, [status, whatsappId]);
    }

    async getRecentConversations(doctorId = null, conn = this.pool) {
        const params = [];
        const baseQuery = `
            SELECT 
                wm.id,
                wm.patient_id,
                wm.sender_phone,
                wm.direction,
                wm.body,
                wm.whatsapp_id,
                wm.status,
                wm.created_at,
                COALESCE(p.full_name, wm.sender_phone) as patient_name,
                COALESCE(p.phone, wm.sender_phone) as patient_phone
            FROM whatsapp_messages wm
            INNER JOIN (
                SELECT 
                    COALESCE(patient_id, RIGHT(REPLACE(REPLACE(sender_phone, '+', ''), ' ', ''), 8)) as identifier, 
                    MAX(created_at) as max_date
                FROM whatsapp_messages
                WHERE (sender_phone IS NULL OR (
                    sender_phone NOT LIKE '%status%' AND
                    sender_phone NOT LIKE '%broadcast%' AND
                    sender_phone NOT LIKE '%newsletter%' AND
                    sender_phone NOT LIKE '%@g.us%' AND
                    sender_phone NOT LIKE '120363%' AND
                    LENGTH(sender_phone) <= 15
                ))
                GROUP BY COALESCE(patient_id, RIGHT(REPLACE(REPLACE(sender_phone, '+', ''), ' ', ''), 8))
            ) latest ON (
                COALESCE(wm.patient_id, RIGHT(REPLACE(REPLACE(wm.sender_phone, '+', ''), ' ', ''), 8)) = latest.identifier
            ) AND wm.created_at = latest.max_date
            LEFT JOIN patients p ON wm.patient_id = p.id`;

        const doctorJoin = doctorId ? ' LEFT JOIN patient_doctors pd ON p.id = pd.patient_id' : '';
        const whereClause = doctorId
            ? ` WHERE (wm.sender_phone IS NULL OR (
                wm.sender_phone NOT LIKE '%status%' AND
                wm.sender_phone NOT LIKE '%broadcast%' AND
                wm.sender_phone NOT LIKE '%newsletter%' AND
                wm.sender_phone NOT LIKE '%@g.us%' AND
                wm.sender_phone NOT LIKE '120363%' AND
                LENGTH(wm.sender_phone) <= 15
            )) AND (pd.doctor_id = ? OR wm.patient_id IS NULL)`
            : ` WHERE (wm.sender_phone IS NULL OR (
                wm.sender_phone NOT LIKE '%status%' AND
                wm.sender_phone NOT LIKE '%broadcast%' AND
                wm.sender_phone NOT LIKE '%newsletter%' AND
                wm.sender_phone NOT LIKE '%@g.us%' AND
                wm.sender_phone NOT LIKE '120363%' AND
                LENGTH(wm.sender_phone) <= 15
            ))`;

        if (doctorId) params.push(doctorId);

        const query = `${baseQuery}${doctorJoin}${whereClause} GROUP BY COALESCE(wm.patient_id, RIGHT(REPLACE(REPLACE(wm.sender_phone, '+', ''), ' ', ''), 8)) ORDER BY wm.created_at DESC`;
        
        return await conn.query(query, params);
    }

    async findPatientByPhone(phone, conn = this.pool) {
        if (!phone) return null;
        const cleanDigits = phone.toString().replace(/\D/g, '');
        if (!cleanDigits) return null;

        const phoneSub = cleanDigits.slice(-8);
        const query = `
            SELECT DISTINCT p.id 
            FROM patients p
            LEFT JOIN phone_numbers pn ON pn.entity_type = 'patient' AND pn.entity_id = p.id
            WHERE REPLACE(REPLACE(REPLACE(p.phone, ' ', ''), '-', ''), '+', '') LIKE ?
               OR REPLACE(REPLACE(REPLACE(pn.phone_number, ' ', ''), '-', ''), '+', '') LIKE ?
            LIMIT 1
        `;
        const rows = await conn.query(query, [`%${phoneSub}%`, `%${phoneSub}%`]);
        return rows.length > 0 ? rows[0].id : null;
    }

    async deleteConversation(patientId, phone, conn = this.pool) {
        const cleanDigits = phone ? phone.toString().replace(/\D/g, '').slice(-8) : null;
        if (patientId) {
            await conn.query('DELETE FROM whatsapp_messages WHERE patient_id = ?', [patientId]);
        }
        if (cleanDigits) {
            await conn.query(`
                DELETE FROM whatsapp_messages 
                WHERE REPLACE(REPLACE(sender_phone, '+', ''), ' ', '') LIKE ?
            `, [`%${cleanDigits}%`]);
        }
        return true;
    }

    async getPatientsForBroadcast(filter = 'last_12_months', conn = this.pool) {
        if (filter === 'all') {
            return await conn.query(
                `SELECT id, full_name, phone FROM patients
                 WHERE phone IS NOT NULL AND phone != '' AND LENGTH(phone) >= 8`
            );
        }
        return await conn.query(
            `SELECT DISTINCT p.id, p.full_name, p.phone
             FROM patients p
             INNER JOIN appointments a ON a.patient_id = p.id
             WHERE a.appointment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
               AND p.phone IS NOT NULL AND p.phone != ''
               AND LENGTH(p.phone) >= 8`
        );
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new WhatsappRepository(defaultPool);
const factory = (customPool) => new WhatsappRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
