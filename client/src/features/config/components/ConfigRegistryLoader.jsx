/* eslint-disable react-refresh/only-export-components -- registry module: lazy component wrappers and the loadDefaultConfigSections initializer are module-level exports */
import React, { lazy } from 'react';
import { registerConfigSection } from '../registry/configRegistry';

// Lazy loading to maintain performance and avoid eager cross-feature coupling at the module level.
// Sections use named exports (export const X), so map them to `default` for React.lazy — otherwise
// React 19 resolves the whole module namespace (an object) as the component.
const GeneralSettings = lazy(() => import('../components/sections/GeneralSettings').then(m => ({ default: m.GeneralSettings })));
const CommunicationSettings = lazy(() => import('../components/sections/CommunicationSettings').then(m => ({ default: m.CommunicationSettings })));
const IntegrationSettings = lazy(() => import('../components/sections/IntegrationSettings').then(m => ({ default: m.IntegrationSettings })));
const BillingSettings = lazy(() => import('../components/sections/BillingSettings').then(m => ({ default: m.BillingSettings })));

// Domain Features
const DoctorsManager = lazy(() => import('@/features/doctors').then(m => ({ default: m.DoctorsManager })));
const ProfileEditor = lazy(() => import('@/features/auth').then(m => ({ default: m.ProfileEditor })));
const InstitutionManager = lazy(() => import('@/features/institutions').then(m => ({ default: m.InstitutionManager })));
const UserManager = lazy(() => import('@/features/users').then(m => ({ default: m.UserManager })));
const AuditLogManager = lazy(() => import('@/features/reports').then(m => ({ default: m.AuditLogManager })));

// Cross-feature imports for Slots (kept inside the loader to keep SystemConfigPage pure)
import { ScheduleBulkActions, ScheduleTimeBlock } from '@/features/appointments';
import { UserForm } from '@/features/users';
import { InstitutionFinances } from '@/features/finances';
import { MessageTemplateEditor } from './forms/MessageTemplateEditor';

// Eager imports for hooks to avoid undef require at runtime/eslint
import { useProfileController } from '@/features/auth/hooks/useProfileController';
import { useDoctorsPageController } from '@/features/doctors';
import { useAuditLogsController } from '@/features/reports';
import { useInstitutionsController } from '@/features/institutions';

// --- Specialized Wrappers to map the common Controller to specific component props ---

const GeneralSettingsWrapper = ({ controller }) => {
    const { user, settings, handlers } = controller;
    return (
        <GeneralSettings 
            user={user} 
            settings={settings} 
            updateSetting={handlers.updateSetting}
            onShowQr={() => {
                const url = settings.staff_base_url || window.location.origin;
                handlers.setQrModal({ open: true, url, expiry: null });
            }}
        />
    );
};

const ProfileEditorWrapper = ({ controller }) => {
    const profileController = useProfileController();
    return <ProfileEditor {...profileController} />;
};

const DoctorsManagerWrapper = ({ controller }) => {
    const doctorsController = useDoctorsPageController();
    
    return (
        <DoctorsManager 
            {...doctorsController} 
            ScheduleBulkActionsComponent={ScheduleBulkActions}
            ScheduleTimeBlockComponent={ScheduleTimeBlock}
            UserFormComponent={UserForm}
            MessageTemplateEditorComponent={MessageTemplateEditor}
        />
    );
};

const InstitutionManagerWrapper = ({ controller }) => {
    const instController = useInstitutionsController();
    return <InstitutionManager {...instController} InstitutionFinancesComponent={InstitutionFinances} />;
};

const UserManagerWrapper = ({ controller }) => <UserManager t={controller.t} />;
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
    registerConfigSection('general', { title: t('general'), icon: 'settings', desc: 'Configuración básica y enlaces de ayuda.' }, GeneralSettingsWrapper);
    registerConfigSection('profile', { title: t('profile'), icon: 'person', desc: 'Gestiona tu información personal y profesional.' }, ProfileEditorWrapper);
    registerConfigSection('communications', { title: t('communications'), icon: 'chat', desc: 'Plantillas de mensajes y automatización de WhatsApp.' }, CommunicationSettingsWrapper);
    registerConfigSection('doctors', { title: t('doctors'), icon: 'medical_services', desc: 'Administra la lista de profesionales.' }, DoctorsManagerWrapper);
    registerConfigSection('integrations', { title: t('integrations'), icon: 'extension', desc: 'Conexión con servicios externos.' }, IntegrationSettingsWrapper);
    registerConfigSection('institutions', { title: t('institutions'), icon: 'business', desc: 'Configura las clínicas y centros.' }, InstitutionManagerWrapper);
    registerConfigSection('users', { title: t('users'), icon: 'group', desc: 'Gestiona los accesos y roles.' }, UserManagerWrapper);
    registerConfigSection('billing', { title: t('billing'), icon: 'payments', desc: 'Configuración de facturación.' }, BillingSettingsWrapper);
    registerConfigSection('logs', { title: t('logs'), icon: 'list_alt', desc: 'Historial de auditoría.' }, AuditLogManagerWrapper);
};
