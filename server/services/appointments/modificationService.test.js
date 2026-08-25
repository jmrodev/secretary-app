const modificationService = require('./modificationService');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const helper = require('./appointmentHelper');
const debtLifecycleService = require('../finance/debtLifecycleService');
const { pool } = require('../../db');

jest.mock('../../repositories/appointments/appointmentRepository');
jest.mock('./googleSyncService');
jest.mock('../finance/financeService');
jest.mock('./appointmentHelper');
jest.mock('../finance/debtLifecycleService');
jest.mock('../../events/eventBus', () => ({ emit: jest.fn() }));
jest.mock('../../events/eventConstants', () => ({
    APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
    APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
    APPOINTMENT_DELETED: 'APPOINTMENT_DELETED'
}));
jest.mock('../../db', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));

describe('ModificationService - debt lifecycle wiring', () => {
    let mockConnection;

    beforeEach(() => {
        mockConnection = {
            beginTransaction: jest.fn().mockResolvedValue(undefined),
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue([])
        };
        pool.getConnection.mockResolvedValue(mockConnection);
        appointmentRepository.findById.mockResolvedValue({
            id: 1,
            status: 'completed',
            payment_status: 'pending',
            doctor_id: 2,
            patient_id: 3,
            appointment_date: '2026-08-17 15:00:00',
            google_event_id: null
        });
        helper.checkModificationPermissions.mockResolvedValue(undefined);
        helper.freeSlot.mockResolvedValue(undefined);
        appointmentRepository.delete.mockResolvedValue({ affectedRows: 1 });
        jest.clearAllMocks();
    });

    describe('deleteAppointment', () => {
        it('should retain and label pending debt before deleting a completed appointment without medical records', async () => {
            const result = await modificationService.deleteAppointment(1, 'secretary', 'admin', 'pass');

            expect(debtLifecycleService.handleAppointmentDelete).toHaveBeenCalledWith(mockConnection, {
                id: 1,
                status: 'completed',
                payment_status: 'pending',
                doctor_id: 2,
                patient_id: 3,
                appointment_date: '2026-08-17 15:00:00',
                google_event_id: null
            });
            expect(appointmentRepository.delete).toHaveBeenCalledWith(1, mockConnection);
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should not touch debt or the transaction when deletion is blocked by medical records', async () => {
            mockConnection.query.mockResolvedValue([{ id: 5 }]);

            await expect(modificationService.deleteAppointment(1, 'secretary', 'admin', 'pass'))
                .rejects.toThrow('No se puede eliminar: tiene registros médicos asociados.');

            expect(debtLifecycleService.handleAppointmentDelete).not.toHaveBeenCalled();
            expect(appointmentRepository.delete).not.toHaveBeenCalled();
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.commit).not.toHaveBeenCalled();
        });

        it('should roll back the whole transaction (debt included) when deletion fails after debt processing', async () => {
            appointmentRepository.delete.mockRejectedValue(new Error('DB boom'));

            await expect(modificationService.deleteAppointment(1, 'secretary', 'admin', 'pass'))
                .rejects.toThrow('DB boom');

            expect(debtLifecycleService.handleAppointmentDelete).toHaveBeenCalled();
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.commit).not.toHaveBeenCalled();
        });
    });

    describe('updateStatus', () => {
        it('should keep pending debt and payment_status when an appointment is marked absent', async () => {
            appointmentRepository.findById.mockResolvedValue({
                id: 2,
                status: 'confirmed',
                payment_status: 'pending',
                doctor_id: 2,
                patient_id: 3,
                appointment_date: '2026-08-17 15:00:00',
                type: 'consultation'
            });

            await modificationService.updateStatus(2, 'absent', null, 1);

            const [id, updates, connection] = appointmentRepository.update.mock.calls[0];
            expect(id).toBe(2);
            expect(updates).toMatchObject({ status: 'absent' });
            expect(updates.payment_status).toBeUndefined();
            expect(connection).toBe(mockConnection);
            expect(debtLifecycleService.handleAppointmentStatusChange).toHaveBeenCalledWith(mockConnection, {
                id: 2,
                status: 'confirmed',
                payment_status: 'pending',
                doctor_id: 2,
                patient_id: 3,
                appointment_date: '2026-08-17 15:00:00',
                type: 'consultation'
            }, 'absent');
            expect(mockConnection.commit).toHaveBeenCalled();
        });

        it('should remove pending debt and label paid transactions when a paid appointment is cancelled', async () => {
            appointmentRepository.findById.mockResolvedValue({
                id: 3,
                status: 'confirmed',
                payment_status: 'paid',
                doctor_id: 2,
                patient_id: 3,
                appointment_date: '2026-08-17 15:00:00',
                type: 'consultation'
            });

            await modificationService.updateStatus(3, 'cancelled', 'motivo', 1);

            expect(debtLifecycleService.handleAppointmentStatusChange).toHaveBeenCalledWith(
                mockConnection,
                expect.objectContaining({ id: 3, payment_status: 'paid' }),
                'cancelled'
            );
            const updates = appointmentRepository.update.mock.calls[0][1];
            expect(updates.payment_status).toBeUndefined();
            expect(mockConnection.commit).toHaveBeenCalled();
        });

        it('should preserve legacy behavior when an appointment is suspended (delete pending + null payment_status)', async () => {
            appointmentRepository.findById.mockResolvedValue({
                id: 4,
                status: 'confirmed',
                payment_status: 'pending',
                doctor_id: 2,
                patient_id: 3,
                appointment_date: '2026-08-17 15:00:00',
                type: 'consultation'
            });

            await modificationService.updateStatus(4, 'suspended', null, 1);

            const [id, updates] = appointmentRepository.update.mock.calls[0];
            expect(id).toBe(4);
            expect(updates).toMatchObject({ status: 'suspended', payment_status: null });
            expect(debtLifecycleService.handleAppointmentStatusChange).toHaveBeenCalledWith(
                mockConnection,
                expect.objectContaining({ id: 4 }),
                'suspended'
            );
            expect(mockConnection.commit).toHaveBeenCalled();
        });
    });
});