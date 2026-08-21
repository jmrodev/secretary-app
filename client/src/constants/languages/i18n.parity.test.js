import { describe, it, expect } from 'vitest';
import { es } from './es.js';
import { en } from './en.js';

describe('Global i18n Dictionary Parity', () => {
    it('verifies that all Spanish keys exist in English and vice-versa', () => {
        const esKeys = Object.keys(es).sort();
        const enKeys = Object.keys(en).sort();

        const missingInEn = esKeys.filter(key => !(key in en));
        const missingInEs = enKeys.filter(key => !(key in es));

        expect(missingInEn).toEqual([]);
        expect(missingInEs).toEqual([]);
        expect(esKeys.length).toBe(enKeys.length);
    });

    it('verifies that all translation values are defined and non-empty', () => {
        for (const [key, value] of Object.entries(es)) {
            expect(value, `es[${key}] must be defined`).toBeDefined();
            if (typeof value === 'string') {
                expect(value.trim().length, `es[${key}] must not be empty`).toBeGreaterThan(0);
            } else if (Array.isArray(value)) {
                expect(value.length, `es[${key}] array must not be empty`).toBeGreaterThan(0);
            }
        }

        for (const [key, value] of Object.entries(en)) {
            expect(value, `en[${key}] must be defined`).toBeDefined();
            if (typeof value === 'string') {
                expect(value.trim().length, `en[${key}] must not be empty`).toBeGreaterThan(0);
            } else if (Array.isArray(value)) {
                expect(value.length, `en[${key}] array must not be empty`).toBeGreaterThan(0);
            }
        }
    });
});
