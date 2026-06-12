import React, { Suspense, useEffect, useMemo } from 'react';
import { useSystemConfigController } from '@/features/config/hooks/useSystemConfigController';
import { getConfigSections, getConfigSection } from './registry/configRegistry';
import { loadDefaultConfigSections } from './components/ConfigRegistryLoader';

// Global Atomic Components
import MainLayout from '@/components/templates/MainLayout';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import FeatureToolbar from '@/components/organisms/FeatureToolbar';
import { QRCodeModal } from '@/features/patients';

import styles from './SystemConfigPage.module.css';

/**
 * SettingsContent (Slot Renderer).
 * Renders the active configuration section based on the registry.
 */
const SettingsContent = ({ activeTab, controller }) => {
    const { t } = controller;
    const section = useMemo(() => getConfigSection(activeTab), [activeTab]);

    if (!section) return null;

    const { metadata, Component } = section;

    return (
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
                <Suspense fallback={<Loading variant="centered" />}>
                    <Component controller={controller} />
                </Suspense>
            </div>
        </section>
    );
};

/**
 * SystemConfigPage (Orchestrator).
 * Now fully decoupled using a Slot/Registry pattern.
 */
const SystemConfigPage = () => {
    const controller = useSystemConfigController();
    const { t, activeTab, qrModal, handlers } = controller;

    // Initialize the registry once. 
    // In a larger app, this would happen at the app level.
    useEffect(() => {
        loadDefaultConfigSections(t);
    }, [t]);

    const tabs = useMemo(() => 
        getConfigSections().map(s => ({
            id: s.id,
            label: s.metadata.title,
            icon: s.metadata.icon
        })), []);

    return (
        <MainLayout wide flush title={t('config') || 'Configuración del Sistema'}>
            <div className="system-config-page-orchestrator layout-content-area animate-fade-in">
                <FeatureToolbar
                    className="system-config-page__toolbar"
                    tabs={tabs.length > 0 ? tabs : [
                        { id: 'general', label: t('general'), icon: 'settings' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={handlers.setActiveTab}
                />

                <main className="system-config-page-orchestrator__main">
                    <div className={`${styles.systemConfigContainer}`}>
                        <Suspense fallback={<Loading variant="centered" />}>
                            <SettingsContent activeTab={activeTab} controller={controller} />
                        </Suspense>

                        <QRCodeModal
                            isOpen={qrModal.open}
                            onClose={() => handlers.setQrModal(prev => ({ ...prev, open: false }))}
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
