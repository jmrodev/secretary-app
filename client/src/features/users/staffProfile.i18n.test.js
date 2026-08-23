import { describe, it, expect } from 'vitest';
import { general as es } from '@/constants/languages/es/general';
import { general as en } from '@/constants/languages/en/general';

const KEYS = ['first_name', 'last_name', 'email', 'address'];

describe('staff-profile i18n keys (spec REQ-05)', () => {
    it.each(KEYS)('ES language file defines a non-empty key "%s"', (key) => {
        expect(typeof es[key]).toBe('string');
        expect(es[key].length).toBeGreaterThan(0);
    });

    it.each(KEYS)('EN language file defines a non-empty key "%s"', (key) => {
        expect(typeof en[key]).toBe('string');
        expect(en[key].length).toBeGreaterThan(0);
    });
});
