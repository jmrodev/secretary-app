import React, { Suspense } from 'react';
import { useSystemConfigController } from '@/features/config/hooks/useSystemConfigController';
import GeneralSettings from '@/features/config/components/sections/GeneralSettings';
import CommunicationSettings from '@/features/config/components/sections/CommunicationSettings';
import IntegrationSettings from '@/features/config/components/sections/IntegrationSettings';
import BillingSettings from '@/features/config/components/sections/BillingSettings';
import AiSettings from '@/features/config/components/sections/AiSettings';
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
import FeatureToolbar from '@/components/organisms/FeatureToolbar';

// Lazy load heavy components
const DoctorsManager = React.lazy(() => import('@/features/doctors').then(module => ({ default: module.DoctorsManager })));
const ReportsDashboard = React.lazy(() => import('@/features/reports').then(module => ({ default: module.ReportsDashboard })));
const InstitutionManager = React.lazy(() => import('@/features/institutions').then(module => ({ default: module.InstitutionManager })));
const AuditLogManager = React.lazy(() => import('@/features/reports').then(module => ({ default: module.AuditLogManager })));
const UserManager = React.lazy(() => import('@/features/users').then(module => ({ default: module.UserManager })));

import { printReport } from '@/utils/printing/reportPrintHelper';
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

const getTabMetadata = (tab, t) => {
    const meta = {
        profile: { title: t('profile'), icon: 'person', desc: 'Gestiona tu información personal y profesional.' },
        doctors: { title: t('doctors'), icon: 'medical_services', desc: 'Administra la lista de profesionales y sus consultorios.' },
        reports: { title: t('reports'), icon: 'assessment', desc: 'Genera reportes detallados y estadísticas del sistema.' },
        institutions: { title: t('institutions'), icon: 'business', desc: 'Configura las clínicas y centros de atención.' },
        users: { title: t('users'), icon: 'group', desc: 'Gestiona los accesos y roles de los usuarios.' },
        logs: { title: t('logs'), icon: 'list_alt', desc: 'Historial de auditoría y seguridad del sistema.' },
        general: { title: t('general'), icon: 'settings', desc: 'Configuración básica y enlaces de ayuda.' },
        communications: { title: t('communications'), icon: 'chat', desc: 'Plantillas de mensajes y automatización de WhatsApp.' },
        integrations: { title: t('integrations'), icon: 'extension', desc: 'Conexión con Google, Meta y otros servicios.' },
        billing: { title: t('billing'), icon: 'payments', desc: 'Configuración de facturación y ARCA (AFIP).' },
        data: { title: t('data_management_title'), icon: 'database', desc: 'Seguridad, respaldos y gestión de base de datos.' }
    };
    return meta[tab] || { title: tab, icon: 'settings', desc: '' };
};

const SettingsContent = ({ activeTab, controller }) => {
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

    const metadata = getTabMetadata(activeTab, t);

    const wrap = (content) => (
        <section className="settings-content-wrapper animate-fade-in-up">
            <header className="settings-content-header">
                <div className="settings-content-header__icon">
                    <Icon name={metadata.icon} size="1.5rem" />
                </div>
                <div className="settings-content-header__text">
                    <h2 className="settings-content-title">{metadata.title}</h2>
                    <p className="settings-content-description">{metadata.desc}</p>
                </div>
            </header>
            <div className="settings-content-body">
                {content}
            </div>
        </section>
    );

    switch (activeTab) {
        case 'profile':
            return wrap(<ProfileSection />);
        case 'doctors':
            return wrap(<DoctorsSection />);
        case 'reports':
            return wrap(<ReportsSection />);
        case 'institutions':
            return wrap(<InstitutionsSection />);
        case 'users':
            return wrap(<UserSection />);
        case 'logs':
            return wrap(<AuditLogsSection />);
        case 'general':
            return wrap(
                <>
                    <GeneralSettings
                        user={user}
                        settings={settings}
                        updateSetting={updateSetting}
                        onShowQr={() => {
                            const url = settings.staff_base_url || window.location.origin;
                            setQrModal({ open: true, url, expiry: null });
                        }}
                    />
                    <article className="system-config-page__documentation animate-fade-in">
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
                </>
            );
        case 'communications':
            return wrap(
                <CommunicationSettings
                    user={user}
                    settings={settings}
                    updateSetting={updateSetting}
                    insertVariable={insertVariable}
                />
            );
        case 'integrations':
            return wrap(
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
            );
        case 'billing':
            return wrap(
                <BillingSettings
                    user={user}
                    settings={settings}
                    updateSetting={updateSetting}
                />
            );
        case 'ai':
            return wrap(
                <AiSettings
                    user={user}
                    settings={settings}
                    updateSetting={updateSetting}
                />
            );
        case 'data':
            return wrap(
                <div className="system-config-page__data-management animate-fade-in">
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
        <MainLayout wide flush title={controller.t('config') || 'Configuración del Sistema'}>
            <div className="system-config-page-orchestrator layout-content-area animate-fade-in">
                <FeatureToolbar
                    className="system-config-page__toolbar"
                    tabs={[
                        { id: 'general', label: controller.t('general'), icon: 'settings' },
                        { id: 'profile', label: controller.t('profile'), icon: 'person' },
                        { id: 'communications', label: controller.t('communications'), icon: 'chat' },
                        { id: 'ai', label: controller.t('ai'), icon: 'psychology' },
                        { id: 'doctors', label: controller.t('doctors'), icon: 'medical_services' },
                        { id: 'integrations', label: controller.t('integrations'), icon: 'extension' },
                        { id: 'users', label: controller.t('users'), icon: 'group' },
                        { id: 'billing', label: controller.t('billing'), icon: 'payments' },
                        { id: 'logs', label: controller.t('logs'), icon: 'list_alt' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={handlers.setActiveTab}
                />

                <main className="system-config-page-orchestrator__main">
                    <div className="system-config-container">
                        <Suspense fallback={<Loading variant="centered" />}>
                            <SettingsContent activeTab={activeTab} controller={controller} />
                        </Suspense>

                        <QRCodeModal
                            isOpen={qrModal.open}
                            onClose={() => setQrModal(prev => ({ ...prev, open: false }))}
                            url={qrModal.url}
                            expiresAt={qrModal.expiry}
                        />
                    </div>
                </main>
            </div>
        </MainLayout>
    );
};

export default SystemConfigPage;
