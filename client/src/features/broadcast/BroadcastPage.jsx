import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import { WhatsappBroadcast } from '@/components/molecules/WhatsappBroadcast';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './BroadcastPage.module.css';

const BroadcastPage = () => {
    const { t } = useLanguage();

    return (
        <MainLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{t('broadcast_tab')}</h1>
                    <p className={styles.subtitle}>{t('broadcast_filter_label')}</p>
                </div>
                <div className={styles.card}>
                    <WhatsappBroadcast t={t} />
                </div>
            </div>
        </MainLayout>
    );
};

export default BroadcastPage;
