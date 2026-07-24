const bookingService = require('./bookingService');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const appointmentEvents = require('../../events/appointmentEvents');
const { pool } = require('../../db');

jest.mock('../../repositories/appointments/appointmentRepository');
jest.mock('../../repositories/user/patientRepository');
jest.mock('../../events/appointmentEvents');
jest.mock('../../db', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));

describe('BookingService - User Traceability (created_by)', () => {
    let mockConnection;

    beforeEach(() => {
        mockConnection = {
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn()
        };
        pool.getConnection.mockResolvedValue(mockConnection);
        jest.clearAllMocks();
    });

    it('should pass the active user ID as created_by to the stored procedure when creating an appointment', async () => {
        const appointmentData = {
            doctor_id: 2,
            patient_id: 10,
            appointment_date: '2026-06-28 15:00:00',
            reason: 'Consulta general',
            is_out_of_hours: false,
            type: 'consultation',
            institution_id: null,
            bonified: false
        };

        patientRepository.findById.mockResolvedValue({ id: 10, institution_id: null });
        appointmentRepository.callSpBookAppointment.mockResolvedValue(401);

        const result = await bookingService.createAppointment(5, 'secretary', appointmentData);

        expect(appointmentRepository.callSpBookAppointment).toHaveBeenCalledWith(
            expect.objectContaining({
                patient_id: 10,
                doctor_id: 2,
                reason: 'Consulta general',
                created_by: 5 // User ID of the session (secretary who managed it)
            }),
            mockConnection
        );
        expect(mockConnection.commit).toHaveBeenCalled();
        expect(result.id).toBe(401);
    });
});
