import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
            location: { pathname: '/config' },
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

        // System category visible
        const systemCategory = screen.getByRole('button', { name: /category_system/i });
        expect(systemCategory).toBeInTheDocument();
        fireEvent.click(systemCategory);

        // Admin links visible
        expect(screen.getByRole('link', { name: /audit_logs/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /system_config/i })).toBeInTheDocument();

        // Clinical and Admin categories are completely hidden for admin
        expect(screen.queryByRole('button', { name: /category_clinical/i })).toBeNull();
        expect(screen.queryByRole('button', { name: /category_admin/i })).toBeNull();
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

        // Open Clinical Category
        const clinicalCategory = screen.getByRole('button', { name: /category_clinical/i });
        expect(clinicalCategory).toBeInTheDocument();
        fireEvent.click(clinicalCategory);

        // Secretary links visible
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /appointments/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /patients/i })).toBeInTheDocument();

        // Open Admin Category
        const adminCategory = screen.getByRole('button', { name: /category_admin/i });
        expect(adminCategory).toBeInTheDocument();
        fireEvent.click(adminCategory);

        expect(screen.getByRole('link', { name: /institutions/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /holidays/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /finances/i })).toBeInTheDocument();

        // Open System Category
        const systemCategory = screen.getByRole('button', { name: /category_system/i });
        fireEvent.click(systemCategory);

        // Admin-only links hidden for secretary
        expect(screen.queryByRole('link', { name: /audit_logs/i })).toBeNull();
    });
});
