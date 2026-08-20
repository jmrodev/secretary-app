import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockShowMessage = vi.hoisted(() => vi.fn());
const mockT = vi.hoisted(() => vi.fn((k) => k));

vi.mock('@/api/axios', () => ({
    api: { get: mockGet, post: mockPost }
}));
vi.mock('@/context/MessageContext', () => ({
    useMessage: () => ({ showMessage: mockShowMessage })
}));
vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({ t: mockT })
}));

import { useSecretaryPermissions } from './useSecretaryPermissions';

describe('useSecretaryPermissions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockResolvedValue({
            data: {
                success: true,
                data: [
                    { id: 2, username: 'sec1', full_name: 'Secretary One', can_manage_users: 0 },
                    { id: 3, username: 'sec2', full_name: 'Secretary Two', can_manage_users: 1 }
                ]
            }
        });
        mockPost.mockResolvedValue({ data: { success: true } });
    });

    it('loads the secretary permission list on mount', async () => {
        const { result } = renderHook(() => useSecretaryPermissions());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith('/users/admin/users/permissions');
        expect(result.current.secretaries).toHaveLength(2);
        expect(result.current.secretaries[1].can_manage_users).toBe(1);
    });

    it('toggles the selected ids', async () => {
        const { result } = renderHook(() => useSecretaryPermissions());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.toggleSelect(2));
        expect(result.current.selectedIds).toEqual([2]);

        act(() => result.current.toggleSelect(3));
        expect(result.current.selectedIds).toEqual([2, 3]);

        act(() => result.current.toggleSelect(2));
        expect(result.current.selectedIds).toEqual([3]);
    });

    it('grants the selected secretaries', async () => {
        const { result } = renderHook(() => useSecretaryPermissions());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.toggleSelect(2));

        await act(async () => { await result.current.applyGrant(); });

        expect(mockPost).toHaveBeenCalledWith('/users/admin/users/permissions', {
            secretaryIds: [2],
            grantToAll: false,
            revoke: false
        });
        expect(mockShowMessage).toHaveBeenCalledWith('permission_updated', 'success');
        expect(mockGet).toHaveBeenCalledTimes(2); // initial + refresh
        expect(result.current.selectedIds).toEqual([]);
    });

    it('revokes when applyRevoke is used', async () => {
        const { result } = renderHook(() => useSecretaryPermissions());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.toggleSelect(2));

        await act(async () => { await result.current.applyRevoke(); });

        expect(mockPost).toHaveBeenCalledWith('/users/admin/users/permissions', {
            secretaryIds: [2],
            grantToAll: false,
            revoke: true
        });
    });

    it('does not call the API when nothing is selected and grantToAll is off', async () => {
        const { result } = renderHook(() => useSecretaryPermissions());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => { await result.current.applyGrant(); });

        expect(mockPost).not.toHaveBeenCalled();
    });
});