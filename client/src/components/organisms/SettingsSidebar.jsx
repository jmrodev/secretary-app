import React from 'react';
import Icon from '../atoms/Icon';
import './SettingsSidebar.css';

const SettingsSidebar = ({ activeSection, onSelect, t, user }) => {
    const MenuItem = ({ id, icon, label, description }) => (
        <button
            className={`settings-sidebar__item ${activeSection === id ? 'settings-sidebar__item--active' : ''}`}
            onClick={() => onSelect(id)}
        >
            <Icon name={icon} className="settings-sidebar__icon" />
            <div className="settings-sidebar__text">
                <span className="settings-sidebar__label">{label}</span>
                {description && <span className="settings-sidebar__desc">{description}</span>}
            </div>
        </button>
    );

    const MenuGroup = ({ title, children }) => (
        <div className="settings-sidebar__group">
            <h3 className="settings-sidebar__title">{title}</h3>
            <div className="settings-sidebar__list">
                {children}
            </div>
        </div>
    );

    return (
        <aside className="settings-sidebar">
            <MenuGroup title={t('personal') || 'Personal'}>
                <MenuItem
                    id="profile"
                    icon="PROFILE"
                    label={t('profile') || 'Mi Perfil'}
                    description={t('profile_subtitle') || 'Datos personales y cuenta'}
                />
            </MenuGroup>

            {(user.role === 'admin' || user.role === 'secretary') && (
                <MenuGroup title={t('administration') || 'Administración'}>
                    <MenuItem
                        id="doctors"
                        icon="DOCTORS"
                        label={t('doctors') || 'Doctores'}
                        description={t('doctors_manage_subtitle') || 'Gestión de personal médico'}
                    />
                    <MenuItem
                        id="reports"
                        icon="REPORTS"
                        label={t('reports') || 'Reportes Financieros'}
                        description={t('reports_subtitle') || 'Estadísticas y balances'}
                    />
                    <MenuItem
                        id="institutions"
                        icon="INSTITUTIONS"
                        label={t('institutions') || 'Instituciones'}
                        description={t('institutions_manage') || 'Obras sociales y convenios'}
                    />
                </MenuGroup>
            )}

            {(user.role === 'admin') && (
                <MenuGroup title={t('security') || 'Seguridad'}>
                    <MenuItem
                        id="users"
                        icon="USERS"
                        label={t('users') || 'Usuarios'}
                        description={t('manage_users') || 'Gestión de cuentas'}
                    />
                    <MenuItem
                        id="logs"
                        icon="LOGS"
                        label={t('audit_logs') || 'Auditoría'}
                        description={t('security_logs') || 'Registro de actividad'}
                    />
                </MenuGroup>
            )}

            {(user.role === 'admin' || user.role === 'secretary') && (
                <MenuGroup title={t('system_config') || 'Configuración'}>
                    <MenuItem
                        id="general"
                        icon="SETTINGS"
                        label={t('general') || 'General'}
                    />
                    <MenuItem
                        id="communications"
                        icon="CAMPAIGN"
                        label={t('communications') || 'Comunicaciones'}
                    />
                    <MenuItem
                        id="integrations"
                        icon="EXTENSION"
                        label={t('integrations') || 'Integraciones'}
                    />
                    <MenuItem
                        id="billing"
                        icon="RECEIPT_LONG"
                        label={t('billing') || 'Facturación'}
                    />
                    <MenuItem
                        id="data"
                        icon="DATABASE"
                        label={t('data') || 'Datos'}
                    />
                </MenuGroup>
            )}
        </aside>
    );
};

export default SettingsSidebar;
