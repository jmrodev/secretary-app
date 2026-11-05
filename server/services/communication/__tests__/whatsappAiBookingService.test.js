jest.mock('../../../repositories/appointments/appointmentRepository', () => ({
    findLastByPatientId: jest.fn()
}));
jest.mock('../../../repositories/user/doctorRepository', () => ({
    findFirst: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    getDoctorSchedules: jest.fn()
}));
jest.mock('../../../repositories/communication/pendingBookingRepository', () => ({
    findActiveByPatient: jest.fn(),
    create: jest.fn()
}));
jest.mock('../../appointments/availabilitySearchService', () => ({
    getNextFreeSlot: jest.fn()
}));
jest.mock('../whatsappService', () => ({
    sendMessageDirect: jest.fn()
}));
jest.mock('@sentry/node', () => ({
    init: jest.fn(),
    captureException: jest.fn()
}));
jest.mock('axios');

const axios = require('axios');
const appointmentRepository = require('../../../repositories/appointments/appointmentRepository');
const doctorRepository = require('../../../repositories/user/doctorRepository');
const pendingBookingRepository = require('../../../repositories/communication/pendingBookingRepository');
const availabilitySearchService = require('../../appointments/availabilitySearchService');
const whatsappService = require('../whatsappService');
const { extractToolCalls, processInboundMessage, resolveDoctorCandidates, checkDoctorShiftConstraint } = require('../whatsappAiBookingService');

describe('whatsappAiBookingService - extractToolCalls', () => {
    it('extracts native Ollama tool_calls array for gestionar_solicitud_turno', () => {
        const msg = {
            tool_calls: [
                {
                    function: {
                        name: 'gestionar_solicitud_turno',
                        arguments: { doctor_solicitado: 'Cecilia', preferencia_franja: 'manana' }
                    }
                }
            ]
        };
        const calls = extractToolCalls(msg);
        expect(calls).toHaveLength(1);
        expect(calls[0].name).toBe('gestionar_solicitud_turno');
        expect(calls[0].arguments.doctor_solicitado).toBe('Cecilia');
    });

    it('extracts tool calls formatted as JSON in content (fallback)', () => {
        const msg = {
            content: '```json\n{"name": "gestionar_solicitud_turno", "arguments": {"doctor_solicitado": "Gomez"}}\n```'
        };
        const calls = extractToolCalls(msg);
        expect(calls).toHaveLength(1);
        expect(calls[0].name).toBe('gestionar_solicitud_turno');
        expect(calls[0].arguments.doctor_solicitado).toBe('Gomez');
    });

    it('returns empty array when content is general conversation without tool calls', () => {
        const msg = { content: 'Hola! Muchas gracias por la atencion' };
        const calls = extractToolCalls(msg);
        expect(calls).toHaveLength(0);
    });
});

describe('whatsappAiBookingService - Doctor Disambiguation & Shifts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('disambiguates when two doctors match the requested name (e.g. Cecilia)', async () => {
        doctorRepository.findAll.mockResolvedValueOnce([
            { id: 1, first_name: 'Cecilia', last_name: 'Gomez', specialty: 'Pediatría' },
            { id: 2, first_name: 'Cecilia', last_name: 'Rossi', specialty: 'Dermatología' },
            { id: 3, first_name: 'Carlos', last_name: 'Perez', specialty: 'Clínica' }
        ]);

        const candidates = await resolveDoctorCandidates({ requestedDoctorName: 'Cecilia', patientId: 10 });
        expect(candidates).toHaveLength(2);
        expect(candidates[0].last_name).toBe('Gomez');
        expect(candidates[1].last_name).toBe('Rossi');
    });

    it('detects when doctor only attends in the morning and patient asks for afternoon', async () => {
        doctorRepository.getDoctorSchedules.mockResolvedValueOnce([
            { start_time: '08:00:00', end_time: '12:00:00', day_of_week: 1 },
            { start_time: '09:00:00', end_time: '13:00:00', day_of_week: 3 }
        ]);

        const check = await checkDoctorShiftConstraint(1, 'tarde');
        expect(check.isCompatible).toBe(false);
        expect(check.reason).toBe('only_morning');
    });
});

describe('whatsappAiBookingService - processInboundMessage Full Flow', () => {
    const origGeminiKey = process.env.GEMINI_API_KEY;

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.GEMINI_API_KEY;
    });

    afterEach(() => {
        if (origGeminiKey) process.env.GEMINI_API_KEY = origGeminiKey;
    });

    it('sends disambiguation WhatsApp prompt when multiple doctors match requested name', async () => {
        pendingBookingRepository.findActiveByPatient.mockResolvedValue(null);

        axios.post.mockResolvedValueOnce({
            data: {
                message: {
                    tool_calls: [
                        {
                            function: {
                                name: 'gestionar_solicitud_turno',
                                arguments: { doctor_solicitado: 'Cecilia' }
                            }
                        }
                    ]
                }
            }
        });

        doctorRepository.findAll.mockResolvedValueOnce([
            { id: 1, first_name: 'Cecilia', last_name: 'Gomez', specialty: 'Pediatría' },
            { id: 2, first_name: 'Cecilia', last_name: 'Rossi', specialty: 'Dermatología' }
        ]);

        const res = await processInboundMessage({
            sender: '5491112345678@s.whatsapp.net',
            message: 'Hola! Quiero un turno con la Dra. Cecilia',
            patientId: 10,
            phone: '5491112345678'
        });

        expect(res.status).toBe('disambiguation_required');
        expect(whatsappService.sendMessageDirect).toHaveBeenCalledTimes(1);
        expect(whatsappService.sendMessageDirect.mock.calls[0][1]).toContain('Cecilia Gomez');
        expect(whatsappService.sendMessageDirect.mock.calls[0][1]).toContain('Cecilia Rossi');
        expect(pendingBookingRepository.create).not.toHaveBeenCalled();
    });

    it('notifies patient when doctor has no free slots (fully booked / saturation)', async () => {
        pendingBookingRepository.findActiveByPatient.mockResolvedValue(null);

        axios.post.mockResolvedValueOnce({
            data: {
                message: {
                    tool_calls: [
                        {
                            function: {
                                name: 'gestionar_solicitud_turno',
                                arguments: { doctor_solicitado: 'Cecilia' }
                            }
                        }
                    ]
                }
            }
        });

        doctorRepository.findAll.mockResolvedValueOnce([
            { id: 1, first_name: 'Cecilia', last_name: 'Gomez', specialty: 'Pediatría' }
        ]);

        availabilitySearchService.getNextFreeSlot.mockResolvedValueOnce({ results: [] });

        const res = await processInboundMessage({
            sender: '5491112345678@s.whatsapp.net',
            message: 'Hola, turno con la Dra. Gomez',
            patientId: 10,
            phone: '5491112345678'
        });

        expect(res.status).toBe('fully_booked');
        expect(whatsappService.sendMessageDirect).toHaveBeenCalledTimes(1);
        expect(whatsappService.sendMessageDirect.mock.calls[0][1]).toContain('no dispone de turnos libres');
        expect(pendingBookingRepository.create).not.toHaveBeenCalled();
    });

    it('creates pending booking and sends immediate acknowledgment with shift notice', async () => {
        pendingBookingRepository.findActiveByPatient.mockResolvedValue(null);

        axios.post.mockResolvedValueOnce({
            data: {
                message: {
                    tool_calls: [
                        {
                            function: {
                                name: 'gestionar_solicitud_turno',
                                arguments: { doctor_solicitado: 'Cecilia', preferencia_franja: 'tarde' }
                            }
                        }
                    ]
                }
            }
        });

        doctorRepository.findAll.mockResolvedValueOnce([
            { id: 1, first_name: 'Cecilia', last_name: 'Gomez', specialty: 'Pediatría' }
        ]);

        doctorRepository.getDoctorSchedules.mockResolvedValueOnce([
            { start_time: '08:00:00', end_time: '12:00:00', day_of_week: 1 }
        ]);

        availabilitySearchService.getNextFreeSlot.mockResolvedValueOnce({
            results: [{ date: '2026-11-15', slots: [{ time: '09:30' }] }]
        });

        pendingBookingRepository.create.mockResolvedValueOnce(99);

        const res = await processInboundMessage({
            sender: '5491112345678@s.whatsapp.net',
            message: 'Quiero turno con Cecilia por la tarde',
            patientId: 10,
            phone: '5491112345678'
        });

        expect(res.pendingId).toBe(99);
        expect(pendingBookingRepository.create).toHaveBeenCalledWith({
            patient_id: 10,
            doctor_id: 1,
            patient_phone: '5491112345678',
            patient_message: 'Quiero turno con Cecilia por la tarde',
            requested_slot_date: '2026-11-15',
            requested_slot_time: '09:30'
        });

        expect(whatsappService.sendMessageDirect).toHaveBeenCalledTimes(1);
        const sentText = whatsappService.sendMessageDirect.mock.calls[0][1];
        expect(sentText).toContain('Registramos tu pedido');
        expect(sentText).toContain('atiende únicamente por la mañana');
        expect(sentText).toContain('2026-11-15');
        expect(sentText).toContain('09:30 hs');
    });
});
