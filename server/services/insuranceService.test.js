const insuranceService = require('./insuranceService');
const insuranceRepository = require('../repositories/insuranceRepository');
const phoneRepository = require('../repositories/phoneRepository');
const { pool } = require('../db');

jest.mock('../repositories/insuranceRepository');
jest.mock('../repositories/phoneRepository');
jest.mock('../db', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));

describe('InsuranceService', () => {
    let mockConn;

    beforeEach(() => {
        mockConn = {
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn()
        };
        pool.getConnection.mockResolvedValue(mockConn);
        jest.clearAllMocks();
    });

    describe('createInsurance', () => {
        it('should commit transaction and release connection if successful', async () => {
            const data = { name: 'Test Insurance', phoneNumbers: ['123456789'] };
            insuranceRepository.create.mockResolvedValue(1);
            phoneRepository.syncPhones.mockResolvedValue('123456789');
            insuranceRepository.update.mockResolvedValue(true);

            const result = await insuranceService.createInsurance(data);

            expect(result).toEqual({ id: 1 });
            expect(pool.getConnection).toHaveBeenCalled();
            expect(mockConn.beginTransaction).toHaveBeenCalled();
            expect(insuranceRepository.create).toHaveBeenCalledWith(data, mockConn);
            expect(phoneRepository.syncPhones).toHaveBeenCalledWith('insurance', 1, data.phoneNumbers, mockConn);
            expect(insuranceRepository.update).toHaveBeenCalledWith(1, { phone: '123456789' }, mockConn);
            expect(mockConn.commit).toHaveBeenCalled();
            expect(mockConn.rollback).not.toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
        });

        it('should rollback transaction and release connection if an error occurs during create', async () => {
            const mockError = new Error('Database error');
            insuranceRepository.create.mockRejectedValue(mockError);

            const data = { name: 'Test Insurance' };

            await expect(insuranceService.createInsurance(data)).rejects.toThrow(mockError);

            expect(pool.getConnection).toHaveBeenCalled();
            expect(mockConn.beginTransaction).toHaveBeenCalled();
            expect(insuranceRepository.create).toHaveBeenCalledWith(data, mockConn);
            expect(mockConn.rollback).toHaveBeenCalled();
            expect(mockConn.commit).not.toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
        });

        it('should rollback transaction and release connection if an error occurs during phone sync', async () => {
            const mockError = new Error('Sync error');
            insuranceRepository.create.mockResolvedValue(1);
            phoneRepository.syncPhones.mockRejectedValue(mockError);

            const data = { name: 'Test Insurance', phoneNumbers: ['123456789'] };

            await expect(insuranceService.createInsurance(data)).rejects.toThrow(mockError);

            expect(pool.getConnection).toHaveBeenCalled();
            expect(mockConn.beginTransaction).toHaveBeenCalled();
            expect(insuranceRepository.create).toHaveBeenCalledWith(data, mockConn);
            expect(phoneRepository.syncPhones).toHaveBeenCalledWith('insurance', 1, data.phoneNumbers, mockConn);
            expect(mockConn.rollback).toHaveBeenCalled();
            expect(mockConn.commit).not.toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
        });
    });
});
