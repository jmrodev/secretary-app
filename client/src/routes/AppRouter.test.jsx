import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { AppRouter } from './AppRouter';

const usePermissionsMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: usePermissionsMock
}));
vi.mock('@/components/templates/ProtectedRoute', () => ({
    ProtectedRoute: () => <Outlet />
}));
vi.mock('@/features/config', () => ({
    SystemConfigPage: () => <div>SYSTEM_CONFIG_PAGE</div>
}));

const renderRouter = (initialPath) => (
    render(
        <MemoryRouter initialEntries={[initialPath]}>
            <AppRouter />
        </MemoryRouter>
    )
);

describe('AppRouter - user management tabs', () => {
    beforeEach(() => {
        usePermissionsMock.mockReset();
    });

    it('redirects /doctors to the doctor tab of the users page', async () => {
        usePermissionsMock.mockReturnValue({ user: { role: 'admin' }, canManageUsers: true, loading: false });

        renderRouter('/doctors');

        expect(await screen.findByText('SYSTEM_CONFIG_PAGE')).toBeTruthy();
    });

    it('lets an admin reach /config?tab=users via /admin/users redirect', async () => {
        usePermissionsMock.mockReturnValue({ user: { role: 'admin' }, canManageUsers: true, loading: false });

        renderRouter('/admin/users');

        expect(await screen.findByText('SYSTEM_CONFIG_PAGE')).toBeTruthy();
    });

    it('lets a granted secretary reach /config?tab=users via /admin/users redirect', async () => {
        usePermissionsMock.mockReturnValue({ user: { role: 'secretary' }, canManageUsers: true, loading: false });

        renderRouter('/admin/users');

        expect(await screen.findByText('SYSTEM_CONFIG_PAGE')).toBeTruthy();
    });

    it('redirects a non-granted secretary away from /admin/users', async () => {
        usePermissionsMock.mockReturnValue({ user: { role: 'secretary' }, canManageUsers: false, loading: false });

        renderRouter('/admin/users');

        expect(screen.queryByText('SYSTEM_CONFIG_PAGE')).toBeNull();
    });
});