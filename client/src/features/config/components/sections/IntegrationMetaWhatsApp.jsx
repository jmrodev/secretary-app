import React from 'react';
import shared from '@/styles/shared.module.css';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import styles from './IntegrationMetaWhatsApp.module.css';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * IntegrationMetaWhatsApp Feature Molecule.
 * Configuration panel for official Meta WhatsApp Cloud API credentials.
 */
export const IntegrationMetaWhatsApp = ({ settings, updateSetting, onTestMeta, loading, isAuthorized }) => {
    const { t } = useLanguage();

    return (
        <div className={`${shared.ConfigSection} ${shared.AnimateFadeIn}`}>
            <div className={shared.ConfigSection__header}>
                <span className={shared.ConfigSection__icon}><Icon name="chat" /></span>
                <h3 className={shared.ConfigSection__title}>{t('meta_whatsapp_title')}</h3>
            </div>

            <div className={shared.ConfigSection__body}>
                <p className={styles.IntegrationMetaWhatsApp__hint}>
                    {t('meta_whatsapp_description')}
                </p>

                <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--2col']}`}>
                    <ConfigField
                        id="meta-phone-id"
                        label={t('meta_phone_number_id_label')}
                        value={settings.meta_phone_number_id || ''}
                        onChange={(e) => updateSetting('meta_phone_number_id', e.target.value)}
                        disabled={!isAuthorized}
                        className={styles.IntegrationMetaWhatsApp__inputMonospace}
                        placeholder={t('meta_phone_number_id_placeholder')}
                    />

                    <ConfigField
                        id="meta-token"
                        label={t('meta_access_token_label')}
                        type="password"
                        value={settings.meta_access_token || ''}
                        onChange={(e) => updateSetting('meta_access_token', e.target.value)}
                        placeholder={settings.meta_access_token === 'MASKED_PRESENT' ? t('meta_access_token_placeholder_saved') : t('meta_access_token_placeholder_empty')}
                        disabled={!isAuthorized}
                        className={styles.IntegrationMetaWhatsApp__inputMonospace}
                    />
                </div>

                <div className={styles.IntegrationMetaWhatsApp__actions}>
                    <Button
                        onClick={onTestMeta}
                        disabled={loading || !settings.meta_phone_number_id}
                        icon={<Icon name="science" />}
                    >
                        {t('meta_test_connection')}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                        icon={<Icon name="open_in_new" />}
                    >
                        {t('meta_developer_portal')}
                    </Button>
                </div>
            </div>
        </div>
    );
};