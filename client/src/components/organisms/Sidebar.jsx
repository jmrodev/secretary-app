import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useConfig } from '../../context/ConfigContext';
import api from '../../api/axios';
import { Link, useLocation } from 'react-router-dom';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import LanguageSelector from '../atoms/LanguageSelector';
import { ICONS } from '../../constants/icons';
import './Sidebar.css';

/**
 * Sidebar Organism.
 * Main navigation component following BEM and Atomic patterns.
 */
const Sidebar = () => {
    const { user, logout } = useAuth();
    const { t, toggleLanguage } = useLanguage();
    const { settings } = useConfig();
    const location = useLocation();
    const [doctors, setDoctors] = useState([]);
    const [isAdminOpen, setIsAdminOpen] = useState(() => {
        // Keep it open if one of the links inside is active
        const adminPaths = ['/profile', '/doctors', '/reports', '/institutions', '/admin/users', '/logs', '/config'];
        return adminPaths.some(path => location.pathname === path);
    });

    const fetchSidebarDoctors = () => {
        if (user && ['admin', 'secretary', 'doctor'].includes(user.role)) {
            api.get('/users/doctors')
                .then(res => setDoctors(res.data))
                .catch(err => console.error("Error fetching doctors in sidebar:", err));
        }
    };

    useEffect(() => {
        fetchSidebarDoctors();

        window.addEventListener('doctors-updated', fetchSidebarDoctors);
        return () => window.removeEventListener('doctors-updated', fetchSidebarDoctors);
    }, [user?.role]);

    const getLinkClass = (path) => `sidebar__link ${location.pathname === path ? 'sidebar__link--active' : ''}`;

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

                {user.role !== 'admin' && (
                    <Link to="/appointments" className={getLinkClass('/appointments')}>
                        <Icon name="APPOINTMENTS" className="sidebar__link-icon" />
                        {t('appointments')}
                    </Link>
                )}

                {user.role !== 'patient' && user.role !== 'admin' && (
                    <Link to="/patients" className={getLinkClass('/patients')}>
                        <Icon name="PATIENTS" className="sidebar__link-icon" />
                        {t('patients')}
                    </Link>
                )}

                {user.role === 'secretary' && (
                    <Link to="/insurances" className={getLinkClass('/insurances')}>
                        <Icon name="INSURANCES" className="sidebar__link-icon" />
                        {t('insurances') || 'Obras Sociales'}
                    </Link>
                )}

                {settings.enable_office_rentals === 'true' && user.role !== 'admin' && (
                    <Link to="/rentals" className={getLinkClass('/rentals')}>
                        <Icon name="RENTALS" className="sidebar__link-icon" />
                        {t('office_rentals')}
                    </Link>
                )}

                {user.role !== 'admin' && (
                    <>
                        <Link to="/documents" className={getLinkClass('/documents')}>
                            <Icon name="DOCUMENTS" className="sidebar__link-icon" />
                            {t('medical_documents')}
                        </Link>
                    </>
                )}

                {user.role === 'secretary' && (
                    <Link to="/finances" className={getLinkClass('/finances')}>
                        <Icon name="FINANCES" className="sidebar__link-icon" />
                        {t('finances')}
                    </Link>
                )}



                {/* Configuration / Administration Section */}
                {(user.role === 'admin' || user.role === 'secretary') && (
                    <div className={`sidebar__section sidebar__section--collapsible ${isAdminOpen ? 'sidebar__section--open' : ''}`}>
                        <div
                            className="sidebar__section-header"
                            onClick={() => setIsAdminOpen(!isAdminOpen)}
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

                            {user.role === 'admin' && (
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

                {/* Spreadsheet Links */}
                {doctors.length > 0 && (
                    <div className="sidebar__section">
                        <div className="sidebar__section-title">{t('spreadsheets') || 'Planillas'}</div>
                        {user.role === 'doctor' ? (
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
                        <span className="sidebar-user__name">{user.full_name || user.username}</span>
                        <span className="sidebar-user__role">{t(user.role) || user.role}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={logout}
                        className="sidebar-user__logout"
                        title={t('sign_out')}
                        icon={<Icon name="logout" size="1.25rem" />}
                    />
                </div>
            </footer>
        </aside>
    );
};

export default Sidebar;
