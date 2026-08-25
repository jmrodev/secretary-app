import { describe, it, expect } from 'vitest';
import { admin_users as en } from './en/admin_users';
import { admin_users as es } from './es/admin_users';

describe('admin_users i18n parity', () => {
    it('every English key exists in Spanish and vice versa', () => {
        const enKeys = Object.keys(en).sort();
        const esKeys = Object.keys(es).sort();

        expect(enKeys).toEqual(esKeys);
    });

    it('tab and grant keys are non-empty in both languages', () => {
        for (const key of [
            'tab_secretaries',
            'tab_doctors',
            'grant_permissions_title',
            'grant_all',
            'grant_selected',
            'revoke_selected',
            'permission_updated'
        ]) {
            expect(en[key]).toBeTruthy();
            expect(es[key]).toBeTruthy();
        }
    });
});