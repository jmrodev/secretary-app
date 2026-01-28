import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useConfig } from '../../context/ConfigContext';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '../atoms/Button';
import LanguageSelector from '../atoms/LanguageSelector';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">{t('app_name')}</h2>
            </div>

            <nav className="sidebar-nav">
                <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
                    <span>📊</span> {t('dashboard')}
                </Link>

                {user.role !== 'admin' && (
                    <Link to="/appointments" className={`sidebar-link ${isActive('/appointments')}`}>
                        <span>📅</span> {t('appointments')}
                    </Link>
                )}

                {user.role !== 'patient' && user.role !== 'admin' && (
                    <Link to="/patients" className={`sidebar-link ${isActive('/patients')}`}>
                        <span>👥</span> {t('patients')}
                    </Link>
                )}

                {user.role === 'secretary' && (
                    <Link to="/insurances" className={`sidebar-link ${isActive('/insurances')}`}>
                        <span>🏥</span> {t('insurances') || 'Obras Sociales'}
                    </Link>
                )}

                {settings.enable_office_rentals === 'true' && user.role !== 'admin' && (
                    <Link to="/rentals" className={`sidebar-link ${isActive('/rentals')}`}>
                        <span>🏢</span> {t('office_rentals')}
                    </Link>
                )}

                {user.role !== 'admin' && (
                    <>
                        <Link to="/requests" className={`sidebar-link ${isActive('/requests')}`}>
                            <span>📝</span> {t('requests_workflow')}
                        </Link>
                        <Link to="/documents" className={`sidebar-link ${isActive('/documents')}`}>
                            <span>📁</span> {t('medical_documents')}
                        </Link>
                        <Link to="/doctors" className={`sidebar-link ${isActive('/doctors')}`}>
                            <span>🩺</span> {t('doctors')}
                        </Link>
                    </>
                )}

                {user.role === 'secretary' && (
                    <Link to="/finances" className={`sidebar-link ${isActive('/finances')}`}>
                        <span>💰</span> {t('finances')}
                    </Link>
                )}

                {user.role === 'admin' && (
                    <Link to="/logs" className={`sidebar-link ${isActive('/logs')}`}>
                        <span>📜</span> {t('audit_logs')}
                    </Link>
                )}

                {user.role === 'admin' && (
                    <Link to="/admin/users" className={`sidebar-link ${isActive('/admin/users')}`}>
                        <span>👤</span> {t('users')}
                    </Link>
                )}

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <Link to="/institutions" className={`sidebar-link ${isActive('/institutions')}`}>
                        <span>🏛️</span> {t('institutions')}
                    </Link>
                )}

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <Link to="/config" className={`sidebar-link ${isActive('/config')}`}>
                        <span>⚙️</span> {t('system_config')}
                    </Link>
                )}

                <Link to="/profile" className={`sidebar-link ${isActive('/profile')}`}>
                    <span>👤</span> {t('profile')}
                </Link>
            </nav>

            <div className="sidebar-footer">
                <div className="mb-2">
                    <LanguageSelector />
                </div>
                <div className="user-profile-card">
                    <div className="user-avatar-mini">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-details">
                        <span className="username">{user.username}</span>
                        <span className="user-role">{t(user.role) || user.role}</span>
                    </div>
                    <Button onClick={logout} className="btn-logout-minimal" title={t('sign_out')}>
                        <span>🚪</span>
                    </Button>
                </div>
            </div>
        </aside >
    );
};

export default Sidebar;
