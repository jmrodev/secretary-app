import React, { useState } from 'react';
import ConfigField from './ConfigField';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import './BillingSettings.css';

/**
 * BillingSettings Feature Component.
 * Handles AFIP (Argentine Tax Authority) integration, connection status, and certificate generation.
 */
const BillingSettings = ({ user, settings, updateSetting }) => {
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { alert } = useModal();
    const [status, setStatus] = useState(null);
    const [checking, setChecking] = useState(false);
    const [generatingCsr, setGeneratingCsr] = useState(false);
    const [generatedCsr, setGeneratedCsr] = useState(null);

    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';

    /**
     * Generates a Certificate Signing Request (CSR) via backend
     */
    const generateCsr = async () => {
        setGeneratingCsr(true);
        try {
            const res = await api.post('/billing/csr');
            setGeneratedCsr(res.data.csr);
            showMessage(t('csr_generated_success') || 'CSR generado correctamente', 'success');
        } catch (err) {
            alert((t('error_saving') || 'Error') + ': ' + (err.response?.data?.error || err.message));
        } finally {
            setGeneratingCsr(false);
        }
    };

    /**
     * Checks current AFIP server accessibility and status
     */
    const checkStatus = async () => {
        setChecking(true);
        try {
            const res = await api.get('/billing/status');
            setStatus(res.data);
            showMessage(t('afip_validated') || 'Conexión con AFIP validada', 'success');
        } catch (err) {
            setStatus({ error: err.response?.data?.error || t('afip_status_error') });
            showMessage(t('afip_connection_failed') || 'Fallo al conectar con AFIP', 'error');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="tab-panel animate-fadeIn billing-settings">
            {/* AFIP General Configuration */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="receipt" size="1.5rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('billing_settings_title')}</h4>
                </div>

                <div className="config-section__body">
                    <div className="config-grid">
                        <ConfigField
                            id="afip-cuit"
                            label={t('billing_cuit')}
                            type="text"
                            placeholder="Ej: 20111111112"
                            value={settings.afip_cuit || ''}
                            onChange={(e) => updateSetting('afip_cuit', e.target.value)}
                            disabled={!isAdmin}
                            hint={t('afip_guide_step_1')}
                        />
                        <ConfigField
                            id="afip-pto-vta"
                            label={t('pto_vta')}
                            type="number"
                            placeholder="1"
                            value={settings.afip_pto_vta || '1'}
                            onChange={(e) => updateSetting('afip_pto_vta', e.target.value)}
                            disabled={!isAdmin}
                            hint={t('afip_guide_step_1')}
                        />
                    </div>

                    <ConfigField
                        id="afip-env"
                        label={t('afip_environment')}
                        type="select"
                        value={settings.afip_environment || 'testing'}
                        onChange={(e) => updateSetting('afip_environment', e.target.value)}
                        disabled={!isAdmin}
                        options={[
                            { value: 'testing', label: t('afip_env_testing') },
                            { value: 'production', label: t('afip_env_production') }
                        ]}
                        hint={t('afip_prod_warning')}
                    />

                    <div className="config-section__divider"></div>

                    <div className="config-group">
                        <div className="config-group__header">
                            <h5 className="config-group__title">{t('connection_status')}</h5>
                        </div>
                        <div className="config-group__items">
                            {status ? (
                                <div className={`billing-settings__status ${status.error ? 'billing-settings__status--error' : 'billing-settings__status--success'}`}>
                                    <div className="billing-settings__status-header">
                                        <Icon name={status.error ? 'error' : 'check_circle'} size="1.2rem" />
                                        <span>
                                            {status.error ? t('afip_status_error') : `${t('afip_status_connected')} (${status.environment})`}
                                        </span>
                                    </div>
                                    {status.error ? (
                                        <p>{status.error}</p>
                                    ) : (
                                        <p className="config-field__hint">
                                            App: {status.afip_status.AppServer}, DB: {status.afip_status.DbServer}, Auth: {status.afip_status.AuthServer}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="config-field__hint">{t('not_verified')}</p>
                            )}
                        </div>

                        <div className="config-actions">
                            <Button
                                variant="secondary"
                                onClick={checkStatus}
                                loading={checking}
                                icon={<Icon name="sync" size="1.1rem" />}
                            >
                                {t('verify_afip_connection')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AFIP Certificates and Key Generation */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="vpn_key" size="1.5rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('digital_certificates')}</h4>
                </div>
                <div className="config-section__body">
                    <div className="config-field__hint">
                        {t('valid_certificate_needed')}
                        <br /><br />
                        1. {t('afip_guide_step_1_short')}
                        <br />
                        2. {t('afip_guide_step_2_short')} <a href="https://auth.afip.gob.ar/contribuyente_/login.xhtml" target="_blank" rel="noreferrer" className="config-link">{t('access_afip')}</a>
                        <br />
                        3. {t('afip_guide_step_3_short')}
                        <br />
                        4. {t('afip_guide_step_4_short')}
                        <br />
                        5. {t('afip_guide_step_5_short')}
                    </div>
                    <div className="config-actions">
                        <Button
                            variant="primary"
                            onClick={generateCsr}
                            loading={generatingCsr}
                            icon={<Icon name="build" size="1.1rem" />}
                        >
                            {t('generate_csr_btn')}
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={true}
                            title="Próximamente"
                            icon={<Icon name="upload" size="1.1rem" />}
                        >
                            {t('upload_crt')}
                        </Button>
                    </div>

                    {generatedCsr && (
                        <div className="billing-settings__csr-box">
                            <div className="config-group__header">
                                <h5 className="config-group__title">{t('your_csr')}</h5>
                            </div>
                            <p className="config-field__hint">{t('copy_to_wsass')}:</p>
                            <Input
                                type="textarea"
                                className="billing-settings__csr-textarea"
                                readOnly
                                value={generatedCsr}
                                onClick={(e) => e.target.select()}
                                rows={8}
                            />
                            <div className="config-actions config-actions--right">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => { navigator.clipboard.writeText(generatedCsr); showMessage(t('csr_copied'), 'success'); }}
                                    icon={<Icon name="content_copy" size="1.1rem" />}
                                >
                                    {t('copy')}
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default BillingSettings;
