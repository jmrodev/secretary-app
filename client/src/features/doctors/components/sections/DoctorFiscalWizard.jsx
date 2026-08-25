import React, { useState, useRef } from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { Switch } from '@/components/atoms/Switch';
import { FormGroup } from '@/components/molecules/FormGroup';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './DoctorFiscalWizard.module.css';

export const DoctorFiscalWizard = ({
    data,
    onChangeData,
    generatedCsr,
    generatingCsr,
    uploading,
    connectionStatus,
    statusDetails,
    error,
    onGenerateCsr,
    onUploadCert,
    onTestConnection
}) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const fileInputRef = useRef(null);

    const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
    const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

    const isStep1Valid = () => {
        return data.afip_cuit && data.afip_pto_vta;
    };

    const handleCopyCsr = () => {
        if (generatedCsr) {
            navigator.clipboard.writeText(generatedCsr);
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onUploadCert(e.target.files[0]);
        }
    };

    return (
        <div className={styles.DoctorFiscalWizard__root}>
            <div className={styles.DoctorFiscalWizard__stepper}>
                <div className={`${styles.DoctorFiscalWizard__step} ${step === 1 ? styles['DoctorFiscalWizard__step--active'] : ''}`}>{t('wizard_step1_title')}</div>
                <div className={`${styles.DoctorFiscalWizard__step} ${step === 2 ? styles['DoctorFiscalWizard__step--active'] : ''}`}>{t('wizard_step2_title')}</div>
                <div className={`${styles.DoctorFiscalWizard__step} ${step === 3 ? styles['DoctorFiscalWizard__step--active'] : ''}`}>{t('wizard_step3_title')}</div>
                <div className={`${styles.DoctorFiscalWizard__step} ${step === 4 ? styles['DoctorFiscalWizard__step--active'] : ''}`}>{t('wizard_step4_title')}</div>
            </div>

            <div className={styles.DoctorFiscalWizard__content}>
                {step === 1 && (
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <Switch
                                label={t('enable_afip_billing')}
                                checked={data.afip_enabled === true || data.afip_enabled === 'true' || data.afip_enabled === 1}
                                onChange={(val) => onChangeData({ afip_enabled: val })}
                            />
                        </div>
                        <FormGroup label={t('billing_cuit')} htmlFor="fiscal-cuit">
                            <Input
                                id="fiscal-cuit"
                                value={data.afip_cuit || ''}
                                onChange={(e) => onChangeData({ afip_cuit: e.target.value })}
                                placeholder="20123456789"
                            />
                        </FormGroup>
                        <FormGroup label={t('pto_vta')} htmlFor="fiscal-pto-vta">
                            <Input
                                id="fiscal-pto-vta"
                                value={data.afip_pto_vta || ''}
                                onChange={(e) => onChangeData({ afip_pto_vta: e.target.value })}
                                type="number"
                            />
                        </FormGroup>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <div className={styles.DoctorFiscalWizard__instructions}>
                            {t('wizard_step2_csr_instructions')}
                        </div>
                        <Button size="sm" variant="secondary" onClick={onGenerateCsr} loading={generatingCsr} icon={<Icon name="settings" size="1.1rem" />}>
                            {t('generate_csr')}
                        </Button>
                        
                        {error && (
                            <div className={`${styles.DoctorFiscalWizard__statusBox} ${styles.DoctorFiscalWizard__statusBoxError} animate-fade-in`} style={{ marginTop: '1rem' }}>
                                <div><Icon name="error" size="1.5rem" color="var(--danger)" /></div>
                                <div><strong>{t('error_label')}:</strong> <p>{error}</p></div>
                            </div>
                        )}

                        {generatedCsr && (
                            <div className={`${styles.DoctorFiscalWizard__csrBox} animate-fade-in`} style={{ marginTop: '1rem' }}>
                                <h6>{t('csr_generated_title')}</h6>
                                <textarea
                                    readOnly
                                    value={generatedCsr}
                                    className={styles.DoctorFiscalWizard__textarea}
                                    onClick={e => e.target.select()}
                                    aria-label={t('your_csr')}
                                />
                                <div>
                                    <Button size="sm" variant="primary" onClick={handleCopyCsr} icon={<Icon name="content_copy" size="1.1rem" />}>
                                        {t('copy_text')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <div className={styles.DoctorFiscalWizard__instructions}>
                            {t('wizard_step3_cert_instructions')}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".crt,.key"
                            style={{ display: 'none' }}
                        />
                        <Button size="sm" variant="ghost" onClick={handleUploadClick} loading={uploading} icon={<Icon name="upload" size="1.1rem" />}>
                            {t('upload_certificate')}
                        </Button>
                    </div>
                )}

                {step === 4 && (
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={onTestConnection}
                                loading={connectionStatus === 'checking'}
                                icon={<Icon name="power" size="1.1rem" />}
                            >
                                {t('test_connection')}
                            </Button>
                        </div>

                        {connectionStatus === 'ok' && (
                            <div className={`${styles.DoctorFiscalWizard__statusBox} ${styles.DoctorFiscalWizard__statusBoxSuccess} animate-fade-in`}>
                                <div>
                                    <Icon name="check_circle" size="1.5rem" color="var(--success)" />
                                </div>
                                <div>
                                    <strong>{t('afip_connection_success')}</strong>
                                    <pre className={styles.DoctorFiscalWizard__statusDetails}>
                                        {JSON.stringify(statusDetails, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {connectionStatus === 'error' && (
                            <div className={`${styles.DoctorFiscalWizard__statusBox} ${styles.DoctorFiscalWizard__statusBoxError} animate-fade-in`}>
                                <div>
                                    <Icon name="error" size="1.5rem" color="var(--danger)" />
                                </div>
                                <div>
                                    <strong>{t('afip_connection_error')}</strong>
                                    <p>{String(statusDetails)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.DoctorFiscalWizard__footer}>
                <Button variant="secondary" onClick={handlePrev} disabled={step === 1}>
                    {t('previous')}
                </Button>
                <Button variant="primary" onClick={handleNext} disabled={(step === 1 && !isStep1Valid()) || step === 4}>
                    {t('next')}
                </Button>
            </div>
        </div>
    );
};
