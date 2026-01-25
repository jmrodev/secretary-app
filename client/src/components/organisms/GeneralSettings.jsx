import React from 'react';
import Switch from '../atoms/Switch';
import Button from '../atoms/Button';

const GeneralSettings = ({ user, settings, updateSetting, onShowQr }) => {
    const isAdmin = user.role === 'admin';

    // BEM: config-section
    return (
        <div className="tab-panel animate-in">
            <div className="card">
                <h3 className="config-section-title">🛠️ Funcionalidades y Permisos</h3>
                <div className="space-y-6">
                    <Switch
                        id="opt-rentals"
                        checked={settings.enable_office_rentals === 'true'}
                        onChange={(val) => updateSetting('enable_office_rentals', val)}
                        disabled={!isAdmin}
                        label="Activar Alquiler de Consultorios"
                    />

                    <Switch
                        id="allow-secretary-edit-past"
                        checked={settings.allow_secretary_edit_past_appointments === 'true'}
                        onChange={(val) => updateSetting('allow_secretary_edit_past_appointments', val)}
                        disabled={!isAdmin}
                        label="Permitir a Secretarias editar turnos anteriores"
                    />

                    <Switch
                        id="enable-secretary-unrestricted-crud"
                        checked={settings.enable_secretary_unrestricted_crud === 'true'}
                        onChange={(val) => updateSetting('enable_secretary_unrestricted_crud', val)}
                        disabled={!isAdmin}
                        label="Habilitar Gestión Global (CRUD) de turnos en cualquier estado para Secretarias"
                    />

                    <Switch
                        id="enable-secretary-finance-crud"
                        checked={settings.enable_secretary_finance_crud === 'true'}
                        onChange={(val) => updateSetting('enable_secretary_finance_crud', val)}
                        disabled={!isAdmin}
                        label="Permitir a Secretarias corregir montos y eliminar transacciones (CRUD Finanzas)"
                    />

                    <Switch
                        id="allow-admin-edit-finance-date"
                        checked={settings.allow_admin_edit_finance_date === 'true'}
                        onChange={(val) => updateSetting('allow_admin_edit_finance_date', val)}
                        disabled={!isAdmin}
                        label="[ADMIN] Permitir editar FECHA de pago en Finanzas"
                    />
                </div>

                <div className="section-divider my-8" style={{ height: '1px', background: '#e2e8f0' }}></div>

                <h3 className="config-section-title">🔗 Direcciones del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="input-group">
                        <label className="input-label" htmlFor="public-base-url">URL Pública (Internet)</label>
                        <input
                            type="url"
                            id="public-base-url"
                            className="input-field"
                            placeholder="https://mi-consultorio.trycloudflare.com"
                            value={settings.public_base_url || ''}
                            onChange={(e) => updateSetting('public_base_url', e.target.value)}
                            readOnly={!isAdmin}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="staff-base-url">URL Local (Red Clínica)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="staff-base-url"
                                className="input-field flex-1"
                                placeholder="http://192.168.0.x:5173"
                                value={settings.staff_base_url || ''}
                                onChange={(e) => updateSetting('staff_base_url', e.target.value)}
                                readOnly={!isAdmin}
                            />
                            <Button
                                variant="secondary"
                                onClick={onShowQr}
                                className="flex items-center gap-2"
                                title="Ver QR Staff"
                            >
                                <span>📱</span> <span>QR</span>
                            </Button>
                        </div>
                        <p className="text-sm text-muted mt-2">
                            Para conectar dispositivos locales.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GeneralSettings;
