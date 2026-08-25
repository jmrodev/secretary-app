import { describe, it, expect, vi } from 'vitest';
import { resolveCanManageUsers, usePermissions } from './usePermissions';
import * as authModule from '@/features/auth/AuthContext';

vi.mock('@/features/auth/AuthContext', () => ({
    useAuth: vi.fn()
}));

describe('resolveCanManageUsers', () => {
    it('returns true when the JWT flag canManageUsers is set', () => {
        expect(resolveCanManageUsers({ role: 'secretary', canManageUsers: true })).toBe(true);
    });

    it('returns true when the permissions dictionary contains can_manage_users', () => {
        expect(resolveCanManageUsers({ role: 'secretary', permissions: { can_manage_users: true } })).toBe(true);
    });

    it('returns true when the snake_case DB field is present', () => {
        expect(resolveCanManageUsers({ role: 'secretary', can_manage_users: 1 })).toBe(true);
    });

    it('returns false when the flag is false', () => {
        expect(resolveCanManageUsers({ role: 'secretary', canManageUsers: false })).toBe(false);
    });

    it('returns false when no user or no flag is present', () => {
        expect(resolveCanManageUsers(null)).toBe(false);
        expect(resolveCanManageUsers({ role: 'secretary' })).toBe(false);
    });
});

describe('usePermissions hook', () => {
    it('returns true for all permissions when user is admin', () => {
        vi.spyOn(authModule, 'useAuth').mockReturnValue({
            user: { id: 1, role: 'admin' },
            logout: vi.fn()
        });

        const perms = usePermissions();
        expect(perms.isAdmin).toBe(true);
        expect(perms.canManageUsers).toBe(true);
        expect(perms.canCrudAppointments).toBe(true);
        expect(perms.canEditPastAppointments).toBe(true);
        expect(perms.canCrudRequests).toBe(true);
        expect(perms.canCrudPrescriptions).toBe(true);
        expect(perms.canCrudLicenses).toBe(true);
        expect(perms.canCrudFiles).toBe(true);
        expect(perms.canCrudFinances).toBe(true);
        expect(perms.loading).toBe(false);
    });

    it('evaluates granular permissions correctly for secretary', () => {
        vi.spyOn(authModule, 'useAuth').mockReturnValue({
            user: {
                id: 2,
                role: 'secretary',
                permissions: {
                    can_manage_users: false,
                    can_crud_appointments: true,
                    can_edit_past_appointments: false,
                    can_crud_requests: true,
                    can_crud_prescriptions: false,
                    can_crud_licenses: true,
                    can_crud_files: false,
                    can_crud_finances: true
                }
            },
            logout: vi.fn()
        });

        const perms = usePermissions();
        expect(perms.isAdmin).toBe(false);
        expect(perms.isSecretary).toBe(true);
        expect(perms.canManageUsers).toBe(false);
        expect(perms.canCrudAppointments).toBe(true);
        expect(perms.canEditPastAppointments).toBe(false);
        expect(perms.canCrudRequests).toBe(true);
        expect(perms.canCrudPrescriptions).toBe(false);
        expect(perms.canCrudLicenses).toBe(true);
        expect(perms.canCrudFiles).toBe(false);
        expect(perms.canCrudFinances).toBe(true);
    });

    it('returns false for granular permissions when user is doctor or patient', () => {
        vi.spyOn(authModule, 'useAuth').mockReturnValue({
            user: { id: 3, role: 'doctor' },
            logout: vi.fn()
        });

        const perms = usePermissions();
        expect(perms.isAdmin).toBe(false);
        expect(perms.isDoctor).toBe(true);
        expect(perms.canCrudAppointments).toBe(false);
        expect(perms.canCrudFinances).toBe(false);
    });
});