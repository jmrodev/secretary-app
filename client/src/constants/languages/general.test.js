import { describe, it, expect } from 'vitest';
import { general as en } from './en/general';
import { general as es } from './es/general';

describe('general i18n parity', () => {
    it('every English key exists in Spanish and vice versa', () => {
        const enKeys = Object.keys(en).sort();
        const esKeys = Object.keys(es).sort();

        expect(enKeys).toEqual(esKeys);
    });

    it('every value in both locales is a non-empty string', () => {
        for (const [key, value] of Object.entries(en)) {
            expect(typeof value, `en.general.${key}`).toBe('string');
            expect(value.length, `en.general.${key}`).toBeGreaterThan(0);
        }
        for (const [key, value] of Object.entries(es)) {
            expect(typeof value, `es.general.${key}`).toBe('string');
            expect(value.length, `es.general.${key}`).toBeGreaterThan(0);
        }
    });
});