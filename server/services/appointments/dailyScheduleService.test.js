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

        // Assert slot at 12:00 contains the Saturday 12:30 appointment and is marked taken
        const takenSlot = slots.find(s => s.slot_time === '12:00:00');
        expect(takenSlot).toBeDefined();
        expect(takenSlot.slot_status).toBe('taken');
        expect(takenSlot.patient_name).toBe('Ana Lopez');
        expect(takenSlot.appointment_date).toBe('2026-08-29 12:30:00');
    });

    it('should map intermediate appointment at 14:15 into canonical 14:00 container slot and leave 15:00 free', async () => {
        const doctorId = 10;
        const dateStr = '2026-08-24'; // Monday

        doctorRepository.getDoctorConfig.mockResolvedValue({
            full_name: 'Dr. Test',
            appointment_duration: 60,
            overturn_start_time: '08:00:00',
            overturn_end_time: '20:00:00'
        });

        doctorRepository.getDoctorSchedules.mockResolvedValue([
            {
                doctor_id: doctorId,
                day_of_week: 1, // Monday
                start_time: '14:00:00',
                end_time: '18:00:00',
                is_break: 0
            }
        ]);

        appointmentRepository.findDetailedByDoctorAndDate.mockResolvedValue([
            {
                id: 201,
                appointment_date: '2026-08-24 14:15:00',
                doctor_name: 'Dr. Test',
                patient_id: 5,
                patient_name: 'Carlos Gomez',
                patient_phone: '112233',
                status: 'confirmed',
                reason: 'Consulta personalizada',
                type: 'consultation'
            }
        ]);

        const slots = await dailyScheduleService.getDailySchedule(doctorId, dateStr);

        // Slot at 14:00 should be marked taken and contain Carlos Gomez
        const slot14 = slots.filter(s => s.slot_time === '14:00:00');
        expect(slot14.length).toBe(1);
        expect(slot14[0].slot_status).toBe('taken');
        expect(slot14[0].patient_name).toBe('Carlos Gomez');

        // There should NOT be a separate 14:15 slot breaking the grid
        const slot1415 = slots.filter(s => s.slot_time === '14:15:00');
        expect(slot1415.length).toBe(0);

        // Slot at 15:00 should remain intact and free
        const slot15 = slots.filter(s => s.slot_time === '15:00:00');
        expect(slot15.length).toBe(1);
        expect(slot15[0].slot_status).toBe('free');
    });

    it('should group main appointment and sobreturno in the same container slot at 14:00', async () => {
        const doctorId = 10;
        const dateStr = '2026-08-24'; // Monday

        doctorRepository.getDoctorConfig.mockResolvedValue({
            full_name: 'Dr. Test',
            appointment_duration: 60,
            overturn_start_time: '08:00:00',
            overturn_end_time: '20:00:00'
        });

        doctorRepository.getDoctorSchedules.mockResolvedValue([
            {
                doctor_id: doctorId,
                day_of_week: 1,
                start_time: '14:00:00',
                end_time: '18:00:00',
                is_break: 0
            }
        ]);

        appointmentRepository.findDetailedByDoctorAndDate.mockResolvedValue([
            {
                id: 301,
                appointment_date: '2026-08-24 14:00:00',
                doctor_name: 'Dr. Test',
                patient_id: 10,
                patient_name: 'Paciente Principal',
                status: 'confirmed'
            },
            {
                id: 302,
                appointment_date: '2026-08-24 14:30:00',
                doctor_name: 'Dr. Test',
                patient_id: 11,
                patient_name: 'Paciente Sobreturno',
                status: 'confirmed'
            }
        ]);

        const slots = await dailyScheduleService.getDailySchedule(doctorId, dateStr);

        // Slot 14:00 should return 2 rows for the two patients
        const slot14Rows = slots.filter(s => s.slot_time === '14:00:00');
        expect(slot14Rows.length).toBe(2);
        expect(slot14Rows.map(r => r.patient_name)).toEqual(['Paciente Principal', 'Paciente Sobreturno']);

        // Slot 15:00 should remain intact and free
        const slot15 = slots.find(s => s.slot_time === '15:00:00');
        expect(slot15).toBeDefined();
        expect(slot15.slot_status).toBe('free');
    });
});
