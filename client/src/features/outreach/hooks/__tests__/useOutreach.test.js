import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOutreach } from '../useOutreach';

// Mock axios API module
vi.mock('@/api/axios', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

import { api } from '@/api/axios';

describe('useOutreach', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useOutreach());

        expect(result.current.segmentType).toBe('');
        expect(result.current.patients).toEqual([]);
        expect(result.current.body).toBe('');
        expect(result.current.variants).toEqual([]);
        expect(result.current.sendProgress).toBeNull();
        expect(result.current.sendResult).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should fetch patients and update state on success', async () => {
        const mockPatients = [
            { id: 1, full_name: 'John Doe', phone: '5491111111111' },
            { id: 2, full_name: 'Jane Smith', phone: '5492222222222' }
        ];

        api.get.mockResolvedValueOnce({
            data: { patients: mockPatients, total: 2 }
        });

        const { result } = renderHook(() => useOutreach());

        await act(async () => {
            await result.current.fetchPatients('this_week');
        });

        expect(api.get).toHaveBeenCalledWith('/outreach/segments', {
            params: { type: 'this_week' }
        });
        expect(result.current.patients).toEqual(mockPatients);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should pass date params when fetching date_range segment', async () => {
        api.get.mockResolvedValueOnce({
            data: { patients: [], total: 0 }
        });

        const { result } = renderHook(() => useOutreach());

        await act(async () => {
            await result.current.fetchPatients('date_range', '2024-01-01', '2024-12-31');
        });

        expect(api.get).toHaveBeenCalledWith('/outreach/segments', {
            params: { type: 'date_range', start_date: '2024-01-01', end_date: '2024-12-31' }
        });
    });

    it('should set error when fetchPatients fails', async () => {
        api.get.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useOutreach());

        await act(async () => {
            await result.current.fetchPatients('this_week');
        });

        expect(result.current.error).toBe('Network error');
        expect(result.current.loading).toBe(false);
        expect(result.current.patients).toEqual([]);
    });

    it('should update body and clear variants when body changes', () => {
        const { result } = renderHook(() => useOutreach());

        act(() => {
            result.current.setBody('Your appointment is tomorrow');
        });

        expect(result.current.body).toBe('Your appointment is tomorrow');
        expect(result.current.variants).toEqual([]);
    });

    it('should clear variants when body is updated after generation', () => {
        const { result } = renderHook(() => useOutreach());

        // Set body
        act(() => {
            result.current.setBody('Your appointment is tomorrow');
        });

        // Generate variants
        act(() => {
            result.current.generateVariants();
        });

        expect(result.current.variants).toHaveLength(3);

        // Change body — variants should clear
        act(() => {
            result.current.setBody('New message body');
        });

        expect(result.current.variants).toEqual([]);
    });

    it('should set segment type', () => {
        const { result } = renderHook(() => useOutreach());

        act(() => {
            result.current.setSegmentType('this_week');
        });

        expect(result.current.segmentType).toBe('this_week');
    });

    it('should set date range', () => {
        const { result } = renderHook(() => useOutreach());

        act(() => {
            result.current.setDateRange('2024-01-01', '2024-12-31');
        });

        expect(result.current.dateRange).toEqual({
            startDate: '2024-01-01',
            endDate: '2024-12-31'
        });
    });

    it('should generate 3 variants from current body', () => {
        const { result } = renderHook(() => useOutreach());

        act(() => {
            result.current.setBody('Your appointment is tomorrow');
        });

        act(() => {
            result.current.generateVariants();
        });

        expect(result.current.variants).toHaveLength(3);
        result.current.variants.forEach(v => {
            expect(v).toHaveProperty('header');
            expect(v).toHaveProperty('body');
            expect(v).toHaveProperty('footer');
        });
    });

    it('should not generate variants when body is empty', () => {
        const { result } = renderHook(() => useOutreach());

        act(() => {
            result.current.generateVariants();
        });

        expect(result.current.variants).toEqual([]);
    });

    it('should send broadcast via API and return results', async () => {
        const mockResult = {
            total_sent: 2,
            total_failed: 0,
            results: [
                { patient_id: 1, status: 'sent' },
                { patient_id: 2, status: 'sent' }
            ]
        };

        api.post.mockResolvedValueOnce({
            data: mockResult
        });

        const { result } = renderHook(() => useOutreach());

        // Setup: fetch patients, set body, generate variants
        act(() => {
            result.current.setPatients([{ id: 1, full_name: 'John', phone: '5491111111111' }]);
            result.current.setBody('Test message');
        });

        act(() => {
            result.current.generateVariants();
        });

        expect(result.current.variants).toHaveLength(3);

        await act(async () => {
            await result.current.sendBroadcast();
        });

        expect(api.post).toHaveBeenCalledWith('/outreach/send', {
            patient_ids: [1],
            body: 'Test message',
            variants: result.current.variants
        });
        expect(result.current.sendProgress).toBe(100);
        expect(result.current.sendResult).toEqual(mockResult);
    });

    it('should track send progress incrementally', async () => {
        // Mock a delayed response to test progress tracking
        api.post.mockImplementationOnce(() =>
            new Promise((resolve) =>
                setTimeout(() => resolve({
                    data: {
                        total_sent: 1,
                        total_failed: 0,
                        results: [{ patient_id: 1, status: 'sent' }]
                    }
                }), 50)
            )
        );

        const { result } = renderHook(() => useOutreach());

        act(() => {
            result.current.setPatients([{ id: 1, full_name: 'John', phone: '5491111111111' }]);
            result.current.setBody('Test');
        });

        let sendPromise;
        act(() => {
            sendPromise = result.current.sendBroadcast();
        });

        // Progress should be 0 while sending
        expect(result.current.sendProgress).toBe(0);

        await act(async () => {
            await sendPromise;
        });

        expect(result.current.sendProgress).toBe(100);
    });

    it('should handle send errors', async () => {
        api.post.mockRejectedValueOnce(new Error('Send failed'));

        const { result } = renderHook(() => useOutreach());

        act(() => {
            result.current.setPatients([{ id: 1, full_name: 'John', phone: '5491111111111' }]);
            result.current.setBody('Test');
        });

        await act(async () => {
            await result.current.sendBroadcast();
        });

        expect(result.current.error).toBe('Send failed');
        expect(result.current.sendProgress).toBeNull();
    });
});
