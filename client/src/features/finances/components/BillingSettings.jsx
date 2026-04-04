import React, { useState } from 'react';
import { ConfigField } from '../../config';
import Button from '../../../components/atoms/Button';
import api from '../../../api/axios';
import { useMessage } from '../../../context/MessageContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useModal } from '../../../context/ModalContext';
import './BillingSettings.css';

/**
 * BillingSettings Feature Organism/Molecule.
 * Manages AFIP integration settings, CSR generation, and connection status.
 * Core part of the fiscal management within the finances domain.
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
        <div className="tab-panel animate-fadeIn">
            <div className="config-section">
                <div className="config-section__header">
                    <span className="config-section__icon">🧾</span>
                    <h4 className="config-section__title">{t('billing_settings_title')}</h4>
                </div>

                <div className="config-section__body">
                    <div className="config-grid">
                        <ConfigField
                            label={t('billing_cuit')}
                            type="text"
                            placeholder="Ej: 20111111112"
                            value={settings.afip_cuit || ''}
                            onChange={(e) => updateSetting('afip_cuit', e.target.value)}
                            disabled={!isAdmin}
                            hint={t('afip_guide_step_1')}
                        />
                        <ConfigField
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
                                <div className={`config-group__status ${status.error ? 'config-group__status--error' : 'config-group__status--success'}`}>
                                    {status.error ? (
                                        <p>❌ {t('afip_status_error')}: {status.error}</p>
                                    ) : (
                                        <>
                                            <p>✅ {t('afip_status_connected')} ({status.environment})</p>
                                            <p className="config-group__status-details">
                                                App: {status.afip_status.AppServer} · DB: {status.afip_status.DbServer} · Auth: {status.afip_status.AuthServer}
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="config-group__status-empty">{t('not_verified')}</p>
                            )}
                        </div>

                        <div className="config-actions">
                            <Button
                                variant="secondary"
                                onClick={checkStatus}
                                loading={checking}
                                className="config-btn-full"
                            >
                                🔄 {t('verify_afip_connection')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-section config-section--boxed">
                <div className="config-section__header">
                    <span className="config-section__icon">🔑</span>
                    <h4 className="config-section__title">{t('digital_certificates')}</h4>
                </div>
                <div className="config-section__body">
                    <div className="config-instructions">
                        <p className="config-instructions__title">{t('valid_certificate_needed')}</p>
                        <p>1. {t('afip_guide_step_1_short')}</p>
                        <p>2. {t('afip_guide_step_2_short')} <a href="https://auth.afip.gob.ar/contribuyente_/login.xhtml" target="_blank" rel="noreferrer" className="config-instructions__link">{t('access_afip')}</a></p>
                        <p>3. {t('afip_guide_step_3_short')}</p>
                        <p>4. {t('afip_guide_step_4_short')}</p>
                        <p>5. {t('afip_guide_step_5_short')}</p>
                    </div>
                    <div className="config-actions">
                        <Button variant="primary" onClick={generateCsr} loading={generatingCsr}>
                            ⚙️ {t('generate_csr_btn')}
                        </Button>
                        <Button variant="ghost" disabled={true} title="Próximamente" className="opacity-50 cursor-not-allowed">
                            {t('upload_crt')}
                        </Button>
                    </div>

                    {generatedCsr && (
                        <div className="config-group config-group--blue">
                            <div className="config-group__header">
                                <h5 className="config-group__title config-group__title--link">{t('your_csr')}</h5>
                            </div>
                            <p className="config-group__subtitle">{t('copy_to_wsass')}:</p>
                            <textarea
                                className="config-group__textarea"
                                readOnly
                                value={generatedCsr}
                                onClick={(e) => e.target.select()}
                            />
                            <div className="config-actions config-actions--right">
                                <Button size="sm" variant="accent" onClick={() => { navigator.clipboard.writeText(generatedCsr); showMessage(t('csr_copied'), 'success'); }}>
                                    📋 {t('copy')}
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
