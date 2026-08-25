const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const googleSyncService = require('./googleSyncService');
const financeService = require('../finance/financeService');
const debtLifecycleService = require('../finance/debtLifecycleService');
const helper = require('./appointmentHelper');
const { pool } = require('../../db');
const { nowLocalSQL } = require('../../utils/core/dateUtils');

/**
 * ModificationService
 * Handles updates, deletions, and status changes for appointments.
 */
class ModificationService {
    async deleteAppointment(id, userId, userOrRole, adminPassword) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const appt = await appointmentRepository.findById(id, conn);
            if (!appt) throw new Error("Appointment not found");

            const userObj = typeof userOrRole === 'object' && userOrRole !== null ? userOrRole : { role: userOrRole };
            await helper.checkModificationPermissions(conn, appt, userObj, adminPassword);

            // Check for medical records before deletion
            const medical = await conn.query("SELECT id FROM prescriptions WHERE appointment_id = ? UNION SELECT id FROM medical_licenses WHERE appointment_id = ?", [id, id]);
            if (medical.length > 0) throw new Error("No se puede eliminar: tiene registros médicos asociados.");

            // Apply debt policy atomically within this transaction (R1-R6)
            await debtLifecycleService.handleAppointmentDelete(conn, appt);

            await helper.freeSlot(conn, appt.doctor_id, appt.appointment_date);
            await appointmentRepository.delete(id, conn);

            // Notify side effects (Finances, Google Sync, etc.)
            const eventBus = require('../../events/eventBus');
            const EVENTS = require('../../events/eventConstants');
            eventBus.emit(EVENTS.APPOINTMENT_DELETED, { id, payment_status: appt.payment_status, google_event_id: appt.google_event_id, doctor_id: appt.doctor_id, userId, conn });

            await conn.commit();
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
            if (status === 'arrived' && !['confirmed', 'pending', 'rescheduled'].includes(appt.status)) {
                throw new Error("No se puede marcar como 'En Sala' si el turno no está en estado 'Confirmado', 'Pendiente' o 'Reprogramado'.");
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
            if (status === 'confirmed') {
                updates.confirmed_at = nowLocalSQL();
            } else if (status === 'arrived') {
                updates.arrived_at = nowLocalSQL();
            } else if (status === 'completed') {
                updates.completed_at = nowLocalSQL();
            }

            // R4: absent retains payment_status (debt is kept and charged); cancelled/suspended legacy nulls it
            if (['cancelled', 'suspended'].includes(status) && ['pending', 'debt'].includes(appt.payment_status)) {
                updates.payment_status = null;
            }

            await appointmentRepository.update(id, updates, conn);

            // Notify side effects via eventBus (ECC Pattern)
            const eventBus = require('../../events/eventBus');
            const EVENTS = require('../../events/eventConstants');
            
            if (status === 'completed') {
                await this._handleCompletion(conn, appt);
                eventBus.emit(EVENTS.APPOINTMENT_COMPLETED, { id, appt, userId, conn });
            }
            
            if (['cancelled', 'absent', 'suspended'].includes(status)) {
                await this._handleCancellation(conn, appt, status);
                // Apply debt policy atomically within this transaction (R4/R5/R6 + suspended legacy)
                await debtLifecycleService.handleAppointmentStatusChange(conn, appt, status);
                eventBus.emit(EVENTS.APPOINTMENT_CANCELLED, { id, status, appt, userId, conn });
            }

            await conn.commit();
            return true;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async updateAppointment(id, updates, userId, userOrRole, adminPassword) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const appt = await appointmentRepository.findById(id, conn);
            if (!appt) throw new Error("Appointment not found");

            const userObj = typeof userOrRole === 'object' && userOrRole !== null ? userOrRole : { role: userOrRole };
            await helper.checkModificationPermissions(conn, appt, userObj, adminPassword);

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
                if (appt.bonified === 1 || appt.bonified === true) {
                    throw new Error("El turno ya se encuentra bonificado.");
                }
                if (appt.payment_status === 'paid') {
                    throw new Error("No se puede bonificar un turno que ya ha sido pagado.");
                }
                await financeService.markAsBonified(id, 'appointment', conn);
                delete updates.bonified;
                if (updates.payment_status) delete updates.payment_status;
            }

            if (Object.keys(updates).length > 0) {
                await appointmentRepository.update(id, updates, conn);
            }
            await conn.commit();
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
    }
}

module.exports = new ModificationService();
