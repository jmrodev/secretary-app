const insuranceService = require('./insuranceService');
const insuranceRepository = require('../repositories/insuranceRepository');
const phoneRepository = require('../repositories/phoneRepository');
const { pool } = require('../db');

// Mock dependencies
jest.mock('../repositories/insuranceRepository');
jest.mock('../repositories/phoneRepository');
jest.mock('../db', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));

describe('InsuranceService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createInsurance', () => {
        let mockConn;

        beforeEach(() => {
            mockConn = {
                beginTransaction: jest.fn(),
                commit: jest.fn(),
                rollback: jest.fn(),
                release: jest.fn()
            };
            pool.getConnection.mockResolvedValue(mockConn);
        });

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

    describe('getAllInsurances', () => {
        it('should return an empty array when there are no insurances', async () => {
            insuranceRepository.findAll.mockResolvedValue([]);

            const result = await insuranceService.getAllInsurances();

            expect(result).toEqual({ insurances: [], totalCount: 0 });
            expect(insuranceRepository.findAll).toHaveBeenCalledTimes(1);
            expect(phoneRepository.findByEntity).not.toHaveBeenCalled();
        });

        it('should return insurances with their phone numbers', async () => {
            const mockInsurances = [
                { id: 1, name: 'OSDE' },
                { id: 2, name: 'Swiss Medical' }
            ];

            const mockPhones1 = [{ number: '1234-5678', type: 'Main' }];
            const mockPhones2 = [{ number: '8765-4321', type: 'Emergency' }];

            insuranceRepository.findAll.mockResolvedValue(mockInsurances);

            phoneRepository.findByEntity.mockImplementation((entity, id) => {
                if (id === 1) return Promise.resolve(mockPhones1);
                if (id === 2) return Promise.resolve(mockPhones2);
                return Promise.resolve([]);
            });

            const result = await insuranceService.getAllInsurances();

            expect(result).toEqual({
                insurances: [
                    { id: 1, name: 'OSDE', phoneNumbers: mockPhones1 },
                    { id: 2, name: 'Swiss Medical', phoneNumbers: mockPhones2 }
                ],
                totalCount: 2
            });

            expect(insuranceRepository.findAll).toHaveBeenCalledTimes(1);
            expect(phoneRepository.findByEntity).toHaveBeenCalledTimes(2);
            expect(phoneRepository.findByEntity).toHaveBeenCalledWith('insurance', 1);
            expect(phoneRepository.findByEntity).toHaveBeenCalledWith('insurance', 2);
        });

        it('should handle errors from the repository', async () => {
            const error = new Error('Database connection failed');
            insuranceRepository.findAll.mockRejectedValue(error);

            await expect(insuranceService.getAllInsurances()).rejects.toThrow(error);
            expect(phoneRepository.findByEntity).not.toHaveBeenCalled();
        });

        it('should handle errors when fetching phone numbers', async () => {
            const mockInsurances = [
                { id: 1, name: 'OSDE' }
            ];

            insuranceRepository.findAll.mockResolvedValue(mockInsurances);

            const error = new Error('Phone fetch failed');
            phoneRepository.findByEntity.mockRejectedValue(error);

            await expect(insuranceService.getAllInsurances()).rejects.toThrow(error);
            expect(insuranceRepository.findAll).toHaveBeenCalledTimes(1);
            expect(phoneRepository.findByEntity).toHaveBeenCalledTimes(1);
        });
    });
});
