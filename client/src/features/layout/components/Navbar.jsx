import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLayoutController } from '@/features/layout/hooks/useLayoutController';
import { Icon } from '@/components/atoms/Icon';
import { NavbarCategoryDropdown } from './NavbarCategoryDropdown';
import { UserProfileDropdown } from './UserProfileDropdown';
import styles from './Navbar.module.css';

/**
 * Refactored Categorized Navbar (Level 1 Global Header).
 * Provides clean categorised navigation: Clinical, Administration, System,
 * plus notifications and an integrated UserProfileDropdown.
 */
export const Navbar = () => {
    const {
        user, logout, t, settings,
        doctors, language, toggleLanguage,
        isStaff, isAdmin, isSecretary, isPatient, isDoctor
    } = useLayoutController();

    const location = useLocation();
    const [openCategory, setOpenCategory] = useState(null); // 'clinical' | 'admin' | 'system' | null

    const currentPath = location.pathname;

    // --- 1. Clinical Category ---
    const clinicalItems = useMemo(() => {
        const items = [
            { path: '/dashboard', label: t('dashboard') || 'Dashboard', icon: 'dashboard', show: !isAdmin, isActive: currentPath === '/dashboard' },
            { path: '/appointments', label: t('appointments') || 'Turnos', icon: 'calendar_today', show: !isAdmin, isActive: currentPath === '/appointments' },
            { path: '/patients', label: t('patients') || 'Pacientes', icon: 'people', show: !isPatient && !isAdmin, isActive: currentPath === '/patients' },
            { path: '/documents', label: t('medical_documents') || 'Documentos Médicos', icon: 'description', show: !isAdmin, isActive: currentPath === '/documents' }
        ];

        // Append doctor spreadsheets if available
        if (doctors && doctors.length > 0) {
            doctors.forEach(d => {
                if (!d.spreadsheet_id || (isDoctor && d.user_id !== (user?.user_id || user?.id))) return;
                items.push({
                    path: `https://docs.google.com/spreadsheets/d/${d.spreadsheet_id}`,
                    label: isDoctor ? (t('my_spreadsheet') || 'Mi Planilla') : `${t('spreadsheets') || 'Planilla'} (${d.full_name.split(' ')[0]})`,
                    icon: 'table_chart',
                    external: true,
                    show: true
                });
            });
        }
        return items;
    }, [t, isAdmin, isPatient, isDoctor, user, doctors, currentPath]);

    // --- 2. Admin Category ---
    const adminItems = useMemo(() => [
        { path: '/finances', label: t('finances') || 'Finanzas / Caja', icon: 'attach_money', show: isSecretary, isActive: currentPath === '/finances' },
        { path: '/insurances', label: t('insurances') || 'Obras Sociales', icon: 'verified_user', show: isSecretary, isActive: currentPath === '/insurances' },
        { path: '/institutions', label: t('institutions') || 'Instituciones', icon: 'business', show: isSecretary, isActive: currentPath === '/institutions' },
        { path: '/rentals', label: t('office_rentals') || 'Alquiler Consultorios', icon: 'meeting_room', show: settings?.enable_office_rentals === 'true' && !isAdmin, isActive: currentPath === '/rentals' },
        { path: '/holidays', label: t('holidays') || 'Feriados', icon: 'event_busy', show: isSecretary, isActive: currentPath === '/holidays' }
    ], [t, isSecretary, settings?.enable_office_rentals, isAdmin, currentPath]);

    // --- 3. System Category ---
    const systemItems = useMemo(() => [
        { path: '/config?tab=users', label: t('user_management') || 'Gestión de Usuarios', icon: 'manage_accounts', show: isStaff, isActive: currentPath === '/config' && location.search.includes('users') },
        { path: '/config?tab=modules', label: t('system_config') || 'Configuración del Sistema', icon: 'settings', show: isStaff, isActive: currentPath === '/config' && !location.search.includes('users') },
        { path: '/logs', label: t('audit_logs') || 'Registros de Auditoría', icon: 'history', show: isAdmin, isActive: currentPath === '/logs' }
    ], [t, isStaff, isAdmin, currentPath, location.search]);

    if (!user) return null;

    const isClinicalActive = clinicalItems.some(i => i.isActive);
    const isAdminActive = adminItems.some(i => i.isActive);
    const isSystemActive = systemItems.some(i => i.isActive);

    const handleToggle = (key) => setOpenCategory(prev => prev === key ? null : key);

    return (
        <header className={styles.Navbar__root}>
            <div className={styles.Navbar__container}>
                {/* --- Left: Branding --- */}
                <div className={styles.Navbar__left}>
                    <Link to={isAdmin ? "/config?tab=users" : "/dashboard"} className={styles.Navbar__logo}>
                        <div className={styles.Navbar__logoIcon}>
                            <Icon name="local_hospital" size="1.5rem" color="var(--primary-color)" />
                        </div>
                        <span className={styles.Navbar__logoText}>{t('app_name')}</span>
                    </Link>
                </div>

                {/* --- Center: Categorized Navigation --- */}
                <nav className={styles.Navbar__nav}>
                    <NavbarCategoryDropdown
                        label={t('category_clinical') || 'Clínica'}
                        icon="medical_services"
                        items={clinicalItems}
                        isActive={isClinicalActive}
                        isOpen={openCategory === 'clinical'}
                        onToggle={() => handleToggle('clinical')}
                    />

                    <NavbarCategoryDropdown
                        label={t('category_admin') || 'Administración'}
                        icon="admin_panel_settings"
                        items={adminItems}
                        isActive={isAdminActive}
                        isOpen={openCategory === 'admin'}
                        onToggle={() => handleToggle('admin')}
                    />

                    <NavbarCategoryDropdown
                        label={t('category_system') || 'Sistema'}
                        icon="tune"
                        items={systemItems}
                        isActive={isSystemActive}
                        isOpen={openCategory === 'system'}
                        onToggle={() => handleToggle('system')}
                    />
                </nav>

                {/* --- Right: Notifications & UserProfileDropdown --- */}
                <div className={styles.Navbar__right}>
                    <div className={styles.Navbar__actionIcon} title="Notificaciones">
                        <Icon name="notifications" size="1.25rem" />
                        <span className={styles.Navbar__badge}></span>
                    </div>

                    <UserProfileDropdown
                        user={user}
                        logout={logout}
                        language={language}
                        toggleLanguage={toggleLanguage}
                        t={t}
                        isStaff={isStaff}
                    />
                </div>
            </div>
        </header>
    );
};
