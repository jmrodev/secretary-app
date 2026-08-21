import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { Loading } from '@/components/atoms/Loading';

/**
 * RoleGuard Component.
 * Protects routes or UI sections based on allowed roles.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to protect.
 * @param {string[]} [props.allowedRoles=[]] - List of roles that can access the content.
 * @param {string} [props.permission] - Optional permission flag on the user (e.g. 'canManageUsers') that must be true.
 * @param {string} [props.fallbackPath='/dashboard'] - Path to redirect if access is denied.
 * @param {boolean} [props.redirectTo=true] - Whether to redirect or just return null/fallback UI.
 * @param {boolean} [props.showLoading=true] - Whether to show a loading screen while auth is resolving.
 */
const EMPTY_ARRAY = [];

export const RoleGuard = ({ 
    children, 
    allowedRoles = EMPTY_ARRAY, 
    permission,
    fallbackPath = '/dashboard',
    redirectTo = true,
    showLoading = true
}) => {
    const { user, loading, canManageUsers } = usePermissions();

    if (loading && showLoading) {
        return <Loading variant="full-page" />;
    }

    if (!user) {
        return redirectTo ? <Navigate to="/" replace /> : null;
    }

    const hasRole = allowedRoles.length === 0 || allowedRoles.includes(user.role);
    // Permission flags resolve through the hook's computed values (e.g. the
    // backend semantics: admins always hold canManageUsers, secretaries only
    // when granted), falling back to the raw user field for other flags.
    const hasPermission = !permission
        || (permission === 'canManageUsers' ? Boolean(canManageUsers) : user[permission] === true);

    if (!hasRole || !hasPermission) {
        const defaultFallback = user?.role === 'admin' ? '/admin/users' : '/dashboard';
        const effectiveFallback = fallbackPath === '/dashboard' ? defaultFallback : fallbackPath;
        return redirectTo ? <Navigate to={effectiveFallback} replace /> : null;
    }

    return children;
};

