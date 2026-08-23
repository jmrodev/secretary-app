import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage, useLanguageActions } from '@/hooks/useLanguage';
import { useConfig } from '@/context/ConfigContext';
import { useFetch } from '@/hooks/useFetch';

/**
 * Controller hook for the Layout orchestration.
 * Handles navigation state, user session, and external data fetching (doctors/spreadsheets).
 */
export const useLayoutController = () => {
    const { user, logout, isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff, canManageUsers } = usePermissions();
    const { t, language } = useLanguage();
    const { toggleLanguage } = useLanguageActions();
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
        const adminPaths = ['/profile', '/doctors', '/reports', '/institutions', '/logs', '/config'];
        return adminPaths.some(path => location.pathname === path);
    });

    const fetchRef = useRef(fetchSidebarDoctors);
    useEffect(() => {
        fetchRef.current = fetchSidebarDoctors;
    }, [fetchSidebarDoctors]);

    useEffect(() => {
        const handler = () => fetchRef.current();
        window.addEventListener('doctors-updated', handler);
        return () => window.removeEventListener('doctors-updated', handler);
    }, []);

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
        language,
        toggleLanguage,
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
        isMedicalStaff,
        canManageUsers
    };
};
