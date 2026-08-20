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
vi.mock('@/features/users', () => ({
    AdminUsersPage: () => <div>ADMIN_USERS_PAGE</div>
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

        expect(await screen.findByText('ADMIN_USERS_PAGE')).toBeTruthy();
    });

    it('lets an admin reach /admin/users', async () => {
        usePermissionsMock.mockReturnValue({ user: { role: 'admin' }, canManageUsers: true, loading: false });

        renderRouter('/admin/users');

        expect(await screen.findByText('ADMIN_USERS_PAGE')).toBeTruthy();
    });

    it('lets a granted secretary reach /admin/users', async () => {
        usePermissionsMock.mockReturnValue({ user: { role: 'secretary' }, canManageUsers: true, loading: false });

        renderRouter('/admin/users');

        expect(await screen.findByText('ADMIN_USERS_PAGE')).toBeTruthy();
    });

    it('redirects a non-granted secretary away from /admin/users', async () => {
        usePermissionsMock.mockReturnValue({ user: { role: 'secretary' }, canManageUsers: false, loading: false });

        renderRouter('/admin/users');

        expect(screen.queryByText('ADMIN_USERS_PAGE')).toBeNull();
    });
});