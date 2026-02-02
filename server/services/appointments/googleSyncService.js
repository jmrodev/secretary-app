const googleController = require('../../controllers/googleController');
const { pool } = require('../../db');

class GoogleSyncService {
    buildDescription(appt, patient, extra = {}) {
        return [
            `Motivo: ${appt.reason || 'N/A'}`,
            `Paciente: ${patient.full_name || 'N/A'} (DNI: ${patient.dni || 'N/A'})`,
            `Teléfono: ${patient.phone || 'N/A'}`,
            `Email: ${patient.email || 'N/A'}`,
            appt.type ? `Tipo: ${appt.type === 'virtual' ? 'VIRTUAL' : 'Presencial'}` : null,
            `Estado: ${extra.status || appt.status}`,
            `Pago: ${extra.payment_status || appt.payment_status}`,
            '---',
            'Sincronizado por Aplicación de Secretaría'
        ].filter(Boolean).join('\n');
    }

    async syncCreate(appointmentId, doctorId, eventData, userId) {
        try {
            const googleEvent = await googleController.createEventHelper(doctorId, eventData, userId);
            if (googleEvent) {
                await pool.query("UPDATE appointments SET google_event_id = ? WHERE id = ?", [googleEvent.id, appointmentId]);
                return googleEvent.id;
            }
        } catch (syncErr) {
            console.warn(`[GoogleSyncService] Create failed for appt ${appointmentId}: ${syncErr.message}`);
            await this.enqueue(appointmentId, doctorId, 'create', eventData);
        }
        return null;
    }

    async syncUpdate(appointmentId, doctorId, googleEventId, eventData, userId) {
        if (!googleEventId) return this.syncCreate(appointmentId, doctorId, eventData, userId);
        try {
            await googleController.updateEventHelper(doctorId, googleEventId, eventData, userId);
            return true;
        } catch (syncErr) {
            console.warn(`[GoogleSyncService] Update failed for appt ${appointmentId}: ${syncErr.message}`);
            await this.enqueue(appointmentId, doctorId, 'update', { eventId: googleEventId, updates: eventData });
        }
        return false;
    }

    async syncDelete(appointmentId, doctorId, googleEventId, userId) {
        if (!googleEventId) return true;
        try {
            await googleController.deleteEventHelper(doctorId, googleEventId, userId);
            return true;
        } catch (syncErr) {
            console.warn(`[GoogleSyncService] Delete failed for appt ${appointmentId}: ${syncErr.message}`);
            return false;
        }
    }

    async enqueue(appointmentId, doctorId, action, payload) {
        try {
            await pool.query(
                "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, ?, ?, 'pending')",
                [appointmentId, doctorId, action, JSON.stringify(payload)]
            );
        } catch (err) {
            console.error("[GoogleSyncService] Failed to enqueue sync:", err.message);
        }
    }
}

module.exports = new GoogleSyncService();
