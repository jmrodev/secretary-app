import React from 'react';
import './RoleGuard.css';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import Loading from '@/components/atoms/Loading';

/**
 * RoleGuard Component.
 * Protects routes or UI sections based on allowed roles.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to protect.
 * @param {string[]} [props.allowedRoles=[]] - List of roles that can access the content.
 * @param {string} [props.fallbackPath='/dashboard'] - Path to redirect if access is denied.
 * @param {boolean} [props.redirectTo=true] - Whether to redirect or just return null/fallback UI.
 * @param {boolean} [props.showLoading=true] - Whether to show a loading screen while auth is resolving.
 */
const RoleGuard = ({ 
    children, 
    allowedRoles = [], 
    fallbackPath = '/dashboard',
    redirectTo = true,
    showLoading = true
}) => {
    const { user, loading } = usePermissions();

    if (loading && showLoading) {
        return <Loading variant="full-page" />;
    }

    if (!user) {
        return redirectTo ? <Navigate to="/login" replace /> : null;
    }

    const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(user.role);

    if (!hasAccess) {
        return redirectTo ? <Navigate to={fallbackPath} replace /> : null;
    }

    return children;
};

export default RoleGuard;
