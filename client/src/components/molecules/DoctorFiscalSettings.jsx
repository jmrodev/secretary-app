
import React from 'react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Switch from '../atoms/Switch';
import FormGroup from './FormGroup';
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

    const handleCopyCsr = () => {
        if (generatedCsr) {
            navigator.clipboard.writeText(generatedCsr);
            // Alert responsibility could be lifted up too, but for UI feedback copy is simple here.
            // Ideally use a toast prop if available.
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
                        label="Habilitar Facturación con ARCA/AFIP"
                        checked={data.afip_enabled === true || data.afip_enabled === 'true' || data.afip_enabled === 1}
                        onChange={(val) => onChangeData({ afip_enabled: val })}
                    />
                </div>

                <div className="doctor-fiscal-settings__grid">
                    <FormGroup label="CUIT Facturación">
                        <Input
                            value={data.afip_cuit || ''}
                            onChange={(e) => onChangeData({ afip_cuit: e.target.value })}
                            placeholder="20123456789"
                        />
                    </FormGroup>
                    <FormGroup label="Punto de Venta">
                        <Input
                            value={data.afip_pto_vta || '1'}
                            onChange={(e) => onChangeData({ afip_pto_vta: e.target.value })}
                            type="number"
                        />
                    </FormGroup>
                </div>
            </div>

            <div className="doctor-fiscal-settings__section">
                <h6 className="doctor-fiscal-settings__title">Certificados Digitales</h6>
                <p className="doctor-fiscal-settings__description">
                    Para facturar, necesitas un certificado válido (.crt) asociado a tu CUIT.
                </p>

                <div className="doctor-fiscal-settings__actions">
                    <Button size="sm" variant="secondary" onClick={onGenerateCsr} loading={generatingCsr}>
                        ⚙️ Generar CSR
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".crt,.key"
                        style={{ display: 'none' }}
                    />
                    <Button size="sm" variant="ghost" onClick={handleUploadClick} loading={uploading}>
                        📤 Subir Certificado (.crt)
                    </Button>
                </div>

                {generatedCsr && showCsrInfo && (
                    <div className="doctor-fiscal-settings__csr-box animated fadeIn">
                        <div className="doctor-fiscal-settings__csr-header">
                            <h6 className="doctor-fiscal-settings__csr-title">CSR Generado (Copiar y pegar en AFIP)</h6>
                            <button onClick={onHideCsrInfo} className="doctor-fiscal-settings__csr-close">Ocultar</button>
                        </div>
                        <textarea
                            readOnly
                            value={generatedCsr}
                            className="doctor-fiscal-settings__textarea"
                            onClick={e => e.target.select()}
                        />
                        <div className="doctor-fiscal-settings__csr-footer">
                            <span className="doctor-fiscal-settings__hint">Copia este texto en la web de AFIP WSASS</span>
                            <Button size="xs" variant="primary" onClick={handleCopyCsr}>
                                Copiar Texto
                            </Button>
                        </div>
                    </div>
                )}

                <div className="doctor-fiscal-settings__status-section">
                    <div className="doctor-fiscal-settings__status-header">
                        <h6 className="doctor-fiscal-settings__title mb-0">Estado de Conexión y Pruebas</h6>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={onTestConnection}
                            loading={connectionStatus === 'checking'}
                        >
                            🔌 Testear Conexión
                        </Button>
                    </div>

                    {connectionStatus === 'ok' && (
                        <div className="doctor-fiscal-settings__status-box doctor-fiscal-settings__status-box--success animate-fadeIn">
                            <div className="doctor-fiscal-settings__status-icon">✅</div>
                            <div className="doctor-fiscal-settings__status-content">
                                <strong>Conexión Exitosa con AFIP</strong>
                                <pre className="doctor-fiscal-settings__status-details">
                                    {JSON.stringify(statusDetails, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {connectionStatus === 'error' && (
                        <div className="doctor-fiscal-settings__status-box doctor-fiscal-settings__status-box--error animate-fadeIn">
                            <div className="doctor-fiscal-settings__status-icon">❌</div>
                            <div className="doctor-fiscal-settings__status-content">
                                <strong>Error de Conexión</strong>
                                <p className="doctor-fiscal-settings__status-message">{String(statusDetails)}</p>
                            </div>
                        </div>
                    )}

                    <details className="mt-2 text-xs text-slate-500 cursor-pointer">
                        <summary className="hover:text-slate-700 font-medium">📜 Guía Rápida de Configuración (Click para ver)</summary>
                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                            <li>Completa <strong>CUIT</strong> y <strong>Punto de Venta</strong> y Habilita la facturación arriba.</li>
                            <li>Haz clic en <strong>Generar CSR</strong>. Copia el texto generado.</li>
                            <li>Entra a AFIP con tu Clave Fiscal. Ve al servicio "Administración de Certificados Digitales".</li>
                            <li>Crea un "Alias" y pega el CSR. Descarga el certificado (archivo <code>.crt</code>).</li>
                            <li>Vuelve aquí y usa <strong>Subir Certificado (.crt)</strong> para cargar ese archivo.</li>
                            <li>En AFIP, ve a "Administrador de Relaciones de Clave Fiscal".</li>
                            <li>Nueva Relación → Busca tu Alias (Computador Fiscal) → Servicio "Facturación Electrónica" → Autorizar "Web Service de Factura Electrónica (wsfe)".</li>
                            <li>Finalmente, haz clic en <strong>Testear Conexión</strong> para validar todo.</li>
                        </ol>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default DoctorFiscalSettings;
