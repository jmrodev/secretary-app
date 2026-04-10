import React from 'react';
import { Link } from 'react-router-dom';
import { useSidebarController } from '../hooks/useSidebarController';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import LanguageSelector from '@/components/atoms/LanguageSelector';
import './Sidebar.css';

/**
 * Sidebar Organism (Feature Component).
 * Global navigation component with role-based links and administrative tools.
 */
const Sidebar = () => {
    const {
        user, logout, t, settings,
        location, doctors,
        isAdminOpen, toggleAdmin,
        getLinkClass,
        isStaff, isAdmin, isSecretary, isDoctor, isPatient, isMedicalStaff
    } = useSidebarController();

    if (!user) return null;

    return (
        <aside className="sidebar">
            <header className="sidebar__header">
                <h2 className="sidebar__title">{t('app_name')}</h2>
            </header>

            <nav className="sidebar__nav">
                <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                    <Icon name="DASHBOARD" className="sidebar__link-icon" />
                    {t('dashboard')}
                </Link>

                {!isAdmin && (
                    <Link to="/appointments" className={getLinkClass('/appointments')}>
                        <Icon name="APPOINTMENTS" className="sidebar__link-icon" />
                        {t('appointments')}
                    </Link>
                )}

                {!isPatient && !isAdmin && (
                    <Link to="/patients" className={getLinkClass('/patients')}>
                        <Icon name="PATIENTS" className="sidebar__link-icon" />
                        {t('patients')}
                    </Link>
                )}

                {isSecretary && (
                    <Link to="/insurances" className={getLinkClass('/insurances')}>
                        <Icon name="INSURANCES" className="sidebar__link-icon" />
                        {t('insurances') || 'Obras Sociales'}
                    </Link>
                )}

                {settings.enable_office_rentals === 'true' && !isAdmin && (
                    <Link to="/rentals" className={getLinkClass('/rentals')}>
                        <Icon name="RENTALS" className="sidebar__link-icon" />
                        {t('office_rentals')}
                    </Link>
                )}

                {!isAdmin && (
                    <Link to="/documents" className={getLinkClass('/documents')}>
                        <Icon name="DOCUMENTS" className="sidebar__link-icon" />
                        {t('medical_documents')}
                    </Link>
                )}

                {isSecretary && (
                    <Link to="/finances" className={getLinkClass('/finances')}>
                        <Icon name="FINANCES" className="sidebar__link-icon" />
                        {t('finances')}
                    </Link>
                )}

                {/* Configuration / Administration Section */}
                {isStaff && (
                    <div className={`sidebar__section sidebar__section--collapsible ${isAdminOpen ? 'sidebar__section--open' : ''}`}>
                        <div
                            className="sidebar__section-header"
                            onClick={toggleAdmin}
                        >
                            <span className="sidebar__section-title">{t('administration')}</span>
                            <Icon
                                name={isAdminOpen ? 'EXPAND_LESS' : 'EXPAND_MORE'}
                                className="sidebar__section-chevron"
                            />
                        </div>

                        <div className="sidebar__section-content">
                            <Link to="/profile" className={getLinkClass('/profile')}>
                                <Icon name="PROFILE" className="sidebar__link-icon" />
                                {t('profile')}
                            </Link>

                            <Link to="/doctors" className={getLinkClass('/doctors')}>
                                <Icon name="DOCTORS" className="sidebar__link-icon" />
                                {t('doctors')}
                            </Link>

                            <Link to="/reports" className={getLinkClass('/reports')}>
                                <Icon name="REPORTS" className="sidebar__link-icon" />
                                {t('reports')}
                            </Link>

                            <Link to="/institutions" className={getLinkClass('/institutions')}>
                                <Icon name="INSTITUTIONS" className="sidebar__link-icon" />
                                {t('institutions')}
                            </Link>

                            {isAdmin && (
                                <>
                                    <Link to="/admin/users" className={getLinkClass('/admin/users')}>
                                        <Icon name="USERS" className="sidebar__link-icon" />
                                        {t('users')}
                                    </Link>
                                    <Link to="/logs" className={getLinkClass('/logs')}>
                                        <Icon name="LOGS" className="sidebar__link-icon" />
                                        {t('audit_logs')}
                                    </Link>
                                </>
                            )}

                            <Link to="/config?tab=general" className={`sidebar__link ${location.pathname === '/config' ? 'sidebar__link--active' : ''}`}>
                                <Icon name="SETTINGS" className="sidebar__link-icon" />
                                {t('system_config')}
                            </Link>
                        </div>
                    </div>
                )}

                {/* Spreadsheet Links Implementation */}
                {doctors.length > 0 && (
                    <div className="sidebar__section">
                        <div className="sidebar__section-title">{t('spreadsheets') || 'Planillas'}</div>
                        {isDoctor ? (
                            doctors
                                .filter(d => d.user_id === (user.user_id || user.id) && d.spreadsheet_id)
                                .map(d => (
                                    <a
                                        key={d.id}
                                        href={`https://docs.google.com/spreadsheets/d/${d.spreadsheet_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="sidebar__link"
                                    >
                                        <Icon name="SPREADSHEETS" className="sidebar__link-icon" />
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
                                        className="sidebar__link"
                                        title={`Planilla de ${d.full_name}`}
                                    >
                                        <Icon name="SPREADSHEETS" className="sidebar__link-icon" />
                                        {d.full_name.split(' ')[0]}
                                    </a>
                                ))
                        )}
                    </div>
                )}
            </nav>

            <footer className="sidebar__footer">
                <LanguageSelector />

                <div className="sidebar-user">
                    <div className="sidebar-user__avatar">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="sidebar-user__info">
                        <span className="sidebar-user__name">{user?.full_name || user?.username}</span>
                        <span className="sidebar-user__role">{t(user?.role) || user?.role}</span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    onClick={logout}
                    className="sidebar__logout-btn"
                    icon={<Icon name="logout" size="1.1rem" />}
                >
                    {t('sign_out')}
                </Button>
            </footer>
        </aside>
    );
};

export default Sidebar;
