import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';

const usePermissionsMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: usePermissionsMock
}));

const ProtectedContent = () => <div>PROTECTED_CONTENT</div>;
const FallbackContent = () => <div>FALLBACK_CONTENT</div>;

const renderGuarded = (props, initialPath = '/config?tab=users') => {
    // React Router matches on the pathname only, so split off any query
    // string before registering the route pattern.
    const [pathname] = initialPath.split('?');
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path={pathname} element={
                    <RoleGuard {...props}>
                        <ProtectedContent />
                    </RoleGuard>
                } />
                <Route path="/dashboard" element={<FallbackContent />} />
                <Route path="/" element={<div>LOGIN</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('RoleGuard - permission prop', () => {
    beforeEach(() => {
        usePermissionsMock.mockReset();
    });

    it('renders children when the permission is granted', () => {
        usePermissionsMock.mockReturnValue({
            user: { role: 'secretary' },
            canManageUsers: true,
            loading: false
        });

        renderGuarded({ allowedRoles: ['secretary'], permission: 'canManageUsers' });

        expect(screen.getByText('PROTECTED_CONTENT')).toBeTruthy();
    });

    it('redirects when the permission is not granted', () => {
        usePermissionsMock.mockReturnValue({
            user: { role: 'secretary' },
            canManageUsers: false,
            loading: false
        });

        renderGuarded({ allowedRoles: ['secretary'], permission: 'canManageUsers' });

        expect(screen.getByText('FALLBACK_CONTENT')).toBeTruthy();
        expect(screen.queryByText('PROTECTED_CONTENT')).toBeNull();
    });

    it('admins always pass the canManageUsers permission', () => {
        usePermissionsMock.mockReturnValue({
            user: { role: 'admin' },
            canManageUsers: true,
            loading: false
        });

        renderGuarded({ allowedRoles: ['admin', 'secretary'], permission: 'canManageUsers' });

        expect(screen.getByText('PROTECTED_CONTENT')).toBeTruthy();
    });

    it('keeps working without a permission prop (role-only access)', () => {
        usePermissionsMock.mockReturnValue({
            user: { role: 'admin' },
            canManageUsers: true,
            loading: false
        });

        renderGuarded({ allowedRoles: ['admin'] });

        expect(screen.getByText('PROTECTED_CONTENT')).toBeTruthy();
    });

    it('redirects unauthorized admin users to /config?tab=users by default', () => {
        usePermissionsMock.mockReturnValue({
            user: { role: 'admin' },
            canManageUsers: true,
            loading: false
        });

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <Routes>
                    <Route path="/dashboard" element={
                        <RoleGuard allowedRoles={['secretary']}>
                            <ProtectedContent />
                        </RoleGuard>
                    } />
                    <Route path="/config" element={<div>ADMIN_USERS_FALLBACK</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('ADMIN_USERS_FALLBACK')).toBeTruthy();
        expect(screen.queryByText('PROTECTED_CONTENT')).toBeNull();
    });
});