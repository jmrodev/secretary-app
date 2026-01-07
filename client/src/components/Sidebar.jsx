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
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('app_name')}</h2>
            </div>
            <nav>
                <a href="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>{t('dashboard')}</a>
                <a href="/appointments" className={`sidebar-link ${isActive('/appointments')}`}>{t('appointments')}</a>
                <a href="/patients" className={`sidebar-link ${isActive('/patients')}`}>{t('patients')}</a>

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
            <div style={{ marginTop: 'auto' }}>
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                    {user.username} <br />
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{user.role}</span>
                </div>
                <button onClick={logout} className="sidebar-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    {t('sign_out')}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
