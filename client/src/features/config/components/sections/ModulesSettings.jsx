import React from 'react';
import { ConfigToggle } from '@/features/config/components/ui/ConfigToggle';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './ModulesSettings.module.css';

/**
 * ModulesSettings Feature Component.
 * Minimalist orchestrator for optional system business modules and feature flags.
 */
export const ModulesSettings = ({ user, settings, updateSetting }) => {
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin';

    return (
        <div className={`${styles.ModulesSettings__root} tab-panel animate-fade-in`}>
            <div className={styles.ModulesSettings__grid}>
                {/* Office Rentals Module */}
                <article className={styles.ModulesSettings__card}>
                    <div className={styles.ModulesSettings__info}>
                        <div className={styles.ModulesSettings__iconWrapper}>
                            <Icon name="domain" size="1.4rem" />
                        </div>
                        <div className={styles.ModulesSettings__text}>
                            <h4 className={styles.ModulesSettings__title}>
                                {t('office_rentals_module') || 'Alquiler de Consultorios'}
                            </h4>
                            <p className={styles.ModulesSettings__description}>
                                {t('office_rentals_module_desc') || 'Permite a los profesionales reservar consultorios físicos y gestionar tarifas de alquiler.'}
                            </p>
                        </div>
                    </div>
                    <div className={styles.ModulesSettings__toggle}>
                        <ConfigToggle
                            id="opt-rentals"
                            label=""
                            checked={settings?.enable_office_rentals === 'true'}
                            onChange={(val) => updateSetting('enable_office_rentals', val)}
                            disabled={!isAdmin}
                        />
                    </div>
                </article>
            </div>
        </div>
    );
};
