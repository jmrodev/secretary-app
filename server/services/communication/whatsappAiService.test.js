const whatsappAiService = require('./whatsappAiService');
const doctorRepository = require('../../repositories/user/doctorRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const scheduleRepository = require('../../repositories/appointments/scheduleRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');
const availabilitySearchService = require('../../services/appointments/availabilitySearchService');
const pendingBookingRepository = require('../../repositories/communication/pendingBookingRepository');
const bookingService = require('../../services/appointments/bookingService');
const { pool } = require('../../db');

jest.mock('../../repositories/user/doctorRepository');
jest.mock('../../repositories/user/patientRepository');
jest.mock('../../repositories/communication/whatsappRepository');
jest.mock('../../repositories/appointments/scheduleRepository');
jest.mock('../../repositories/appointments/holidayRepository');
jest.mock('../../services/appointments/availabilitySearchService');
jest.mock('../../repositories/communication/pendingBookingRepository');
jest.mock('../../services/appointments/bookingService');
jest.mock('../../db', () => ({
    pool: {
        query: jest.fn()
    }
}));

describe('WhatsAppAiService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GROQ_API_KEY = 'mock-api-key';
        global.fetch = jest.fn();
    });

    afterEach(() => {
        delete process.env.GROQ_API_KEY;
    });

    describe('_buildPrompt', () => {
        it('should correctly format the prompt with context and history', () => {
            const ctx = {
                doctorName: 'Dr. House',
                doctorContext: 'Actuá como la secretaría de House.',
                lastMessages: 'Paciente: Hola\nSecretaría: Hola'
            };
            const prompt = whatsappAiService._buildPrompt(ctx);
            expect(prompt).toContain('Actuá como la secretaría de House.');
            expect(prompt).toContain('Paciente: Hola');
        });
    });

    describe('_buildContext', () => {
        it('should return fallback context when doctorId is not provided', async () => {
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan Perez' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);

            const context = await whatsappAiService._buildContext(1, null, 1);

            expect(context.doctorName).toBe('la Secretaría');
            expect(context.doctorContext).toContain('Actuá como la secretaría de un consultorio médico');
            expect(context.freeSlots).toEqual([]);
        });

        it('should replace dynamic variables when doctor is provided', async () => {
            const mockDoctor = {
                full_name: 'Dr. Gregory House',
                gemini_context: 'Hola {patient_name}, sos atendido por {doctor_name}. Horarios: {horarios}.',
                gemini_history_limit: 5,
                consultation_price: 5000,
                office_number: 'Consultorio 101',
                cbu: '12345',
                alias: 'house.alias',
                bio: 'Infectólogo',
                specialty: 'Infectólogo'
            };
            doctorRepository.findById.mockResolvedValue(mockDoctor);
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan Perez' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([
                { direction: 'inbound', body: 'Necesito un turno' }
            ]);
            scheduleRepository.findByDoctor.mockResolvedValue([
                { day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00', is_break: false }
            ]);
            holidayRepository.findAll.mockResolvedValue([]);
            pool.query.mockResolvedValue([[{ full_name: 'Ana (Secretaria)' }]]);
            availabilitySearchService.getFreeSlotsBatch.mockResolvedValue({
                results: [{ dayName: 'Lunes', slots: [{ time: '09:00' }] }]
            });

            const context = await whatsappAiService._buildContext(1, 2, 3);

            expect(context.doctorName).toBe('Dr. Gregory House');
            expect(context.doctorContext).toBe('Hola Juan Perez, sos atendido por Dr. Gregory House. Horarios: Lunes: 09:00 a 12:00.');
            expect(context.lastMessages).toContain('Paciente: Necesito un turno');
            expect(context.lastPatientMessage).toBe('Necesito un turno');
            expect(context.freeSlots).toEqual([{ dayName: 'Lunes', slots: [{ time: '09:00' }] }]);
        });

        it('should inject all dynamic variables in doctorContext', async () => {
            const mockDoctor = {
                full_name: 'Dr. House',
                gemini_context: 'Especialidad: {doctor_specialty}. Precio: {doctor_price}. Lugar: {doctor_location}. Pago: {doctor_payment}. Slot: {free_slots}. Fecha: {current_datetime}.',
                gemini_history_limit: 3,
                consultation_price: 5000,
                office_number: 'Consultorio 101',
                cbu: '12345',
                alias: 'house.alias',
                specialty: 'Infectólogo',
                bio: 'Infectólogo'
            };
            doctorRepository.findById.mockResolvedValue(mockDoctor);
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            scheduleRepository.findByDoctor.mockResolvedValue([]);
            holidayRepository.findAll.mockResolvedValue([]);
            pool.query.mockResolvedValue([[{ full_name: 'Ana' }]]);
            availabilitySearchService.getFreeSlotsBatch.mockResolvedValue({
                results: [{ dayName: 'Lunes', date: '2026-08-03', slots: [{ time: '09:00' }] }]
            });

            const context = await whatsappAiService._buildContext(1, 2, 3);

            expect(context.doctorContext).toContain('Especialidad: Infectólogo');
            expect(context.doctorContext).toContain('Precio: $5000');
            expect(context.doctorContext).toContain('Lugar: Consultorio 101');
            expect(context.doctorContext).toContain('Pago: 12345 / house.alias');
            expect(context.doctorContext).toContain('Lunes: 09:00');
            expect(context.doctorContext).toContain('2026');
        });
        it('should set hasPendingBooking true when the patient has an active pending booking', async () => {
            const mockDoctor = {
                full_name: 'Dr. House',
                gemini_context: 'Hola {patient_name}',
                gemini_history_limit: 3
            };
            doctorRepository.findById.mockResolvedValue(mockDoctor);
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            scheduleRepository.findByDoctor.mockResolvedValue([]);
            holidayRepository.findAll.mockResolvedValue([]);
            pool.query.mockResolvedValue([[{ full_name: 'Ana' }]]);
            availabilitySearchService.getFreeSlotsBatch.mockResolvedValue({ results: [] });
            pendingBookingRepository.findActiveByPatient.mockResolvedValue({ id: 9, status: 'pending' });

            const context = await whatsappAiService._buildContext(1, 2, 3);

            expect(context.hasPendingBooking).toBe(true);
            expect(pendingBookingRepository.findActiveByPatient).toHaveBeenCalledWith(1);
        });

        it('should set hasPendingBooking false when the patient has no active pending booking', async () => {
            const mockDoctor = {
                full_name: 'Dr. House',
                gemini_context: 'Hola {patient_name}',
                gemini_history_limit: 3
            };
            doctorRepository.findById.mockResolvedValue(mockDoctor);
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            scheduleRepository.findByDoctor.mockResolvedValue([]);
            holidayRepository.findAll.mockResolvedValue([]);
            pool.query.mockResolvedValue([[{ full_name: 'Ana' }]]);
            availabilitySearchService.getFreeSlotsBatch.mockResolvedValue({ results: [] });
            pendingBookingRepository.findActiveByPatient.mockResolvedValue(null);

            const context = await whatsappAiService._buildContext(1, 2, 3);

            expect(context.hasPendingBooking).toBe(false);
        });

        it('should set hasPendingBooking false in the fallback context when no doctor is provided', async () => {
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan Perez' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            pendingBookingRepository.findActiveByPatient.mockResolvedValue(null);

            const context = await whatsappAiService._buildContext(1, null, null);

            expect(context.hasPendingBooking).toBe(false);
        });
    });

    describe('_tryAutoBook', () => {
        it('should return null when no lastPatientMessage', async () => {
            const result = await whatsappAiService._tryAutoBook({ doctor: { id: 1 }, freeSlots: [], lastPatientMessage: null }, 1);
            expect(result).toBeNull();
        });

        it('should return null when message is not a confirmation', async () => {
            const result = await whatsappAiService._tryAutoBook({
                doctor: { id: 1 },
                freeSlots: [{ dayName: 'Lunes', date: '2026-08-03', slots: [{ time: '09:00' }] }],
                lastPatientMessage: '¿Cuánto cuesta?'
            }, 1);
            expect(result).toBeNull();
        });

        it('should create a pending booking instead of an appointment when patient confirms a slot', async () => {
            pendingBookingRepository.create.mockResolvedValue(7);

            const result = await whatsappAiService._tryAutoBook({
                doctor: { id: 1, full_name: 'Dr. House' },
                doctorName: 'Dr. House',
                freeSlots: [{ dayName: 'Lunes 3 de Agosto', date: '2026-08-03', slots: [{ time: '09:00' }] }],
                lastPatientMessage: 'si, el de las 9',
                patientId: 5,
                phone: '5491112345678'
            }, 3);

            expect(pendingBookingRepository.create).toHaveBeenCalledWith({
                patient_id: 5,
                doctor_id: 1,
                patient_phone: '5491112345678',
                requested_slot_date: '2026-08-03',
                requested_slot_time: '09:00'
            });
            expect(bookingService.createAppointment).not.toHaveBeenCalled();
            expect(result).toContain('revisión');
            expect(result).toContain('09:00');
        });

        it('should NOT create a pending booking when the patient already has an active pending (re-detection guard)', async () => {
            const result = await whatsappAiService._tryAutoBook({
                doctor: { id: 1, full_name: 'Dr. House' },
                freeSlots: [{ dayName: 'Lunes 3 de Agosto', date: '2026-08-03', slots: [{ time: '09:00' }] }],
                lastPatientMessage: 'si, el de las 9',
                hasPendingBooking: true,
                patientId: 5
            }, 3);

            expect(result).toBeNull();
            expect(pendingBookingRepository.create).not.toHaveBeenCalled();
            expect(bookingService.createAppointment).not.toHaveBeenCalled();
        });
    });

    describe('getAiSuggestion', () => {
        it('should return the configured pending template without calling AI when a pending booking exists', async () => {
            process.env.GROQ_API_KEY = 'mock-groq';
            delete process.env.GEMINI_API_KEY;
            doctorRepository.findById.mockResolvedValue({
                full_name: 'Dr. House',
                gemini_context: 'Hola {patient_name}',
                gemini_history_limit: 3,
                pending_response_template: 'Tu solicitud está en revisión. Te confirmamos a la brevedad.'
            });
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            scheduleRepository.findByDoctor.mockResolvedValue([]);
            holidayRepository.findAll.mockResolvedValue([]);
            pool.query.mockResolvedValue([[{ full_name: 'Ana' }]]);
            availabilitySearchService.getFreeSlotsBatch.mockResolvedValue({ results: [] });
            pendingBookingRepository.findActiveByPatient.mockResolvedValue({ id: 9, status: 'pending' });

            const suggestion = await whatsappAiService.getAiSuggestion(1, null, 1);

            expect(suggestion).toBe('Tu solicitud está en revisión. Te confirmamos a la brevedad.');
            expect(global.fetch).not.toHaveBeenCalled();
            expect(pendingBookingRepository.create).not.toHaveBeenCalled();
        });

        it('should use the default pending message when no template is configured', async () => {
            process.env.GROQ_API_KEY = 'mock-groq';
            delete process.env.GEMINI_API_KEY;
            doctorRepository.findById.mockResolvedValue({
                full_name: 'Dr. House',
                gemini_context: 'Hola {patient_name}',
                gemini_history_limit: 3
            });
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            scheduleRepository.findByDoctor.mockResolvedValue([]);
            holidayRepository.findAll.mockResolvedValue([]);
            pool.query.mockResolvedValue([[{ full_name: 'Ana' }]]);
            availabilitySearchService.getFreeSlotsBatch.mockResolvedValue({ results: [] });
            pendingBookingRepository.findActiveByPatient.mockResolvedValue({ id: 9, status: 'pending' });

            const suggestion = await whatsappAiService.getAiSuggestion(1, null, 1);

            expect(suggestion).toContain('revisión');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should request suggestion from Groq', async () => {
            process.env.GROQ_API_KEY = 'mock-groq';
            delete process.env.GEMINI_API_KEY;
            delete process.env.AI_MODEL;
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan Perez' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            pendingBookingRepository.findActiveByPatient.mockResolvedValue(null);
            
            const mockResponse = {
                choices: [{ message: { content: 'Sugerencia de respuesta' } }]
            };
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse)
            });

            const suggestion = await whatsappAiService.getAiSuggestion(1, null, 1);
            expect(suggestion).toBe('Sugerencia de respuesta');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should throw error when api key is missing', async () => {
            delete process.env.GROQ_API_KEY;
            delete process.env.GEMINI_API_KEY;
            pendingBookingRepository.findActiveByPatient.mockResolvedValue(null);
            await expect(whatsappAiService.getAiSuggestion(1, null, 1))
                .rejects.toThrow('Configuración de IA incompleta');
        });

        it('should call Gemini endpoint when model starts with gemini and GEMINI_API_KEY is present', async () => {
            delete process.env.GROQ_API_KEY;
            process.env.GEMINI_API_KEY = 'mock-gemini';
            process.env.AI_MODEL = 'gemini-2.5-flash';

            patientRepository.findById.mockResolvedValue({ full_name: 'Juan Perez' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            pendingBookingRepository.findActiveByPatient.mockResolvedValue(null);
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    candidates: [{ content: { parts: [{ text: 'Sugerencia Gemini' }] } }]
                })
            });

            const suggestion = await whatsappAiService.getAiSuggestion(1, null, 1);
            expect(suggestion).toBe('Sugerencia Gemini');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=mock-gemini'),
                expect.any(Object)
            );
        });
    });
});