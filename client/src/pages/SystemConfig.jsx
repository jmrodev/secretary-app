import React from 'react';
import { useSystemConfigController } from '../controllers/useSystemConfigController';

// Organisms
import Sidebar from '../components/organisms/Sidebar';
import GeneralSettings from '../components/organisms/GeneralSettings';
import CommunicationSettings from '../components/organisms/CommunicationSettings';
import IntegrationSettings from '../components/organisms/IntegrationSettings';
import QRCodeModal from '../components/molecules/QRCodeModal';
import TabButton from '../components/atoms/TabButton';

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
        handleRefreshTunnel
    } = useSystemConfigController();

    // Permission check for viewing settings
    // If not admin/secretary, redirect or show denied is handled usually by router or layout, 
    // but here we render conditional tabs.

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
                    <div className="tab-panel animate-in">
                        <div className="card text-center p-12 text-muted bg-slate-50 border border-dashed rounded-xl">
                            <span className="text-4xl block mb-4">💾</span>
                            <h3 className="font-bold text-slate-700">Gestión de Datos y Copias de Seguridad</h3>
                            <p>Próximamente...</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="w-full max-w-5xl mx-auto">
                    {/* Header / Title if needed */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h1>
                        <p className="text-slate-500">Administre las preferencias globales de la aplicación.</p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="tabs-container mb-8 border-b border-slate-200 sticky top-0 bg-white z-10 pt-4">
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <>
                                <TabButton
                                    isActive={activeTab === 'general'}
                                    onClick={() => setActiveTab('general')}
                                    activeColor="blue"
                                >
                                    ⚙️ General
                                </TabButton>
                                <TabButton
                                    isActive={activeTab === 'communications'}
                                    onClick={() => setActiveTab('communications')}
                                    activeColor="purple"
                                >
                                    📢 Comunicaciones
                                </TabButton>
                                <TabButton
                                    isActive={activeTab === 'integrations'}
                                    onClick={() => setActiveTab('integrations')}
                                    activeColor="green"
                                >
                                    🔌 Integraciones
                                </TabButton>
                                <TabButton
                                    isActive={activeTab === 'data'}
                                    onClick={() => setActiveTab('data')}
                                    activeColor="amber"
                                >
                                    💾 Datos
                                </TabButton>
                            </>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="tab-content relative min-h-[500px]">
                        {renderTabContent()}
                    </div>
                </div>
            </main>

            {/* Global Modals for this Page */}
            <QRCodeModal
                isOpen={qrModal.open}
                onClose={() => setQrModal({ ...qrModal, open: false })}
                url={qrModal.url}
                expiresAt={qrModal.expiry}
            />
        </div>
    );
};

export default SystemConfig;
