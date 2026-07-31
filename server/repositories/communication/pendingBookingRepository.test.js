const PendingBookingRepository = require('./pendingBookingRepository');

describe('PendingBookingRepository', () => {
    let mockPool;
    let repo;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        repo = PendingBookingRepository(mockPool);
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should INSERT a pending booking row with the requested slot data', async () => {
            mockPool.query.mockResolvedValue({ insertId: 7 });

            const id = await repo.create({
                patient_id: 5,
                doctor_id: 3,
                patient_phone: '+5411111111',
                requested_slot_date: '2026-08-03',
                requested_slot_time: '09:00'
            });

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO whatsapp_pending_bookings'),
                [5, 3, '+5411111111', '2026-08-03', '09:00']
            );
            expect(id).toBe(7);
        });
    });

    describe('findActive', () => {
        it('should return only pending and alternative_sent bookings with patient and doctor names', async () => {
            const rows = [
                { id: 1, patient_name: 'Juan Perez', doctor_name: 'Dr. House', status: 'pending' },
                { id: 2, patient_name: 'Ana Lopez', doctor_name: 'Dr. House', status: 'alternative_sent' }
            ];
            mockPool.query.mockResolvedValue(rows);

            const result = await repo.findActive();

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE wb.status IN (?, ?)'),
                ['pending', 'alternative_sent']
            );
            expect(result).toEqual(rows);
        });
    });

    describe('findActiveByPatient', () => {
        it('should return the active pending booking for a patient', async () => {
            const row = { id: 9, patient_id: 5, status: 'pending' };
            mockPool.query.mockResolvedValue([row]);

            const result = await repo.findActiveByPatient(5);

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE patient_id = ? AND status IN (?, ?)'),
                [5, 'pending', 'alternative_sent']
            );
            expect(result).toEqual(row);
        });

        it('should return null when the patient has no active pending booking', async () => {
            mockPool.query.mockResolvedValue([]);

            const result = await repo.findActiveByPatient(99);

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should return the pending booking with names and accepted_by name joined', async () => {
            const row = { id: 1, patient_name: 'Juan Perez', doctor_name: 'Dr. House', accepted_by_name: 'Ana' };
            mockPool.query.mockResolvedValue([row]);

            const result = await repo.findById(1);

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('FROM whatsapp_pending_bookings'),
                [1]
            );
            expect(result).toEqual(row);
        });

        it('should return null when the booking does not exist', async () => {
            mockPool.query.mockResolvedValue([]);

            const result = await repo.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('acceptById — optimistic lock', () => {
        it('should update to accepted only when the row is still pending (first-wins)', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 1 });

            const affected = await repo.acceptById(4, 11);

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("status = 'accepted'"),
                expect.any(Array)
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("id = ? AND status = 'pending'"),
                expect.any(Array)
            );
            expect(affected).toBe(1);
        });

        it('should return 0 affectedRows when the booking was already taken (race lost)', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 0 });

            const affected = await repo.acceptById(4, 12);

            expect(affected).toBe(0);
        });
    });

    describe('suggestAlternative', () => {
        it('should set status to alternative_sent with slot iso and note, only when pending', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 1 });

            const affected = await repo.suggestAlternative(4, '2026-08-05T10:00:00', 'Prefiere turnos a la mañana');

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("status = 'alternative_sent'"),
                expect.any(Array)
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("id = ? AND status = 'pending'"),
                expect.any(Array)
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('alternative_slot_iso = ?'),
                expect.any(Array)
            );
            expect(mockPool.query.mock.calls[0][1]).toEqual(['2026-08-05T10:00:00', 'Prefiere turnos a la mañana', 4]);
            expect(affected).toBe(1);
        });

        it('should return 0 affectedRows when the booking is no longer pending', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 0 });

            const affected = await repo.suggestAlternative(4, '2026-08-05T10:00:00', null);

            expect(affected).toBe(0);
        });
    });

    describe('rejectById', () => {
        it('should set status to rejected with reason and rejecting user', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 1 });

            const affected = await repo.rejectById(4, 11, 'Paciente no responde');

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("status = 'rejected'"),
                expect.any(Array)
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('rejected_reason = ?'),
                expect.any(Array)
            );
            expect(mockPool.query.mock.calls[0][1]).toEqual([11, 'Paciente no responde', 4]);
            expect(affected).toBe(1);
        });
    });

    describe('expireStaleAlternatives', () => {
        it('should mark alternative_sent rows older than 2 hours as timed_out', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 2 });

            const affected = await repo.expireStaleAlternatives();

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("status = 'timed_out'")
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("status = 'alternative_sent'")
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INTERVAL 2 HOUR')
            );
            expect(affected).toBe(2);
        });

        it('should return 0 affectedRows when there are no stale alternatives', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 0 });

            const affected = await repo.expireStaleAlternatives();

            expect(affected).toBe(0);
        });
    });

    describe('acceptAlternativeById', () => {
        it('should set status to alternative_accepted with the appointment id, only when alternative_sent', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 1 });

            const affected = await repo.acceptAlternativeById(4, 456);

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("status = 'alternative_accepted'"),
                expect.any(Array)
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('appointment_id = ?'),
                expect.any(Array)
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("id = ? AND status = 'alternative_sent'"),
                expect.any(Array)
            );
            expect(mockPool.query.mock.calls[0][1]).toEqual([456, 4]);
            expect(affected).toBe(1);
        });

        it('should return 0 affectedRows when the alternative was already resolved', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 0 });

            const affected = await repo.acceptAlternativeById(4, 456);

            expect(affected).toBe(0);
        });
    });

    describe('rejectAlternativeById', () => {
        it('should set status to alternative_rejected with the reason, only when alternative_sent', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 1 });

            const affected = await repo.rejectAlternativeById(4, 'patient_declined');

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("status = 'alternative_rejected'"),
                expect.any(Array)
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('rejected_reason = ?'),
                expect.any(Array)
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("id = ? AND status = 'alternative_sent'"),
                expect.any(Array)
            );
            expect(mockPool.query.mock.calls[0][1]).toEqual(['patient_declined', 4]);
            expect(affected).toBe(1);
        });

        it('should default the reason to null when none is provided', async () => {
            mockPool.query.mockResolvedValue({ affectedRows: 1 });

            const affected = await repo.rejectAlternativeById(4, null);

            expect(mockPool.query.mock.calls[0][1]).toEqual([null, 4]);
            expect(affected).toBe(1);
        });
    });
});
