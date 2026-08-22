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

    it('no longer registers users, doctors, institutions, profile, general, or logs sections', () => {
        loadDefaultConfigSections((key) => key);

        const registeredKeys = registerMock.mock.calls.map(([key]) => key);
        expect(registeredKeys).not.toContain('users');
        expect(registeredKeys).not.toContain('doctors');
        expect(registeredKeys).not.toContain('institutions');
        expect(registeredKeys).not.toContain('profile');
        expect(registeredKeys).not.toContain('general');
        expect(registeredKeys).not.toContain('logs');
    });

    it('registers valid sections with role scoping (modules, communications, integrations, billing)', () => {
        loadDefaultConfigSections((key) => key);

        const registeredKeys = registerMock.mock.calls.map(([key]) => key);
        expect(registeredKeys).toEqual(['modules', 'communications', 'integrations', 'billing']);
    });

    it('assigns allowedRoles [admin] to modules and integrations, [secretary] to communications, and [admin, secretary] to billing', () => {
        loadDefaultConfigSections((key) => key);

        const sectionMap = Object.fromEntries(
            registerMock.mock.calls.map(([key, metadata]) => [key, metadata])
        );

        expect(sectionMap.modules.allowedRoles).toEqual(['admin']);
        expect(sectionMap.communications.allowedRoles).toEqual(['secretary']);
        expect(sectionMap.integrations.allowedRoles).toEqual(['admin']);
        expect(sectionMap.billing.allowedRoles).toEqual(['admin', 'secretary']);
    });
});