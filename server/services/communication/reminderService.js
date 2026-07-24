const reminderRepository = require('../../repositories/communication/reminderRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');

/**
 * ReminderService
 * Business logic for reminders.
 */
class ReminderService {
    async getRemindersForUser(user) {
        const { role, user_id } = user;
        let doctorId = null;

        if (role === 'doctor') {
            const doc = await doctorRepository.getDoctorConfigByUserId(user_id);
            if (doc) doctorId = doc.id;
        }

        return await reminderRepository.findPendingReminders(doctorId);
    }

    async completeReminder(data) {
        const { patientId, type, medIds, notified } = data;
        const val = notified ? 1 : 0;

        if (type === 'visit') {
            if (notified !== undefined) await reminderRepository.updatePatientReminder(patientId, 'visit_notified', val);
            else await reminderRepository.clearPatientReminder(patientId, 'next_suggested_visit_date', 'visit_notified');
        } else if (type === 'prescription') {
            if (notified !== undefined) await reminderRepository.updatePatientReminder(patientId, 'prescription_notified', val);
            else await reminderRepository.clearPatientReminder(patientId, 'next_suggested_prescription_date', 'prescription_notified');
        } else if (type === 'license') {
            if (notified !== undefined) await reminderRepository.updatePatientReminder(patientId, 'license_notified', val);
            else await reminderRepository.clearPatientReminder(patientId, 'license_expiry_date', 'license_notified');
        } else if (type === 'medication' && medIds) {
            const ids = Array.isArray(medIds) ? medIds : String(medIds).split(',');
            if (notified !== undefined) await reminderRepository.updateMedicationReminders(ids, notified);
            else await reminderRepository.clearMedicationReminders(ids);
        }
    }
}

module.exports = new ReminderService();
