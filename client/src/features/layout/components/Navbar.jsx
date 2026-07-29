import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLayoutController } from '@/features/layout/hooks/useLayoutController';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import LanguageSelector from '@/components/atoms/LanguageSelector';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import NavbarLink from './NavbarLink';
import NavbarDropdown from './NavbarDropdown';
import styles from './Navbar.module.css';

/**
 * ECC-Pattern: Refactored Navbar (Orchestrator).
 * Uses Atomic Design (Atoms/Molecules) and clean separation of navigation logic.
 */
const Navbar = () => {
    const {
        user, logout, t, settings,
        location, doctors,
        language, toggleLanguage,
        isStaff, isAdmin, isSecretary, isPatient, isDoctor
    } = useLayoutController();

    const [openDropdown, setOpenDropdown] = useState(null); // 'admin' | 'spreadsheets' | null

    // ECC: Navigation Configuration (Computed during render)
    const navLinks = useMemo(() => [
        { path: '/dashboard', label: t('dashboard'), show: true },
        { path: '/appointments', label: t('appointments'), show: !isAdmin },
        { path: '/patients', label: t('patients'), show: !isPatient && !isAdmin },
        { path: '/insurances', label: t('insurances'), show: isSecretary },
        { path: '/rentals', label: t('office_rentals'), show: settings?.enable_office_rentals === 'true' && !isAdmin },
        { path: '/documents', label: t('medical_documents'), show: !isAdmin },
        { path: '/finances', label: t('finances'), show: isSecretary }
    ].filter(l => l.show), [t, isAdmin, isPatient, isSecretary, settings?.enable_office_rentals]);

    if (!user) return null;

    const handleToggle = (key) => setOpenDropdown(prev => prev === key ? null : key);

    return (
        <header className={styles.root}>
            <div className={styles.container}>
                {/* --- Left: Branding --- */}
                <div className={styles.left}>
                    <Link to="/dashboard" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Icon name="DASHBOARD" size="1.5rem" color="var(--primary-color)" />
                        </div>
                        <span className={styles.logoText}>{t('app_name')}</span>
                    </Link>
                </div>

                {/* --- Center: Main Navigation (Refactored) --- */}
                <nav className={styles.nav}>
                    {navLinks.map(link => (
                        <NavbarLink 
                            key={link.path}
                            to={link.path}
                            label={link.label}
                            isActive={location.pathname === link.path}
                        />
                    ))}

                    {/* Spreadsheets Dropdown */}
                    {doctors.length > 0 && (
                        <NavbarDropdown 
                            label={t('spreadsheets') || 'Planillas'}
                            isOpen={openDropdown === 'spreadsheets'}
                            onToggle={() => handleToggle('spreadsheets')}
                        >
                            {doctors.filter(d => d.spreadsheet_id && (!isDoctor || d.user_id === (user.user_id || user.id))).map(d => (
                                <a key={d.id} href={`https://docs.google.com/spreadsheets/d/${d.spreadsheet_id}`} 
                                   target="_blank" rel="noopener noreferrer" className={styles.link}>
                                    <Icon name="SPREADSHEETS" />
                                    {isDoctor ? (t('my_spreadsheet') || 'Mi Planilla') : d.full_name.split(' ')[0]}
                                </a>
                            ))}
                        </NavbarDropdown>
                    )}

                    {/* Admin Dropdown */}
                    {isStaff && (
                        <NavbarDropdown 
                            label={t('administration')}
                            isOpen={openDropdown === 'admin'}
                            onToggle={() => handleToggle('admin')}
                        >
                            <NavbarLink to="/profile" label={t('profile')} onClick={() => setOpenDropdown(null)} icon={<Icon name="PROFILE" />} />
                            <NavbarLink to="/doctors" label={t('doctors')} onClick={() => setOpenDropdown(null)} icon={<Icon name="DOCTORS" />} />
                            <NavbarLink to="/reports" label={t('reports')} onClick={() => setOpenDropdown(null)} icon={<Icon name="REPORTS" />} />
                            <NavbarLink to="/institutions" label={t('institutions')} onClick={() => setOpenDropdown(null)} icon={<Icon name="INSTITUTIONS" />} />
                            <NavbarLink to="/holidays" label="Feriados" onClick={() => setOpenDropdown(null)} icon={<Icon name="beach_access" />} />
                            {isAdmin && (
                                <>
                                    <NavbarLink to="/admin/users" label={t('users')} onClick={() => setOpenDropdown(null)} icon={<Icon name="USERS" />} />
                                    <NavbarLink to="/logs" label={t('audit_logs')} onClick={() => setOpenDropdown(null)} icon={<Icon name="LOGS" />} />
                                </>
                            )}
                            <NavbarLink to="/config?tab=general" label={t('system_config')} onClick={() => setOpenDropdown(null)} icon={<Icon name="SETTINGS" />} />
                        </NavbarDropdown>
                    )}
                </nav>

                {/* --- Right: User & Actions --- */}
                <div className={styles.right}>
                    <div className={styles.actions}>
                        <ThemeToggle />
                        <div className={styles.actionIcon}>
                            <Icon name="NOTIFICATIONS" size="1.2rem" />
                            <span className={styles.badge}></span>
                        </div>
                        <LanguageSelector 
                            currentLanguage={language} 
                            onToggleLanguage={toggleLanguage} 
                        />
                    </div>
                    
                    <div className={styles.navbarUser}>
                        <div className={styles.avatar}>
                            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className={styles.info}>
                            <span className={styles.name}>{user?.full_name || user?.username}</span>
                            <span className={styles.role}>{user?.role}</span>
                        </div>
                    </div>

                    <Button variant="ghost" onClick={logout} icon={<Icon name="LOGOUT" size="1.2rem" />} />
                </div>
            </div>
        </header>
    );
};

export default Navbar;
