import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { PatientBlocker } from '@/features/patients/components/ui/PatientBlocker';
import { Loading } from '@/components/atoms/Loading';
import { GlobalWhatsappMessenger } from '@/components/organisms/GlobalWhatsappMessenger';
import { GlobalPatientRegistrar } from '@/components/organisms/GlobalPatientRegistrar';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Route guard layout component.
 * Verifies authentication status and user roles for a group of routes.
 */
export const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const { t } = useLanguage();

    if (loading) {
        return <Loading variant="full-page" />;
    }
    
    if (!user) return <Navigate to="/" />;

    // Patients should not be able to access the management dashboard or other views
    if (user.role === 'patient') {
        return <PatientBlocker />;
    }

    // Render child routes
    return (
        <>
            <Outlet />
            {(user.role === 'secretary' || user.role === 'admin') && (
                <GlobalWhatsappMessenger t={t} />
            )}
            <GlobalPatientRegistrar />
        </>
    );
};
