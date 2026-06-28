const auditHelper = require('./audit');
const auditRepository = require('../../repositories/system/auditRepository');

jest.mock('../../repositories/system/auditRepository');

describe('audit helper - logAction & logCRUD', () => {
    let mockReq;

    beforeEach(() => {
        mockReq = {
            user: { user_id: 12, username: 'doctor1' },
            ip: '192.168.10.5'
        };
        jest.clearAllMocks();
    });

    it('logAction should extract user details and IP, and call auditRepository.create', async () => {
        auditRepository.create.mockResolvedValue({ affectedRows: 1 });

        const details = { resource: 'report' };
        await auditHelper.logAction(mockReq, 'GENERATE_REPORT', details);

        expect(auditRepository.create).toHaveBeenCalledWith({
            user_id: 12,
            username: 'doctor1',
            action: 'GENERATE_REPORT',
            details: JSON.stringify(details),
            ip_address: '192.168.10.5'
        });
    });

    it('logAction should fall back to body username or Anonymous if no req.user exists', async () => {
        const anonymousReq = {
            body: { username: 'guest' },
            ip: '127.0.0.1'
        };

        await auditHelper.logAction(anonymousReq, 'CONTACT_FORM_SUBMIT', 'form details');

        expect(auditRepository.create).toHaveBeenCalledWith({
            user_id: null,
            username: 'guest',
            action: 'CONTACT_FORM_SUBMIT',
            details: 'form details',
            ip_address: '127.0.0.1'
        });
    });

    it('logCRUD should format before/after state diff and call logAction', async () => {
        auditRepository.create.mockResolvedValue({ affectedRows: 1 });

        const oldData = { status: 'pending' };
        const newData = { status: 'completed' };

        await auditHelper.logCRUD(mockReq, 'UPDATE', 'appointment', 99, oldData, newData);

        expect(auditRepository.create).toHaveBeenCalledWith({
            user_id: 12,
            username: 'doctor1',
            action: 'UPDATE',
            details: JSON.stringify({
                entityType: 'appointment',
                entityId: 99,
                changes: {
                    from: oldData,
                    to: newData
                }
            }),
            ip_address: '192.168.10.5'
        });
    });
});
