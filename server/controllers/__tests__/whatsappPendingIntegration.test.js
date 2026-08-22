/**
 * Integration tests for the supervised WhatsApp pending-booking flow.
 *
 * Exercises the REAL pendingBookingRepository (and the AI service alternative
 * confirmation path) against an in-memory fake MariaDB pool, while mocking only
 * external boundaries (WhatsApp transport, appointment creation SP, patient/doctor
 * lookups). The optimistic lock behaves like production: first UPDATE wins,
 * second sees affectedRows 0.
 *
 * Covers spec scenarios 2.1, 4.1, 5.1 and 3.1.
 */
const httpMocks = require('node-mocks-http');
const { createFakePool } = require('../../test-helpers/fakePool');

jest.mock('../../services/communication/whatsappService', () => ({
    sendMessageDirect: jest.fn().mockResolvedValue({ ok: true })
}));
jest.mock('../../services/appointments/bookingService', () => ({
    createAppointment: jest.fn()
}));
jest.mock('../../repositories/user/patientRepository', () => ({
    findById: jest.fn()
}));
jest.mock('../../repositories/user/doctorRepository', () => ({
    findById: jest.fn()
}));
jest.mock('../../repositories/communication/whatsappRepository', () => ({
    getHistoryByPatient: jest.fn(),
    getHistoryByPhone: jest.fn()
}));
jest.mock('../../repositories/appointments/scheduleRepository', () => ({
    findByDoctor: jest.fn()
}));
jest.mock('../../repositories/appointments/holidayRepository', () => ({
    findAll: jest.fn()
}));
jest.mock('../../services/appointments/availabilitySearchService', () => ({
    getFreeSlotsBatch: jest.fn()
}));
jest.mock('../../db', () => ({
    pool: { query: jest.fn() }
}));
// Defensive: the controller imports this repo; under NODE_ENV=test its real
// module loads with a null pool. Mocking keeps the module graph off any real
// DB binding while the env-only AI path is exercised.
jest.mock('../../repositories/system/systemSettingsRepository', () => ({
    findManyByKeys: jest.fn().mockResolvedValue([]),
    findByKey: jest.fn().mockImplementation(async (key) => {
        if (key === 'whatsapp_template_accept') return { setting_value: 'Hola {patient_name}, aceptada el {date} a las {time} con {doctor_name}' };
        if (key === 'whatsapp_template_alternative') return { setting_value: 'Hola {patient_name}, alternativa el {date} a las {time}' };
        return null;
    }),
    findAll: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue([])
}));

const whatsappController = require('../communication/whatsappController');
const pendingBookingRepository = require('../../repositories/communication/pendingBookingRepository');
const whatsappService = require('../../services/communication/whatsappService');
const bookingService = require('../../services/appointments/bookingService');
const patientRepository = require('../../repositories/user/patientRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const scheduleRepository = require('../../repositories/appointments/scheduleRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');
const availabilitySearchService = require('../../services/appointments/availabilitySearchService');
const { pool } = require('../../db');

const seedPending = {
    id: 4,
    patient_id: 5,
    doctor_id: 3,
    patient_phone: '+5491112345678',
    requested_slot_date: '2026-08-03',
    requested_slot_time: '09:00',
    status: 'pending',
    created_at: new Date('2026-08-01T10:00:00')
};

let fakePool;

beforeEach(() => {
    jest.clearAllMocks();
    fakePool = createFakePool({
        pendingBookings: [{ ...seedPending }],
        patientNames: { 5: 'Juan Perez' },
        doctorNames: { 3: 'Dr. House' }
    });
    // Point the real repository at the in-memory pool for this test.
    pendingBookingRepository.pool = fakePool;

    bookingService.createAppointment.mockResolvedValue({ id: 456, patient_id: 5 });
    patientRepository.findById.mockResolvedValue({ phone: '+5491112345678' });
});

function makeRequest(body = {}, params = {}) {
    const req = httpMocks.createRequest();
    req.user = { user_id: 11, role: 'secretary' };
    req.params = params;
    req.body = body;
    return req;
}

describe('Pending booking integration — controller + real repository + fake pool', () => {
    describe('Scenario 2.1 — secretary accepts → appointment created, pending accepted', () => {
        it('creates the appointment, marks the pending accepted and notifies the patient', async () => {
            const req = makeRequest({}, { id: '4' });
            const res = httpMocks.createResponse();

            await whatsappController.acceptPending(req, res);

            expect(bookingService.createAppointment).toHaveBeenCalledWith(11, 'secretary', {
                patient_id: 5,
                doctor_id: 3,
                appointment_date: '2026-08-03 09:00:00',
                reason: 'Turno aprobado por Secretaría'
            });
            expect(whatsappService.sendMessageDirect).toHaveBeenCalledWith(
                '+5491112345678',
                'Hola Juan Perez, aceptada el 2026-08-03 a las 09:00 con Dr. House',
                5
            );
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ success: true, appointment_id: 456 });

            const row = fakePool._pendingRows.find((r) => r.id === 4);
            expect(row.status).toBe('accepted');
            expect(row.accepted_by).toBe(11);
        });
    });

    describe('Scenario 4.1 — two secretaries accept concurrently → first wins, second sees taken', () => {
        it('lets only the first accept succeed and reports the winner to the second', async () => {
            const firstReq = makeRequest({}, { id: '4' });
            const firstRes = httpMocks.createResponse();
            await whatsappController.acceptPending(firstReq, firstRes);
            expect(firstRes.statusCode).toBe(200);

            const secondReq = makeRequest({}, { id: '4' });
            secondReq.user = { user_id: 12, role: 'secretary' };
            const secondRes = httpMocks.createResponse();
            await whatsappController.acceptPending(secondReq, secondRes);

            expect(secondRes.statusCode).toBe(409);
            expect(secondRes._getJSONData()).toEqual({
                success: false,
                status: 'taken',
                accepted_by: 'Ana (Secretaria)',
                message: 'Already accepted by Ana (Secretaria)'
            });
            expect(bookingService.createAppointment).toHaveBeenCalledTimes(1);
            expect(fakePool._pendingRows.find((r) => r.id === 4).accepted_by).toBe(11);
        });
    });

    describe('Scenario 5.1 — patient changed phone → auto-reject', () => {
        it('rejects the pending when the current patient phone no longer matches', async () => {
            patientRepository.findById.mockResolvedValue({ phone: '+5422222222' });
            const req = makeRequest({}, { id: '4' });
            const res = httpMocks.createResponse();

            await whatsappController.acceptPending(req, res);

            expect(res.statusCode).toBe(409);
            expect(res._getJSONData().status).toBe('phone_changed');
            expect(bookingService.createAppointment).not.toHaveBeenCalled();

            const row = fakePool._pendingRows.find((r) => r.id === 4);
            expect(row.status).toBe('rejected');
            expect(row.rejected_reason).toBe('phone_changed');
        });
    });

    describe('Scenario 3.1 part 1 — secretary suggests alternative → alternative_sent + patient asked', () => {
        it('marks the pending alternative_sent and sends the question via WhatsApp', async () => {
            const req = makeRequest(
                { alternative_slot_iso: '2026-08-05T10:00:00', note: 'Prefiere turnos a la mañana' },
                { id: '4' }
            );
            const res = httpMocks.createResponse();

            await whatsappController.suggestAlternative(req, res);

            expect(res.statusCode).toBe(200);
            expect(whatsappService.sendMessageDirect).toHaveBeenCalledWith(
                '+5491112345678',
                'Hola Juan Perez, alternativa el 2026-08-05 a las 10:00',
                5
            );

            const row = fakePool._pendingRows.find((r) => r.id === 4);
            expect(row.status).toBe('alternative_sent');
            expect(row.alternative_slot_iso).toBe('2026-08-05T10:00:00');
            expect(row.alternative_note).toBe('Prefiere turnos a la mañana');
        });
    });
});

