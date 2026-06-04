import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLayoutController } from '@/features/layout/hooks/useLayoutController';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import LanguageSelector from '@/components/atoms/LanguageSelector';
import styles from './Navbar.module.css';

/**
 * Navbar Organism (Feature Component).
 * Global top navigation component with role-based links and user controls.
 */
const Navbar = () => {
    const {
        user, logout, t, settings,
        location, doctors,
        language, toggleLanguage,
        isStaff, isAdmin, isSecretary, isPatient, isDoctor
    } = useLayoutController();

    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [isSpreadsheetsOpen, setIsSpreadsheetsOpen] = useState(false);

    if (!user) return null;

    const getLinkClass = (path) => 
        `navbar__link ${location.pathname === path ? styles.linkActive : ''}`;

    const toggleAdmin = () => {
        setIsAdminOpen(!isAdminOpen);
        setIsSpreadsheetsOpen(false);
    };

    const toggleSpreadsheets = () => {
        setIsSpreadsheetsOpen(!isSpreadsheetsOpen);
        setIsAdminOpen(false);
    };

    const handleKeyDown = (e, toggleFn) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFn();
        }
    };

    return (
        <header className={`${styles.root}`}>
            <div className={`${styles.container}`}>
                <div className={`${styles.left}`}>
                    <Link to="/dashboard" className={`${styles.logo}`}>
                        <div className={`${styles.logoIcon}`}>
                            <Icon name="DASHBOARD" size="1.5rem" color="var(--primary-color)" />
                        </div>
                        <span className={`${styles.logoText}`}>{t('app_name')}</span>
                    </Link>
                </div>

                <nav className={`${styles.nav}`}>
                    <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                        {t('dashboard')}
                    </Link>

                    {!isAdmin && (
                        <Link to="/appointments" className={getLinkClass('/appointments')}>
                            {t('appointments')}
                        </Link>
                    )}

                    {!isPatient && !isAdmin && (
                        <Link to="/patients" className={getLinkClass('/patients')}>
                            {t('patients')}
                        </Link>
                    )}

                    {isSecretary && (
                        <Link to="/insurances" className={getLinkClass('/insurances')}>
                            {t('insurances') || 'Obras Sociales'}
                        </Link>
                    )}

                    {settings.enable_office_rentals === 'true' && !isAdmin && (
                        <Link to="/rentals" className={getLinkClass('/rentals')}>
                            {t('office_rentals')}
                        </Link>
                    )}

                    {!isAdmin && (
                        <Link to="/documents" className={getLinkClass('/documents')}>
                            {t('medical_documents')}
                        </Link>
                    )}

                    {isSecretary && (
                        <Link to="/finances" className={getLinkClass('/finances')}>
                            {t('finances')}
                        </Link>
                    )}

                    {/* Spreadsheets Dropdown */}
                    {doctors.length > 0 && (
                        <div className={`${styles.dropdown} ${isSpreadsheetsOpen ? 'navbar__dropdown--open' : ''}`}>
                            <div 
                                className={`${styles.dropdownTrigger}`} 
                                onClick={toggleSpreadsheets}
                                onKeyDown={(e) => handleKeyDown(e, toggleSpreadsheets)}
                                role="button"
                                tabIndex={0}
                            >
                                {t('spreadsheets') || 'Planillas'}
                                <Icon name={isSpreadsheetsOpen ? 'EXPAND_LESS' : 'EXPAND_MORE'} size="1rem" />
                            </div>
                            {isSpreadsheetsOpen && (
                                <div className={`${styles.dropdownContent}`}>
                                    {isDoctor ? (
                                        doctors.reduce((acc, d) => {
                                            if (d.user_id === (user.user_id || user.id) && d.spreadsheet_id) {
                                                acc.push(
                                                    <a
                                                        key={d.id}
                                                        href={`https://docs.google.com/spreadsheets/d/${d.spreadsheet_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`${styles.link}`}
                                                    >
                                                        <Icon name="SPREADSHEETS" className="navbar__link-icon" />
                                                        {t('my_spreadsheet') || 'Mi Planilla'}
                                                    </a>
                                                );
                                            }
                                            return acc;
                                        }, [])
                                    ) : (
                                        doctors.reduce((acc, d) => {
                                            if (d.spreadsheet_id) {
                                                acc.push(
                                                    <a
                                                        key={d.id}
                                                        href={`https://docs.google.com/spreadsheets/d/${d.spreadsheet_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`${styles.link}`}
                                                        title={`Planilla de ${d.full_name}`}
                                                    >
                                                        <Icon name="SPREADSHEETS" className="navbar__link-icon" />
                                                        {d.full_name.split(' ')[0]}
                                                    </a>
                                                );
                                            }
                                            return acc;
                                        }, [])
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Admin Dropdown */}
                    {isStaff && (
                        <div className={`${styles.dropdown} ${isAdminOpen ? 'navbar__dropdown--open' : ''}`}>
                            <div 
                                className={`${styles.dropdownTrigger}`} 
                                onClick={toggleAdmin}
                                onKeyDown={(e) => handleKeyDown(e, toggleAdmin)}
                                role="button"
                                tabIndex={0}
                            >
                                {t('administration')}
                                <Icon name={isAdminOpen ? 'EXPAND_LESS' : 'EXPAND_MORE'} size="1rem" />
                            </div>
                            {isAdminOpen && (
                                <div className={`${styles.dropdownContent}`}>
                                    <Link to="/profile" className={getLinkClass('/profile')} onClick={() => setIsAdminOpen(false)}>
                                        <Icon name="PROFILE" className="navbar__link-icon" />
                                        {t('profile')}
                                    </Link>
                                    <Link to="/doctors" className={getLinkClass('/doctors')} onClick={() => setIsAdminOpen(false)}>
                                        <Icon name="DOCTORS" className="navbar__link-icon" />
                                        {t('doctors')}
                                    </Link>
                                    <Link to="/reports" className={getLinkClass('/reports')} onClick={() => setIsAdminOpen(false)}>
                                        <Icon name="REPORTS" className="navbar__link-icon" />
                                        {t('reports')}
                                    </Link>
                                    <Link to="/institutions" className={getLinkClass('/institutions')} onClick={() => setIsAdminOpen(false)}>
                                        <Icon name="INSTITUTIONS" className="navbar__link-icon" />
                                        {t('institutions')}
                                    </Link>
                                    <Link to="/holidays" className={getLinkClass('/holidays')} onClick={() => setIsAdminOpen(false)}>
                                        <Icon name="beach_access" className="navbar__link-icon" />
                                        Feriados
                                    </Link>
                                    {isAdmin && (
                                        <>
                                            <Link to="/admin/users" className={getLinkClass('/admin/users')} onClick={() => setIsAdminOpen(false)}>
                                                <Icon name="USERS" className="navbar__link-icon" />
                                                {t('users')}
                                            </Link>
                                            <Link to="/logs" className={getLinkClass('/logs')} onClick={() => setIsAdminOpen(false)}>
                                                <Icon name="LOGS" className="navbar__link-icon" />
                                                {t('audit_logs')}
                                            </Link>
                                        </>
                                    )}
                                    <Link to="/config?tab=general" className={getLinkClass('/config')} onClick={() => setIsAdminOpen(false)}>
                                        <Icon name="SETTINGS" className="navbar__link-icon" />
                                        {t('system_config')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                <div className={`${styles.right}`}>
                    <div className={`${styles.actions}`}>
                        <div className={`${styles.actionIcon}`}>
                            <Icon name="NOTIFICATIONS" size="1.2rem" />
                            <span className={`${styles.badge}`}></span>
                        </div>
                        <LanguageSelector 
                            currentLanguage={language} 
                            onToggleLanguage={toggleLanguage} 
                            switchTitle={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                        />
                    </div>
                    
                    <div className={`${styles.navbarUser}`}>
                        <div className={`${styles.avatar}`}>
                            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className={`${styles.info}`}>
                            <span className={`${styles.name}`}>{user?.full_name || user?.username}</span>
                            <span className={`${styles.role}`}>{user?.role}</span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={logout}
                        className="navbar__logout-btn"
                        icon={<Icon name="LOGOUT" size="1.2rem" />}
                    />
                </div>
            </div>
        </header>
    );
};

export default Navbar;
