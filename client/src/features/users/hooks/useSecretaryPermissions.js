import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { buildPermissionPayload } from './buildPermissionPayload';

/**
 * Controller hook for the secretary permissions grant UI.
 * Fetches the secretary list with their can_manage_users flag and
 * grants/revokes the grant through POST /users/admin/permissions.
 */
export const useSecretaryPermissions = () => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const [secretaries, setSecretaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [grantToAll, setGrantToAll] = useState(false);

    const fetchPermissions = useCallback(async () => {
        try {
            const res = await api.get('/users/admin/users/permissions');
            setSecretaries(res.data?.data ?? []);
        } catch (err) {
            console.error("[useSecretaryPermissions] Failed to fetch permissions", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        queueMicrotask(() => {
            if (!isMounted) return;
            fetchPermissions();
        });
        return () => { isMounted = false; };
    }, [fetchPermissions]);

    const toggleSelect = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const apply = useCallback(async (revoke) => {
        if (!grantToAll && selectedIds.length === 0) return;

        setUpdating(true);
        try {
            await api.post('/users/admin/users/permissions', buildPermissionPayload({
                secretaryIds: selectedIds,
                grantToAll,
                revoke
            }));
            showMessage(t('permission_updated'), 'success');
            await fetchPermissions();
            setSelectedIds([]);
            setGrantToAll(false);
        } catch (err) {
            console.error("[useSecretaryPermissions] Failed to update permissions", err);
            showMessage(t('permission_update_failed'), 'error');
        } finally {
            setUpdating(false);
        }
    }, [selectedIds, grantToAll, t, showMessage, fetchPermissions]);

    return {
        secretaries,
        loading,
        updating,
        selectedIds,
        grantToAll,
        setGrantToAll,
        toggleSelect,
        applyGrant: () => apply(false),
        applyRevoke: () => apply(true)
    };
};