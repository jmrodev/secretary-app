/* eslint-disable react-refresh/only-export-components -- registry module: lazy component wrappers and the loadDefaultConfigSections initializer are module-level exports */
import React, { lazy } from 'react';
import { registerConfigSection } from '../registry/configRegistry';

// Lazy loading for config sections
const ModulesSettings = lazy(() => import('../components/sections/ModulesSettings').then(m => ({ default: m.ModulesSettings })));
const IntegrationSettings = lazy(() => import('../components/sections/IntegrationSettings').then(m => ({ default: m.IntegrationSettings })));

// --- Specialized Wrappers to map the common Controller to specific component props ---

const ModulesSettingsWrapper = ({ controller }) => (
    <ModulesSettings 
        user={controller.user} 
        settings={controller.settings} 
        updateSetting={controller.handlers.updateSetting}
    />
);

const IntegrationSettingsWrapper = ({ controller }) => (
    <IntegrationSettings 
        {...controller} 
        {...controller.handlers} 
        onGoogleAuth={controller.handlers.handleGoogleAuth}
        onDisconnectGoogle={controller.handlers.handleDisconnectGoogle}
        onRetryGoogle={controller.handlers.handleRetryGoogleFailed}
        onRefreshTunnel={controller.handlers.handleRefreshTunnel}
        onTestMeta={controller.handlers.handleTestMeta}
        onShowQr={() => {
            const url = controller.settings.staff_base_url || window.location.origin;
            controller.handlers.setQrModal({ open: true, url, expiry: null });
        }}
    />
);

/**
 * Orchestrator that populates the configuration registry.
 * This is the ONLY place where cross-feature configuration imports should live.
 * By centralizing this, we allow SystemConfigPage to be a pure, decoupled renderer.
 */
export const loadDefaultConfigSections = (t) => {
    registerConfigSection('modules', { title: t('modules') || 'Módulos', icon: 'view_module', desc: t('modules_desc') || 'Habilita o deshabilita módulos opcionales de la clínica.' }, ModulesSettingsWrapper);
    registerConfigSection('integrations', { title: t('integrations'), icon: 'extension', desc: t('integrations_desc') }, IntegrationSettingsWrapper);
};
