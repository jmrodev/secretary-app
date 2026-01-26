
import React from 'react';
import { useSystemConfigController } from '../controllers/useSystemConfigController';
import MainLayout from '../components/templates/MainLayout';
import GeneralSettings from '../components/organisms/GeneralSettings';
import CommunicationSettings from '../components/organisms/CommunicationSettings';
import IntegrationSettings from '../components/organisms/IntegrationSettings';
import QRCodeModal from '../components/molecules/QRCodeModal';
import Button from '../components/atoms/Button';

const SystemConfig = () => {
    const {
        user,
        settings,
        activeTab,
        setActiveTab,
        qrModal,
        setQrModal,
        loading,
        googleUnlinked,
        updateSetting,
        handleGoogleAuth,
        handleDisconnectGoogle,
        handleRetryGoogleFailed,
        handleTestMeta,
        insertVariable,
        handleRefreshTunnel,
        t
    } = useSystemConfigController();

    const renderTabContent = () => {
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
            case 'data':
                return (
                    <div className="tab-panel animate-fadeIn">
                        <div className="card text-center p-12 text-muted border-dashed border-2">
                            <span className="text-4xl block mb-4">💾</span>
                            <h3 className="font-bold text-slate-700">{t('data_management_title') || 'Gestión de Datos y Copias de Seguridad'}</h3>
                            <p>{t('coming_soon') || 'Próximamente...'}</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <MainLayout
            title={t('system_config') || 'Configuración del Sistema'}
            subtitle={t('system_config_subtitle') || 'Administre las preferencias globales de la aplicación.'}
        >
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
                            className={`tab-nav__item ${activeTab === 'data' ? 'tab-nav__item--active' : ''}`}
                            onClick={() => setActiveTab('data')}
                        >
                            💾 {t('data') || 'Datos'}
                        </Button>
                    </>
                )}
            </nav>

            <div className="tab-content relative min-h-[500px] animate-fadeIn">
                {renderTabContent()}
            </div>

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
