import React, { useState } from 'react';
import { MainLayout } from '@/components/templates/MainLayout';
import { Icon } from '@/components/atoms/Icon';
import { WhatsappBroadcast } from '@/components/molecules/WhatsappBroadcast';
import { WhatsappConfig } from './WhatsappConfig';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './WhatsappPage.module.css';

export const WhatsappPage = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('config');

    return (
        <MainLayout wide flush title={t('whatsapp_messenger')}>
            <div className={styles.WhatsappPage__page}>
                <div className={styles.WhatsappPage__tabBar}>
                    <button
                        type="button"
                        className={`${styles.WhatsappPage__tab} ${activeTab === 'broadcast' ? styles.WhatsappPage__tabActive : ''}`}
                        onClick={() => setActiveTab('broadcast')}
                    >
                        <Icon name="campaign" size="1rem" />
                        {t('broadcast_tab')}
                    </button>
                    <button
                        type="button"
                        className={`${styles.WhatsappPage__tab} ${activeTab === 'config' ? styles.WhatsappPage__tabActive : ''}`}
                        onClick={() => setActiveTab('config')}
                    >
                        <Icon name="settings" size="1rem" />
                        Config
                    </button>
                </div>

                {activeTab === 'broadcast' ? (
                    <div className={styles.WhatsappPage__broadcastContainer}>
                        <WhatsappBroadcast t={t} />
                    </div>
                ) : (
                    <div className={styles.WhatsappPage__configContainer}>
                        <WhatsappConfig t={t} />
                    </div>
                )}
            </div>
        </MainLayout>
    );
};