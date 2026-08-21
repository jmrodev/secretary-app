import React from 'react';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './GeneralSettings.module.css';
import shared from '@/styles/shared.module.css';

/**
 * GeneralSettings Feature Component.
 * Minimalist institutional and contact parameters for the clinic.
 */
export const GeneralSettings = ({ user, settings, updateSetting }) => {
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin';

    return (
        <div className={`${styles.GeneralSettings__root} ${shared.TabPanel} ${shared.AnimateFadeIn}`}>
            {/* Contact & Notification Channels */}
            <article className={shared.ConfigSection}>
                <header className={shared.ConfigSection__header}>
                    <Icon name="business" size="1.5rem" className={shared.ConfigSection__icon} />
                    <h3 className={shared.ConfigSection__title}>{t('contact_pharmacy_dispatch')}</h3>
                </header>

                <div className={shared.ConfigSection__body}>
                    <p className={styles.GeneralSettings__hint}>
                        {t('contact_pharmacy_hint')}
                    </p>

                    <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--2col']}`}>
                        <ConfigField
                            id="pharmacy-email"
                            label={t('pharmacy_email_label')}
                            type="email"
                            placeholder="farmacia@clinica.com"
                            value={settings.pharmacy_email || ''}
                            onChange={(e) => updateSetting('pharmacy_email', e.target.value)}
                            disabled={!isAdmin}
                            hint={t('pharmacy_email_hint')}
                        />
                        <ConfigField
                            id="pharmacy-phone"
                            label={t('pharmacy_phone_label')}
                            type="text"
                            placeholder="+54 9 11 1234-5678"
                            value={settings.pharmacy_phone || ''}
                            onChange={(e) => updateSetting('pharmacy_phone', e.target.value)}
                            disabled={!isAdmin}
                            hint={t('pharmacy_phone_hint')}
                        />
                    </div>
                </div>
            </article>
        </div>
    );
};

