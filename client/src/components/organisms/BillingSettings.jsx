import React, { useState, useEffect } from 'react';
import ConfigField from '../molecules/ConfigField';
import Button from '../atoms/Button';
import api from '../../api/axios';
import { useMessage } from '../../context/MessageContext';

const BillingSettings = ({ user, settings, updateSetting }) => {
    const { showMessage } = useMessage();
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
            showMessage('CSR generado correctamente', 'success');
        } catch (err) {
            alert('Error generando CSR: ' + (err.response?.data?.error || err.message));
        } finally {
            setGeneratingCsr(false);
        }
    };

    const checkStatus = async () => {
        setChecking(true);
        try {
            const res = await api.get('/billing/status');
            setStatus(res.data);
            showMessage('Conexión con AFIP validada', 'success');
        } catch (err) {
            setStatus({ error: err.response?.data?.error || 'Error de conexión' });
            showMessage('Fallo al conectar con AFIP', 'error');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="tab-panel animate-fadeIn">
            <div className="config-section">
                <div className="config-section__header">
                    <span className="config-section__icon">🧾</span>
                    <h4 className="config-section__title">Configuración de Facturación ARCA (AFIP)</h4>
                </div>

                <div className="config-section__body">
                    <div className="config-grid config-grid--2col">
                        <ConfigField
                            label="CUIT de Facturación"
                            type="text"
                            placeholder="Ej: 20111111112"
                            value={settings.afip_cuit || ''}
                            onChange={(e) => updateSetting('afip_cuit', e.target.value)}
                            disabled={!isAdmin}
                            hint="CUIT sin guiones del titular de la facturación."
                        />
                        <ConfigField
                            label="Punto de Venta"
                            type="number"
                            placeholder="1"
                            value={settings.afip_pto_vta || '1'}
                            onChange={(e) => updateSetting('afip_pto_vta', e.target.value)}
                            disabled={!isAdmin}
                            hint="Número de punto de venta configurado en AFIP."
                        />
                    </div>

                    <ConfigField
                        label="Entorno AFIP"
                        type="select"
                        value={settings.afip_environment || 'testing'}
                        onChange={(e) => updateSetting('afip_environment', e.target.value)}
                        disabled={!isAdmin}
                        options={[
                            { value: 'testing', label: 'Homologación (Pruebas)' },
                            { value: 'production', label: 'Producción (Real)' }
                        ]}
                        hint="ADVERTENCIA: El modo Producción genera facturas legales reales."
                    />

                    <div className="config-section__divider"></div>

                    <div className="config-group">
                        <div className="config-group__header">
                            <h5 className="config-group__title">Estado de la Conexión</h5>
                        </div>
                        <div className="config-group__items">
                            {status ? (
                                <div className={`text-sm ${status.error ? 'text-danger' : 'text-success'}`}>
                                    {status.error ? (
                                        <p>❌ Error: {status.error}</p>
                                    ) : (
                                        <>
                                            <p>✅ Conectado a AFIP ({status.environment})</p>
                                            <p className="config-field__hint">App: {status.afip_status.AppServer}, DB: {status.afip_status.DbServer}, Auth: {status.afip_status.AuthServer}</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="config-field__hint">No se ha verificado la conexión todavía.</p>
                            )}
                        </div>

                        <div className="config-actions" style={{ marginTop: '1rem' }}>
                            <Button
                                variant="secondary"
                                onClick={checkStatus}
                                loading={checking}
                            >
                                🔄 Verificar Conexión con AFIP
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-section">
                <div className="config-section__header">
                    <span className="config-section__icon">🔑</span>
                    <h4 className="config-section__title">Certificados Digitales</h4>
                </div>
                <div className="config-section__body">
                    <p className="config-field__hint" style={{ marginBottom: '1.5rem' }}>
                        Para habilitar la facturación, necesitas generar un Certificado de Homologación (Pruebas) o Producción en la web de AFIP.
                        Sigue estos pasos:
                        <br /><br />
                        1. Genera el pedido de certificado (CSR) con el botón de abajo.
                        <br />
                        2. Ingresa a AFIP con Clave Fiscal: <a href="https://auth.afip.gob.ar/contribuyente_/login.xhtml" target="_blank" rel="noreferrer" className="link">Acceder a AFIP</a>
                        <br />
                        3. Busca el servicio <b>"WSASS - Autogestión Certificados Homologación"</b>.
                        <br />
                        4. Crea un certificado nuevo pegando el texto CSR.
                        <br />
                        5. Descarga el archivo .crt y súbelo aquí.
                    </p>
                    <div className="config-actions">
                        <Button variant="primary" onClick={generateCsr} loading={generatingCsr}>
                            ⚙️ Generar CSR (Pedido de Certificado)
                        </Button>
                        <Button variant="ghost" disabled={true} title="Próximamente">Subir Certificado (.crt)</Button>
                    </div>

                    {generatedCsr && (
                        <div className="config-group" style={{ background: 'white' }}>
                            <div className="config-group__header">
                                <h5 className="config-group__title">Tu Pedido de Certificado (CSR)</h5>
                            </div>
                            <p className="config-field__hint" style={{ marginBottom: '0.5rem' }}>Copia este texto exacto y pégalo en la web de AFIP:</p>
                            <textarea
                                className="input-field"
                                style={{ height: '200px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                                readOnly
                                value={generatedCsr}
                                onClick={(e) => e.target.select()}
                            />
                            <div className="config-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(generatedCsr); showMessage('Copiado al portapapeles', 'success'); }}>
                                    📋 Copiar
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
