const PrescriptionRepository = require('./prescriptionRepository');

describe('PrescriptionRepository', () => {
    let mockPool;
    let prescriptionRepository;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        prescriptionRepository = PrescriptionRepository(mockPool);
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should include patient_id in INSERT statement when creating a prescription', async () => {
            mockPool.query.mockResolvedValue({ insertId: 100 });

            const data = {
                appointment_id: 2163,
                patient_id: 8680,
                medications: 'CLONAGIN 0.5',
                instructions: '1 comprimido por día',
                bonified: true
            };

            const result = await prescriptionRepository.create(data);

            expect(result).toBe(100);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO prescriptions (appointment_id, patient_id, medications, instructions, bonified)'),
                [2163, 8680, 'CLONAGIN 0.5', '1 comprimido por día', true]
            );
        });
    });

    describe('findAll', () => {
        it('should use LEFT JOIN on appointments and filter by patient_id using COALESCE or OR clause', async () => {
            mockPool.query.mockResolvedValue([]);

            await prescriptionRepository.findAll({ patient_id: 8680 });

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('LEFT JOIN appointments a ON pr.appointment_id = a.id'),
                expect.arrayContaining([8680])
            );

            const sqlQuery = mockPool.query.mock.calls[0][0];
            expect(sqlQuery).toContain('JOIN patients p ON a.patient_id = p.id');
        });
    });
});
