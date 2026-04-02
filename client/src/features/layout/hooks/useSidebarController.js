import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useLanguage } from '../../../context/LanguageContext';
import { useConfig } from '../../../context/ConfigContext';
import api from '../../../api/axios';

/**
 * Controller hook for the Sidebar orchestration.
 * Handles navigation state, user session, and external data fetching (doctors/spreadsheets).
 */
export const useSidebarController = () => {
    const { user, logout } = useAuth();
    const { t, toggleLanguage } = useLanguage();
    const { settings } = useConfig();
    const location = useLocation();
    const [doctors, setDoctors] = useState([]);

    // Logic to keep the administration section open if a subpath is active
    const [isAdminOpen, setIsAdminOpen] = useState(() => {
        const adminPaths = ['/profile', '/doctors', '/reports', '/institutions', '/admin/users', '/logs', '/config'];
        return adminPaths.some(path => location.pathname === path);
    });

    /**
     * Fetches doctors list for spreadsheet links.
     * Listens to 'doctors-updated' custom event for real-time refresh.
     */
    const fetchSidebarDoctors = () => {
        if (user && ['admin', 'secretary', 'doctor'].includes(user.role)) {
            api.get('/users/doctors')
                .then(res => setDoctors(res.data))
                .catch(err => console.error("Error fetching doctors in sidebar:", err));
        }
    };

    useEffect(() => {
        if (user) {
            fetchSidebarDoctors();
        }

        window.addEventListener('doctors-updated', fetchSidebarDoctors);
        return () => window.removeEventListener('doctors-updated', fetchSidebarDoctors);
    }, [user?.role]);

    /**
     * Helper to determine active link styling based on current path.
     */
    const getLinkClass = (path) => 
        `sidebar__link ${location.pathname === path ? 'sidebar__link--active' : ''}`;

    const toggleAdmin = () => setIsAdminOpen(prev => !prev);

    return {
        user,
        logout,
        t,
        settings,
        location,
        doctors,
        isAdminOpen,
        toggleAdmin,
        getLinkClass
    };
};
