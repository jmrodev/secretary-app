import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppointments } from '../useAppointments';

vi.mock('@/api/axios', () => ({
    api: {
        put: vi.fn(),
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn()
    }
}));

import { api } from '@/api/axios';

describe('useAppointments - rescheduleAppointment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should send PUT /appointments/:id with { appointment_date: isoDate, adminPassword } and return normalized { success: true, ...res.data }', async () => {
        api.put.mockResolvedValueOnce({
            data: { message: 'Appointment updated' }
        });

        const { result } = renderHook(() => useAppointments());
        const testDate = '2026-09-16T14:00:00.000Z';

        let res;
        await act(async () => {
            res = await result.current.rescheduleAppointment(1, testDate, 'adminSecret');
        });

        expect(api.put).toHaveBeenCalledWith('/appointments/1', {
            appointment_date: new Date(testDate).toISOString(),
            adminPassword: 'adminSecret'
        });
        expect(res).toEqual({
            success: true,
            message: 'Appointment updated'
        });
    });

    it('should transition isSubmitting loading state during the request', async () => {
        let resolvePromise;
        const pendingPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });

        api.put.mockReturnValueOnce(pendingPromise);

        const { result } = renderHook(() => useAppointments());
        expect(result.current.isSubmitting).toBe(false);

        let actionPromise;
        act(() => {
            actionPromise = result.current.rescheduleAppointment(1, '2026-09-16T14:00:00.000Z', null);
        });

        expect(result.current.isSubmitting).toBe(true);

        await act(async () => {
            resolvePromise({ data: { message: 'Appointment updated' } });
            await actionPromise;
        });

        expect(result.current.isSubmitting).toBe(false);
    });
});
