import { describe, it, expect } from 'vitest';
import { composeFullName } from './composeFullName';

describe('composeFullName', () => {
    it('composes full name from first and last name (happy path)', () => {
        expect(composeFullName({ first_name: 'Maria', last_name: 'Cecilia' })).toBe('Maria Cecilia');
    });

    it('falls back to full_name when first_name is empty', () => {
        expect(composeFullName({ first_name: '', last_name: 'Cecilia', full_name: 'Legacy Name' })).toBe('Legacy Name');
    });

    it('falls back to full_name when last_name is empty', () => {
        expect(composeFullName({ first_name: 'Maria', last_name: '', full_name: 'Legacy Name' })).toBe('Legacy Name');
    });

    it('falls back to full_name when both parts are empty', () => {
        expect(composeFullName({ first_name: '', last_name: '', full_name: 'Legacy Name' })).toBe('Legacy Name');
    });

    it('returns full_name when only full_name is provided', () => {
        expect(composeFullName({ full_name: 'Only Legacy' })).toBe('Only Legacy');
    });

    it('returns undefined when nothing is provided', () => {
        expect(composeFullName({})).toBeUndefined();
    });
});
