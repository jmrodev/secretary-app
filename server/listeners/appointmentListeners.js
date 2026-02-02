const appointmentEvents = require('../events/appointmentEvents');
const googleSyncService = require('../services/appointments/googleSyncService');
const { logAction } = require('../utils/audit');

// 1. Google Calendar Synchronizer
appointmentEvents.on('appointmentCreated', async ({ appointmentId, data, patientData, paymentStatus, userId }) => {
    const startTime = new Date(data.appointment_date);
    const endTime = new Date(startTime.getTime() + 30 * 60000);
    const eventData = {
        summary: patientData.full_name,
        description: `Motivo: ${data.reason}\nPaciente: ${patientData.full_name}\nTipo: ${data.type}\nPago: ${paymentStatus}`,
        start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
        end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' }
    };
    await googleSyncService.syncCreate(appointmentId, data.doctor_id, eventData, userId);
});

// 2. Audit Logger
appointmentEvents.on('appointmentCreated', async ({ appointmentId, patientData, userId }) => {
    // Assuming a fake 'req' object or a specialized log function
    console.log(`[Audit] Appointment ${appointmentId} created by User ${userId}`);
});

// Listener for updates
appointmentEvents.on('appointmentStatusUpdated', async ({ appointmentId, appt, status, userId }) => {
    if (appt.google_event_id) {
        const eventData = { status, paymentStatus: appt.payment_status };
        await googleSyncService.syncUpdate(appointmentId, appt.doctor_id, appt.google_event_id, eventData, userId);
    }
});

module.exports = appointmentEvents;
