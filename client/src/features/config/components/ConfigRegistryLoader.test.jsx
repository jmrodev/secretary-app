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

    it('no longer registers users, doctors, institutions, profile, or general sections', () => {
        loadDefaultConfigSections((key) => key);

        const registeredKeys = registerMock.mock.calls.map(([key]) => key);
        expect(registeredKeys).not.toContain('users');
        expect(registeredKeys).not.toContain('doctors');
        expect(registeredKeys).not.toContain('institutions');
        expect(registeredKeys).not.toContain('profile');
        expect(registeredKeys).not.toContain('general');
    });

    it('still registers the core system config sections', () => {
        loadDefaultConfigSections((key) => key);

        const registeredKeys = registerMock.mock.calls.map(([key]) => key);
        for (const key of ['modules', 'communications', 'integrations', 'billing', 'logs']) {
            expect(registeredKeys).toContain(key);
        }
    });
});