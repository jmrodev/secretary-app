const eventBus = require('../events/eventBus');
const EVENTS = require('../events/eventConstants');
const googleSyncService = require('../services/appointments/googleSyncService');
const doctorRepository = require('../repositories/user/doctorRepository');
const appointmentRepository = require('../repositories/appointments/appointmentRepository');
const whatsappService = require('../services/communication/whatsappService');

// 1. Google Calendar Synchronizer (Cross-domain via eventBus)

eventBus.on(EVENTS.APPOINTMENT_DELETED, async ({ id, google_event_id, doctor_id, userId }) => {
    if (google_event_id) {
        try {
            await googleSyncService.syncDelete(id, doctor_id, google_event_id, userId);
        } catch (e) { console.warn("[Listeners] Google Sync Delete Failed", e.message); }
    }
});

eventBus.on(EVENTS.APPOINTMENT_CANCELLED, async ({ id, status, userId }) => {
    try {
        const appt = await appointmentRepository.findById(id);
        if (!appt?.google_event_id) return;

        if (status === 'cancelled') {
            await googleSyncService.syncDelete(id, appt.doctor_id, appt.google_event_id, userId);
        } else {
            const data = { 
                status, 
                description: googleSyncService.buildDescription(appt, { id: appt.patient_id, full_name: appt.patient_name }, { status }) 
            };
            await googleSyncService.syncUpdate(id, appt.doctor_id, appt.google_event_id, data, userId);
        }
    } catch (e) { console.warn("[Listeners] Google Sync Status Update Failed", e.message); }
});

eventBus.on(EVENTS.APPOINTMENT_COMPLETED, async ({ id, status, userId }) => {
    try {
        const appt = await appointmentRepository.findById(id);
        if (!appt?.google_event_id) return;
        const data = { 
            status: 'completed', 
            description: googleSyncService.buildDescription(appt, { id: appt.patient_id, full_name: appt.patient_name }, { status: 'completed' }) 
        };
        await googleSyncService.syncUpdate(id, appt.doctor_id, appt.google_event_id, data, userId);
    } catch (e) { console.warn("[Listeners] Google Sync Completion Failed", e.message); }
});

// 2. WhatsApp Confirmation Notifier (Domain-specific via appointmentEvents)
const appointmentEvents = require('../events/appointmentEvents');

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
