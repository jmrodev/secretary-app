const outreachService = require('./outreachService');
const whatsappService = require('./whatsappService');
const { pool } = require('../../db');

jest.mock('./whatsappService', () => ({
    sendMessageDirect: jest.fn()
}));

jest.mock('../../db', () => ({
    pool: {
        query: jest.fn()
    }
}));

describe('OutreachService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('buildSegmentSql', () => {
        it('should build SQL for this_week segment', () => {
            const result = outreachService.buildSegmentSql('this_week');
            expect(result).toHaveProperty('sql');
            expect(result).toHaveProperty('params');
            expect(result.sql).toContain('patients');
            expect(result.sql).toContain('appointments');
            expect(result.sql).toContain('YEARWEEK');
            expect(result.params).toEqual([]);
        });

        it('should build SQL for date_range segment with start and end dates', () => {
            const result = outreachService.buildSegmentSql('date_range', '2024-01-01', '2024-12-31');
            expect(result.sql).toContain('BETWEEN');
            expect(result.sql).toContain('?');
            expect(result.params).toEqual(['2024-01-01', '2024-12-31']);
        });

        it('should build SQL for this_year segment', () => {
            const result = outreachService.buildSegmentSql('this_year');
            expect(result.sql).toContain('YEAR');
            expect(result.sql).toContain('CURDATE()');
            expect(result.params).toEqual([]);
        });

        it('should build SQL for since_year_ago segment', () => {
            const result = outreachService.buildSegmentSql('since_year_ago');
            expect(result.sql).toContain('NOT EXISTS');
            expect(result.sql).toContain('INTERVAL 12 MONTH');
            expect(result.params).toEqual([]);
        });

        it('should build SQL for upcoming segment', () => {
            const result = outreachService.buildSegmentSql('upcoming');
            expect(result.sql).toContain('> NOW()');
            expect(result.params).toEqual([]);
        });

        it('should build SQL for custom segment with dates', () => {
            const result = outreachService.buildSegmentSql('custom', '2024-06-01', '2024-06-30');
            expect(result.sql).toContain('BETWEEN');
            expect(result.params).toEqual(['2024-06-01', '2024-06-30']);
        });

        it('should throw for unknown segment type', () => {
            expect(() => outreachService.buildSegmentSql('invalid_type'))
                .toThrow('Unknown segment type: invalid_type');
        });

        it('should throw for date_range without dates', () => {
            expect(() => outreachService.buildSegmentSql('date_range'))
                .toThrow('start_date and end_date are required for date_range segment');
        });

        it('should throw for custom without dates', () => {
            expect(() => outreachService.buildSegmentSql('custom'))
                .toThrow('start_date and end_date are required for custom segment');
        });

        it('should include phone filtering in all segment types', () => {
            const types = ['this_week', 'this_year', 'upcoming', 'since_year_ago'];
            types.forEach(type => {
                const result = outreachService.buildSegmentSql(type);
                expect(result.sql).toContain('phone IS NOT NULL');
                expect(result.sql).toContain('LENGTH(p.phone) >= 8');
            });
        });
    });

    describe('getSegmentPatients', () => {
        it('should return patients from pool.query for a valid segment type', async () => {
            const mockPatients = [
                { id: 1, full_name: 'John Doe', phone: '5491111111111' },
                { id: 2, full_name: 'Jane Smith', phone: '5492222222222' }
            ];
            pool.query.mockResolvedValue(mockPatients);

            const result = await outreachService.getSegmentPatients('this_week');

            expect(pool.query).toHaveBeenCalledTimes(1);
            const callArgs = pool.query.mock.calls[0];
            expect(callArgs[0]).toContain('SELECT');
            expect(callArgs[0]).toContain('patients');
            expect(result).toEqual(mockPatients);
        });

        it('should pass date params to pool.query for date_range', async () => {
            pool.query.mockResolvedValue([]);

            await outreachService.getSegmentPatients('date_range', '2024-01-01', '2024-12-31');

            const callArgs = pool.query.mock.calls[0];
            expect(callArgs[0]).toContain('BETWEEN');
            expect(callArgs[1]).toEqual(['2024-01-01', '2024-12-31']);
        });

        it('should propagate pool.query errors', async () => {
            pool.query.mockRejectedValue(new Error('DB connection failed'));

            await expect(outreachService.getSegmentPatients('this_week'))
                .rejects.toThrow('DB connection failed');
        });
    });

    describe('sendBroadcast', () => {
        const mockVariants = [
            { header: 'Hello', body: 'Your appointment is tomorrow', footer: 'Best regards' },
            { header: 'Hi there', body: 'Your appointment is tomorrow', footer: 'Thanks' },
            { header: 'Greetings', body: 'Your appointment is tomorrow', footer: 'Regards' }
        ];

        const mockPatients = [
            { id: 1, full_name: 'John Doe', phone: '5491111111111' },
            { id: 2, full_name: 'Jane Smith', phone: '5492222222222' },
            { id: 3, full_name: 'Bob Wilson', phone: '5493333333333' },
            { id: 4, full_name: 'Alice Brown', phone: '5494444444444' },
            { id: 5, full_name: 'Charlie Davis', phone: '5495555555555' },
            { id: 6, full_name: 'Diana Evans', phone: '5496666666666' }
        ];

        beforeEach(() => {
            // sendBroadcast queries patients by IDs to get names
            pool.query.mockImplementation((sql, params) => {
                if (sql.includes('SELECT id, full_name, phone FROM patients WHERE id IN')) {
                    const ids = params;
                    return Promise.resolve(mockPatients.filter(p => ids.includes(p.id)));
                }
                return Promise.resolve([]);
            });
        });

        it('should send messages to each patient alternating variants', async () => {
            const patientIds = [1, 2, 3, 4, 5, 6];
            whatsappService.sendMessageDirect.mockResolvedValue({ success: true });

            const result = await outreachService.sendBroadcast(patientIds, 'Your appointment is tomorrow', mockVariants, 0);

            expect(whatsappService.sendMessageDirect).toHaveBeenCalledTimes(6);
            // Patient 1 gets variant 0, patient 2 gets variant 1, etc.
            expect(whatsappService.sendMessageDirect.mock.calls[0][2]).toBe(1);
            expect(whatsappService.sendMessageDirect.mock.calls[1][2]).toBe(2);
            expect(whatsappService.sendMessageDirect.mock.calls[2][2]).toBe(3);
            expect(whatsappService.sendMessageDirect.mock.calls[3][2]).toBe(4);
            expect(whatsappService.sendMessageDirect.mock.calls[4][2]).toBe(5);
            expect(whatsappService.sendMessageDirect.mock.calls[5][2]).toBe(6);
            expect(result.total_sent).toBe(6);
            expect(result.total_failed).toBe(0);
        });

        it('should alternate variants across patients', async () => {
            const patientIds = [1, 2, 3, 4];
            whatsappService.sendMessageDirect.mockResolvedValue({ success: true });

            await outreachService.sendBroadcast(patientIds, 'Test body', mockVariants, 0);

            // Patient 1 should get variant 0 (index 0 % 3 = 0)
            // Patient 4 should get variant 0 (index 3 % 3 = 0)
            const firstMessage = whatsappService.sendMessageDirect.mock.calls[0][1];
            const fourthMessage = whatsappService.sendMessageDirect.mock.calls[3][1];
            expect(firstMessage).toContain('Hello');
            expect(fourthMessage).toContain('Hello');
        });

        it('should handle partial failures and continue sending', async () => {
            const patientIds = [1, 2, 3];
            whatsappService.sendMessageDirect
                .mockResolvedValueOnce({ success: true })
                .mockRejectedValueOnce(new Error('Bridge error'))
                .mockResolvedValueOnce({ success: true });

            const result = await outreachService.sendBroadcast(patientIds, 'Test body', mockVariants, 0);

            expect(whatsappService.sendMessageDirect).toHaveBeenCalledTimes(3);
            expect(result.total_sent).toBe(2);
            expect(result.total_failed).toBe(1);
            expect(result.results[0].status).toBe('sent');
            expect(result.results[1].status).toBe('failed');
            expect(result.results[1].error).toBe('Bridge error');
            expect(result.results[2].status).toBe('sent');
        });

        it('should substitute {patient_name} placeholders in messages', async () => {
            const patientIds = [1, 2];
            whatsappService.sendMessageDirect.mockResolvedValue({ success: true });

            await outreachService.sendBroadcast(patientIds, 'Hello {patient_name}', mockVariants, 0);

            // Patient 1 = John Doe, variant 0 header = "Hello"
            expect(whatsappService.sendMessageDirect.mock.calls[0][1]).toContain('Hello');
            expect(whatsappService.sendMessageDirect.mock.calls[0][1]).toContain('John Doe');
            // Patient 2 = Jane Smith, variant 1 header = "Hi there"
            expect(whatsappService.sendMessageDirect.mock.calls[1][1]).toContain('Hi there');
            expect(whatsappService.sendMessageDirect.mock.calls[1][1]).toContain('Jane Smith');
        });

        it('should return empty result for empty patient_ids', async () => {
            const result = await outreachService.sendBroadcast([], 'Test body', mockVariants, 0);

            expect(whatsappService.sendMessageDirect).not.toHaveBeenCalled();
            expect(result.total_sent).toBe(0);
            expect(result.total_failed).toBe(0);
            expect(result.results).toEqual([]);
        });

        it('should use body without variants when variants are not provided', async () => {
            const patientIds = [1, 2];
            whatsappService.sendMessageDirect.mockResolvedValue({ success: true });

            await outreachService.sendBroadcast(patientIds, 'Simple message', null, 0);

            expect(whatsappService.sendMessageDirect).toHaveBeenCalledTimes(2);
            expect(whatsappService.sendMessageDirect.mock.calls[0][1]).toContain('Simple message');
            expect(whatsappService.sendMessageDirect.mock.calls[0][1]).not.toContain('\n\n');
        });
    });
});
