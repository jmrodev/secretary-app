import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminUsersPage } from './AdminUsersPage';
import { resolveTab } from './utils/tabs';

vi.mock('@/components/templates/MainLayout', () => ({
    MainLayout: ({ children }) => <div>{children}</div>
}));
vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key) => key })
}));
vi.mock('@/features/users/components/UserManagement', () => ({
    UserManagement: () => <div>USER_MANAGEMENT</div>
}));
vi.mock('@/features/doctors', () => ({
    DoctorsManager: () => <div>DOCTORS_MANAGER</div>,
    useDoctorsPageController: () => ({})
}));
vi.mock('@/features/appointments', () => ({
    ScheduleBulkActions: () => null,
    ScheduleTimeBlock: () => null
}));
vi.mock('@/features/config/components/forms/MessageTemplateEditor', () => ({
    MessageTemplateEditor: () => null
}));

const renderPage = (initialPath) => (
    render(
        <MemoryRouter initialEntries={[initialPath]}>
            <AdminUsersPage />
        </MemoryRouter>
    )
);

describe('AdminUsersPage - tabs', () => {
    it('renders the secretaries tab by default with UserManagement full-width', () => {
        renderPage('/admin/users');

        expect(screen.getByText('USER_MANAGEMENT')).toBeTruthy();
        expect(screen.queryByText('DOCTORS_MANAGER')).toBeNull();
    });

    it('renders the doctors tab when ?subtab=doctor is present', () => {
        renderPage('/admin/users?subtab=doctor');

        expect(screen.getByText('DOCTORS_MANAGER')).toBeTruthy();
        expect(screen.queryByText('USER_MANAGEMENT')).toBeNull();
    });
});

describe('resolveTab', () => {
    it('defaults to the secretaries tab when no param is present', () => {
        expect(resolveTab(undefined)).toBe('secretaries');
        expect(resolveTab('')).toBe('secretaries');
    });

    it('returns a valid tab key when present', () => {
        expect(resolveTab('doctor')).toBe('doctor');
        expect(resolveTab('secretaries')).toBe('secretaries');
    });

    it('falls back to the default for unknown values', () => {
        expect(resolveTab('patients')).toBe('secretaries');
        expect(resolveTab('bogus')).toBe('secretaries');
    });
});