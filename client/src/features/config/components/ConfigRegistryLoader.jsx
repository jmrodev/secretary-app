/* eslint-disable react-refresh/only-export-components -- registry module: lazy component wrappers and the loadDefaultConfigSections initializer are module-level exports */
import React, { lazy } from 'react';
import { registerConfigSection } from '../registry/configRegistry';

// Lazy loading to maintain performance and avoid eager cross-feature coupling at the module level.
// Sections use named exports (export const X), so map them to `default` for React.lazy — otherwise
// React 19 resolves the whole module namespace (an object) as the component.
const ModulesSettings = lazy(() => import('../components/sections/ModulesSettings').then(m => ({ default: m.ModulesSettings })));
const CommunicationSettings = lazy(() => import('../components/sections/CommunicationSettings').then(m => ({ default: m.CommunicationSettings })));
const IntegrationSettings = lazy(() => import('../components/sections/IntegrationSettings').then(m => ({ default: m.IntegrationSettings })));
const BillingSettings = lazy(() => import('../components/sections/BillingSettings').then(m => ({ default: m.BillingSettings })));

// Domain Features
const AuditLogManager = lazy(() => import('@/features/reports').then(m => ({ default: m.AuditLogManager })));

// Eager imports for hooks to avoid undef require at runtime/eslint
import { useAuditLogsController } from '@/features/reports';

// --- Specialized Wrappers to map the common Controller to specific component props ---

const ModulesSettingsWrapper = ({ controller }) => (
    <ModulesSettings 
        user={controller.user} 
        settings={controller.settings} 
        updateSetting={controller.handlers.updateSetting}
    />
);

const AuditLogManagerWrapper = ({ controller }) => {
    const logsController = useAuditLogsController();
    return <AuditLogManager {...logsController} />;
};

const CommunicationSettingsWrapper = ({ controller }) => (
    <CommunicationSettings 
        user={controller.user} 
        settings={controller.settings} 
        updateSetting={controller.handlers.updateSetting}
        insertVariable={controller.handlers.insertVariable}
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

const BillingSettingsWrapper = ({ controller }) => (
    <BillingSettings 
        user={controller.user} 
        settings={controller.settings} 
        updateSetting={controller.handlers.updateSetting}
    />
);

/**
 * Orchestrator that populates the configuration registry.
 * This is the ONLY place where cross-feature configuration imports should live.
 * By centralizing this, we allow SystemConfigPage to be a pure, decoupled renderer.
 */
export const loadDefaultConfigSections = (t) => {
    registerConfigSection('modules', { title: t('modules') || 'Módulos', icon: 'view_module', desc: t('modules_desc') || 'Habilita o deshabilita módulos opcionales de la clínica.' }, ModulesSettingsWrapper);
    registerConfigSection('communications', { title: t('communications'), icon: 'chat', desc: t('communications_desc') }, CommunicationSettingsWrapper);
    registerConfigSection('integrations', { title: t('integrations'), icon: 'extension', desc: t('integrations_desc') }, IntegrationSettingsWrapper);
    registerConfigSection('billing', { title: t('billing'), icon: 'payments', desc: t('billing_desc') }, BillingSettingsWrapper);
    registerConfigSection('logs', { title: t('logs'), icon: 'list_alt', desc: t('logs_desc') }, AuditLogManagerWrapper);
};
