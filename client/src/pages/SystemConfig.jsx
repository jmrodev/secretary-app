import React from 'react';
import { useSystemConfigController } from '../controllers/useSystemConfigController';
import MainLayout from '../components/templates/MainLayout';
import GeneralSettings from '../components/organisms/GeneralSettings';
import CommunicationSettings from '../components/organisms/CommunicationSettings';
import IntegrationSettings from '../components/organisms/IntegrationSettings';
import BillingSettings from '../components/organisms/BillingSettings';
import QRCodeModal from '../components/molecules/QRCodeModal';
import Button from '../components/atoms/Button';

/**
 * SystemConfig Page
 * 
 * Control panel for system-wide settings
 * Uses BEM CSS methodology and Atomic Design principles
 */

/**
 * Single Responsibility: Render tab content based on active tab
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
                <GeneralSettings
                    user={user}
                    settings={settings}
                    updateSetting={updateSetting}
                    onShowQr={() => {
                        const url = settings.staff_base_url || window.location.origin;
                        setQrModal({ open: true, url, expiry: null });
                    }}
                />
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
                <div className="tab-panel animate-fadeIn">
                    <div className="config-section">
                        <div className="config-section__header">
                            <span className="config-section__icon">💾</span>
                            <h3 className="config-section__title">
                                {t('data_management_title') || 'Gestión de Datos y Copias de Seguridad'}
                            </h3>
                        </div>
                        <div className="config-section__body" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p className="config-field__hint">{t('coming_soon') || 'Próximamente...'}</p>
                        </div>
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
        <MainLayout
            title={t('system_config') || 'Configuración del Sistema'}
            subtitle={t('system_config_subtitle') || 'Administre las preferencias globales de la aplicación.'}
        >
            {/* Tab Navigation with BEM CSS */}
            <nav className="tab-nav mb-8">
                {(user.role === 'admin' || user.role === 'secretary') && (
                    <>
                        <Button
                            variant="ghost"
                            className={`tab-nav__item ${activeTab === 'general' ? 'tab-nav__item--active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            ⚙️ {t('general') || 'General'}
                        </Button>
                        <Button
                            variant="ghost"
                            className={`tab-nav__item ${activeTab === 'communications' ? 'tab-nav__item--active' : ''}`}
                            onClick={() => setActiveTab('communications')}
                        >
                            📢 {t('communications') || 'Comunicaciones'}
                        </Button>
                        <Button
                            variant="ghost"
                            className={`tab-nav__item ${activeTab === 'integrations' ? 'tab-nav__item--active' : ''}`}
                            onClick={() => setActiveTab('integrations')}
                        >
                            🔌 {t('integrations') || 'Integraciones'}
                        </Button>
                        <Button
                            variant="ghost"
                            className={`tab-nav__item ${activeTab === 'billing' ? 'tab-nav__item--active' : ''}`}
                            onClick={() => setActiveTab('billing')}
                        >
                            🧾 {t('billing') || 'Facturación'}
                        </Button>
                        <Button
                            variant="ghost"
                            className={`tab-nav__item ${activeTab === 'data' ? 'tab-nav__item--active' : ''}`}
                            onClick={() => setActiveTab('data')}
                        >
                            💾 {t('data') || 'Datos'}
                        </Button>
                    </>
                )}
            </nav>

            {/* Tab Content */}
            <div className="tab-content relative min-h-[500px] animate-fadeIn">
                {renderTabContent(activeTab, controller)}
            </div>

            {/* QR Code Modal */}
            <QRCodeModal
                isOpen={qrModal.open}
                onClose={() => setQrModal({ ...qrModal, open: false })}
                url={qrModal.url}
                expiresAt={qrModal.expiry}
            />
        </MainLayout>
    );
};

export default SystemConfig;
