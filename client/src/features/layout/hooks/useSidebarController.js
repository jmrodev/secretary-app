import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage } from '@/context/LanguageContext';
import { useConfig } from '@/context/ConfigContext';
import { useFetch } from '@/hooks/useFetch';

/**
 * Controller hook for the Sidebar orchestration.
 * Handles navigation state, user session, and external data fetching (doctors/spreadsheets).
 */
export const useSidebarController = () => {
    const { user, logout, isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff } = usePermissions();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const location = useLocation();

    // --- Data Fetching ---
    const { 
        data: doctors = [], 
        refetch: fetchSidebarDoctors 
    } = useFetch('/users/doctors', {
        initialData: [],
        immediate: !!user && isMedicalStaff
    });

    // Logic to keep the administration section open if a subpath is active
    const [isAdminOpen, setIsAdminOpen] = useState(() => {
        const adminPaths = ['/profile', '/doctors', '/reports', '/institutions', '/admin/users', '/logs', '/config'];
        return adminPaths.some(path => location.pathname === path);
    });

    useEffect(() => {
        window.addEventListener('doctors-updated', fetchSidebarDoctors);
        return () => window.removeEventListener('doctors-updated', fetchSidebarDoctors);
    }, [fetchSidebarDoctors]);

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
        getLinkClass,
        isStaff,
        isAdmin,
        isSecretary,
        isDoctor,
        isPatient,
        isMedicalStaff
    };
};
