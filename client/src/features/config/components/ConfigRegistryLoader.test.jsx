import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadDefaultConfigSections } from './ConfigRegistryLoader';

const registerMock = vi.hoisted(() => vi.fn());
vi.mock('../registry/configRegistry', () => ({
    registerConfigSection: registerMock
}));

describe('loadDefaultConfigSections', () => {
    beforeEach(() => {
        registerMock.mockClear();
    });

    it('no longer registers users, doctors, institutions, profile, general, billing, communications, or logs sections', () => {
        loadDefaultConfigSections((key) => key);

        const registeredKeys = registerMock.mock.calls.map(([key]) => key);
        expect(registeredKeys).not.toContain('users');
        expect(registeredKeys).not.toContain('doctors');
        expect(registeredKeys).not.toContain('institutions');
        expect(registeredKeys).not.toContain('profile');
        expect(registeredKeys).not.toContain('general');
        expect(registeredKeys).not.toContain('billing');
        expect(registeredKeys).not.toContain('communications');
        expect(registeredKeys).not.toContain('logs');
    });

    it('still registers the core system config sections (modules and integrations)', () => {
        loadDefaultConfigSections((key) => key);

        const registeredKeys = registerMock.mock.calls.map(([key]) => key);
        expect(registeredKeys).toEqual(['modules', 'integrations']);
    });
});