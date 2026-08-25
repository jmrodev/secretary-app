const pendingBookingRepository = require('../../repositories/communication/pendingBookingRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');
const whatsappService = require('./whatsappService');
const bookingService = require('../appointments/bookingService');
const { ConflictError } = require('../../utils/core/errors');

/**
 * PendingBookingService — encapsulates business logic for supervised WhatsApp auto-booking.
 * Controllers handle only request/response; this service owns guards, locking, templates and side-effects.
 */

const listPending = async () => {
    await pendingBookingRepository.expireStaleAlternatives();
    const data = await pendingBookingRepository.findActive();
    return data;
};

const acceptPending = async (id, secretaryId) => {
    const pending = await pendingBookingRepository.findById(id);
    if (!pending) {
        const err = new Error('Pending booking not found');
        err.statusCode = 404;
        throw err;
    }

    if (pending.status !== 'pending') {
        const err = new Error(pending.accepted_by_name ? `Already accepted by ${pending.accepted_by_name}` : 'This pending booking was already resolved');
        err.statusCode = 409;
        err.meta = { status: 'taken', accepted_by: pending.accepted_by_name || null };
        throw err;
    }

    // Phone-change guard: reject if patient's current phone no longer matches the captured phone
    const patient = await patientRepository.findById(pending.patient_id);
    const currentPhone = (patient?.phone || '').replace(/\D/g, '');
    const pendingPhone = (pending.patient_phone || '').replace(/\D/g, '');
    if (currentPhone && pendingPhone && !currentPhone.endsWith(pendingPhone.slice(-8))) {
        await pendingBookingRepository.rejectById(id, null, 'phone_changed');
        const err = new Error('El paciente cambió su número de teléfono. El pedido fue rechazado.');
        err.statusCode = 409;
        err.meta = { status: 'phone_changed' };
        throw err;
    }

    // Optimistic lock: only one secretary can win pending → accepted
    const affected = await pendingBookingRepository.acceptById(id, secretaryId);
    if (affected === 0) {
        const refreshedPending = await pendingBookingRepository.findById(id);
        const err = new Error(refreshedPending?.accepted_by_name ? `Already accepted by ${refreshedPending.accepted_by_name}` : 'Already accepted');
        err.statusCode = 409;
        err.meta = { status: 'taken', accepted_by: refreshedPending?.accepted_by_name || null };
        throw err;
    }

    try {
        const result = await bookingService.createAppointment(secretaryId, 'secretary', {
            patient_id: pending.patient_id,
            doctor_id: pending.doctor_id,
            appointment_date: `${pending.requested_slot_date} ${pending.requested_slot_time}:00`,
            reason: 'Turno aprobado por Secretaría'
        });

        const templateSetting = await systemSettingsRepository.findByKey('whatsapp_template_accept');
        if (!templateSetting || !templateSetting.setting_value?.trim()) {
            throw new Error('Template missing or empty');
        }

        const message = templateSetting.setting_value
            .replace(/{patient_name}/g, pending.patient_name)
            .replace(/{date}/g, pending.requested_slot_date)
            .replace(/{time}/g, pending.requested_slot_time)
            .replace(/{doctor_name}/g, pending.doctor_name);

        await whatsappService.sendMessageDirect(pending.patient_phone, message, pending.patient_id);

        return { appointment_id: result.id };
    } catch (err) {
        await pendingBookingRepository.rejectById(id, null, 'slot_taken');
        if (err instanceof ConflictError) {
            const conflictErr = new Error('Slot no longer available');
            conflictErr.statusCode = 409;
            conflictErr.meta = { status: 'slot_taken' };
            throw conflictErr;
        }
        throw err;
    }
};

const suggestAlternative = async (id, alternativeSlotIso, note) => {
    if (!alternativeSlotIso) {
        const err = new Error('alternative_slot_iso is required');
        err.statusCode = 400;
        throw err;
    }

    const pending = await pendingBookingRepository.findById(id);
    if (!pending) {
        const err = new Error('Pending booking not found');
        err.statusCode = 404;
        throw err;
    }

    const affected = await pendingBookingRepository.suggestAlternative(id, alternativeSlotIso, note);
    if (affected === 0) {
        const err = new Error('This pending booking was already resolved');
        err.statusCode = 409;
        err.meta = { status: 'taken' };
        throw err;
    }

    const [datePart, timePart] = alternativeSlotIso.split('T');
    const timeFormatted = timePart.substring(0, 5);

    const templateSetting = await systemSettingsRepository.findByKey('whatsapp_template_alternative');
    if (!templateSetting || !templateSetting.setting_value?.trim()) {
        throw new Error('Template missing or empty');
    }

    const message = templateSetting.setting_value
        .replace(/{patient_name}/g, pending.patient_name)
        .replace(/{date}/g, datePart)
        .replace(/{time}/g, timeFormatted);

    await whatsappService.sendMessageDirect(pending.patient_phone, message, pending.patient_id);

    return { message: 'Alternative sent to patient' };
};

const rejectPending = async (id, userId, reason) => {
    await pendingBookingRepository.rejectById(id, userId, reason || null);
    return { success: true };
};

module.exports = { listPending, acceptPending, suggestAlternative, rejectPending };
