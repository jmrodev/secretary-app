import { useAuth } from '@/features/auth/AuthContext';

/**
 * Pure helper: resolves whether a user holds the can_manage_users grant
 * (JWT camelCase flag, permissions dictionary, or legacy snake_case DB field).
 */
export const resolveCanManageUsers = (user) => {
    if (!user) return false;
    if (typeof user.canManageUsers === 'boolean') return user.canManageUsers;
    if (user.permissions?.can_manage_users !== undefined) return Boolean(user.permissions.can_manage_users);
    return Boolean(user.can_manage_users);
};

/**
 * Hook to manage role-based permissions and granular secretary permissions.
 * Evaluates synchronously from user session state without making HTTP requests.
 */
export const usePermissions = () => {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isSecretary = user?.role === 'secretary';

    const getPerm = (key) => {
        if (isAdmin) return true;
        if (!isSecretary) return false;
        if (user?.permissions?.[key] !== undefined) return Boolean(user.permissions[key]);
        return Boolean(user?.[key]);
    };

    const permissions = {
        canManageUsers: isAdmin || resolveCanManageUsers(user),
        canCrudAppointments: getPerm('can_crud_appointments'),
        canEditPastAppointments: getPerm('can_edit_past_appointments'),
        canCrudRequests: getPerm('can_crud_requests'),
        canCrudPrescriptions: getPerm('can_crud_prescriptions'),
        canCrudLicenses: getPerm('can_crud_licenses'),
        canCrudFiles: getPerm('can_crud_files'),
        canCrudFinances: getPerm('can_crud_finances'),
        // Backwards-compatible aliases used in older medical components
        canManageAppointments: getPerm('can_crud_appointments'),
        canDeletePrescription: getPerm('can_crud_prescriptions'),
        canDeleteLicense: getPerm('can_crud_licenses'),
        canDeleteRequest: getPerm('can_crud_requests'),
        canDeleteFile: getPerm('can_crud_files')
    };

    return {
        ...permissions,
        loading: false,
        isAdmin,
        isSecretary,
        isDoctor: user?.role === 'doctor',
        isPatient: user?.role === 'patient',
        isStaff: isAdmin || isSecretary,
        isMedicalStaff: isAdmin || isSecretary || user?.role === 'doctor',
        user,
        logout
    };
};
