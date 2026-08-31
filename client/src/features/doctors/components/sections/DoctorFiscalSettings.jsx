import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { Switch } from '@/components/atoms/Switch';
import { FormGroup } from '@/components/molecules/FormGroup';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './DoctorFiscalSettings.module.css';

/**
 * Molecule for displaying Doctor's AFIP/Fiscal settings.
 * Pure Presentational Component.
 */
export const DoctorFiscalSettings = ({
    // Data Props
    data,
    generatedCsr,
    generatingCsr,
    showCsrInfo,
    uploading,
    connectionStatus,
    statusDetails,

    // Handler Props
    onChangeData,
    onGenerateCsr,
    onUploadCert,
    onTestConnection,
    onHideCsrInfo
}) => {
    const { t } = useLanguage();

    const handleCopyCsr = () => {
        if (generatedCsr) {
            navigator.clipboard.writeText(generatedCsr);
        }
    };

    const fileInputRef = React.useRef(null);

    const handleUploadClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onUploadCert(e.target.files[0]);
        }
    };

    return (
        <div className={`${styles.DoctorFiscalSettings__root}`}>
            <div className={`${styles.DoctorFiscalSettings__card}`}>
                <div className={`${styles.DoctorFiscalSettings__header}`}>
                    <Switch
                        label={t('enable_afip_billing')}
                        checked={data.afip_enabled === true || data.afip_enabled === 'true' || data.afip_enabled === 1}
                        onChange={(val) => onChangeData({ afip_enabled: val })}
                    />
                </div>

                <div className={`${styles.DoctorFiscalSettings__grid}`}>
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
                            value={data.afip_pto_vta || '1'}
                            onChange={(e) => onChangeData({ afip_pto_vta: e.target.value })}
                            type="number"
                        />
                    </FormGroup>
                </div>
            </div>

            <div className={`${styles.DoctorFiscalSettings__section}`}>
                <h6 className={`${styles.DoctorFiscalSettings__title}`}>{t('digital_certificates')}</h6>
                <p className={`${styles.DoctorFiscalSettings__description}`}>
                    {t('valid_certificate_needed')}
                </p>

                <div className={`${styles.DoctorFiscalSettings__actions}`}>
                    <Button size="sm" variant="secondary" onClick={onGenerateCsr} loading={generatingCsr} icon={<Icon name="settings" size="1.1rem" />}>
                        {t('generate_csr')}
                    </Button>
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

                {generatedCsr && showCsrInfo && (
                    <div className={`${styles.DoctorFiscalSettings__csrBox} animate-fade-in`}>
                        <div className={`${styles.DoctorFiscalSettings__csrHeader}`}>
                            <h6 className={`${styles.DoctorFiscalSettings__csrTitle}`}>{t('csr_generated_title')}</h6>
                            <Button onClick={onHideCsrInfo} className={`${styles.DoctorFiscalSettings__csrClose}`} unstyled>{t('hide')}</Button>
                        </div>
                        <textarea
                            readOnly
                            value={generatedCsr}
                            className={`${styles.DoctorFiscalSettings__textarea}`}
                            onClick={e => e.target.select()}
                            aria-label={t('your_csr')}
                        />
                        <div className={`${styles.DoctorFiscalSettings__csrFooter}`}>
                            <span className={`${styles.DoctorFiscalSettings__hint}`}>{t('copy_to_wsass')}</span>
                            <Button size="sm" variant="primary" onClick={handleCopyCsr} icon={<Icon name="content_copy" size="1.1rem" />}>
                                {t('copy_text')}
                            </Button>
                        </div>
                    </div>
                )}

                <div className={`${styles.DoctorFiscalSettings__statusSection}`}>
                    <div className={`${styles.DoctorFiscalSettings__statusHeader}`}>
                        <h6 className={`${styles.DoctorFiscalSettings__title}`}>{t('connection_test_title')}</h6>
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
                        <div className={`${styles.DoctorFiscalSettings__statusBox} ${styles.DoctorFiscalSettings__statusBoxSuccess} animate-fade-in`}>
                            <div className={`${styles.DoctorFiscalSettings__statusIcon}`}>
                                <Icon name="check_circle" size="1.5rem" />
                            </div>
                            <div className={`${styles.DoctorFiscalSettings__statusContent}`}>
                                <strong>{t('afip_connection_success')}</strong>
                                <pre className={`${styles.DoctorFiscalSettings__statusDetails}`}>
                                    {JSON.stringify(statusDetails, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {connectionStatus === 'error' && (
                        <div className={`${styles.DoctorFiscalSettings__statusBox} ${styles.DoctorFiscalSettings__statusBoxError} animate-fade-in`}>
                            <div className={`${styles.DoctorFiscalSettings__statusIcon}`}>
                                <Icon name="error" size="1.5rem" />
                            </div>
                            <div className={`${styles.DoctorFiscalSettings__statusContent}`}>
                                <strong>{t('afip_connection_error')}</strong>
                                <p className={`${styles.DoctorFiscalSettings__statusMessage}`}>{String(statusDetails)}</p>
                            </div>
                        </div>
                    )}

                    <details className={`${styles.DoctorFiscalSettings__guide}`}>
                        <summary className={`${styles.DoctorFiscalSettings__guideSummary}`}>
                            <Icon name="history_edu" size="1.2rem" />
                            {t('afip_setup_guide')}
                        </summary>
                        <ol className={`${styles.DoctorFiscalSettings__guideList}`}>
                            <li>{t('afip_guide_step_1')}</li>
                            <li>{t('afip_guide_step_2')}</li>
                            <li>{t('afip_guide_step_3')}</li>
                            <li>{t('afip_guide_step_4')}</li>
                            <li>{t('afip_guide_step_5')}</li>
                            <li>{t('afip_guide_step_6')}</li>
                            <li>{t('afip_guide_step_7')}</li>
                            <li>{t('afip_guide_step_8')}</li>
                        </ol>
                    </details>
                </div>
            </div>
        </div>
    );
};


