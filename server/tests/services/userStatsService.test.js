jest.mock('../../db', () => ({
    pool: {
        query: jest.fn(),
        getConnection: jest.fn(() => ({
            query: jest.fn(),
            release: jest.fn(),
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn()
        })),
        end: jest.fn()
    }
}));

const statsRepository = require('../../repositories/statsRepository');
const doctorRepository = require('../../repositories/doctorRepository');

jest.mock('../../repositories/statsRepository');
jest.mock('../../repositories/doctorRepository');

const userStatsService = require('../../services/userStatsService');

describe('UserStatsService', () => {
    let originalDate;

    beforeEach(() => {
        jest.clearAllMocks();

        // Use a mock for Date instead of fake timers to avoid open handle issues
        // and safely test the date logic.
        originalDate = global.Date;

        // For testing we will use a fixed UTC date.
        const FIXED_DATE = new originalDate('2023-10-18T12:00:00Z');

        global.Date = class extends Date {
            constructor(...args) {
                if (args.length === 0) {
                    return FIXED_DATE;
                }
                return new originalDate(...args);
            }
        };
        global.Date.now = () => FIXED_DATE.getTime();
    });

    afterEach(() => {
        global.Date = originalDate;
    });

    // Helper to calculate expected ISO dates using local time components
    // to avoid the bug being tested and ensure independence from service implementation.
    const getExpectedDates = (fixedDate) => {
        const now = new originalDate(fixedDate.getTime());
        const pad = (n) => n.toString().padStart(2, '0');
        const format = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        const todayStart = format(new originalDate(now.getFullYear(), now.getMonth(), now.getDate()));
        const todayEnd = format(new originalDate(now.getFullYear(), now.getMonth(), now.getDate() + 1));

        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = format(new originalDate(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset));
        const weekEnd = format(new originalDate(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + 7));

        const monthStart = format(new originalDate(now.getFullYear(), now.getMonth(), 1));
        const monthEnd = format(new originalDate(now.getFullYear(), now.getMonth() + 1, 1));

        return { todayStart, todayEnd, weekStart, weekEnd, monthStart, monthEnd };
    };

    describe('getStats', () => {
        it('should return stats for a non-doctor user correctly with correct date calculations', async () => {
            const mockUser = { role: 'admin', user_id: 1 };

            statsRepository.countAppointments.mockResolvedValueOnce(5); // today
            statsRepository.countAppointments.mockResolvedValueOnce(20); // week
            statsRepository.countAppointments.mockResolvedValueOnce(80); // month
            statsRepository.countAppointments.mockResolvedValueOnce(500); // total
            statsRepository.countPatients.mockResolvedValueOnce(150); // patients (doctorId)
            statsRepository.countPatients.mockResolvedValueOnce(150); // contacts (no doctorId)

            const result = await userStatsService.getStats(mockUser);

            expect(result).toEqual({
                appointments_today: 5,
                appointments_week: 20,
                appointments_month: 80,
                total_appointments: 500,
                total_patients: 150,
                total_contacts: 150,
            });

            expect(doctorRepository.getDoctorConfigByUserId).not.toHaveBeenCalled();

            const expectedDates = getExpectedDates(new originalDate('2023-10-18T12:00:00Z'));

            // Verify the dates sent to repository methods
            expect(statsRepository.countAppointments).toHaveBeenNthCalledWith(1, { doctorId: null, from: expectedDates.todayStart, to: expectedDates.todayEnd });
            expect(statsRepository.countAppointments).toHaveBeenNthCalledWith(2, { doctorId: null, from: expectedDates.weekStart, to: expectedDates.weekEnd });
            expect(statsRepository.countAppointments).toHaveBeenNthCalledWith(3, { doctorId: null, from: expectedDates.monthStart, to: expectedDates.monthEnd });
            expect(statsRepository.countAppointments).toHaveBeenNthCalledWith(4, { doctorId: null });

            // Patients
            expect(statsRepository.countPatients).toHaveBeenNthCalledWith(1, null);
            // Contacts
            expect(statsRepository.countPatients).toHaveBeenNthCalledWith(2);
        });

        it('should return stats for a doctor user correctly', async () => {
            const mockUser = { role: 'doctor', user_id: 2 };
            const mockDoctorId = 10;

            doctorRepository.getDoctorConfigByUserId.mockResolvedValue({ id: mockDoctorId });

            statsRepository.countAppointments.mockResolvedValueOnce(2); // today
            statsRepository.countAppointments.mockResolvedValueOnce(10); // week
            statsRepository.countAppointments.mockResolvedValueOnce(40); // month
            statsRepository.countAppointments.mockResolvedValueOnce(200); // total
            statsRepository.countPatients.mockResolvedValueOnce(50); // patients (doctorId)
            statsRepository.countPatients.mockResolvedValueOnce(150); // contacts (no doctorId)

            const result = await userStatsService.getStats(mockUser);

            expect(result).toEqual({
                appointments_today: 2,
                appointments_week: 10,
                appointments_month: 40,
                total_appointments: 200,
                total_patients: 50,
                total_contacts: 150,
            });

            expect(doctorRepository.getDoctorConfigByUserId).toHaveBeenCalledWith(2);

            expect(statsRepository.countAppointments).toHaveBeenCalledWith(expect.objectContaining({ doctorId: mockDoctorId }));

            expect(statsRepository.countPatients).toHaveBeenNthCalledWith(1, mockDoctorId);
            expect(statsRepository.countPatients).toHaveBeenNthCalledWith(2);
        });

        it('should throw an error if doctor profile is not found for a doctor user', async () => {
            const mockUser = { role: 'doctor', user_id: 3 };

            doctorRepository.getDoctorConfigByUserId.mockResolvedValue(null);

            await expect(userStatsService.getStats(mockUser)).rejects.toThrow('Doctor profile not found');

            expect(statsRepository.countAppointments).not.toHaveBeenCalled();
            expect(statsRepository.countPatients).not.toHaveBeenCalled();
        });

        it('should handle week boundary correctly when today is Sunday', async () => {
            const mockUser = { role: 'admin', user_id: 1 };

            // Set date to a Sunday: 2023-10-22T12:00:00Z
            const FIXED_DATE = new originalDate('2023-10-22T12:00:00Z');
            global.Date = class extends Date {
                constructor(...args) {
                    if (args.length === 0) return FIXED_DATE;
                    return new originalDate(...args);
                }
            };
            global.Date.now = () => FIXED_DATE.getTime();

            statsRepository.countAppointments.mockResolvedValue(0);
            statsRepository.countPatients.mockResolvedValue(0);

            await userStatsService.getStats(mockUser);

            const expectedDates = getExpectedDates(FIXED_DATE);

            expect(statsRepository.countAppointments).toHaveBeenNthCalledWith(2, { doctorId: null, from: expectedDates.weekStart, to: expectedDates.weekEnd });
        });
    });
});
