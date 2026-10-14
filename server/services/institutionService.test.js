const institutionService = require('./institutionService');
const institutionRepository = require('../repositories/institutionRepository');
const phoneRepository = require('../repositories/phoneRepository');

jest.mock('../db', () => ({
    pool: {
        getConnection: jest.fn()
    }
}), { virtual: true });
jest.mock('mariadb', () => ({}), { virtual: true });

jest.mock('../repositories/institutionRepository');
jest.mock('../repositories/phoneRepository');

describe('InstitutionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllInstitutions', () => {
        it('should return institutions with their phone numbers', async () => {
            const mockInstitutions = [
                { id: 1, name: 'Inst 1' },
                { id: 2, name: 'Inst 2' }
            ];
            const mockPhones = {
                1: [{ phone_number: '111' }],
                2: [{ phone_number: '222' }]
            };

            institutionRepository.findAll.mockResolvedValue(mockInstitutions);
            phoneRepository.findByEntities.mockResolvedValue(mockPhones);

            const result = await institutionService.getAllInstitutions();

            expect(result.institutions).toHaveLength(2);
            expect(result.institutions[0].phoneNumbers).toEqual(mockPhones[1]);
            expect(result.institutions[1].phoneNumbers).toEqual(mockPhones[2]);
            expect(result.totalCount).toBe(2);
            expect(phoneRepository.findByEntities).toHaveBeenCalledWith('institution', [1, 2]);
        });

        it('should return empty list if no institutions found', async () => {
            institutionRepository.findAll.mockResolvedValue([]);
            phoneRepository.findByEntities.mockResolvedValue({});

            const result = await institutionService.getAllInstitutions();

            expect(result.institutions).toHaveLength(0);
            expect(result.totalCount).toBe(0);
        });
    });
});
