const whatsappService = require('./whatsappService');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');

jest.mock('../../repositories/system/systemSettingsRepository');
jest.mock('../../repositories/appointments/appointmentRepository');
jest.mock('../../repositories/communication/whatsappRepository');
jest.mock('axios');

const whatsappRetryQueue = require('./whatsappRetryQueue');
const axios = require('axios');

describe('whatsappService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        systemSettingsRepository.findByKey.mockResolvedValue({ setting_value: 'true' });
    });

    describe('Missing Templates Validation', () => {
        it('should throw an error when reminder template is missing', async () => {
            appointmentRepository.findTomorrowAppointments.mockResolvedValue([{
                patient_name: 'Test',
                patient_phone: '1234567890',
                appointment_date: new Date(),
                doctor_name: 'Dr. Test'
            }]);
            
            systemSettingsRepository.findAll.mockResolvedValue([]); // No templates

            await expect(whatsappService.sendAutomatedReminders()).rejects.toThrow('Template missing or empty');
        });

        it('should throw an error when confirmation template is missing', async () => {
            systemSettingsRepository.findAll.mockResolvedValue([]); // No templates

            await expect(whatsappService.sendConfirmationMessage({
                patient_name: 'Test',
                patient_phone: '1234567890',
                appointment_date: new Date()
            })).rejects.toThrow('Template missing or empty');
        });

        it('should throw an error when debt template is missing', async () => {
            systemSettingsRepository.findByKey.mockImplementation(async (key) => {
                if (key === 'whatsapp_use_local_bridge') return { setting_value: 'true' };
                return null;
            });

            await expect(whatsappService.sendDebtReminder({
                patient_id: 1,
                patient_name: 'Test',
                debt_amount: 100,
                patient_phone: '1234567890'
            })).rejects.toThrow('Template missing or empty');
        });
    });

    describe('Template Interpolation', () => {
        let axios;
        beforeEach(() => {
            axios = require('axios');
            axios.post.mockResolvedValue({ data: { success: true } });
        });

        it('should interpolate reminder template correctly', async () => {
            appointmentRepository.findTomorrowAppointments.mockResolvedValue([{
                patient_id: 1,
                patient_name: 'Juan Perez',
                patient_phone: '1234567890',
                appointment_date: new Date('2026-08-25T10:00:00Z'),
                doctor_name: 'Dr. Smith'
            }]);
            
            systemSettingsRepository.findAll.mockResolvedValue([
                { setting_key: 'whatsapp_template_reminder', setting_value: 'Hola {patient_name}, turno el {date} a las {time} con {doctor_name} en {appointment_location}' },
                { setting_key: 'clinic_address', setting_value: 'Calle Falsa 123' }
            ]);

            await whatsappService.sendAutomatedReminders();

            expect(axios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    message: expect.stringMatching(/Hola Juan Perez, turno el .* a las .* con Dr. Smith en Calle Falsa 123/)
                })
            );
        });

        it('should interpolate confirmation template correctly', async () => {
            systemSettingsRepository.findAll.mockResolvedValue([
                { setting_key: 'whatsapp_template_confirmation', setting_value: 'Confirma {patient_name} el {date} a las {time} con {doctor_name} en {appointment_location}' },
                { setting_key: 'clinic_address', setting_value: 'Av Siempreviva 742' }
            ]);

            await whatsappService.sendConfirmationMessage({
                patient_id: 2,
                patient_name: 'Maria Lopez',
                patient_phone: '0987654321',
                appointment_date: new Date('2026-09-01T15:30:00Z'),
                doctor_name: 'Dra. Gomez'
            });

            expect(axios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    message: expect.stringMatching(/Confirma Maria Lopez el .* a las .* con Dra. Gomez en Av Siempreviva 742/)
                })
            );
        });

        it('should interpolate debt template correctly', async () => {
            systemSettingsRepository.findByKey.mockImplementation(async (key) => {
                if (key === 'whatsapp_use_local_bridge') return { setting_value: 'true' };
                if (key === 'whatsapp_template_debt') return { setting_value: 'Hola {patient_name}, tu deuda es de ${debt_amount}' };
                return null;
            });

            await whatsappService.sendDebtReminder({
                patient_id: 3,
                patient_name: 'Carlos Ruiz',
                debt_amount: 1500,
                patient_phone: '1122334455'
            });

            expect(axios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    message: 'Hola Carlos Ruiz, tu deuda es de $1500'
                })
            );
        });
    });

    describe('sendMessageDirect retry queue', () => {
        beforeEach(() => {
            process.env.WHATSAPP_QUEUE_BACKOFF_MS = '1';
            process.env.WHATSAPP_QUEUE_MAX_ATTEMPTS = '3';
            whatsappRetryQueue.clear();
        });

        it('enqueues and returns queued when bridge returns 401', async () => {
            axios.post.mockRejectedValue({ response: { status: 401 } });

            const result = await whatsappService.sendMessageDirect('1234567890', 'hi', 1);

            expect(result.queued).toBe(true);
            expect(whatsappRepository.createMessage).not.toHaveBeenCalledWith(1, 'outbound', 'hi', null, 'sent');
        });

        it('enqueues and returns queued when bridge returns 503', async () => {
            axios.post.mockRejectedValue({ response: { status: 503 } });

            const result = await whatsappService.sendMessageDirect('1234567890', 'hi', 1);

            expect(result.queued).toBe(true);
        });

        it('throws and persists failed for non-retriable errors', async () => {
            axios.post.mockRejectedValue({ response: { status: 500 } });

            await expect(whatsappService.sendMessageDirect('1234567890', 'hi', 1))
                .rejects.toThrow();
            expect(whatsappRepository.createMessage).toHaveBeenCalledWith(1, 'outbound', 'hi', null, 'failed');
        });

        it('returns data and persists sent on 200', async () => {
            axios.post.mockResolvedValue({ status: 200, data: { ok: true } });

            const result = await whatsappService.sendMessageDirect('1234567890', 'hi', 1);

            expect(result).toEqual({ ok: true });
            expect(whatsappRepository.createMessage).toHaveBeenCalledWith(1, 'outbound', 'hi', null, 'sent');
        });
    });

    describe('getBridgeHealth', () => {
        it('reports authenticated when bridge reachable', async () => {
            axios.get.mockResolvedValue({ data: { authenticated: true } });

            const health = await whatsappService.getBridgeHealth();

            expect(health).toEqual({ success: true, authenticated: true });
        });

        it('reports not authenticated when bridge unreachable', async () => {
            axios.get.mockRejectedValue(new Error('conn refused'));

            const health = await whatsappService.getBridgeHealth();

            expect(health).toEqual({ success: false, authenticated: false });
        });
    });
});
