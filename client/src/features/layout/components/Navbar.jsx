import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSidebarController } from '@/features/layout/hooks/useSidebarController';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import LanguageSelector from '@/components/atoms/LanguageSelector';
import './Navbar.css';

/**
 * Navbar Organism (Feature Component).
 * Global top navigation component with role-based links and user controls.
 */
const Navbar = () => {
    const {
        user, logout, t, settings,
        location, doctors,
        isStaff, isAdmin, isSecretary, isPatient, isDoctor
    } = useSidebarController();

    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [isSpreadsheetsOpen, setIsSpreadsheetsOpen] = useState(false);

    if (!user) return null;

    const getLinkClass = (path) => 
        `navbar__link ${location.pathname === path ? 'navbar__link--active' : ''}`;

    const toggleAdmin = () => {
        setIsAdminOpen(!isAdminOpen);
        setIsSpreadsheetsOpen(false);
    };

    const toggleSpreadsheets = () => {
        setIsSpreadsheetsOpen(!isSpreadsheetsOpen);
        setIsAdminOpen(false);
    };

    return (
        <header className="navbar">
            <div className="navbar__container">
                <div className="navbar__left">
                    <Link to="/dashboard" className="navbar__logo">
                        <div className="navbar__logo-icon">
                            <Icon name="DASHBOARD" size="1.5rem" color="var(--primary-color)" />
                        </div>
                        <span className="navbar__logo-text">{t('app_name')}</span>
                    </Link>
                </div>

                <nav className="navbar__nav">
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
                        <div className={`navbar__dropdown ${isSpreadsheetsOpen ? 'navbar__dropdown--open' : ''}`}>
                            <div className="navbar__dropdown-trigger" onClick={toggleSpreadsheets}>
                                {t('spreadsheets') || 'Planillas'}
                                <Icon name={isSpreadsheetsOpen ? 'EXPAND_LESS' : 'EXPAND_MORE'} size="1rem" />
                            </div>
                            {isSpreadsheetsOpen && (
                                <div className="navbar__dropdown-content">
                                    {isDoctor ? (
                                        doctors
                                            .filter(d => d.user_id === (user.user_id || user.id) && d.spreadsheet_id)
                                            .map(d => (
                                                <a
                                                    key={d.id}
                                                    href={`https://docs.google.com/spreadsheets/d/${d.spreadsheet_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="navbar__link"
                                                >
                                                    <Icon name="SPREADSHEETS" className="navbar__link-icon" />
                                                    {t('my_spreadsheet') || 'Mi Planilla'}
                                                </a>
                                            ))
                                    ) : (
                                        doctors
                                            .filter(d => d.spreadsheet_id)
                                            .map(d => (
                                                <a
                                                    key={d.id}
                                                    href={`https://docs.google.com/spreadsheets/d/${d.spreadsheet_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="navbar__link"
                                                    title={`Planilla de ${d.full_name}`}
                                                >
                                                    <Icon name="SPREADSHEETS" className="navbar__link-icon" />
                                                    {d.full_name.split(' ')[0]}
                                                </a>
                                            ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Admin Dropdown */}
                    {isStaff && (
                        <div className={`navbar__dropdown ${isAdminOpen ? 'navbar__dropdown--open' : ''}`}>
                            <div className="navbar__dropdown-trigger" onClick={toggleAdmin}>
                                {t('administration')}
                                <Icon name={isAdminOpen ? 'EXPAND_LESS' : 'EXPAND_MORE'} size="1rem" />
                            </div>
                            {isAdminOpen && (
                                <div className="navbar__dropdown-content">
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

                <div className="navbar__right">
                    <div className="navbar__actions">
                        <div className="navbar__action-icon">
                            <Icon name="NOTIFICATIONS" size="1.2rem" />
                            <span className="navbar__badge"></span>
                        </div>
                        <LanguageSelector />
                    </div>
                    
                    <div className="navbar-user">
                        <div className="navbar-user__avatar">
                            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="navbar-user__info">
                            <span className="navbar-user__name">{user?.full_name || user?.username}</span>
                            <span className="navbar-user__role">{user?.role}</span>
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
