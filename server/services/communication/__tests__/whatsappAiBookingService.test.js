jest.mock('../../../repositories/appointments/appointmentRepository', () => ({
    findLastByPatientId: jest.fn()
}));
jest.mock('../../../repositories/user/doctorRepository', () => ({
    findFirst: jest.fn()
}));
jest.mock('../../../repositories/communication/pendingBookingRepository', () => ({
    findActiveByPatient: jest.fn(),
    create: jest.fn()
}));
jest.mock('../../appointments/availabilitySearchService', () => ({
    getNextFreeSlot: jest.fn()
}));
jest.mock('axios');

const axios = require('axios');
const appointmentRepository = require('../../../repositories/appointments/appointmentRepository');
const doctorRepository = require('../../../repositories/user/doctorRepository');
const pendingBookingRepository = require('../../../repositories/communication/pendingBookingRepository');
const availabilitySearchService = require('../../appointments/availabilitySearchService');
const { extractToolCalls, processInboundMessage } = require('../whatsappAiBookingService');

describe('whatsappAiBookingService - extractToolCalls', () => {
    it('extracts native Ollama tool_calls array', () => {
        const msg = {
            tool_calls: [
                {
                    function: {
                        name: 'buscar_turnos_disponibles',
                        arguments: { doctor_id: 3 }
                    }
                }
            ]
        };
        const calls = extractToolCalls(msg);
        expect(calls).toHaveLength(1);
        expect(calls[0].name).toBe('buscar_turnos_disponibles');
        expect(calls[0].arguments.doctor_id).toBe(3);
    });

    it('extracts tool calls formatted as JSON in content (fallback)', () => {
        const msg = {
            content: '```json\n{"name": "buscar_turnos_disponibles", "arguments": {"doctor_id": 5}}\n```'
        };
        const calls = extractToolCalls(msg);
        expect(calls).toHaveLength(1);
        expect(calls[0].name).toBe('buscar_turnos_disponibles');
        expect(calls[0].arguments.doctor_id).toBe(5);
    });

    it('returns empty array when content is general conversation without tool calls', () => {
        const msg = {
            content: 'Hola! En qué puedo ayudarte?'
        };
        const calls = extractToolCalls(msg);
        expect(calls).toHaveLength(0);
    });
});

describe('whatsappAiBookingService - processInboundMessage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a pending booking when patient requests an appointment and a free slot exists', async () => {
        // Mock active check: no active pending booking
        pendingBookingRepository.findActiveByPatient.mockResolvedValue(null);

        // Mock doctor resolution: found doctor 7
        appointmentRepository.findLastByPatientId.mockResolvedValueOnce({ doctor_id: 7 });

        // Mock Ollama response calling the tool
        axios.post.mockResolvedValueOnce({
            data: {
                message: {
                    tool_calls: [
                        {
                            function: {
                                name: 'buscar_turnos_disponibles',
                                arguments: { doctor_id: 7 }
                            }
                        }
                    ]
                }
            }
        });

        // Mock availability search
        availabilitySearchService.getNextFreeSlot.mockResolvedValueOnce({
            results: [
                {
                    date: '2026-10-28',
                    slots: [{ time: '11:15' }]
                }
            ]
        });

        // Mock pending booking create
        pendingBookingRepository.create.mockResolvedValueOnce(42);

        const result = await processInboundMessage({
            sender: '5491112345678@s.whatsapp.net',
            message: 'Hola! Necesito un turno para la semana que viene por favor',
            patientId: 10,
            phone: '5491112345678'
        });

        expect(result).toEqual({ pendingId: 42, date: '2026-10-28', time: '11:15' });
        expect(pendingBookingRepository.create).toHaveBeenCalledWith({
            patient_id: 10,
            doctor_id: 7,
            patient_phone: '5491112345678',
            patient_message: 'Hola! Necesito un turno para la semana que viene por favor',
            requested_slot_date: '2026-10-28',
            requested_slot_time: '11:15'
        });
    });

    it('skips duplicate creation if patient already has an active pending booking', async () => {
        pendingBookingRepository.findActiveByPatient.mockResolvedValue({ id: 1, status: 'pending' });

        const result = await processInboundMessage({
            sender: '5491112345678@s.whatsapp.net',
            message: 'Hola turno porfa',
            patientId: 10,
            phone: '5491112345678'
        });

        expect(result).toBeNull();
        expect(axios.post).not.toHaveBeenCalled();
        expect(pendingBookingRepository.create).not.toHaveBeenCalled();
    });
});
