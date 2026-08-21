import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

const mockUseLayoutController = vi.hoisted(() => vi.fn());
vi.mock('@/features/layout/hooks/useLayoutController', () => ({
    useLayoutController: mockUseLayoutController
}));

const renderNavbar = () => render(
    <MemoryRouter>
        <Navbar />
    </MemoryRouter>
);

describe('Navbar - Role Boundaries', () => {
    beforeEach(() => {
        mockUseLayoutController.mockReset();
    });

    it('renders admin-specific navigation and hides clinical sections', () => {
        mockUseLayoutController.mockReturnValue({
            user: { username: 'admin', role: 'admin' },
            logout: vi.fn(),
            t: (key) => key,
            settings: {},
            location: { pathname: '/admin/users' },
            doctors: [],
            language: 'es',
            toggleLanguage: vi.fn(),
            isStaff: true,
            isAdmin: true,
            isSecretary: false,
            isPatient: false,
            isDoctor: false,
            canManageUsers: true
        });

        renderNavbar();

        // Admin links visible
        expect(screen.getByRole('link', { name: 'users' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'audit_logs' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'system_config' })).toBeInTheDocument();

        // Clinical links hidden
        expect(screen.queryByRole('link', { name: 'dashboard' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'institutions' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'holidays' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'appointments' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'finances' })).toBeNull();
    });

    it('renders clinical navigation for secretary', () => {
        mockUseLayoutController.mockReturnValue({
            user: { username: 'sec', role: 'secretary' },
            logout: vi.fn(),
            t: (key) => key,
            settings: {},
            location: { pathname: '/dashboard' },
            doctors: [],
            language: 'es',
            toggleLanguage: vi.fn(),
            isStaff: true,
            isAdmin: false,
            isSecretary: true,
            isPatient: false,
            isDoctor: false,
            canManageUsers: false
        });

        renderNavbar();

        // Secretary links visible
        expect(screen.getByRole('link', { name: 'dashboard' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'appointments' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'patients' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'institutions' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'holidays' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'finances' })).toBeInTheDocument();

        // Admin-only links hidden
        expect(screen.queryByRole('link', { name: 'audit_logs' })).toBeNull();
    });
});
