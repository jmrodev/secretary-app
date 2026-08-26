import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsContent, ConfigTabFallback } from './SystemConfigPage';

const getConfigSectionMock = vi.hoisted(() => vi.fn());
const getConfigSectionsMock = vi.hoisted(() => vi.fn());

vi.mock('./registry/configRegistry', () => ({
    getConfigSection: (id) => getConfigSectionMock(id),
    getConfigSections: () => getConfigSectionsMock()
}));

const controller = {
    t: (k, p) => (p ? `${k}:${JSON.stringify(p)}` : k)
};

describe('ConfigTabFallback / SettingsContent (review-config-doctors)', () => {
    it('renders the fallback when the requested tab is not registered', () => {
        getConfigSectionMock.mockReturnValue(undefined);
        getConfigSectionsMock.mockReturnValue([{ id: 'modules', metadata: { title: 'Modulos' } }]);

        render(<SettingsContent activeTab="does-not-exist" controller={controller} />);

        expect(screen.getByText(/config_tab_not_found/)).toBeTruthy();
        expect(screen.getByText(/config_tab_redirect/)).toBeTruthy();
    });

    it('renders the section component when registered', () => {
        const Section = () => <div>SECTION_OK</div>;
        getConfigSectionMock.mockReturnValue({
            metadata: { icon: 'star', title: 'X', desc: 'd' },
            Component: Section
        });

        render(<SettingsContent activeTab="x" controller={controller} />);

        expect(screen.getByText('SECTION_OK')).toBeTruthy();
    });

    it('displays the unknown tab name in the fallback message', () => {
        getConfigSectionMock.mockReturnValue(undefined);
        getConfigSectionsMock.mockReturnValue([{ id: 'modules', metadata: { title: 'Modulos' } }]);

        render(<ConfigTabFallback activeTab="weird" controller={controller} />);

        expect(screen.getByText(/config_tab_not_found.*weird|weird.*config_tab_not_found/)).toBeTruthy();
    });
});
