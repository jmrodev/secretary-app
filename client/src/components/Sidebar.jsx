import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfig } from '../context/ConfigContext';
import { useLocation } from 'react-router-dom';

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
            <nav>
                <a href="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>{t('dashboard')}</a>
                <a href="/appointments" className={`sidebar-link ${isActive('/appointments')}`}>{t('appointments')}</a>


                {user.role !== 'patient' && (
                    <a href="/patients" className={`sidebar-link ${isActive('/patients')}`}>{t('patients')}</a>
                )}

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <a href="/insurances" className={`sidebar-link ${isActive('/insurances')}`}>🏥 Obras Sociales</a>
                )}

                {/* Optional Office Rentals */}
                {settings.enable_office_rentals === 'true' && (
                    <a href="/rentals" className={`sidebar-link ${isActive('/rentals')}`}>{t('office_rentals')}</a>
                )}

                <a href="/requests" className={`sidebar-link ${isActive('/requests')}`}>Requerimientos</a>
                <a href="/documents" className={`sidebar-link ${isActive('/documents')}`}>{t('medical_documents')}</a>
                <a href="/doctors" className={`sidebar-link ${isActive('/doctors')}`}>{t('doctors')}</a>

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <a href="/finances" className={`sidebar-link ${isActive('/finances')}`}>{t('finances')}</a>
                )}

                {user.role === 'admin' && (
                    <a href="/logs" className={`sidebar-link ${isActive('/logs')}`}>{t('audit_logs')}</a>
                )}

                {user.role === 'admin' && (
                    <a href="/admin/users" className={`sidebar-link ${isActive('/admin/users')}`}>{t('users')}</a>
                )}

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <a href="/config" className={`sidebar-link ${isActive('/config')}`}>{t('system_config')}</a>
                )}

                <a href="/profile" className={`sidebar-link ${isActive('/profile')}`}>{t('profile')}</a>
            </nav>
            <div className="sidebar-footer">
                <div className="user-info">
                    {user.username} <br />
                    <span className="user-role">{user.role}</span>
                </div>
                <button onClick={logout} className="sidebar-link btn-logout">
                    {t('sign_out')}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
