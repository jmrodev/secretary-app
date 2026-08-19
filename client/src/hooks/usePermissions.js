import React, { useEffect } from 'react';
import { api } from '@/api/axios';
import { useAuth } from '@/features/auth';

/**
 * Hook to manage complex role-based permissions, including dynamic system settings.
 * Ensures clean code by abstracting permission logic away from components.
 */
export const usePermissions = () => {
    const { user, logout } = useAuth();
    const [state, dispatch] = React.useReducer((s, a) => ({ ...s, ...a }), {
        permissions: {
            canDeletePrescription: false,
            canDeleteLicense: false,
            canDeleteRequest: false,
            canDeleteFile: false,
            canManageAppointments: false
        },
        loading: true
    });

    const { permissions, loading } = state;
    const fetchedForUserId = React.useRef(null);

    useEffect(() => {
        let isCurrent = true;
        const fetchSettings = async () => {
            if (!user) {
                dispatch({ loading: false });
                return;
            }

            if (user.role === 'admin') {
                dispatch({
                    permissions: {
                        canDeletePrescription: true,
                        canDeleteLicense: true,
                        canDeleteRequest: true,
                        canDeleteFile: true,
                        canManageAppointments: true
                    },
                    loading: false
                });
                return;
            }

            if (user.role === 'secretary' && fetchedForUserId.current !== user.id) {
                fetchedForUserId.current = user.id;
                let newPermissions = {
                    canDeletePrescription: false,
                    canDeleteLicense: false,
                    canDeleteRequest: false,
                    canDeleteFile: false,
                    canManageAppointments: false
                };

                try {
                    const res = await api.get('/settings');
                    if (!isCurrent) return;
                    const settings = res.data;

                    newPermissions = {
                        canDeletePrescription: settings.enable_secretary_crud_prescriptions === 'true',
                        canDeleteLicense: settings.enable_secretary_crud_licenses === 'true',
                        canDeleteRequest: settings.enable_secretary_crud_requests === 'true',
                        canDeleteFile: settings.enable_secretary_crud_files === 'true',
                        canManageAppointments: settings.enable_secretary_crud_appointments === 'true'
                    };
                } catch (err) {
                    if (!isCurrent) return;
                    console.error("[usePermissions] Failed to fetch settings", err);
                }

                dispatch({ permissions: newPermissions, loading: false });
            } else {
                dispatch({ loading: false });
            }
        };

        fetchSettings();
        return () => { isCurrent = false; };
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
