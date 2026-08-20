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

    it('no longer registers the users or doctors sections', () => {
        loadDefaultConfigSections((key) => key);

        const registeredKeys = registerMock.mock.calls.map(([key]) => key);
        expect(registeredKeys).not.toContain('users');
        expect(registeredKeys).not.toContain('doctors');
    });

    it('still registers the remaining sections', () => {
        loadDefaultConfigSections((key) => key);

        const registeredKeys = registerMock.mock.calls.map(([key]) => key);
        for (const key of ['general', 'profile', 'communications', 'integrations', 'institutions', 'billing', 'logs']) {
            expect(registeredKeys).toContain(key);
        }
    });
});