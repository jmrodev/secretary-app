import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

const { mockListPending, mockAcceptPending, mockSuggestAlternative, mockRejectPending } = vi.hoisted(() => ({
    mockListPending: vi.fn(),
    mockAcceptPending: vi.fn(),
    mockSuggestAlternative: vi.fn(),
    mockRejectPending: vi.fn()
}));

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('@/api/pendingBookingApi', () => ({
    listPending: mockListPending,
    acceptPending: mockAcceptPending,
    suggestAlternative: mockSuggestAlternative,
    rejectPending: mockRejectPending
}));

vi.mock('@/features/auth', () => ({
    useAuth: mockUseAuth
}));

import { PendingApprovalProvider, usePendingApproval } from './PendingApprovalContext';

const secretaryUser = { user: { role: 'secretary', user_id: 1 } };

const pendingItem = (overrides = {}) => ({
    id: 1,
    patient_name: 'Juan Pérez',
    doctor_name: 'Dr. House',
    requested_slot_date: '2026-08-03',
    requested_slot_time: '09:00',
    status: 'pending',
    ...overrides
});

const Probe = () => {
    const { pendingItems, accept, suggestAlternative, reject, refresh } = usePendingApproval();
    return (
        <div>
            <span data-testid="count">{pendingItems.length}</span>
            <button type="button" onClick={() => accept(7)}>accept</button>
            <button type="button" onClick={() => suggestAlternative(7, '2026-08-05T10:00:00', 'Prefiere mañana')}>suggest</button>
            <button type="button" onClick={() => reject(7, 'Paciente no responde')}>reject</button>
            <button type="button" onClick={refresh}>refresh</button>
        </div>
    );
};

beforeEach(() => {
    vi.useFakeTimers();
    mockUseAuth.mockReturnValue(secretaryUser);
    mockListPending.mockReset();
    mockAcceptPending.mockReset();
    mockSuggestAlternative.mockReset();
    mockRejectPending.mockReset();
});

afterEach(() => {
    vi.useRealTimers();
    cleanup();
});

describe('PendingApprovalContext', () => {
    it('fetches active pending bookings on mount and exposes them', async () => {
        mockListPending.mockResolvedValue([pendingItem()]);
        render(<PendingApprovalProvider><Probe /></PendingApprovalProvider>);
        expect(mockListPending).toHaveBeenCalledTimes(1);

        await act(async () => {});
        expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    it('polls every 10 seconds and renders the fresh data from each poll', async () => {
        mockListPending.mockResolvedValueOnce([pendingItem()]);
        render(<PendingApprovalProvider><Probe /></PendingApprovalProvider>);
        await act(async () => {});
        expect(screen.getByTestId('count')).toHaveTextContent('1');

        mockListPending.mockResolvedValueOnce([pendingItem(), pendingItem({ id: 2, patient_name: 'María López' })]);
        await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
        expect(mockListPending).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('count')).toHaveTextContent('2');
    });

    it('stops polling when the provider unmounts', async () => {
        mockListPending.mockResolvedValue([]);
        const { unmount } = render(<PendingApprovalProvider><Probe /></PendingApprovalProvider>);
        await act(async () => {});
        expect(mockListPending).toHaveBeenCalledTimes(1);

        await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
        expect(mockListPending).toHaveBeenCalledTimes(4);

        unmount();
        await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
        expect(mockListPending).toHaveBeenCalledTimes(4);
    });

    it('does not poll for patient users', async () => {
        mockUseAuth.mockReturnValue({ user: { role: 'patient' } });
        mockListPending.mockResolvedValue([]);
        render(<PendingApprovalProvider><Probe /></PendingApprovalProvider>);
        await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
        expect(mockListPending).not.toHaveBeenCalled();
    });

    it('accept calls the api and refreshes the list', async () => {
        mockListPending.mockResolvedValue([pendingItem()]);
        mockAcceptPending.mockResolvedValue({ success: true, appointment_id: 456 });
        render(<PendingApprovalProvider><Probe /></PendingApprovalProvider>);
        await act(async () => {});
        expect(mockListPending).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'accept' }));
        await act(async () => {});
        expect(mockAcceptPending).toHaveBeenCalledWith(7);
        expect(mockListPending).toHaveBeenCalledTimes(2);
    });

    it('suggestAlternative calls the api with slot and note, then refreshes', async () => {
        mockListPending.mockResolvedValue([pendingItem()]);
        mockSuggestAlternative.mockResolvedValue({ success: true, message: 'Alternative sent to patient' });
        render(<PendingApprovalProvider><Probe /></PendingApprovalProvider>);
        await act(async () => {});
        expect(mockListPending).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'suggest' }));
        await act(async () => {});
        expect(mockSuggestAlternative).toHaveBeenCalledWith(7, '2026-08-05T10:00:00', 'Prefiere mañana');
        expect(mockListPending).toHaveBeenCalledTimes(2);
    });

    it('reject calls the api with id and reason, then refreshes', async () => {
        mockListPending.mockResolvedValue([pendingItem()]);
        mockRejectPending.mockResolvedValue({ success: true });
        render(<PendingApprovalProvider><Probe /></PendingApprovalProvider>);
        await act(async () => {});
        expect(mockListPending).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'reject' }));
        await act(async () => {});
        expect(mockRejectPending).toHaveBeenCalledWith(7, 'Paciente no responde');
        expect(mockListPending).toHaveBeenCalledTimes(2);
    });

    it('refresh forces an immediate re-poll', async () => {
        mockListPending.mockResolvedValue([]);
        render(<PendingApprovalProvider><Probe /></PendingApprovalProvider>);
        await act(async () => {});
        expect(mockListPending).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'refresh' }));
        await act(async () => {});
        expect(mockListPending).toHaveBeenCalledTimes(2);
    });

    it('propagates action errors to the caller and still refreshes', async () => {
        mockListPending.mockResolvedValue([]);
        mockAcceptPending.mockRejectedValue(new Error('conflict'));
        const { result } = renderHook(() => usePendingApproval(), {
            wrapper: ({ children }) => <PendingApprovalProvider>{children}</PendingApprovalProvider>
        });
        await act(async () => {});
        expect(mockListPending).toHaveBeenCalledTimes(1);

        await act(async () => {
            await expect(result.current.accept(7)).rejects.toThrow('conflict');
        });
        expect(mockListPending).toHaveBeenCalledTimes(2);
    });
});
