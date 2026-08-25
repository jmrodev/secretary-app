const transactionRepository = require('../../repositories/finance/transactionRepository');

jest.mock('../../repositories/finance/transactionRepository', () => ({
    findByAppointmentId: jest.fn(),
    findByRequestId: jest.fn(),
    detachAndLabel: jest.fn(),
    deletePendingByAppointmentId: jest.fn(),
    deletePendingByRequestId: jest.fn()
}));

const DebtLifecycleService = require('./debtLifecycleService');

const DEBT_LABEL = 'Deuda (Turno Eliminado)';
const CREDIT_LABEL = 'Saldo a favor (Turno Eliminado)';

describe('DebtLifecycleService - handleAppointmentDelete', () => {
    let conn;

    beforeEach(() => {
        conn = { query: jest.fn() };
        jest.clearAllMocks();
    });

    it('should retain and label pending debt when a completed appointment is deleted', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 1, status: 'pending' },
            { id: 2, status: 'paid' }
        ]);
        const appt = { id: 10, status: 'completed', payment_status: 'pending' };

        await DebtLifecycleService.handleAppointmentDelete(conn, appt);

        expect(transactionRepository.findByAppointmentId).toHaveBeenCalledWith(10, conn);
        expect(transactionRepository.detachAndLabel).toHaveBeenCalledWith([1], DEBT_LABEL, conn);
        expect(transactionRepository.deletePendingByAppointmentId).not.toHaveBeenCalled();
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalledWith([2], expect.anything(), conn);
    });

    it('should retain and label pending debt when an absent appointment is deleted', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 3, status: 'pending' }
        ]);
        const appt = { id: 11, status: 'absent', payment_status: 'debt' };

        await DebtLifecycleService.handleAppointmentDelete(conn, appt);

        expect(transactionRepository.detachAndLabel).toHaveBeenCalledWith([3], DEBT_LABEL, conn);
        expect(transactionRepository.deletePendingByAppointmentId).not.toHaveBeenCalled();
    });

    it('should delete pending debt when a confirmed (non-rendered) appointment is deleted', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 4, status: 'pending' }
        ]);
        const appt = { id: 12, status: 'confirmed', payment_status: 'pending' };

        await DebtLifecycleService.handleAppointmentDelete(conn, appt);

        expect(transactionRepository.deletePendingByAppointmentId).toHaveBeenCalledWith(12, conn);
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
    });

    it('should delete pending debt and label paid transactions when a paid cancelled appointment is deleted', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 5, status: 'pending' },
            { id: 6, status: 'paid' }
        ]);
        const appt = { id: 13, status: 'cancelled', payment_status: 'paid' };

        await DebtLifecycleService.handleAppointmentDelete(conn, appt);

        expect(transactionRepository.deletePendingByAppointmentId).toHaveBeenCalledWith(13, conn);
        expect(transactionRepository.detachAndLabel).toHaveBeenCalledWith([6], CREDIT_LABEL, conn);
    });

    it('should delete pending debt without labeling when a non-paid cancelled appointment is deleted', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 7, status: 'pending' }
        ]);
        const appt = { id: 14, status: 'cancelled', payment_status: 'pending' };

        await DebtLifecycleService.handleAppointmentDelete(conn, appt);

        expect(transactionRepository.deletePendingByAppointmentId).toHaveBeenCalledWith(14, conn);
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
    });

    it('should delete pending debt and null payment_status when a suspended appointment is deleted (legacy)', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 8, status: 'pending' }
        ]);
        const appt = { id: 15, status: 'suspended', payment_status: 'pending' };

        await DebtLifecycleService.handleAppointmentDelete(conn, appt);

        expect(transactionRepository.deletePendingByAppointmentId).toHaveBeenCalledWith(15, conn);
        expect(conn.query).toHaveBeenCalledWith(
            expect.stringContaining("UPDATE appointments SET payment_status = NULL WHERE id = ?"),
            [15]
        );
    });

    it('should leave paid transactions untouched when a paid no-show appointment is deleted', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 9, status: 'paid' }
        ]);
        const appt = { id: 16, status: 'confirmed', payment_status: 'paid' };

        await DebtLifecycleService.handleAppointmentDelete(conn, appt);

        expect(transactionRepository.deletePendingByAppointmentId).not.toHaveBeenCalled();
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
    });
});

describe('DebtLifecycleService - handleAppointmentStatusChange', () => {
    let conn;

    beforeEach(() => {
        conn = { query: jest.fn() };
        jest.clearAllMocks();
    });

    it('should retain pending debt and payment_status when an appointment is marked absent', async () => {
        const appt = { id: 20, status: 'confirmed', payment_status: 'pending' };

        await DebtLifecycleService.handleAppointmentStatusChange(conn, appt, 'absent');

        expect(transactionRepository.findByAppointmentId).not.toHaveBeenCalled();
        expect(transactionRepository.deletePendingByAppointmentId).not.toHaveBeenCalled();
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
        expect(conn.query).not.toHaveBeenCalled();
    });

    it('should remove pending debt and label paid transactions when a paid appointment is cancelled', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 21, status: 'pending' },
            { id: 22, status: 'paid' }
        ]);
        const appt = { id: 30, status: 'confirmed', payment_status: 'paid' };

        await DebtLifecycleService.handleAppointmentStatusChange(conn, appt, 'cancelled');

        expect(transactionRepository.deletePendingByAppointmentId).toHaveBeenCalledWith(30, conn);
        expect(transactionRepository.detachAndLabel).toHaveBeenCalledWith([22], CREDIT_LABEL, conn);
    });

    it('should remove pending debt without labeling when a non-paid appointment is cancelled', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 23, status: 'pending' }
        ]);
        const appt = { id: 31, status: 'confirmed', payment_status: 'pending' };

        await DebtLifecycleService.handleAppointmentStatusChange(conn, appt, 'cancelled');

        expect(transactionRepository.deletePendingByAppointmentId).toHaveBeenCalledWith(31, conn);
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
    });

    it('should remove pending debt when an appointment is suspended (legacy)', async () => {
        transactionRepository.findByAppointmentId.mockResolvedValue([
            { id: 24, status: 'pending' }
        ]);
        const appt = { id: 32, status: 'confirmed', payment_status: 'pending' };

        await DebtLifecycleService.handleAppointmentStatusChange(conn, appt, 'suspended');

        expect(transactionRepository.deletePendingByAppointmentId).toHaveBeenCalledWith(32, conn);
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
    });
});

describe('DebtLifecycleService - handleRequestDelete', () => {
    let conn;

    beforeEach(() => {
        conn = { query: jest.fn() };
        jest.clearAllMocks();
    });

    it('should retain, label and detach pending debt when a completed request is deleted', async () => {
        transactionRepository.findByRequestId.mockResolvedValue([
            { id: 40, status: 'pending' }
        ]);
        const reqInfo = { id: 50, status: 'completed' };

        await DebtLifecycleService.handleRequestDelete(conn, reqInfo);

        expect(transactionRepository.findByRequestId).toHaveBeenCalledWith(50, conn);
        expect(transactionRepository.detachAndLabel).toHaveBeenCalledWith([40], DEBT_LABEL, conn);
        expect(transactionRepository.deletePendingByRequestId).not.toHaveBeenCalled();
    });

    it('should remove pending debt when a pending request is deleted', async () => {
        transactionRepository.findByRequestId.mockResolvedValue([
            { id: 41, status: 'pending' }
        ]);
        const reqInfo = { id: 51, status: 'pending' };

        await DebtLifecycleService.handleRequestDelete(conn, reqInfo);

        expect(transactionRepository.deletePendingByRequestId).toHaveBeenCalledWith(51, conn);
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
    });

    it('should remove pending debt when a rejected request is deleted', async () => {
        transactionRepository.findByRequestId.mockResolvedValue([
            { id: 42, status: 'pending' }
        ]);
        const reqInfo = { id: 52, status: 'rejected' };

        await DebtLifecycleService.handleRequestDelete(conn, reqInfo);

        expect(transactionRepository.deletePendingByRequestId).toHaveBeenCalledWith(52, conn);
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
    });

    it('should remove pending debt when a cancelled request is deleted', async () => {
        transactionRepository.findByRequestId.mockResolvedValue([
            { id: 43, status: 'pending' }
        ]);
        const reqInfo = { id: 53, status: 'cancelled' };

        await DebtLifecycleService.handleRequestDelete(conn, reqInfo);

        expect(transactionRepository.deletePendingByRequestId).toHaveBeenCalledWith(53, conn);
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
    });

    it('should leave paid transactions unchanged when a request with only paid debt is deleted', async () => {
        transactionRepository.findByRequestId.mockResolvedValue([
            { id: 44, status: 'paid' }
        ]);
        const reqInfo = { id: 54, status: 'pending' };

        await DebtLifecycleService.handleRequestDelete(conn, reqInfo);

        expect(transactionRepository.deletePendingByRequestId).not.toHaveBeenCalled();
        expect(transactionRepository.detachAndLabel).not.toHaveBeenCalled();
    });
});