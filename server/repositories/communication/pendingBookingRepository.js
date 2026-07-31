/**
 * PendingBookingRepository
 * Handles data access for whatsapp_pending_bookings (supervised auto-booking queue).
 * The AI inserts a pending row; the secretary accepts/suggests/rejects it.
 */
const ACTIVE_STATUSES = ['pending', 'alternative_sent'];
const ACTIVE_STATUSES_SQL = ACTIVE_STATUSES.map(() => '?').join(', ');

class PendingBookingRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async create(data, conn = this.pool) {
        const query = `
            INSERT INTO whatsapp_pending_bookings
                (patient_id, doctor_id, patient_phone, requested_slot_date, requested_slot_time)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await conn.query(query, [
            data.patient_id,
            data.doctor_id,
            data.patient_phone,
            data.requested_slot_date,
            data.requested_slot_time
        ]);
        return Number(result.insertId);
    }

    async findActive(conn = this.pool) {
        const query = `
            SELECT
                wb.*,
                p.full_name AS patient_name,
                d.full_name AS doctor_name
            FROM whatsapp_pending_bookings wb
            INNER JOIN patients p ON p.id = wb.patient_id
            INNER JOIN doctors d ON d.id = wb.doctor_id
            WHERE wb.status IN (${ACTIVE_STATUSES_SQL})
            ORDER BY wb.created_at ASC
        `;
        return await conn.query(query, [...ACTIVE_STATUSES]);
    }

    async findActiveByPatient(patientId, conn = this.pool) {
        const query = `
            SELECT *
            FROM whatsapp_pending_bookings
            WHERE patient_id = ? AND status IN (${ACTIVE_STATUSES_SQL})
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const rows = await conn.query(query, [patientId, ...ACTIVE_STATUSES]);
        return rows[0] || null;
    }

    async findById(id, conn = this.pool) {
        const query = `
            SELECT
                wb.*,
                p.full_name AS patient_name,
                d.full_name AS doctor_name,
                s.full_name AS accepted_by_name
            FROM whatsapp_pending_bookings wb
            INNER JOIN patients p ON p.id = wb.patient_id
            INNER JOIN doctors d ON d.id = wb.doctor_id
            LEFT JOIN secretaries s ON s.user_id = wb.accepted_by
            WHERE wb.id = ?
        `;
        const rows = await conn.query(query, [id]);
        return rows[0] || null;
    }

    /**
     * Optimistic lock: only succeeds while the row is still 'pending'.
     * Returns affectedRows — 1 means this secretary won the race.
     */
    async acceptById(id, acceptedBy, conn = this.pool) {
        const query = `
            UPDATE whatsapp_pending_bookings
            SET status = 'accepted', accepted_by = ?, accepted_at = NOW()
            WHERE id = ? AND status = 'pending'
        `;
        const result = await conn.query(query, [acceptedBy, id]);
        return result.affectedRows;
    }

    async suggestAlternative(id, alternativeSlotIso, note, conn = this.pool) {
        const query = `
            UPDATE whatsapp_pending_bookings
            SET status = 'alternative_sent',
                alternative_slot_iso = ?,
                alternative_note = ?,
                alternative_sent_at = NOW()
            WHERE id = ? AND status = 'pending'
        `;
        const result = await conn.query(query, [alternativeSlotIso, note || null, id]);
        return result.affectedRows;
    }

    /**
     * Alternative accepted by the patient: marks alternative_accepted and
     * stores the created appointment id. Only succeeds while status is
     * alternative_sent (optimistic lock against timeout/secretary actions).
     */
    async acceptAlternativeById(id, appointmentId, conn = this.pool) {
        const query = `
            UPDATE whatsapp_pending_bookings
            SET status = 'alternative_accepted',
                appointment_id = ?,
                accepted_at = NOW()
            WHERE id = ? AND status = 'alternative_sent'
        `;
        const result = await conn.query(query, [appointmentId, id]);
        return result.affectedRows;
    }

    /**
     * Alternative declined by the patient: marks alternative_rejected with an
     * optional reason. Only succeeds while status is alternative_sent.
     */
    async rejectAlternativeById(id, reason, conn = this.pool) {
        const query = `
            UPDATE whatsapp_pending_bookings
            SET status = 'alternative_rejected',
                rejected_reason = ?
            WHERE id = ? AND status = 'alternative_sent'
        `;
        const result = await conn.query(query, [reason || null, id]);
        return result.affectedRows;
    }

    async rejectById(id, rejectedBy, reason, conn = this.pool) {
        const query = `
            UPDATE whatsapp_pending_bookings
            SET status = 'rejected', rejected_by = ?, rejected_reason = ?
            WHERE id = ?
        `;
        const result = await conn.query(query, [rejectedBy, reason || null, id]);
        return result.affectedRows;
    }

    /**
     * 2h alternative timeout cleanup: alternative_sent rows whose question was
     * sent more than 2 hours ago become timed_out. Runs on listPending.
     */
    async expireStaleAlternatives(conn = this.pool) {
        const query = `
            UPDATE whatsapp_pending_bookings
            SET status = 'timed_out'
            WHERE status = 'alternative_sent'
              AND alternative_sent_at <= (NOW() - INTERVAL 2 HOUR)
        `;
        const result = await conn.query(query);
        return result.affectedRows;
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new PendingBookingRepository(defaultPool);
const factory = (customPool) => new PendingBookingRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
