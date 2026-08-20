import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLayoutController } from '@/features/layout/hooks/useLayoutController';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { LanguageSelector } from '@/components/atoms/LanguageSelector';
import { ThemeToggle } from '@/components/atoms/ThemeToggle';
import { NavbarLink } from './NavbarLink';
import { NavbarDropdown } from './NavbarDropdown';
import styles from './Navbar.module.css';

/**
 * ECC-Pattern: Refactored Navbar (Orchestrator).
 * Uses Atomic Design (Atoms/Molecules) and clean separation of navigation logic.
 */
export const Navbar = () => {
    const {
        user, logout, t, settings,
        location, doctors,
        language, toggleLanguage,
        isStaff, isAdmin, isSecretary, isPatient, isDoctor
    } = useLayoutController();

    const [openDropdown, setOpenDropdown] = useState(null); // 'admin' | 'spreadsheets' | 'user' | null

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
        <header className={styles.Navbar__root}>
            <div className={styles.Navbar__container}>
                {/* --- Left: Branding --- */}
                <div className={styles.Navbar__left}>
                    <Link to="/dashboard" className={styles.Navbar__logo}>
                        <div className={styles.Navbar__logoIcon}>
                            <Icon name="DASHBOARD" size="1.5rem" color="var(--primary-color)" />
                        </div>
                        <span className={styles.Navbar__logoText}>{t('app_name')}</span>
                    </Link>
                </div>

                {/* --- Center: Main Navigation (Refactored) --- */}
                <nav className={styles.Navbar__nav}>
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
                            {doctors.map(d => {
                                if (!d.spreadsheet_id || (isDoctor && d.user_id !== (user.user_id || user.id))) return null;
                                return (
                                    <a key={d.id} href={`https://docs.google.com/spreadsheets/d/${d.spreadsheet_id}`}
                                       target="_blank" rel="noopener noreferrer" className={styles.Navbar__link}>
                                        <Icon name="SPREADSHEETS" />
                                        {isDoctor ? (t('my_spreadsheet') || 'Mi Planilla') : d.full_name.split(' ')[0]}
                                    </a>
                                );
                            })}
                        </NavbarDropdown>
                    )}

                    {/* Admin Dropdown */}
                    {isStaff && (
                        <NavbarDropdown 
                            label={t('administration')}
                            isOpen={openDropdown === 'admin'}
                            onToggle={() => handleToggle('admin')}
                        >
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
                <div className={styles.Navbar__right}>
                    <div className={styles.Navbar__actions}>
                        <ThemeToggle />
                        <div className={styles.Navbar__actionIcon}>
                            <Icon name="NOTIFICATIONS" size="1.2rem" />
                            <span className={styles.badge}></span>
                        </div>
                        <LanguageSelector 
                            currentLanguage={language} 
                            onToggleLanguage={toggleLanguage} 
                        />
                    </div>
                    
                    <div className={`${styles.Navbar__dropdown} ${openDropdown === 'user' ? styles.Navbar__dropdownOpen : ''}`}>
                        <button
                            type="button"
                            className={styles.Navbar__userButton}
                            onClick={() => handleToggle('user')}
                            aria-expanded={openDropdown === 'user'}
                            aria-haspopup="menu"
                        >
                            <div className={styles.Navbar__avatar}>
                                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className={styles.Navbar__info}>
                                <span className={styles.Navbar__name}>{user?.full_name || user?.username}</span>
                                <span className={styles.Navbar__role}>{user?.role}</span>
                            </div>
                            <Icon name={openDropdown === 'user' ? 'EXPAND_LESS' : 'EXPAND_MORE'} size="1rem" />
                        </button>
                        {openDropdown === 'user' && (
                            <div className={styles.Navbar__dropdownContent} role="menu">
                                <NavbarLink to="/profile" label={t('profile')} onClick={() => setOpenDropdown(null)} icon={<Icon name="PROFILE" />} />
                            </div>
                        )}
                    </div>

                    <Button variant="ghost" onClick={logout} icon={<Icon name="LOGOUT" size="1.2rem" />} />
                </div>
            </div>
        </header>
    );
};
