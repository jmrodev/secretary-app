import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../features/auth';

/**
 * Hook to manage complex role-based permissions, including dynamic system settings.
 * Ensures clean code by abstracting permission logic away from components.
 */
export const usePermissions = () => {
    const { user, logout } = useAuth();
    const [permissions, setPermissions] = useState({
        canDeletePrescription: false,
        canDeleteLicense: false,
        canDeleteRequest: false,
        canDeleteFile: false,
        canManageAppointments: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            if (user.role === 'admin') {
                setPermissions({
                    canDeletePrescription: true,
                    canDeleteLicense: true,
                    canDeleteRequest: true,
                    canDeleteFile: true,
                    canManageAppointments: true
                });
                setLoading(false);
                return;
            }

            if (user.role === 'secretary') {
                try {
                    // Fetch all settings to determine permissions
                    const res = await api.get('/settings');
                    const settings = res.data; // Returns object { key: value }

                    setPermissions({
                        canDeletePrescription: settings.enable_secretary_crud_prescriptions === 'true',
                        canDeleteLicense: settings.enable_secretary_crud_licenses === 'true',
                        canDeleteRequest: settings.enable_secretary_crud_requests === 'true',
                        canDeleteFile: settings.enable_secretary_crud_files === 'true',
                        canManageAppointments: settings.enable_secretary_crud_appointments === 'true'
                    });
                } catch (err) {
                    console.error("[usePermissions] Failed to fetch settings", err);
                    // Default to restricted if error
                }
            } else {
                // Doctors and Patients default to restricted for these administrative CRUD actions
                setPermissions({
                    canDeletePrescription: false,
                    canDeleteLicense: false,
                    canDeleteRequest: false,
                    canDeleteFile: false,
                    canManageAppointments: false
                });
            }
            setLoading(false);
        };

        fetchSettings();
    }, [user]);

    return { 
        ...permissions, 
        loading,
        isAdmin: user?.role === 'admin',
        isSecretary: user?.role === 'secretary',
        isDoctor: user?.role === 'doctor',
        isPatient: user?.role === 'patient',
        isStaff: user?.role === 'admin' || user?.role === 'secretary',
        isMedicalStaff: user?.role === 'admin' || user?.role === 'secretary' || user?.role === 'doctor',
        user,
        logout
    };
};
