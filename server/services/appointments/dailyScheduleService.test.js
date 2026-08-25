const dailyScheduleService = require('./dailyScheduleService');
const doctorRepository = require('../../repositories/user/doctorRepository');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');

jest.mock('../../repositories/user/doctorRepository');
jest.mock('../../repositories/appointments/appointmentRepository');
jest.mock('../../repositories/appointments/holidayRepository');

describe('DailyScheduleService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        holidayRepository.getHolidaysInRange.mockResolvedValue([]);
    });

    it('should generate aligned slots for Monday when work schedule starts at 08:30', async () => {
        const doctorId = 10;
        const dateStr = '2026-08-24'; // Monday

        // Mock Doctor Config
        doctorRepository.getDoctorConfig.mockResolvedValue({
            full_name: 'Maria Cecilia Scheerle',
            appointment_duration: 60,
            overturn_start_time: '07:00:00',
            overturn_end_time: '20:00:00',
            force_hour_alignment: 0
        });

        // Mock Monday Schedule (08:30 to 13:30)
        doctorRepository.getDoctorSchedules.mockResolvedValue([
            {
                doctor_id: doctorId,
                day_of_week: 1, // Monday
                start_time: '08:30:00',
                end_time: '13:30:00',
                is_break: 0
            }
        ]);

        // Mock Monday Appointment
        appointmentRepository.findDetailedByDoctorAndDate.mockResolvedValue([
            {
                id: 100,
                appointment_date: '2026-08-24 09:30:00',
                doctor_name: 'Maria Cecilia Scheerle',
                patient_id: 1,
                patient_name: 'Juan Perez',
                patient_phone: '12345',
                status: 'confirmed',
                reason: 'Consulta',
                type: 'consultation',
                paid_amount: 0,
                pending_amount: 0,
                cost: 0,
                payment_status: 'pending'
            }
        ]);

        const slots = await dailyScheduleService.getDailySchedule(doctorId, dateStr);

        // Assert slot at 08:30 exists
        const workSlot = slots.find(s => s.slot_time === '08:30:00');
        expect(workSlot).toBeDefined();
        expect(workSlot.slot_status).toBe('free');

        // Assert slot at 09:30 is taken
        const takenSlot = slots.find(s => s.slot_time === '09:30:00');
        expect(takenSlot).toBeDefined();
        expect(takenSlot.slot_status).toBe('taken');
        expect(takenSlot.patient_name).toBe('Juan Perez');

        // Assert the preceding slot from 08:00 to 08:30 was adjusted (duration math works)
        const precedingSlot = slots.find(s => s.slot_time === '08:00:00');
        expect(precedingSlot).toBeDefined();
        expect(precedingSlot.is_out_of_hours).toBe(true);
    });

    it('should inject Saturday appointments when no work schedule is configured', async () => {
        const doctorId = 10;
        const dateStr = '2026-08-29'; // Saturday

        // Mock Doctor Config
        doctorRepository.getDoctorConfig.mockResolvedValue({
            full_name: 'Maria Cecilia Scheerle',
            appointment_duration: 60,
            overturn_start_time: '07:00:00',
            overturn_end_time: '20:00:00',
            force_hour_alignment: 0
        });

        // Mock Saturday Schedules (None)
        doctorRepository.getDoctorSchedules.mockResolvedValue([]);

        // Mock Saturday Appointments
        appointmentRepository.findDetailedByDoctorAndDate.mockResolvedValue([
            {
                id: 101,
                appointment_date: '2026-08-29 12:30:00',
                doctor_name: 'Maria Cecilia Scheerle',
                patient_id: 2,
                patient_name: 'Ana Lopez',
                patient_phone: '67890',
                status: 'confirmed',
                reason: 'Consulta',
                type: 'consultation',
                paid_amount: 0,
                pending_amount: 0,
                cost: 0,
                payment_status: 'pending'
            }
        ]);

        const slots = await dailyScheduleService.getDailySchedule(doctorId, dateStr);

        // Assert slot at 12:30 was dynamically injected and marked taken
        const injectedSlot = slots.find(s => s.slot_time === '12:30:00');
        expect(injectedSlot).toBeDefined();
        expect(injectedSlot.slot_status).toBe('taken');
        expect(injectedSlot.patient_name).toBe('Ana Lopez');
    });
});
