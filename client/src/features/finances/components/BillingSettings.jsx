import React, { useState } from 'react';
import ConfigField from '../../../components/molecules/ConfigField';
import Button from '../../../components/atoms/Button';
import api from '../../../api/axios';
import { useMessage } from '../../../context/MessageContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useModal } from '../../../context/ModalContext';

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

    const isAdmin = user.role === 'admin' || user.role === 'secretary';

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
                <div className="config-section__header flex items-center gap-3 mb-6">
                    <span className="config-section__icon text-2xl">🧾</span>
                    <h4 className="config-section__title text-xl font-bold text-gray-800">{t('billing_settings_title')}</h4>
                </div>

                <div className="config-section__body space-y-6">
                    <div className="config-grid grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="config-section__divider border-t border-gray-100 my-8"></div>

                    <div className="config-group bg-gray-50 p-6 rounded-sm border border-gray-100">
                        <div className="config-group__header mb-4">
                            <h5 className="config-group__title font-bold text-gray-700">{t('connection_status')}</h5>
                        </div>
                        <div className="config-group__items mb-6">
                            {status ? (
                                <div className={`text-sm p-4 rounded bg-white shadow-sm font-medium ${status.error ? 'text-red-600' : 'text-green-600'}`}>
                                    {status.error ? (
                                        <p>❌ {t('afip_status_error')}: {status.error}</p>
                                    ) : (
                                        <>
                                            <p>✅ {t('afip_status_connected')} ({status.environment})</p>
                                            <p className="text-[10px] mt-1 opacity-60 uppercase tracking-widest">
                                                App: {status.afip_status.AppServer} · DB: {status.afip_status.DbServer} · Auth: {status.afip_status.AuthServer}
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">{t('not_verified')}</p>
                            )}
                        </div>

                        <div className="config-actions">
                            <Button
                                variant="secondary"
                                onClick={checkStatus}
                                loading={checking}
                                className="w-full md:w-auto"
                            >
                                🔄 {t('verify_afip_connection')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-section mt-12 bg-white shadow-sm border border-gray-100 p-8 rounded-sm">
                <div className="config-section__header flex items-center gap-3 mb-6">
                    <span className="config-section__icon text-2xl">🔑</span>
                    <h4 className="config-section__title text-xl font-bold text-gray-800">{t('digital_certificates')}</h4>
                </div>
                <div className="config-section__body">
                    <div className="text-sm space-y-2 text-gray-600 mb-8 leading-relaxed">
                        <p className="font-bold text-gray-800 underline mb-4">{t('valid_certificate_needed')}</p>
                        <p>1. {t('afip_guide_step_1_short')}</p>
                        <p>2. {t('afip_guide_step_2_short')} <a href="https://auth.afip.gob.ar/contribuyente_/login.xhtml" target="_blank" rel="noreferrer" className="text-accent underline font-bold">{t('access_afip')}</a></p>
                        <p>3. {t('afip_guide_step_3_short')}</p>
                        <p>4. {t('afip_guide_step_4_short')}</p>
                        <p>5. {t('afip_guide_step_5_short')}</p>
                    </div>
                    <div className="config-actions flex flex-wrap gap-4">
                        <Button variant="primary" onClick={generateCsr} loading={generatingCsr}>
                            ⚙️ {t('generate_csr_btn')}
                        </Button>
                        <Button variant="ghost" disabled={true} title="Próximamente" className="opacity-50 cursor-not-allowed">
                            {t('upload_crt')}
                        </Button>
                    </div>

                    {generatedCsr && (
                        <div className="config-group mt-8 p-6 bg-blue-50 border border-blue-100 rounded-sm">
                            <div className="config-group__header mb-4">
                                <h5 className="config-group__title font-bold text-blue-800 underline">{t('your_csr')}</h5>
                            </div>
                            <p className="text-xs text-blue-600 mb-2 font-medium">{t('copy_to_wsass')}:</p>
                            <textarea
                                className="w-full h-[200px] p-4 font-mono text-[11px] bg-white border border-blue-200 rounded-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
                                readOnly
                                value={generatedCsr}
                                onClick={(e) => e.target.select()}
                            />
                            <div className="config-actions flex justify-end mt-4">
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
