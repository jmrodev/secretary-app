import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfig } from '../context/ConfigContext';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';
    const API_URL = import.meta.env.VITE_API_URL || '/api';

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">ClinicFlow</h2>
                <div className="user-profile-card mt-4">
                    <div className="user-avatar-mini">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                        <span className="username">{user.username}</span>
                        <span className="user-role">{t(user.role) || user.role}</span>
                    </div>
                    <button onClick={logout} className="btn-logout-minimal" title={t('sign_out')}>
                        <span>🚪</span>
                    </button>
                </div>
            </div>

            <nav className="sidebar-nav">
                <a href="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
                    <span>📊</span> {t('dashboard')}
                </a>

                {user.role !== 'admin' && (
                    <a href="/appointments" className={`sidebar-link ${isActive('/appointments')}`}>
                        <span>📅</span> {t('appointments')}
                    </a>
                )}

                {user.role !== 'patient' && user.role !== 'admin' && (
                    <a href="/patients" className={`sidebar-link ${isActive('/patients')}`}>
                        <span>👥</span> {t('patients')}
                    </a>
                )}

                {user.role === 'secretary' && (
                    <a href="/insurances" className={`sidebar-link ${isActive('/insurances')}`}>
                        <span>🏥</span> Obras Sociales
                    </a>
                )}

                {settings.enable_office_rentals === 'true' && user.role !== 'admin' && (
                    <a href="/rentals" className={`sidebar-link ${isActive('/rentals')}`}>
                        <span>🏢</span> {t('office_rentals')}
                    </a>
                )}

                {user.role !== 'admin' && (
                    <>
                        <a href="/requests" className={`sidebar-link ${isActive('/requests')}`}>
                            <span>📝</span> Requerimientos
                        </a>
                        <a href="/documents" className={`sidebar-link ${isActive('/documents')}`}>
                            <span>📁</span> {t('medical_documents')}
                        </a>
                        <a href="/doctors" className={`sidebar-link ${isActive('/doctors')}`}>
                            <span>🩺</span> {t('doctors')}
                        </a>
                    </>
                )}

                {user.role === 'secretary' && (
                    <a href="/finances" className={`sidebar-link ${isActive('/finances')}`}>
                        <span>💰</span> {t('finances')}
                    </a>
                )}

                {user.role === 'admin' && (
                    <a href="/logs" className={`sidebar-link ${isActive('/logs')}`}>
                        <span>📜</span> {t('audit_logs')}
                    </a>
                )}

                {user.role === 'admin' && (
                    <a href="/admin/users" className={`sidebar-link ${isActive('/admin/users')}`}>
                        <span>👤</span> {t('users')}
                    </a>
                )}

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <a href="/institutions" className={`sidebar-link ${isActive('/institutions')}`}>
                        <span>🏛️</span> Instituciones
                    </a>
                )}

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <a href="/config" className={`sidebar-link ${isActive('/config')}`}>
                        <span>⚙️</span> {t('system_config')}
                    </a>
                )}

                <a href="/profile" className={`sidebar-link ${isActive('/profile')}`}>
                    <span>👤</span> {t('profile')}
                </a>
            </nav>
        </aside>
    );
};

export default Sidebar;
