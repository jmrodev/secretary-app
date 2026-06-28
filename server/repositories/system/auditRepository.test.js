const AuditRepository = require('./auditRepository');

describe('AuditRepository', () => {
    let mockPool;
    let repository;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        repository = AuditRepository(mockPool);
        jest.clearAllMocks();
    });

    it('create should insert a log entry with correct parameters', async () => {
        mockPool.query.mockResolvedValue({ insertId: 501 });

        const logData = {
            user_id: 10,
            username: 'admin',
            action: 'LOGIN',
            details: '{"success": true}',
            ip_address: '127.0.0.1'
        };

        const result = await repository.create(logData);

        expect(mockPool.query).toHaveBeenCalledWith(
            "INSERT INTO audit_logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)",
            [10, 'admin', 'LOGIN', '{"success": true}', '127.0.0.1']
        );
        expect(result.insertId).toBe(501);
    });

    it('findRecentLogs should retrieve audit entries ordered by date desc with limit', async () => {
        mockPool.query.mockResolvedValue([
            { id: 101, action: 'LOGOUT' }
        ]);

        const result = await repository.findRecentLogs(50);

        expect(mockPool.query).toHaveBeenCalledWith(
            "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?",
            [50]
        );
        expect(result[0].action).toBe('LOGOUT');
    });

    it('findRecycleBin should fetch all deleted entries', async () => {
        mockPool.query.mockResolvedValue([
            { id: 1, entity_type: 'patient', deleted_at: '2026-06-28' }
        ]);

        const result = await repository.findRecycleBin();

        expect(mockPool.query).toHaveBeenCalledWith(
            "SELECT * FROM recycle_bin ORDER BY deleted_at DESC"
        );
        expect(result[0].entity_type).toBe('patient');
    });
});
