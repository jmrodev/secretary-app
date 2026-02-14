
import React from 'react';
import { useSystemConfigController } from '../controllers/useSystemConfigController';
import MainLayout from '../components/templates/MainLayout';
import GeneralSettings from '../components/organisms/GeneralSettings';
import CommunicationSettings from '../components/organisms/CommunicationSettings';
import IntegrationSettings from '../components/organisms/IntegrationSettings';
import BillingSettings from '../components/organisms/BillingSettings';
import QRCodeModal from '../components/molecules/QRCodeModal';
import Button from '../components/atoms/Button';
import Icon from '../components/atoms/Icon';
import TabNav from '../components/molecules/TabNav';
import TabButton from '../components/atoms/TabButton';
import './SystemConfig.css';

/**
 * SystemConfig Page
 * 
 * Control panel for system-wide settings
 */

const renderTabContent = (activeTab, controller) => {
    const {
        user,
        settings,
        updateSetting,
        setQrModal,
        loading,
        googleUnlinked,
        handleGoogleAuth,
        handleDisconnectGoogle,
        handleRetryGoogleFailed,
        handleTestMeta,
        insertVariable,
        handleRefreshTunnel,
        t
    } = controller;

    switch (activeTab) {
        case 'general':
            return (
                <div className="space-y-8">
                    <GeneralSettings
                        user={user}
                        settings={settings}
                        updateSetting={updateSetting}
                        onShowQr={() => {
                            const url = settings.staff_base_url || window.location.origin;
                            setQrModal({ open: true, url, expiry: null });
                        }}
                    />
                    <div className="dashboard-card">
                        <div className="flex items-center gap-2 mb-4">
                            <Icon name="description" size="1.2rem" className="text-primary" />
                            <h3 className="text-lg font-bold text-slate-800">Documentación y Ayuda</h3>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Button
                                variant="outline"
                                onClick={() => window.open('/docs/MANUAL_OPERACIONES.html', '_blank')}
                                icon={<Icon name="assessment" size="1.1rem" />}
                            >
                                Ver Manual de Operaciones
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.open('/docs/GUIA_CONFIGURACION_GENERAL.md', '_blank')}
                                icon={<Icon name="settings" size="1.1rem" />}
                            >
                                Guía de Configuración
                            </Button>
                        </div>
                    </div>
                </div>
            );
        case 'communications':
            return (
                <CommunicationSettings
                    user={user}
                    settings={settings}
                    updateSetting={updateSetting}
                    insertVariable={insertVariable}
                />
            );
        case 'integrations':
            return (
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
            return (
                <BillingSettings
                    user={user}
                    settings={settings}
                    updateSetting={updateSetting}
                />
            );
        case 'data':
            return (
                <div className="dashboard-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon name="payments" size="1.2rem" className="text-primary" />
                        <h3 className="text-lg font-bold text-slate-800">
                            {t('data_management_title') || 'Gestión de Datos y Copias de Seguridad'}
                        </h3>
                    </div>
                    <div className="py-20 text-center">
                        <p className="text-slate-400 italic">{t('coming_soon') || 'Próximamente...'}</p>
                    </div>
                </div>
            );
        default:
            return null;
    }
};

const SystemConfig = () => {
    const controller = useSystemConfigController();
    const {
        user,
        activeTab,
        setActiveTab,
        qrModal,
        setQrModal,
        t
    } = controller;

    return (
        <MainLayout wide>
            <div className="system-config-page">
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">{t('system_config') || 'Configuración del Sistema'}</h1>
                    <p className="dashboard-header__subtitle">{t('system_config_subtitle') || 'Administre las preferencias globales de la aplicación.'}</p>
                </header>

                <div className="dashboard-nav-bar dashboard-nav-bar--centered animate-fadeIn">
                    <TabNav>
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <>
                                <TabButton
                                    isActive={activeTab === 'general'}
                                    onClick={() => setActiveTab('general')}
                                    icon={<Icon name="settings" size="1rem" />}
                                >
                                    {t('general') || 'General'}
                                </TabButton>
                                <TabButton
                                    isActive={activeTab === 'communications'}
                                    onClick={() => setActiveTab('communications')}
                                    icon={<Icon name="campaign" size="1rem" />}
                                >
                                    {t('communications') || 'Comunicaciones'}
                                </TabButton>
                                <TabButton
                                    isActive={activeTab === 'integrations'}
                                    onClick={() => setActiveTab('integrations')}
                                    icon={<Icon name="extension" size="1rem" />}
                                >
                                    {t('integrations') || 'Integraciones'}
                                </TabButton>
                                <TabButton
                                    isActive={activeTab === 'billing'}
                                    onClick={() => setActiveTab('billing')}
                                    icon={<Icon name="receipt_long" size="1rem" />}
                                >
                                    {t('billing') || 'Facturación'}
                                </TabButton>
                                <TabButton
                                    isActive={activeTab === 'data'}
                                    onClick={() => setActiveTab('data')}
                                    icon={<Icon name="database" size="1rem" />}
                                >
                                    {t('data') || 'Datos'}
                                </TabButton>
                            </>
                        )}
                    </TabNav>
                </div>

                <div className="max-w-4xl mx-auto py-8 animate-fadeIn">
                    {renderTabContent(activeTab, controller)}
                </div>

                <QRCodeModal
                    isOpen={qrModal.open}
                    onClose={() => setQrModal({ ...qrModal, open: false })}
                    url={qrModal.url}
                    expiresAt={qrModal.expiry}
                />
            </div>
        </MainLayout>
    );
};

export default SystemConfig;
