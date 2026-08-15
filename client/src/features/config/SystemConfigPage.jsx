import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSystemConfigController } from '@/features/config/hooks/useSystemConfigController';
import { getConfigSections, getConfigSection } from './registry/configRegistry';
import { loadDefaultConfigSections } from './components/ConfigRegistryLoader';

// Global Atomic Components
import { MainLayout } from '@/components/templates/MainLayout';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import FeatureToolbar from '@/components/organisms/FeatureToolbar';
import { QRCodeModal } from '@/features/patients';

import styles from './SystemConfigPage.module.css';

/**
 * SettingsContent (Slot Renderer).
 * Renders the active configuration section based on the registry.
 */
const SettingsContent = ({ activeTab, controller, registryLoaded }) => {
    const { t } = controller;
    const section = useMemo(() => getConfigSection(activeTab), [activeTab, registryLoaded]);

    if (!section) return null;

    const { metadata, Component } = section;

    return (
        <section className="config-section -up">
            <header className="config-section__header">
                <div className="config-section__icon">
                    <Icon name={metadata.icon} size="1.5rem" />
                </div>
                <div className="config-section__text">
                    <h2 className="config-section__title">{metadata.title}</h2>
                    <p className="config-section__desc">{metadata.desc}</p>
                </div>
            </header>
            <div className="config-section__body">
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
export const SystemConfigPage = () => {
    const controller = useSystemConfigController();
    const { t, activeTab, qrModal, handlers } = controller;

    const [registryLoaded, setRegistryLoaded] = useState(false);

    // Initialize the registry once. 
    // In a larger app, this would happen at the app level.
    useEffect(() => {
        loadDefaultConfigSections(t);
        setRegistryLoaded(true);
    }, [t]);

    const tabs = useMemo(() => 
        getConfigSections().map(s => ({
            id: s.id,
            label: s.metadata.title,
            icon: s.metadata.icon
        })), [registryLoaded]);

    return (
        <MainLayout wide flush title={t('config') || 'Configuración del Sistema'}>
            <div className={`${styles.root}  `}>
                <FeatureToolbar
                    tabs={tabs.length > 0 ? tabs : [
                        { id: 'general', label: t('general'), icon: 'settings' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={handlers.setActiveTab}
                />

                <section className={styles.systemConfigMain}>
                    <div className={styles.systemConfigContainer}>
                        <Suspense fallback={<Loading variant="centered" />}>
                            <SettingsContent activeTab={activeTab} controller={controller} registryLoaded={registryLoaded} />
                        </Suspense>

                        <QRCodeModal
                            isOpen={qrModal.open}
                            onClose={() => handlers.setQrModal(prev => ({ ...prev, open: false }))}
                            url={qrModal.url}
                            expiresAt={qrModal.expiry}
                        />
                    </div>
                </section>
            </div>
        </MainLayout>
    );
};

