import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useConfig } from '../../context/ConfigContext';
import { Link, useLocation } from 'react-router-dom';
import Button from '../atoms/Button';
import LanguageSelector from '../atoms/LanguageSelector';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const location = useLocation();

    const getLinkClass = (path) => `sidebar__link ${location.pathname === path ? 'sidebar__link--active' : ''}`;

    return (
        <aside className="sidebar">
            <div className="sidebar__header">
                <h2 className="sidebar__title">{t('app_name')}</h2>
            </div>

            <nav className="sidebar__nav">
                <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                    <span className="sidebar__link-icon">📊</span> {t('dashboard')}
                </Link>

                {user.role !== 'admin' && (
                    <Link to="/appointments" className={getLinkClass('/appointments')}>
                        <span className="sidebar__link-icon">📅</span> {t('appointments')}
                    </Link>
                )}

                {user.role !== 'patient' && (
                    <Link to="/monthly-view" className={getLinkClass('/monthly-view')}>
                        <span className="sidebar__link-icon">🗓️</span> {t('monthly_view') || 'Vista Mensual'}
                    </Link>
                )}

                {user.role !== 'patient' && user.role !== 'admin' && (
                    <Link to="/patients" className={getLinkClass('/patients')}>
                        <span className="sidebar__link-icon">👥</span> {t('patients')}
                    </Link>
                )}

                {user.role === 'secretary' && (
                    <Link to="/insurances" className={getLinkClass('/insurances')}>
                        <span className="sidebar__link-icon">🏥</span> {t('insurances') || 'Obras Sociales'}
                    </Link>
                )}

                {settings.enable_office_rentals === 'true' && user.role !== 'admin' && (
                    <Link to="/rentals" className={getLinkClass('/rentals')}>
                        <span className="sidebar__link-icon">🏢</span> {t('office_rentals')}
                    </Link>
                )}

                {user.role !== 'admin' && (
                    <>
                        <Link to="/requests" className={getLinkClass('/requests')}>
                            <span className="sidebar__link-icon">📝</span> {t('requests_workflow')}
                        </Link>
                        <Link to="/documents" className={getLinkClass('/documents')}>
                            <span className="sidebar__link-icon">📁</span> {t('medical_documents')}
                        </Link>
                        <Link to="/doctors" className={getLinkClass('/doctors')}>
                            <span className="sidebar__link-icon">🩺</span> {t('doctors')}
                        </Link>
                    </>
                )}

                {user.role === 'secretary' && (
                    <Link to="/finances" className={getLinkClass('/finances')}>
                        <span className="sidebar__link-icon">💰</span> {t('finances')}
                    </Link>
                )}

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <Link to="/reports" className={getLinkClass('/reports')}>
                        <span className="sidebar__link-icon">📑</span> {t('reports') || 'Reportes'}
                    </Link>
                )}

                {user.role === 'admin' && (
                    <Link to="/logs" className={getLinkClass('/logs')}>
                        <span className="sidebar__link-icon">📜</span> {t('audit_logs')}
                    </Link>
                )}

                {user.role === 'admin' && (
                    <Link to="/admin/users" className={getLinkClass('/admin/users')}>
                        <span className="sidebar__link-icon">👤</span> {t('users')}
                    </Link>
                )}

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <Link to="/institutions" className={getLinkClass('/institutions')}>
                        <span className="sidebar__link-icon">🏛️</span> {t('institutions')}
                    </Link>
                )}

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <Link to="/config" className={getLinkClass('/config')}>
                        <span className="sidebar__link-icon">⚙️</span> {t('system_config')}
                    </Link>
                )}

                <Link to="/profile" className={getLinkClass('/profile')}>
                    <span className="sidebar__link-icon">👤</span> {t('profile')}
                </Link>
            </nav>

            <div className="sidebar__footer">
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
                    >
                        🚪
                    </Button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
