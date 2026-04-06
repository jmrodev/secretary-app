const restoreService = require('./restoreService');
const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('../db', () => ({
    pool: {
        getConnection: jest.fn(),
    }
}));

jest.mock('../utils/audit', () => ({
    logAction: jest.fn(),
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
}));

describe('RestoreService', () => {
    let mockConn;

    beforeEach(() => {
        mockConn = {
            query: jest.fn(),
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
        };
        pool.getConnection.mockResolvedValue(mockConn);
        jest.clearAllMocks();
    });

    describe('restoreItem', () => {
        it('should correctly restore a patient and commit the transaction', async () => {
            const req = { user: { id: 1 } };
            const itemId = 123;

            const itemData = {
                profile: { id: 1, first_name: 'John', full_name: 'John Doe' },
                appointments: [],
                files: [],
                medical_requests: [],
                assigned_doctors: []
            };

            const dbRows = [{
                id: itemId,
                entity_type: 'patient',
                entity_name: 'John Doe',
                data: JSON.stringify(itemData)
            }];

            mockConn.query.mockImplementation((query, args) => {
                if (query.includes('SELECT * FROM recycle_bin')) {
                    return Promise.resolve(dbRows);
                }
                if (query.includes('INSERT INTO users')) {
                    return Promise.resolve([{ insertId: 42 }]); // Mock insertId
                }
                if (query.includes('INSERT INTO patients')) {
                    return Promise.resolve([]);
                }
                if (query.includes('DELETE FROM recycle_bin')) {
                    return Promise.resolve([]);
                }
                return Promise.resolve([]);
            });

            bcrypt.hash.mockResolvedValue('hashedPassword');

            const result = await restoreService.restoreItem(req, itemId);

            expect(result).toEqual({ message: "Item restored successfully" });
            expect(mockConn.query).toHaveBeenCalledWith("SELECT * FROM recycle_bin WHERE id = ?", [itemId]);
            expect(mockConn.beginTransaction).toHaveBeenCalled();
            expect(mockConn.commit).toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
            expect(mockConn.rollback).not.toHaveBeenCalled();
            expect(logAction).toHaveBeenCalledWith(req, 'RESTORE_ITEM', 'Restored patient John Doe');
        });

        it('should rollback the transaction and throw an error if an exception occurs during restoration', async () => {
            const req = { user: { id: 1 } };
            const itemId = 123;

            const dbRows = [{
                id: itemId,
                entity_type: 'patient',
                entity_name: 'John Doe',
                data: JSON.stringify({ profile: { id: 1 } })
            }];

            mockConn.query.mockImplementation((query, args) => {
                if (query.includes('SELECT * FROM recycle_bin')) {
                    return Promise.resolve(dbRows);
                }
                if (query.includes('INSERT INTO users')) {
                    return Promise.reject(new Error('DB Error'));
                }
                return Promise.resolve([]);
            });

            await expect(restoreService.restoreItem(req, itemId)).rejects.toThrow('DB Error');

            expect(mockConn.beginTransaction).toHaveBeenCalled();
            expect(mockConn.rollback).toHaveBeenCalled();
            expect(mockConn.commit).not.toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
        });

        it('should throw an error if the item is not found', async () => {
             const req = { user: { id: 1 } };
             const itemId = 999;
             mockConn.query.mockResolvedValue([]);

             await expect(restoreService.restoreItem(req, itemId)).rejects.toThrow("Item not found in recycle bin");

             // Ensure release is called even on early exit
             expect(mockConn.release).toHaveBeenCalled();
             expect(mockConn.beginTransaction).not.toHaveBeenCalled();
        });
    });
});
