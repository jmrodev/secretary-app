const httpMocks = require('node-mocks-http');
const { ConflictError } = require('../../utils/core/errors');

jest.mock('../../services/communication/whatsappService', () => ({
    sendMessageDirect: jest.fn().mockResolvedValue({ ok: true })
}));
jest.mock('../../repositories/communication/pendingBookingRepository');
jest.mock('../../services/appointments/bookingService');
jest.mock('../../repositories/user/patientRepository');
jest.mock('../../db', () => ({
    pool: { query: jest.fn() }
}));

const whatsappController = require('../communication/whatsappController');
const whatsappService = require('../../services/communication/whatsappService');
const pendingBookingRepository = require('../../repositories/communication/pendingBookingRepository');
const bookingService = require('../../services/appointments/bookingService');
const patientRepository = require('../../repositories/user/patientRepository');

describe('WhatsAppController - pending bookings', () => {
    let req, res;

    const basePending = {
        id: 4,
        patient_id: 5,
        doctor_id: 3,
        patient_name: 'Juan Perez',
        doctor_name: 'Dr. House',
        patient_phone: '+5491112345678',
        requested_slot_date: '2026-08-03',
        requested_slot_time: '09:00',
        status: 'pending'
    };

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        jest.clearAllMocks();
        req.user = { user_id: 11, role: 'secretary' };
        req.params = { id: '4' };
        req.body = {};
        bookingService.createAppointment.mockResolvedValue({ id: 456, patient_id: 5 });
    });

    describe('listPending', () => {
        it('should run the 2h alternative timeout cleanup and return active pendings', async () => {
            pendingBookingRepository.expireStaleAlternatives.mockResolvedValue(2);
            pendingBookingRepository.findActive.mockResolvedValue([basePending]);

            await whatsappController.listPending(req, res);

            expect(pendingBookingRepository.expireStaleAlternatives).toHaveBeenCalledTimes(1);
            expect(pendingBookingRepository.findActive).toHaveBeenCalledTimes(1);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ success: true, data: [basePending] });
        });
    });

    describe('acceptPending', () => {
        it('should create the appointment, mark accepted and notify the patient', async () => {
            pendingBookingRepository.findById.mockResolvedValue({ ...basePending });
            patientRepository.findById.mockResolvedValue({ phone: '+5491112345678' });
            pendingBookingRepository.acceptById.mockResolvedValue(1);

            await whatsappController.acceptPending(req, res);

            expect(bookingService.createAppointment).toHaveBeenCalledWith(11, 'secretary', {
                patient_id: 5,
                doctor_id: 3,
                appointment_date: '2026-08-03 09:00:00',
                reason: 'Turno aprobado por Secretaría'
            });
            expect(pendingBookingRepository.acceptById).toHaveBeenCalledWith(4, 11);
            expect(whatsappService.sendMessageDirect).toHaveBeenCalledWith(
                '+5491112345678',
                expect.stringContaining('confirmado'),
                5
            );
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ success: true, appointment_id: 456 });
        });

        it('should return 404 when the pending booking does not exist', async () => {
            pendingBookingRepository.findById.mockResolvedValue(null);

            await whatsappController.acceptPending(req, res);

            expect(res.statusCode).toBe(404);
            expect(bookingService.createAppointment).not.toHaveBeenCalled();
        });

        it('should report taken when the optimistic lock fails (second secretary loses the race)', async () => {
            pendingBookingRepository.findById
                .mockResolvedValueOnce({ ...basePending })
                .mockResolvedValueOnce({ ...basePending, status: 'accepted', accepted_by_name: 'Ana (Secretaria)' });
            pendingBookingRepository.acceptById.mockResolvedValue(0);

            await whatsappController.acceptPending(req, res);

            expect(bookingService.createAppointment).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(409);
            expect(res._getJSONData()).toEqual({
                success: false,
                status: 'taken',
                accepted_by: 'Ana (Secretaria)',
                message: 'Already accepted by Ana (Secretaria)'
            });
        });

        it('should reject with phone_changed when the patient changed their phone since the pending was created', async () => {
            pendingBookingRepository.findById.mockResolvedValue({ ...basePending, patient_phone: '+5411111111' });
            patientRepository.findById.mockResolvedValue({ phone: '+5422222222' });

            await whatsappController.acceptPending(req, res);

            expect(pendingBookingRepository.rejectById).toHaveBeenCalledWith(4, null, 'phone_changed');
            expect(bookingService.createAppointment).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(409);
            expect(res._getJSONData().status).toBe('phone_changed');
        });

        it('should reject with slot_taken when the slot was booked elsewhere before approval', async () => {
            pendingBookingRepository.findById.mockResolvedValue({ ...basePending });
            patientRepository.findById.mockResolvedValue({ phone: '+5491112345678' });
            pendingBookingRepository.acceptById.mockResolvedValue(1);
            bookingService.createAppointment.mockRejectedValue(new ConflictError('Ya existe un turno confirmado en este horario.'));

            await whatsappController.acceptPending(req, res);

            expect(pendingBookingRepository.rejectById).toHaveBeenCalledWith(4, null, 'slot_taken');
            expect(whatsappService.sendMessageDirect).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(409);
            expect(res._getJSONData()).toEqual({
                success: false,
                status: 'slot_taken',
                message: 'Slot no longer available'
            });
        });
    });

    describe('suggestAlternative', () => {
        it('should mark alternative_sent, ask the patient via WhatsApp and confirm to the secretary', async () => {
            req.body = { alternative_slot_iso: '2026-08-05T10:00:00', note: 'Prefiere turnos a la mañana' };
            pendingBookingRepository.findById.mockResolvedValue({ ...basePending });
            pendingBookingRepository.suggestAlternative.mockResolvedValue(1);

            await whatsappController.suggestAlternative(req, res);

            expect(pendingBookingRepository.suggestAlternative).toHaveBeenCalledWith(4, '2026-08-05T10:00:00', 'Prefiere turnos a la mañana');
            expect(whatsappService.sendMessageDirect).toHaveBeenCalledWith(
                '+5491112345678',
                expect.stringContaining('alternativ'),
                5
            );
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ success: true, message: 'Alternative sent to patient' });
        });

        it('should return 400 when no alternative slot is provided', async () => {
            await whatsappController.suggestAlternative(req, res);

            expect(res.statusCode).toBe(400);
            expect(pendingBookingRepository.suggestAlternative).not.toHaveBeenCalled();
        });

        it('should return 409 when the pending booking was already resolved', async () => {
            req.body = { alternative_slot_iso: '2026-08-05T10:00:00' };
            pendingBookingRepository.findById.mockResolvedValue({ ...basePending });
            pendingBookingRepository.suggestAlternative.mockResolvedValue(0);

            await whatsappController.suggestAlternative(req, res);

            expect(res.statusCode).toBe(409);
            expect(whatsappService.sendMessageDirect).not.toHaveBeenCalled();
        });
    });

    describe('rejectPending', () => {
        it('should mark the pending booking as rejected with the reason', async () => {
            req.body = { reason: 'Paciente no responde' };
            pendingBookingRepository.rejectById.mockResolvedValue(1);

            await whatsappController.rejectPending(req, res);

            expect(pendingBookingRepository.rejectById).toHaveBeenCalledWith(4, 11, 'Paciente no responde');
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ success: true });
        });

        it('should reject without reason when none is provided', async () => {
            pendingBookingRepository.rejectById.mockResolvedValue(1);

            await whatsappController.rejectPending(req, res);

            expect(pendingBookingRepository.rejectById).toHaveBeenCalledWith(4, 11, null);
            expect(res._getJSONData()).toEqual({ success: true });
        });
    });
});
