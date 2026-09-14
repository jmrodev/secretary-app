import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppointmentActions } from '../useAppointmentActions';

describe('useAppointmentActions - handleReschedule', () => {
    let mockT;
    let mockShowMessage;
    let mockConfirm;
    let mockPrompt;
    let mockUpdateStatus;
    let mockUpdateAppointment;
    let mockDeleteAppointment;
    let mockRescheduleAppointment;
    let mockFetchAppointments;
    let mockSetActionModal;

    beforeEach(() => {
        mockT = vi.fn((key) => key);
        mockShowMessage = vi.fn();
        mockConfirm = vi.fn();
        mockPrompt = vi.fn();
        mockUpdateStatus = vi.fn();
        mockUpdateAppointment = vi.fn();
        mockDeleteAppointment = vi.fn();
        mockRescheduleAppointment = vi.fn();
        mockFetchAppointments = vi.fn();
        mockSetActionModal = vi.fn();
    });

    const createHook = () => {
        return renderHook(() =>
            useAppointmentActions({
                t: mockT,
                showMessage: mockShowMessage,
                confirm: mockConfirm,
                prompt: mockPrompt,
                updateStatus: mockUpdateStatus,
                updateAppointment: mockUpdateAppointment,
                deleteAppointment: mockDeleteAppointment,
                rescheduleAppointment: mockRescheduleAppointment,
                fetchAppointments: mockFetchAppointments,
                setActionModal: mockSetActionModal
            })
        );
    };

    it('should call rescheduleAppointment with adminPassword, showMessage success, fetchAppointments, and return { success: true, ... } on success', async () => {
        mockRescheduleAppointment.mockResolvedValueOnce({
            success: true,
            message: 'Appointment updated'
        });

        const { result } = createHook();

        let res;
        await act(async () => {
            res = await result.current.handleReschedule(10, '2026-09-16T15:00:00.000Z', 'adminSecret');
        });

        expect(mockRescheduleAppointment).toHaveBeenCalledWith(10, '2026-09-16T15:00:00.000Z', 'adminSecret');
        expect(mockShowMessage).toHaveBeenCalledWith('rescheduled_success', 'success');
        expect(mockFetchAppointments).toHaveBeenCalled();
        expect(res).toEqual({
            success: true,
            message: 'Appointment updated'
        });
    });

    it('should handle 403 / AUTH_REQUIRED challenge: return { type: "AUTH_REQUIRED" } and suppress generic error toast', async () => {
        const authError = {
            response: {
                status: 403,
                data: {
                    type: 'AUTH_REQUIRED',
                    error: 'Requiere autorización de Administrador...'
                }
            }
        };
        mockRescheduleAppointment.mockRejectedValueOnce(authError);

        const { result } = createHook();

        let res;
        await act(async () => {
            res = await result.current.handleReschedule(10, '2026-09-16T15:00:00.000Z');
        });

        expect(res).toEqual({ type: 'AUTH_REQUIRED' });
        expect(mockShowMessage).not.toHaveBeenCalled();
        expect(mockFetchAppointments).not.toHaveBeenCalled();
    });

    it('should handle AUTH_REQUIRED challenge when status is not 403 but type is AUTH_REQUIRED', async () => {
        const authError = {
            response: {
                status: 400,
                data: {
                    type: 'AUTH_REQUIRED',
                    error: 'Requiere autorización de Administrador...'
                }
            }
        };
        mockRescheduleAppointment.mockRejectedValueOnce(authError);

        const { result } = createHook();

        let res;
        await act(async () => {
            res = await result.current.handleReschedule(10, '2026-09-16T15:00:00.000Z');
        });

        expect(res).toEqual({ type: 'AUTH_REQUIRED' });
        expect(mockShowMessage).not.toHaveBeenCalled();
        expect(mockFetchAppointments).not.toHaveBeenCalled();
    });

    it('should handle generic error (e.g. 409 collision): show error message and return { success: false }', async () => {
        const conflictError = {
            response: {
                status: 409,
                data: {
                    error: 'Ya existe un turno confirmado en este horario.'
                }
            }
        };
        mockRescheduleAppointment.mockRejectedValueOnce(conflictError);

        const { result } = createHook();

        let res;
        await act(async () => {
            res = await result.current.handleReschedule(10, '2026-09-16T15:00:00.000Z');
        });

        expect(res).toEqual({ success: false });
        expect(mockShowMessage).toHaveBeenCalledWith('Ya existe un turno confirmado en este horario.', 'error');
        expect(mockFetchAppointments).not.toHaveBeenCalled();
    });

    it('should fall back to t("reschedule_error") if error response has no specific message', async () => {
        const genericError = new Error('Network error');
        mockRescheduleAppointment.mockRejectedValueOnce(genericError);

        const { result } = createHook();

        let res;
        await act(async () => {
            res = await result.current.handleReschedule(10, '2026-09-16T15:00:00.000Z');
        });

        expect(res).toEqual({ success: false });
        expect(mockShowMessage).toHaveBeenCalledWith('reschedule_error', 'error');
        expect(mockFetchAppointments).not.toHaveBeenCalled();
    });
});
