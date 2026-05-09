const appointmentEvents = require('../events/appointmentEvents');
const googleSyncService = require('../services/appointments/googleSyncService');
const doctorRepository = require('../repositories/doctorRepository');
const whatsappService = require('../services/whatsappService');

// 1. Google Calendar Synchronizer
// ... existing code ...

// 3. WhatsApp Confirmation Notifier
appointmentEvents.on('appointmentCreated', async ({ data, patientData }) => {
    try {
        await whatsappService.sendConfirmationMessage({
            patient_id: patientData.id,
            patient_name: patientData.full_name,
            patient_phone: patientData.phone_number || patientData.phone,
            appointment_date: data.appointment_date,
            doctor_id: data.doctor_id,
            type: data.type
        });
    } catch (err) {
        console.error(`[Listeners] WhatsApp Confirmation Error: ${err.message}`);
    }
});
appointmentEvents.on('appointmentCreated', async ({ appointmentId, data, patientData, paymentStatus, userId }) => {
    const startTime = new Date(data.appointment_date);
    
    // Fetch doctor config to get real appointment duration
    let duration = 30; // Default fallback
    try {
        const doctorConfig = await doctorRepository.getDoctorConfig(data.doctor_id);
        if (doctorConfig && doctorConfig.appointment_duration) {
            duration = doctorConfig.appointment_duration;
        }
    } catch (err) {
        console.warn(`[Listeners] Failed to fetch doctor config for ID ${data.doctor_id}: ${err.message}`);
    }

    const endTime = new Date(startTime.getTime() + duration * 60000);
    const eventData = {
        summary: patientData.full_name,
        description: `Motivo: ${data.reason}\nPaciente: ${patientData.full_name}\nTipo: ${data.type}\nPago: ${paymentStatus}`,
        start: { dateTime: startTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
        end: { dateTime: endTime.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' }
    };
    await googleSyncService.syncCreate(appointmentId, data.doctor_id, eventData, userId);
});

// 2. Audit Logger
appointmentEvents.on('appointmentCreated', async ({ appointmentId, userId }) => {
    console.log(`[Audit] Appointment ${appointmentId} created by User ${userId}`);
});

appointmentEvents.on('appointmentOverwritten', async ({ oldAppointment, oldPatientName, newUserId }) => {
    console.log(`[Audit] Appointment ${oldAppointment.id} (Patient: ${oldPatientName}) was OVERWRITTEN by User ${newUserId}`);
});

// Listener for updates
appointmentEvents.on('appointmentStatusUpdated', async ({ appointmentId, appt, status, userId }) => {
    if (appt.google_event_id) {
        const eventData = { status, paymentStatus: appt.payment_status };
        await googleSyncService.syncUpdate(appointmentId, appt.doctor_id, appt.google_event_id, eventData, userId);
    }
});

module.exports = appointmentEvents;
