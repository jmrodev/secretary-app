import React, { Suspense } from 'react';
import { useSystemConfigController } from '@/features/config/hooks/useSystemConfigController';
import GeneralSettings from '@/features/config/components/GeneralSettings';
import CommunicationSettings from '@/features/config/components/CommunicationSettings';
import IntegrationSettings from '@/features/config/components/IntegrationSettings';
import BillingSettings from '@/features/config/components/BillingSettings';
import { useDoctorsPageController } from '@/features/doctors';
import { useProfileController, ProfileEditor } from '@/features/auth';
import { useReportsController, useAuditLogsController } from '@/features/reports';
import { QRCodeModal } from '@/features/patients'; // Fixed import from patients feature
import { useInstitutionsController } from '@/features/institutions';

// Global Atomic Components
import MainLayout from '@/components/templates/MainLayout';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';

// Lazy load heavy components
const DoctorsManager = React.lazy(() => import('@/features/doctors').then(module => ({ default: module.DoctorsManager })));
const ReportsDashboard = React.lazy(() => import('@/features/reports').then(module => ({ default: module.ReportsDashboard })));
const InstitutionManager = React.lazy(() => import('@/features/institutions').then(module => ({ default: module.InstitutionManager })));
const AuditLogManager = React.lazy(() => import('@/features/reports').then(module => ({ default: module.AuditLogManager })));
const UserManager = React.lazy(() => import('@/features/users').then(module => ({ default: module.UserManager })));

import { printReport } from '@/utils/reportPrintHelper';
import './SystemConfigPage.css';

// --- Sub-sections Orchestrated within the Page ---

const DoctorsSection = () => {
    const controller = useDoctorsPageController();
    return <DoctorsManager {...controller} />;
};
const ProfileSection = () => {
    const controller = useProfileController();
    return <ProfileEditor {...controller} />;
};
const ReportsSection = () => {
    const controller = useReportsController();
    const handlePrint = () => {
        printReport(controller.reportData, {
            activeTab: controller.activeTab,
            month: controller.month,
            year: controller.year,
            t: controller.t
        });
    };
    return <ReportsDashboard {...controller} onPrint={handlePrint} />;
};

const InstitutionsSection = () => {
    const controller = useInstitutionsController();
    return <InstitutionManager {...controller} />;
};
const AuditLogsSection = () => {
    const controller = useAuditLogsController();
    return <AuditLogManager {...controller} />;
};
const UserSection = () => {
    const { t } = useSystemConfigController();
    return <UserManager t={t} />;
};

const renderContent = (activeTab, controller) => {
    const {
        user,
        settings,
        loading,
        googleUnlinked,
        t,
        handlers
    } = controller;
    const {
        updateSetting,
        setQrModal,
        handleGoogleAuth,
        handleDisconnectGoogle,
        handleRetryGoogleFailed,
        handleTestMeta,
        insertVariable,
        handleRefreshTunnel
    } = handlers;

    switch (activeTab) {
        case 'profile':
            return <ProfileSection />;
        case 'doctors':
            return <DoctorsSection />;
        case 'reports':
            return <ReportsSection />;
        case 'institutions':
            return <InstitutionsSection />;
        case 'users':
            return <UserSection />;
        case 'logs':
            return <AuditLogsSection />;
        case 'general':
            return (
                <section className="settings-content-wrapper">
                    <header className="settings-content-header">
                        <h2 className="settings-content-title">{t('general') || 'Configuración General'}</h2>
                    </header>
                    <GeneralSettings
                        user={user}
                        settings={settings}
                        updateSetting={updateSetting}
                        onShowQr={() => {
                            const url = settings.staff_base_url || window.location.origin;
                            setQrModal({ open: true, url, expiry: null });
                        }}
                    />
                    <article className="system-config-page__documentation animate-fadeIn">
                        <header className="system-config-page__section-header">
                            <Icon name="description" size="1.2rem" className="system-config-page__section-icon" />
                            <h3 className="system-config-page__section-title">Documentación y Ayuda</h3>
                        </header>
                        <div className="system-config-page__actions">
                            <Button
                                variant="ghost"
                                onClick={() => window.open('/docs/MANUAL_OPERACIONES.html', '_blank')}
                                icon={<Icon name="assessment" size="1.1rem" />}
                                className="system-config-page__action-btn"
                            >
                                Ver Manual de Operaciones
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.open('/docs/GUIA_CONFIGURACION_GENERAL.md', '_blank')}
                                icon={<Icon name="settings" size="1.1rem" />}
                                className="system-config-page__action-btn"
                            >
                                Guía de Configuración
                            </Button>
                        </div>
                    </article>
                </section>
            );
        case 'communications':
            return (
                <div className="settings-content-wrapper">
                    <h2 className="settings-content-title">{t('communications') || 'Comunicaciones'}</h2>
                    <CommunicationSettings
                        user={user}
                        settings={settings}
                        updateSetting={updateSetting}
                        insertVariable={insertVariable}
                    />
                </div>
            );
        case 'integrations':
            return (
                <div className="settings-content-wrapper">
                    <h2 className="settings-content-title">{t('integrations') || 'Integraciones'}</h2>
                    <IntegrationSettings
                        user={user}
                        settings={settings}
                        updateSetting={updateSetting}
                        loading={loading}
                        googleUnlinked={googleUnlinked}
                        onGoogleAuth={handleGoogleAuth}
                        onDisconnectGoogle={handleDisconnectGoogle}
                        onRefreshToken={handleGoogleAuth}
                        onRetryGoogle={handleRetryGoogleFailed}
                        onRefreshTunnel={handleRefreshTunnel}
                        onTestMeta={handleTestMeta}
                    />
                </div>
            );
        case 'billing':
            return (
                <div className="settings-content-wrapper">
                    <h2 className="settings-content-title">{t('billing') || 'Facturación'}</h2>
                    <BillingSettings
                        user={user}
                        settings={settings}
                        updateSetting={updateSetting}
                    />
                </div>
            );
        case 'data':
            return (
                <div className="settings-content-wrapper">
                    <h2 className="settings-content-title">{t('data_management_title') || 'Datos y Seguridad'}</h2>
                    <div className="system-config-page__data-management animate-fadeIn">
                        <div className="system-config-page__section-header">
                            <Icon name="payments" size="1.2rem" className="system-config-page__section-icon" />
                            <h3 className="system-config-page__section-title">
                                {t('data_management_title') || 'Gestión de Datos y Copias de Seguridad'}
                            </h3>
                        </div>
                        <div className="system-config-page__placeholder">
                            <p className="system-config-page__placeholder-text">{t('coming_soon') || 'Próximamente...'}</p>
                        </div>
                    </div>
                </div>
            );
        default:
            return null;
    }
};

/**
 * SystemConfigPage (Orchestrator).
 * Centralized settings panel for the application.
 */
const SystemConfigPage = () => {
    const controller = useSystemConfigController();
    const {
        activeTab,
        qrModal,
        handlers
    } = controller;

    const { setQrModal } = handlers;

    return (
        <MainLayout wide>
            <section className="system-config-page">
                <div className="system-config-container animate-fadeIn">
                    <main className="system-config-main">
                        <Suspense fallback={<Loading variant="centered" />}>
                            {renderContent(activeTab, controller)}
                        </Suspense>
                    </main>

                    <QRCodeModal
                        isOpen={qrModal.open}
                        onClose={() => setQrModal({ ...qrModal, open: false })}
                        url={qrModal.url}
                        expiresAt={qrModal.expiry}
                    />
                </div>
            </section>
        </MainLayout>
    );
};

export default SystemConfigPage;
