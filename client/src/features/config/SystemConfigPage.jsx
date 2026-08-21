import React, { Suspense, useMemo, useState } from 'react';
import { useSystemConfigController } from '@/features/config/hooks/useSystemConfigController';
import { getConfigSections, getConfigSection } from './registry/configRegistry';
import { loadDefaultConfigSections } from './components/ConfigRegistryLoader';

// Global Atomic Components
import { MainLayout } from '@/components/templates/MainLayout';
import { Icon } from '@/components/atoms/Icon';
import { Loading } from '@/components/atoms/Loading';
import { FeatureToolbar } from '@/components/organisms/FeatureToolbar';
import { QRCodeModal } from '@/features/patients';

import styles from './SystemConfigPage.module.css';
import shared from '@/styles/shared.module.css';

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
        <section className={`${shared.ConfigSection} -up`}>
            <header className={shared.ConfigSection__header}>
                <div className={shared.ConfigSection__icon}>
                    <Icon name={metadata.icon} size="1.5rem" />
                </div>
                <div className={shared.ConfigSection__text}>
                    <h2 className={shared.ConfigSection__title}>{metadata.title}</h2>
                    <p className={shared.ConfigSection__desc}>{metadata.desc}</p>
                </div>
            </header>
            <div className={shared.ConfigSection__body}>
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

    // Initialize the registry once, lazily, so the first paint already shows
    // the configured sections without an extra effect round-trip.
    const [sections] = useState(() => {
        loadDefaultConfigSections(t);
        return getConfigSections();
    });

    const tabs = useMemo(() => 
        sections.map(s => ({
            id: s.id,
            label: s.metadata.title,
            icon: s.metadata.icon
        })), [sections]);

    return (
        <MainLayout wide flush title={t('config') || 'Configuración del Sistema'}>
            <div className={`${styles.SystemConfigPage__root}  `}>
                <FeatureToolbar
                    tabs={tabs.length > 0 ? tabs : [
                        { id: 'modules', label: t('modules') || 'Módulos', icon: 'view_module' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={handlers.setActiveTab}
                />

                <section className={styles.SystemConfigPage__systemConfigMain}>
                    <div className={styles.SystemConfigPage__systemConfigContainer}>
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
                </section>
            </div>
        </MainLayout>
    );
};

