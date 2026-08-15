import React from 'react';
import { ConfigToggle } from '@/features/config/components/ui/ConfigToggle';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import styles from './GeneralSettings.module.css';

/**
 * GeneralSettings Feature Component.
 * Orchestrates system functionalities, permissions and networking URLs.
 */
/**
 * PermissionsGroup Section Component.
 */
const PermissionsGroup = ({ settings, updateSetting, isAdmin }) => {
    return (
        <article className="config-group">
            <header className="config-group__header">
                <h4 className="config-group__title">Gestión de Secretarias (CRUD)</h4>
            </header>
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
        </article>
    );
};

/**
 * UrlConfiguration Section Component.
 */
const UrlConfiguration = ({ settings, updateSetting, isAdmin, onShowQr }) => {
    return (
        <div className="config-grid">
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
                <div className={`${styles.GeneralSettings__urlGroup}`}>
                    <Input
                        type="text"
                        id="staff-base-url"
                        className={`${styles.GeneralSettings__urlInput}`}
                        placeholder="http://192.168.0.x:5173"
                        value={settings.staff_base_url || ''}
                        onChange={(e) => updateSetting('staff_base_url', e.target.value)}
                        disabled={!isAdmin}
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

export const GeneralSettings = ({ user, settings, updateSetting, onShowQr }) => {
    const isAdmin = user?.role === 'admin';

    return (
        <div className={`${styles.GeneralSettings__root} tab-panel animate-fade-in`}>
            {/* Functionalities and Permissions */}
            <article className="config-section">
                <header className="config-section__header">
                    <Icon name="settings" size="1.5rem" className="config-section__icon" />
                    <h3 className="config-section__title">Funcionalidades y Permisos</h3>
                </header>

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

                    <PermissionsGroup settings={settings} updateSetting={updateSetting} isAdmin={isAdmin} />

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
            </article>

            {/* System URLs */}
            <article className="config-section">
                <header className="config-section__header">
                    <Icon name="link" size="1.5rem" className="config-section__icon" />
                    <h3 className="config-section__title">Direcciones del Sistema</h3>
                </header>

                <div className="config-section__body">
                    <UrlConfiguration settings={settings} updateSetting={updateSetting} isAdmin={isAdmin} onShowQr={onShowQr} />
                </div>
            </article>

            {/* Mobile App Download */}
            <article className="config-section">
                <header className="config-section__header">
                    <Icon name="smartphone" size="1.5rem" className="config-section__icon" />
                    <h3 className="config-section__title">Aplicación Móvil</h3>
                </header>

                <div className="config-section__body">
                    <article className={`${styles.GeneralSettings__appCard}`}>
                        <header className={`${styles.GeneralSettings__appInfo}`}>
                            <h4 className={`${styles.GeneralSettings__appTitle}`}>Descargar APK para Android</h4>
                            <p className={`${styles.GeneralSettings__appDescription}`}>Instala la aplicación nativa para una gestión más rápida desde el celular.</p>
                        </header>
                        <Button
                            variant="primary"
                            icon={<Icon name="DOWNLOAD" size="1.1rem" />}
                            onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                        >
                            Descargar APK
                        </Button>
                    </article>
                </div>
            </article>
        </div>
    );
};

