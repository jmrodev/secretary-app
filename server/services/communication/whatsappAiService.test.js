const whatsappAiService = require('./whatsappAiService');
const doctorRepository = require('../../repositories/user/doctorRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const scheduleRepository = require('../../repositories/appointments/scheduleRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');
const availabilitySearchService = require('../../services/appointments/availabilitySearchService');
const { pool } = require('../../db');

jest.mock('../../repositories/user/doctorRepository');
jest.mock('../../repositories/user/patientRepository');
jest.mock('../../repositories/communication/whatsappRepository');
jest.mock('../../repositories/appointments/scheduleRepository');
jest.mock('../../repositories/appointments/holidayRepository');
jest.mock('../../services/appointments/availabilitySearchService');
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
        it('should correctly format the prompt with context and extraInfo', () => {
            const ctx = {
                doctorName: 'Dr. House',
                doctorContext: 'Actuá como la secretaría de House.',
                extraInfo: 'Dirección: Princeton',
                lastMessages: 'Paciente: Hola\nSecretaría: Hola'
            };
            const prompt = whatsappAiService._buildPrompt(ctx);
            expect(prompt).toContain('Instrucciones del Consultorio: Actuá como la secretaría de House.');
            expect(prompt).toContain('Doctor/a a cargo: Dr. House');
            expect(prompt).toContain('Dirección: Princeton');
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
            expect(context.extraInfo).toBe('');
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
            expect(context.extraInfo).toContain('Especialidad: Infectólogo');
            expect(context.extraInfo).toContain('Precio Consulta: $5000');
            expect(context.lastMessages).toContain('Paciente: Necesito un turno');
        });
    });

    describe('getAiSuggestion', () => {
        it('should request suggestion from Groq and return response', async () => {
            patientRepository.findById.mockResolvedValue({ full_name: 'Juan Perez' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            
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
            await expect(whatsappAiService.getAiSuggestion(1, null, 1))
                .rejects.toThrow('Configuración de IA incompleta');
        });

        it('should call Gemini endpoint when model starts with gemini and GEMINI_API_KEY is present', async () => {
            delete process.env.GROQ_API_KEY;
            process.env.GEMINI_API_KEY = 'mock-gemini';
            process.env.AI_MODEL = 'gemini-2.5-flash';

            patientRepository.findById.mockResolvedValue({ full_name: 'Juan Perez' });
            whatsappRepository.getHistoryByPatient.mockResolvedValue([]);
            
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
