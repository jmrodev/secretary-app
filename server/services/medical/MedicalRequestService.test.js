const MedicalRequestService = require('./MedicalRequestService');
const medicalRequestRepository = require('../../repositories/medical/medicalRequestRepository');
const medicationRepository = require('../../repositories/medical/medicationRepository');
const debtLifecycleService = require('../finance/debtLifecycleService');
const eventBus = require('../../events/eventBus');
const { pool } = require('../../db');

jest.mock('../../repositories/medical/medicalRequestRepository');
jest.mock('../../repositories/medical/medicationRepository');
jest.mock('../../repositories/user/patientRepository');
jest.mock('../../repositories/user/doctorRepository');
jest.mock('../../repositories/system/systemSettingsRepository');
jest.mock('../../utils/system/recycleBin', () => ({ saveToRecycleBin: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../utils/system/audit', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../events/eventBus', () => ({ emit: jest.fn() }));
jest.mock('../finance/debtLifecycleService');
jest.mock('../../db', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));

describe('MedicalRequestService - deleteRequest debt lifecycle', () => {
    let mockConnection;
    const req = { user: { role: 'secretary', user_id: 1 }, body: {}, ip: '127.0.0.1' };

    beforeEach(() => {
        mockConnection = {
            beginTransaction: jest.fn().mockResolvedValue(undefined),
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue([])
        };
        pool.getConnection.mockResolvedValue(mockConnection);
        medicalRequestRepository.findById.mockResolvedValue({ id: 5, status: 'completed' });
        medicalRequestRepository.delete.mockResolvedValue({ affectedRows: 1 });
        medicationRepository.deleteByRequestId.mockResolvedValue({ affectedRows: 0 });
        jest.clearAllMocks();
    });

    it('should delegate debt handling to the service when a completed request is deleted (retain + label + detach)', async () => {
        medicalRequestRepository.findById.mockResolvedValue({ id: 5, status: 'completed' });

        await MedicalRequestService.deleteRequest(req, 5);

        expect(debtLifecycleService.handleRequestDelete).toHaveBeenCalledWith(mockConnection, { id: 5, status: 'completed' });
        expect(medicalRequestRepository.delete).toHaveBeenCalledWith(5, mockConnection);
        expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('should delegate debt handling to the service when a pending request is deleted (remove)', async () => {
        medicalRequestRepository.findById.mockResolvedValue({ id: 6, status: 'pending' });

        await MedicalRequestService.deleteRequest(req, 6);

        expect(debtLifecycleService.handleRequestDelete).toHaveBeenCalledWith(mockConnection, { id: 6, status: 'pending' });
        expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('should delegate debt handling to the service when a rejected request is deleted (remove)', async () => {
        medicalRequestRepository.findById.mockResolvedValue({ id: 7, status: 'rejected' });

        await MedicalRequestService.deleteRequest(req, 7);

        expect(debtLifecycleService.handleRequestDelete).toHaveBeenCalledWith(mockConnection, { id: 7, status: 'rejected' });
        expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('should roll back the whole transaction (debt included) when request deletion fails', async () => {
        medicalRequestRepository.delete.mockRejectedValue(new Error('DB boom'));

        await expect(MedicalRequestService.deleteRequest(req, 5)).rejects.toThrow('DB boom');

        expect(debtLifecycleService.handleRequestDelete).toHaveBeenCalled();
        expect(mockConnection.rollback).toHaveBeenCalled();
        expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it('should not emit MEDICAL_REQUEST_DELETED (no dead listener branch, no swallowed TypeError)', async () => {
        await MedicalRequestService.deleteRequest(req, 5);

        expect(eventBus.emit).not.toHaveBeenCalled();
    });
});