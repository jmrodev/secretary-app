import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppointmentsHandlers } from '../useAppointmentsHandlers';

const mockAppointmentActions = {
    handleReschedule: vi.fn(),
    handleDelete: vi.fn(),
    handleStatusUpdate: vi.fn(),
    handleTypeUpdate: vi.fn(),
    handleBonify: vi.fn()
};

vi.mock('../useAppointmentActions', () => ({
    useAppointmentActions: vi.fn(() => mockAppointmentActions)
}));

vi.mock('@/api/axios', () => ({
    api: {
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
        delete: vi.fn()
    }
}));

describe('useAppointmentsHandlers - reschedule mode and retry queue', () => {
    let mockExitRescheduleMode;
    let mockSetAuthModalOpen;
    let mockSetRetryAction;
    let mockConfirm;
    let mockShowMessage;
    let mockFetchAppointments;
    let mockDeleteAppointment;
    let mockRescheduleAppointment;

    const baseProps = () => ({
        user: { role: 'admin', name: 'Admin User' },
        t: (key) => key,
        showMessage: mockShowMessage,
        confirm: mockConfirm,
        prompt: vi.fn(),
        navigate: vi.fn(),
        selectedDate: new Date(2026, 8, 16, 9, 0),
        setSelectedDate: vi.fn(),
        viewDoctorId: 1,
        setViewDoctorId: vi.fn(),
        selectedDoctor: 1,
        setSelectedDoctor: vi.fn(),
        rescheduleAppt: { id: 42, doctor_id: 1, appointment_date: '2026-09-15 10:00:00' },
        holidays: [],
        appointments: [{ id: 42, doctor_id: 1, status: 'confirmed' }],
        filteredAppointments: [],
        doctors: [{ id: 1, full_name: 'Dr. Test' }],
        settings: {},
        setDate: vi.fn(),
        setShowForm: vi.fn(),
        setBonified: vi.fn(),
        setSelectedInstitution: vi.fn(),
        setReason: vi.fn(),
        setSyncReferenceInfo: vi.fn(),
        setSyncingZombieId: vi.fn(),
        setActionModal: vi.fn(),
        setPrescribeModal: vi.fn(),
        setAuthModalOpen: mockSetAuthModalOpen,
        setRetryAction: mockSetRetryAction,
        setShowNextSlotModal: vi.fn(),
        setWhatsappModal: vi.fn(),
        setEditPatientModalOpen: vi.fn(),
        setPaymentModal: vi.fn(),
        setHistoryModal: vi.fn(),
        setSelectedPatient: vi.fn(),
        exitRescheduleMode: mockExitRescheduleMode,
        updateStatus: vi.fn(),
        updateAppointment: vi.fn(),
        fetchAppointments: mockFetchAppointments,
        savePrescription: vi.fn(),
        deleteAppointment: mockDeleteAppointment,
        rescheduleAppointment: mockRescheduleAppointment,
        bookAppointment: vi.fn(),
        setIsOutOfHours: vi.fn(),
        fetchNextFreeSlots: vi.fn(),
        selectedPatientData: null,
        copyToClipboard: vi.fn(),
        booking: {},
        setSlotHistory: vi.fn()
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockExitRescheduleMode = vi.fn();
        mockSetAuthModalOpen = vi.fn();
        mockSetRetryAction = vi.fn();
        mockConfirm = vi.fn().mockResolvedValue(true);
        mockShowMessage = vi.fn();
        mockFetchAppointments = vi.fn();
        mockDeleteAppointment = vi.fn().mockResolvedValue({ success: true });
        mockRescheduleAppointment = vi.fn();
    });

    describe('handleSlotClick in reschedule mode', () => {
        it('should invoke appointmentActions.handleReschedule and exitRescheduleMode() upon confirmed slot selection and success', async () => {
            mockAppointmentActions.handleReschedule.mockResolvedValueOnce({ success: true });

            const props = baseProps();
            const { result } = renderHook(() => useAppointmentsHandlers(props));

            await act(async () => {
                await result.current.handleSlotClick(11, null, 30);
            });

            expect(mockAppointmentActions.handleReschedule).toHaveBeenCalledWith(42, expect.stringContaining('11:30'));
            expect(mockExitRescheduleMode).toHaveBeenCalled();
            expect(mockSetRetryAction).not.toHaveBeenCalled();
            expect(mockSetAuthModalOpen).not.toHaveBeenCalled();
        });

        it('should dispatch setRetryAction and setAuthModalOpen(true) when handleReschedule returns AUTH_REQUIRED', async () => {
            mockAppointmentActions.handleReschedule.mockResolvedValueOnce({ type: 'AUTH_REQUIRED' });

            const props = baseProps();
            const { result } = renderHook(() => useAppointmentsHandlers(props));

            await act(async () => {
                await result.current.handleSlotClick(11, null, 30);
            });

            expect(mockAppointmentActions.handleReschedule).toHaveBeenCalledWith(42, expect.stringContaining('11:30'));
            expect(mockExitRescheduleMode).not.toHaveBeenCalled();
            expect(mockSetRetryAction).toHaveBeenCalledWith({
                type: 'reschedule',
                args: [42, expect.stringContaining('11:30')]
            });
            expect(mockSetAuthModalOpen).toHaveBeenCalledWith(true);
        });
    });

    describe('handleAdminAuthConfirm retry execution', () => {
        it('should execute appointmentActions.handleReschedule with password for retryAction type reschedule, and clear modals on success', async () => {
            mockAppointmentActions.handleReschedule.mockResolvedValueOnce({ success: true });

            const props = baseProps();
            const { result } = renderHook(() => useAppointmentsHandlers(props));

            await act(async () => {
                await result.current.handleAdminAuthConfirm(
                    { type: 'reschedule', args: [42, '2026-09-16 11:30'] },
                    'adminPassword123'
                );
            });

            expect(mockAppointmentActions.handleReschedule).toHaveBeenCalledWith(42, '2026-09-16 11:30', 'adminPassword123');
            expect(mockSetAuthModalOpen).toHaveBeenCalledWith(false);
            expect(mockSetRetryAction).toHaveBeenCalledWith(null);
            expect(mockExitRescheduleMode).toHaveBeenCalled();
        });

        it('should execute handleDelete with password for retryAction type delete, and clear modals', async () => {
            const props = baseProps();
            const { result } = renderHook(() => useAppointmentsHandlers(props));

            await act(async () => {
                await result.current.handleAdminAuthConfirm(
                    { type: 'delete', args: [42, 'confirmed'] },
                    'adminPassword123'
                );
            });

            expect(mockDeleteAppointment).toHaveBeenCalledWith(
                42,
                expect.objectContaining({ id: 42 }),
                expect.objectContaining({ adminPassword: 'adminPassword123' })
            );
            expect(mockSetAuthModalOpen).toHaveBeenCalledWith(false);
            expect(mockSetRetryAction).toHaveBeenCalledWith(null);
        });
    });
});
