import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import PatientBlocker from '../molecules/PatientBlocker';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="app-loading">
                <div className="app-loading__content">
                    Cargando aplicación...
                </div>
            </div>
        );
    }
    
    if (!user) return <Navigate to="/login" />;

    // Patients should not be able to access the management dashboard or other views
    if (user.role === 'patient') {
        return <PatientBlocker />;
    }

    return children;
};

export default ProtectedRoute;
