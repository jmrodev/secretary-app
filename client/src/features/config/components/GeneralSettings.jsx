import React from 'react';
import ConfigToggle from './ConfigToggle';
import ConfigField from './ConfigField';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';

/**
 * GeneralSettings Feature Component.
 * Orchestrates system functionalities, permissions and networking URLs.
 */
const renderPermissionsGroup = (settings, updateSetting, isAdmin) => {
    return (
        <div className="config-group">
            <div className="config-group__header">
                <h4 className="config-group__title">Gestión de Secretarias (CRUD)</h4>
            </div>
            <div className="config-group__items">
                <ConfigToggle
                    id="sec-crud-appointments"
                    label="Turnos (Cualquier estado)"
                    checked={settings.enable_secretary_crud_appointments === 'true'}
                    onChange={(val) => updateSetting('enable_secretary_crud_appointments', val)}
                    disabled={!isAdmin}
                />
                <ConfigToggle
                    id="sec-crud-requests"
                    label="Flujo de Solicitudes (Requests)"
                    checked={settings.enable_secretary_crud_requests === 'true'}
                    onChange={(val) => updateSetting('enable_secretary_crud_requests', val)}
                    disabled={!isAdmin}
                />
                <ConfigToggle
                    id="sec-crud-prescriptions"
                    label="Recetas (Modificar/Eliminar)"
                    checked={settings.enable_secretary_crud_prescriptions === 'true'}
                    onChange={(val) => updateSetting('enable_secretary_crud_prescriptions', val)}
                    disabled={!isAdmin}
                />
                <ConfigToggle
                    id="sec-crud-licenses"
                    label="Licencias y Certificados"
                    checked={settings.enable_secretary_crud_licenses === 'true'}
                    onChange={(val) => updateSetting('enable_secretary_crud_licenses', val)}
                    disabled={!isAdmin}
                />
                <ConfigToggle
                    id="sec-crud-files"
                    label="Archivos de Pacientes"
                    checked={settings.enable_secretary_crud_files === 'true'}
                    onChange={(val) => updateSetting('enable_secretary_crud_files', val)}
                    disabled={!isAdmin}
                />
            </div>
        </div>
    );
};

const renderUrlConfiguration = (settings, updateSetting, isAdmin, onShowQr) => {
    return (
        <div className="config-grid config-grid--2col">
            <ConfigField
                id="public-base-url"
                label="URL Pública (Internet)"
                type="url"
                placeholder="https://mi-consultorio.trycloudflare.com"
                value={settings.public_base_url || ''}
                onChange={(e) => updateSetting('public_base_url', e.target.value)}
                disabled={!isAdmin}
            />

            <div className="config-field">
                <label className="config-field__label" htmlFor="staff-base-url">
                    URL Local (Red Clínica)
                </label>
                <div className="config-flex config-flex--gap-2">
                    <input
                        type="text"
                        id="staff-base-url"
                        className="input-field config-flex__item--grow"
                        placeholder="http://192.168.0.x:5173"
                        value={settings.staff_base_url || ''}
                        onChange={(e) => updateSetting('staff_base_url', e.target.value)}
                        readOnly={!isAdmin}
                    />
                    <Button
                        variant="secondary"
                        onClick={onShowQr}
                        title="Ver QR Staff"
                        icon={<Icon name="smartphone" size="1.2rem" />}
                    >
                        QR
                    </Button>
                </div>
                <span className="config-field__hint">
                    Para conectar dispositivos locales.
                </span>
            </div>
        </div>
    );
};

const GeneralSettings = ({ user, settings, updateSetting, onShowQr }) => {
    const isAdmin = user.role === 'admin';

    return (
        <div className="tab-panel animate-fadeIn">
            {/* Functionalities and Permissions */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="settings" size="1.5rem" className="config-section__icon" />
                    <h3 className="config-section__title">Funcionalidades y Permisos</h3>
                </div>

                <div className="config-section__body">
                    <ConfigToggle
                        id="opt-rentals"
                        label="Activar Alquiler de Consultorios"
                        checked={settings.enable_office_rentals === 'true'}
                        onChange={(val) => updateSetting('enable_office_rentals', val)}
                        disabled={!isAdmin}
                    />

                    <ConfigToggle
                        id="allow-secretary-edit-past"
                        label="Permitir a Secretarias editar turnos anteriores"
                        checked={settings.allow_secretary_edit_past_appointments === 'true'}
                        onChange={(val) => updateSetting('allow_secretary_edit_past_appointments', val)}
                        disabled={!isAdmin}
                    />

                    {renderPermissionsGroup(settings, updateSetting, isAdmin)}

                    <ConfigToggle
                        id="enable-secretary-finance-crud"
                        label="Permitir a Secretarias corregir montos y eliminar transacciones (CRUD Finanzas)"
                        checked={settings.enable_secretary_finance_crud === 'true'}
                        onChange={(val) => updateSetting('enable_secretary_finance_crud', val)}
                        disabled={!isAdmin}
                    />

                    <ConfigToggle
                        id="allow-admin-edit-finance-date"
                        label="[ADMIN] Permitir editar FECHA de pago en Finanzas"
                        checked={settings.allow_admin_edit_finance_date === 'true'}
                        onChange={(val) => updateSetting('allow_admin_edit_finance_date', val)}
                        disabled={!isAdmin}
                    />
                </div>
            </div>

            {/* System URLs */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="link" size="1.5rem" className="config-section__icon" />
                    <h3 className="config-section__title">Direcciones del Sistema</h3>
                </div>

                <div className="config-section__body">
                    {renderUrlConfiguration(settings, updateSetting, isAdmin, onShowQr)}
                </div>
            </div>

            {/* Mobile App Download */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="smartphone" size="1.5rem" className="config-section__icon" />
                    <h3 className="config-section__title">Aplicación Móvil</h3>
                </div>

                <div className="config-section__body">
                    <div className="dashboard-card bg-slate-50 border-slate-200">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">Descargar APK para Android</h4>
                                <p className="text-sm text-slate-500">Instala la aplicación nativa para una gestión más rápida desde el celular.</p>
                            </div>
                            <Button
                                variant="primary"
                                icon={<Icon name="DOWNLOAD" size="1.1rem" />}
                                onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                            >
                                Descargar APK
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
