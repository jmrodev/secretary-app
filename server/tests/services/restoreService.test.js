const restoreService = require('../../services/restoreService');
const { pool } = require('../../db');
const { logAction } = require('../../utils/audit');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('../../db', () => ({
  pool: {
    getConnection: jest.fn(),
  },
}));

jest.mock('../../utils/audit', () => ({
  logAction: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('RestoreService', () => {
  let mockConn;
  let req;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConn = {
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };

    pool.getConnection.mockResolvedValue(mockConn);
    bcrypt.hash.mockResolvedValue('hashedPassword');

    req = { user: { id: 1 } };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('restoreItem', () => {
    it('should throw an error if the item is not found in the recycle bin', async () => {
      mockConn.query.mockResolvedValueOnce([]); // mock recycle bin query

      await expect(restoreService.restoreItem(req, 1)).rejects.toThrow('Item not found in recycle bin');

      expect(mockConn.query).toHaveBeenCalledWith("SELECT * FROM recycle_bin WHERE id = ?", [1]);
      expect(mockConn.rollback).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
    });

    it('should throw an error for unsupported entity types', async () => {
      const mockItem = {
        id: 1,
        entity_type: 'unsupported_type',
        data: JSON.stringify({}),
      };
      mockConn.query.mockResolvedValueOnce([mockItem]);

      await expect(restoreService.restoreItem(req, 1)).rejects.toThrow('Unsupported entity type: unsupported_type');

      expect(mockConn.beginTransaction).toHaveBeenCalled();
      expect(mockConn.rollback).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
    });

    it('should successfully restore a patient', async () => {
      const patientData = {
        profile: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe', full_name: 'John Doe', dob: '1990-01-01', phone: '123456789' },
        assigned_doctors: [{ doctor_id: 1 }],
        files: [{ id: 1, file_name: 'test.pdf', file_url: '/files/test.pdf', file_type: 'pdf', uploaded_by: 1 }],
        appointments: [{ id: 1, doctor_id: 1, consultorio_id: 1, appointment_date: '2023-01-01', reason: 'checkup' }],
        medical_requests: [{ id: 1, type: 'prescription', doctor_id: 1 }]
      };

      const mockItem = {
        id: 1,
        entity_type: 'patient',
        entity_name: 'John Doe',
        data: JSON.stringify(patientData),
      };

      mockConn.query.mockImplementation(async (sql, _params) => {
        if (sql.includes('SELECT * FROM recycle_bin')) return [mockItem];
        if (sql.includes('INSERT INTO users')) return [{ insertId: 10 }]; // mock users insert
        if (sql.includes('SELECT id FROM doctors')) return [{ id: 1 }]; // doctor check
        if (sql.includes('SELECT id FROM users')) return [{ id: 1 }]; // user check for files
        return [];
      });

      const res = await restoreService.restoreItem(req, 1);

      expect(res).toEqual({ message: "Item restored successfully" });
      expect(mockConn.beginTransaction).toHaveBeenCalled();
      expect(mockConn.commit).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
      expect(logAction).toHaveBeenCalledWith(req, 'RESTORE_ITEM', 'Restored patient John Doe');
      expect(mockConn.query).toHaveBeenCalledWith("DELETE FROM recycle_bin WHERE id = ?", [1]);
    });

    it('should successfully restore a doctor', async () => {
       const doctorData = {
        profile: { id: 2, full_name: 'Dr. Smith', specialty: 'General', phone: '987654321' }
      };

      const mockItem = {
        id: 2,
        entity_type: 'doctor',
        entity_name: 'Dr. Smith',
        data: JSON.stringify(doctorData),
      };

      mockConn.query.mockImplementation(async (sql, _params) => {
        if (sql.includes('SELECT * FROM recycle_bin')) return [mockItem];
        if (sql.includes('INSERT INTO users')) return [{ insertId: 20 }];
        return [];
      });

      const res = await restoreService.restoreItem(req, 2);

      expect(res).toEqual({ message: "Item restored successfully" });
      expect(mockConn.commit).toHaveBeenCalled();
      expect(logAction).toHaveBeenCalledWith(req, 'RESTORE_ITEM', 'Restored doctor Dr. Smith');

      // Verify correct user insertion
      expect(mockConn.query).toHaveBeenCalledWith(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'doctor')",
        ['dr..smith', 'hashedPassword']
      );
    });

    it('should successfully restore a secretary', async () => {
       const secData = {
        profile: { id: 3, full_name: 'Jane Doe', phone: '555123456' }
      };

      const mockItem = {
        id: 3,
        entity_type: 'secretary',
        entity_name: 'Jane Doe',
        data: JSON.stringify(secData),
      };

      mockConn.query.mockImplementation(async (sql, _params) => {
        if (sql.includes('SELECT * FROM recycle_bin')) return [mockItem];
        if (sql.includes('INSERT INTO users')) return [{ insertId: 30 }];
        return [];
      });

      const res = await restoreService.restoreItem(req, 3);

      expect(res).toEqual({ message: "Item restored successfully" });
      expect(mockConn.commit).toHaveBeenCalled();
      expect(logAction).toHaveBeenCalledWith(req, 'RESTORE_ITEM', 'Restored secretary Jane Doe');

       // Verify correct user insertion
      expect(mockConn.query).toHaveBeenCalledWith(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'secretary')",
        ['jane.doe', 'hashedPassword']
      );
    });

    it('should successfully restore a medical request', async () => {
        const reqData = {
            id: 4, type: 'certificate', patient_id: 1, doctor_id: 1, payment_status: 'debt', debt_amount: 100
        };
        const mockItem = {
            id: 4, entity_type: 'medical_request', entity_name: 'Cert request', data: JSON.stringify(reqData)
        };

        mockConn.query.mockImplementation(async (sql, _params) => {
            if (sql.includes('SELECT * FROM recycle_bin')) return [mockItem];
            if (sql.includes('SELECT id FROM patients')) return [[{ id: 1 }]];
            if (sql.includes('SELECT id FROM doctors')) return [[{ id: 1 }]];
            if (sql.includes('SELECT user_id FROM patients')) return [[{ user_id: 10 }]];
            return [];
        });

        const res = await restoreService.restoreItem(req, 4);

        expect(res).toEqual({ message: "Item restored successfully" });
        expect(mockConn.commit).toHaveBeenCalled();

        // check transaction query was called since payment_status='debt'
        expect(mockConn.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO transactions"),
            expect.arrayContaining(['income_patient', 100, `Restored Request: certificate`, 10, 1, 'credit', 'pending', 4])
        );
    });

    it('should rollback transaction and release connection on error', async () => {
        const mockItem = {
            id: 1,
            entity_type: 'patient',
            data: JSON.stringify({ profile: {} }), // missing fields to force error, though we mock it below
        };

        mockConn.query.mockImplementation(async (sql, _params) => {
            if (sql.includes('SELECT * FROM recycle_bin')) return [mockItem];
            throw new Error('Database insertion failed');
        });

        await expect(restoreService.restoreItem(req, 1)).rejects.toThrow('Database insertion failed');

        expect(mockConn.rollback).toHaveBeenCalled();
        expect(mockConn.release).toHaveBeenCalled();
        expect(mockConn.commit).not.toHaveBeenCalled();
    });

  });
});
