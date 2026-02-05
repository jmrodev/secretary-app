const appointmentRepository = require('../../repositories/appointmentRepository');
const googleSyncService = require('./googleSyncService');
const helper = require('./appointmentHelper');
const { pool } = require('../../db');
const { logAction } = require('../../utils/audit');

class ModificationService {
    async deleteAppointment(id, userId, role, adminPassword) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const appt = await appointmentRepository.findById(id, conn);
            if (!appt) throw new Error("Appointment not found");

            // Centralized Permissions
            await helper.checkModificationPermissions(conn, appt, { role }, adminPassword);

            const medicalData = await conn.query("SELECT id FROM prescriptions WHERE appointment_id = ? UNION SELECT id FROM medical_licenses WHERE appointment_id = ?", [id, id]);
            if (medicalData.length > 0) throw new Error("No se puede eliminar: tiene registros médicos asociados.");

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

            await appointmentRepository.update(id, { status, cancellation_reason: reason || null }, conn);

            // 1. Logic for Completing Appointment: Calculate next suggested visit
            if (status === 'completed') {
                const intervalRows = await conn.query(`
                    SELECT 
                        COALESCE(p.visit_interval_days, d.default_visit_interval_days) as interval_days,
                        p.id as patient_id, d.id as doctor_id, a.appointment_date
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.id
                    JOIN doctors d ON a.doctor_id = d.id
                    WHERE a.id = ?
                `, [id]);

                if (intervalRows.length > 0) {
                    const intervals = intervalRows[0];
                    if (intervals.interval_days > 0) {
                        const nextDate = new Date(appt.appointment_date);
                        nextDate.setDate(nextDate.getDate() + Number(intervals.interval_days));
                        await conn.query("UPDATE patients SET next_suggested_visit_date = ? WHERE id = ?", [nextDate.toISOString().split('T')[0], intervals.patient_id]);
                    }
                }
            }

            // 2. Logic for Non-Attendance/Cancellation
            if (['cancelled', 'absent', 'suspended'].includes(status)) {
                await helper.freeSlot(conn, appt.doctor_id, appt.appointment_date);

                if (status === 'absent') {
                    // Lower patient reputation
                    await conn.query("UPDATE patients SET behavior_rating = GREATEST(0, behavior_rating - 1) WHERE id = ?", [appt.patient_id]);
                }

                if (['cancelled', 'absent', 'suspended'].includes(status)) {
                    // Delete pending transactions to clear debt
                    await conn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [id]);
                }
            }

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

        // 3. Google Calendar Sync (Non-blocking)
        try {
            const appt = await appointmentRepository.findById(id);
            if (appt && appt.google_event_id) {
                if (status === 'cancelled') {
                    await googleSyncService.syncDelete(id, appt.doctor_id, appt.google_event_id, userId);
                } else {
                    const patient = { id: appt.patient_id, full_name: appt.patient_name };
                    const eventData = {
                        status: status,
                        description: googleSyncService.buildDescription(appt, patient, { status })
                    };
                    await googleSyncService.syncUpdate(id, appt.doctor_id, appt.google_event_id, eventData, userId);
                }
            }
        } catch (syncErr) {
            console.warn(`[ModificationService] Non-fatal Sync Error: ${syncErr.message}`);
        }
        return true;
    }

    async updateAppointment(id, updates, userId, role, adminPassword) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const appt = await appointmentRepository.findById(id, conn);
            if (!appt) throw new Error("Appointment not found");

            await helper.checkModificationPermissions(conn, appt, { role }, adminPassword);

            if (updates.appointment_date && helper.formatDateForDB(updates.appointment_date) !== helper.formatDateForDB(appt.appointment_date)) {
                await helper.freeSlot(conn, appt.doctor_id, appt.appointment_date);
                await helper.occupySlot(conn, appt.doctor_id, updates.appointment_date);
                updates.status = 'rescheduled';
            }

            if (updates.appointment_date) {
                updates.appointment_date = helper.formatDateForDB(updates.appointment_date);
            }

            await appointmentRepository.update(id, updates, conn);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

        // 3. Google Calendar Sync
        try {
            const appt = await appointmentRepository.findById(id);
            if (appt && appt.google_event_id) {
                const updatedAppt = { ...appt, ...updates };
                const patient = { id: appt.patient_id, full_name: appt.patient_name };

                const eventData = {
                    summary: patient.full_name,
                    description: googleSyncService.buildDescription(updatedAppt, patient),
                };

                if (updates.appointment_date) {
                    const startTime = new Date(updates.appointment_date);
                    const endTime = new Date(startTime.getTime() + (updates.duration || appt.duration || 30) * 60000);
                    eventData.start = { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' };
                    eventData.end = { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' };
                }

                await googleSyncService.syncUpdate(id, appt.doctor_id, appt.google_event_id, eventData, userId);
            }
        } catch (syncErr) {
            console.warn(`[ModificationService] Non-fatal Update Sync Error: ${syncErr.message}`);
        }
        return true;
    }
    async bulkUpdateType(dayOfWeek, type, doctorId, fromDate, toDate, userId, userRole) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            if (userRole === 'doctor') {
                const docRows = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [userId]);
                if (!docRows || docRows.length === 0 || docRows[0].id != doctorId) throw new Error("Unauthorized");
            }
            const mysqlDay = Number(dayOfWeek) + 1;
            let query = "UPDATE appointments SET type = ? WHERE DAYOFWEEK(appointment_date) = ?";
            let params = [type, mysqlDay];
            if (doctorId) { query += " AND doctor_id = ?"; params.push(doctorId); }
            if (fromDate) { query += " AND appointment_date >= ?"; params.push(fromDate); }
            if (toDate) { query += " AND appointment_date <= ?"; params.push(toDate); }
            const result = await conn.query(query, params);
            await conn.commit();
            return result.affectedRows;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}

module.exports = new ModificationService();
