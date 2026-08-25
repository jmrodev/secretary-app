import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPost: vi.fn() }));

vi.mock('@/api/axios', () => ({
    api: { get: mockGet, post: mockPost }
}));

import { listPending, acceptPending, suggestAlternative, rejectPending } from './pendingBookingApi';

describe('pendingBookingApi', () => {
    beforeEach(() => {
        mockGet.mockReset();
        mockPost.mockReset();
    });

    it('listPending GETs the pending bookings endpoint and returns the data array', async () => {
        mockGet.mockResolvedValue({ data: { success: true, data: [{ id: 1, status: 'pending' }] } });
        const result = await listPending();
        expect(mockGet).toHaveBeenCalledWith('/whatsapp/pending-bookings');
        expect(result).toEqual([{ id: 1, status: 'pending' }]);
    });

    it('listPending returns an empty array when the backend has no active bookings', async () => {
        mockGet.mockResolvedValue({ data: { success: true, data: [] } });
        await expect(listPending()).resolves.toEqual([]);
    });

    it('acceptPending POSTs to the accept endpoint', async () => {
        mockPost.mockResolvedValue({ data: { success: true, appointment_id: 456 } });
        const result = await acceptPending(7);
        expect(mockPost).toHaveBeenCalledWith('/whatsapp/pending-bookings/7/accept');
        expect(result).toEqual({ success: true, appointment_id: 456 });
    });

    it('suggestAlternative POSTs the slot iso and note', async () => {
        mockPost.mockResolvedValue({ data: { success: true, message: 'Alternative sent to patient' } });
        const result = await suggestAlternative(7, '2026-08-05T10:00:00', 'Prefiere turnos mañana');
        expect(mockPost).toHaveBeenCalledWith('/whatsapp/pending-bookings/7/suggest-alternative', {
            alternative_slot_iso: '2026-08-05T10:00:00',
            note: 'Prefiere turnos mañana'
        });
        expect(result).toEqual({ success: true, message: 'Alternative sent to patient' });
    });

    it('rejectPending POSTs the reason', async () => {
        mockPost.mockResolvedValue({ data: { success: true } });
        const result = await rejectPending(7, 'Paciente no responde');
        expect(mockPost).toHaveBeenCalledWith('/whatsapp/pending-bookings/7/reject', { reason: 'Paciente no responde' });
        expect(result).toEqual({ success: true });
    });

    it('rejectPending defaults the reason to an empty string', async () => {
        mockPost.mockResolvedValue({ data: { success: true } });
        await rejectPending(7);
        expect(mockPost).toHaveBeenCalledWith('/whatsapp/pending-bookings/7/reject', { reason: '' });
    });
});
