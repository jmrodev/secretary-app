import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { PatientBlocker } from '@/features/patients';
import Loading from '@/components/atoms/Loading';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Route guard layout component.
 * Verifies authentication status and user roles for a group of routes.
 */
const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const { t } = useLanguage();

    if (loading) {
        return <Loading variant="full-page" text="Cargando Clínica..." />;
    }
    
    if (!user) return <Navigate to="/login" />;

    // Patients should not be able to access the management dashboard or other views
    if (user.role === 'patient') {
        return <PatientBlocker />;
    }

    // Render child routes
    return <Outlet />;
};

export default ProtectedRoute;
