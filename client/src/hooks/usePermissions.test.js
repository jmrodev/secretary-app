import { describe, it, expect } from 'vitest';
import { resolveCanManageUsers } from './usePermissions';

describe('resolveCanManageUsers', () => {
    it('returns true when the JWT flag canManageUsers is set', () => {
        expect(resolveCanManageUsers({ role: 'secretary', canManageUsers: true })).toBe(true);
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