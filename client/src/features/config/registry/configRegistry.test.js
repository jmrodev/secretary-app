import { describe, it, expect } from 'vitest';
import { registerConfigSection, getConfigSections } from './configRegistry';

describe('configRegistry idempotency (review-config-doctors)', () => {
    it('registering the same id twice does not create a duplicate entry', () => {
        const Component = () => null;
        registerConfigSection('test-tab', { title: 'Test', icon: 'star' }, Component);
        const before = getConfigSections().length;

        registerConfigSection('test-tab', { title: 'Test', icon: 'star' }, Component);
        const after = getConfigSections().length;

        expect(after).toBe(before);
        expect(getConfigSections().filter((s) => s.id === 'test-tab').length).toBe(1);
    });

    it('registering distinct ids keeps both', () => {
        registerConfigSection('tab-a', { title: 'A' }, () => null);
        registerConfigSection('tab-b', { title: 'B' }, () => null);
        const ids = getConfigSections().map((s) => s.id);
        expect(ids).toContain('tab-a');
        expect(ids).toContain('tab-b');
    });
});
