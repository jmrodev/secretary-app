const appointmentRepository = require('../../repositories/appointmentRepository');
const googleSyncService = require('./googleSyncService');
const financeService = require('../finance/financeService');
const helper = require('./appointmentHelper');
const { pool } = require('../../db');
const { logAction } = require('../../utils/audit');

/**
 * ModificationService
 * Handles updates, deletions, and status changes for appointments.
 */
class ModificationService {
    async deleteAppointment(id, userId, role, adminPassword) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const appt = await appointmentRepository.findById(id, conn);
            if (!appt) throw new Error("Appointment not found");

            await helper.checkModificationPermissions(conn, appt, { role }, adminPassword);

            // Check for medical records before deletion
            const medical = await conn.query("SELECT id FROM prescriptions WHERE appointment_id = ? UNION SELECT id FROM medical_licenses WHERE appointment_id = ?", [id, id]);
            if (medical.length > 0) throw new Error("No se puede eliminar: tiene registros médicos asociados.");

            // Handle transactions
            if (appt.payment_status === 'paid') {
                await conn.query("UPDATE transactions SET description = CONCAT('Saldo a favor (Turno Eliminado): ', description) WHERE appointment_id = ? AND status = 'paid'", [id]);
            } else {
                await conn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [id]);
            }

            await helper.freeSlot(conn, appt.doctor_id, appt.appointment_date);
            await appointmentRepository.delete(id, conn);
            await conn.commit();

            if (appt.google_event_id) await googleSyncService.syncDelete(id, appt.doctor_id, appt.google_event_id, userId);
            return true;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async updateStatus(id, status, reason, userId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const appt = await appointmentRepository.findById(id, conn);
            if (!appt) throw new Error("Appointment not found");

            // Enforce strict business rules for status transitions
            if (status === 'arrived' && appt.status !== 'confirmed') {
                throw new Error("No se puede marcar como 'En Sala' si el turno no está en estado 'Confirmado'.");
            }
            if (status === 'completed') {
                const isVirtual = appt.type === 'virtual';
                if (isVirtual) {
                    if (appt.status !== 'confirmed') {
                        throw new Error("Para marcar como 'Atendido' un turno virtual, primero debe estar 'Confirmado'.");
                    }
                } else {
                    if (appt.status !== 'arrived') {
                        throw new Error("No se puede marcar como 'Atendido' si el paciente no está 'En Sala'.");
                    }
                }
            }

            const updates = { status, cancellation_reason: reason || null };
            if (['cancelled', 'absent', 'suspended'].includes(status) && ['pending', 'debt'].includes(appt.payment_status)) {
                updates.payment_status = null;
            }

            await appointmentRepository.update(id, updates, conn);

            if (status === 'completed') await this._handleCompletion(conn, appt);
            if (['cancelled', 'absent', 'suspended'].includes(status)) await this._handleCancellation(conn, appt, status);

            await conn.commit();
            await this._syncStatusToGoogle(id, status, userId);
            return true;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async updateAppointment(id, updates, userId, role, adminPassword) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const appt = await appointmentRepository.findById(id, conn);
            if (!appt) throw new Error("Appointment not found");

            await helper.checkModificationPermissions(conn, appt, { role }, adminPassword);

            if (updates.appointment_date) {
                const newDate = helper.formatDateForDB(updates.appointment_date);
                if (newDate !== helper.formatDateForDB(appt.appointment_date)) {
                    await helper.freeSlot(conn, appt.doctor_id, appt.appointment_date);
                    await helper.occupySlot(conn, appt.doctor_id, newDate);
                    updates.status = 'rescheduled';
                    updates.rescheduled_from_date = appt.appointment_date;
                }
                updates.appointment_date = newDate;
            }

            if (updates.bonified === 1 || updates.bonified === true || updates.bonified === 'true') {
                await financeService.markAsBonified(id, 'appointment', conn);
                delete updates.bonified;
                if (updates.payment_status) delete updates.payment_status;
            }

            if (Object.keys(updates).length > 0) {
                await appointmentRepository.update(id, updates, conn);
            }
            await conn.commit();
            await this._syncUpdateToGoogle(id, updates, userId);
            return true;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async bulkUpdateType(dayOfWeek, type, doctorId, fromDate, toDate, userId, userRole) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            if (userRole === 'doctor') {
                const rows = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [userId]);
                if (rows.length === 0 || rows[0].id != doctorId) throw new Error("Unauthorized");
            }
            let sql = "UPDATE appointments SET type = ? WHERE DAYOFWEEK(appointment_date) = ?";
            let params = [type, Number(dayOfWeek) + 1];
            if (doctorId) { sql += " AND doctor_id = ?"; params.push(doctorId); }
            if (fromDate) { sql += " AND appointment_date >= ?"; params.push(fromDate); }
            if (toDate) { sql += " AND appointment_date <= ?"; params.push(toDate); }
            const res = await conn.query(sql, params);
            await conn.commit();
            return res.affectedRows;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    // --- Private Helpers ---

    async _handleCompletion(conn, appt) {
        const rows = await conn.query(`
            SELECT COALESCE(p.visit_interval_days, d.default_visit_interval_days) as days
            FROM patients p JOIN doctors d ON d.id = ? WHERE p.id = ?`, [appt.doctor_id, appt.patient_id]);
        if (rows.length > 0 && rows[0].days > 0) {
            const next = new Date(appt.appointment_date);
            next.setDate(next.getDate() + Number(rows[0].days));
            await conn.query("UPDATE patients SET next_suggested_visit_date = ? WHERE id = ?", [next.toISOString().split('T')[0], appt.patient_id]);
        }
    }

    async _handleCancellation(conn, appt, status) {
        await helper.freeSlot(conn, appt.doctor_id, appt.appointment_date);
        if (status === 'absent') {
            await conn.query("UPDATE patients SET behavior_rating = GREATEST(0, behavior_rating - 1) WHERE id = ?", [appt.patient_id]);
        }
        await conn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [appt.id]);
    }

    async _syncStatusToGoogle(id, status, userId) {
        try {
            const appt = await appointmentRepository.findById(id);
            if (!appt?.google_event_id) return;
            if (status === 'cancelled') await googleSyncService.syncDelete(id, appt.doctor_id, appt.google_event_id, userId);
            else {
                const data = { status, description: googleSyncService.buildDescription(appt, { id: appt.patient_id, full_name: appt.patient_name }, { status }) };
                await googleSyncService.syncUpdate(id, appt.doctor_id, appt.google_event_id, data, userId);
            }
        } catch (e) { console.warn("Sync Status Failed", e.message); }
    }

    async _syncUpdateToGoogle(id, updates, userId) {
        try {
            const appt = await appointmentRepository.findById(id);
            if (!appt?.google_event_id) return;
            const data = {
                summary: appt.patient_name,
                description: googleSyncService.buildDescription({ ...appt, ...updates }, { id: appt.patient_id, full_name: appt.patient_name })
            };
            if (updates.appointment_date) {
                const start = new Date(updates.appointment_date);
                const end = new Date(start.getTime() + (updates.duration || appt.duration || 30) * 60000);
                data.start = { dateTime: start.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' };
                data.end = { dateTime: end.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' };
            }
            await googleSyncService.syncUpdate(id, appt.doctor_id, appt.google_event_id, data, userId);
        } catch (e) { console.warn("Sync Update Failed", e.message); }
    }
}

module.exports = new ModificationService();
