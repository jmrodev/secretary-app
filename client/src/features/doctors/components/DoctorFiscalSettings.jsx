import React from 'react';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';
import Input from '../../../components/atoms/Input';
import Switch from '../../../components/atoms/Switch';
import FormGroup from '../../../components/molecules/FormGroup';
import { useLanguage } from '../../../context/LanguageContext';
import './DoctorFiscalSettings.css';

/**
 * Molecule for displaying Doctor's AFIP/Fiscal settings.
 * Pure Presentational Component.
 */
const DoctorFiscalSettings = ({
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
        <div className="doctor-fiscal-settings">
            <div className="doctor-fiscal-settings__card">
                <div className="doctor-fiscal-settings__header">
                    <Switch
                        label={t('enable_afip_billing')}
                        checked={data.afip_enabled === true || data.afip_enabled === 'true' || data.afip_enabled === 1}
                        onChange={(val) => onChangeData({ afip_enabled: val })}
                    />
                </div>

                <div className="doctor-fiscal-settings__grid">
                    <FormGroup label={t('billing_cuit')}>
                        <Input
                            value={data.afip_cuit || ''}
                            onChange={(e) => onChangeData({ afip_cuit: e.target.value })}
                            placeholder="20123456789"
                        />
                    </FormGroup>
                    <FormGroup label={t('pto_vta')}>
                        <Input
                            value={data.afip_pto_vta || '1'}
                            onChange={(e) => onChangeData({ afip_pto_vta: e.target.value })}
                            type="number"
                        />
                    </FormGroup>
                </div>
            </div>

            <div className="doctor-fiscal-settings__section">
                <h6 className="doctor-fiscal-settings__title">{t('digital_certificates')}</h6>
                <p className="doctor-fiscal-settings__description">
                    {t('valid_certificate_needed')}
                </p>

                <div className="doctor-fiscal-settings__actions">
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
                    <div className="doctor-fiscal-settings__csr-box animate-fadeIn">
                        <div className="doctor-fiscal-settings__csr-header">
                            <h6 className="doctor-fiscal-settings__csr-title">{t('csr_generated_title')}</h6>
                            <button onClick={onHideCsrInfo} className="doctor-fiscal-settings__csr-close">{t('hide')}</button>
                        </div>
                        <textarea
                            readOnly
                            value={generatedCsr}
                            className="doctor-fiscal-settings__textarea"
                            onClick={e => e.target.select()}
                        />
                        <div className="doctor-fiscal-settings__csr-footer">
                            <span className="doctor-fiscal-settings__hint">{t('copy_to_wsass')}</span>
                            <Button size="sm" variant="primary" onClick={handleCopyCsr} icon={<Icon name="content_copy" size="1.1rem" />}>
                                {t('copy_text')}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="doctor-fiscal-settings__status-section">
                    <div className="doctor-fiscal-settings__status-header">
                        <h6 className="doctor-fiscal-settings__title">{t('connection_test_title')}</h6>
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
                        <div className="doctor-fiscal-settings__status-box doctor-fiscal-settings__status-box--success animate-fadeIn">
                            <div className="doctor-fiscal-settings__status-icon">
                                <Icon name="check_circle" size="1.5rem" />
                            </div>
                            <div className="doctor-fiscal-settings__status-content">
                                <strong>{t('afip_connection_success')}</strong>
                                <pre className="doctor-fiscal-settings__status-details">
                                    {JSON.stringify(statusDetails, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {connectionStatus === 'error' && (
                        <div className="doctor-fiscal-settings__status-box doctor-fiscal-settings__status-box--error animate-fadeIn">
                            <div className="doctor-fiscal-settings__status-icon">
                                <Icon name="error" size="1.5rem" />
                            </div>
                            <div className="doctor-fiscal-settings__status-content">
                                <strong>{t('afip_connection_error')}</strong>
                                <p className="doctor-fiscal-settings__status-message">{String(statusDetails)}</p>
                            </div>
                        </div>
                    )}

                    <details className="doctor-fiscal-settings__guide">
                        <summary className="doctor-fiscal-settings__guide-summary">
                            <Icon name="history_edu" size="1.2rem" />
                            {t('afip_setup_guide')}
                        </summary>
                        <ol className="doctor-fiscal-settings__guide-list">
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

export default DoctorFiscalSettings;
