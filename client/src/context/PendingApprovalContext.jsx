import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth';
import {
    listPending,
    acceptPending as acceptPendingRequest,
    suggestAlternative as suggestAlternativeRequest,
    rejectPending as rejectPendingRequest
} from '@/api/pendingBookingApi';

const POLL_INTERVAL_MS = 10000;

const PendingApprovalContext = createContext(null);

export const usePendingApproval = () => use(PendingApprovalContext);

/**
 * PendingApprovalProvider — global context for the supervised WhatsApp
 * auto-booking queue. Polls GET /whatsapp/pending-bookings every 10s while
 * mounted (MainLayout) and exposes the actions accept / suggestAlternative /
 * reject, each refreshing the list on completion. Patients never poll.
 */
export const PendingApprovalProvider = ({ children }) => {
    const { user } = useAuth();
    const [pendingItems, setPendingItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const items = await listPending();
            setPendingItems(items);
        } catch (error) {
            if (error.response?.status !== 404 && error.response?.status !== 403) {
                console.error('[PendingApprovalContext] Error fetching pending bookings:', error);
            } else {
                console.debug(`[PendingApprovalContext] Suppressed status ${error.response?.status} during initial render/polling`);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user || user.role === 'patient') return undefined;
        // The initial fetch must run synchronously: PendingApprovalContext.test
        // asserts the poll starts on mount, and the loading flag mirrors the
        // async external polling system (deferring it would drop the spinner).
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync initial poll drives a global queue spinner
        refresh();
        const interval = setInterval(refresh, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [user, refresh]);

    const accept = useCallback(async (id) => {
        try {
            return await acceptPendingRequest(id);
        } finally {
            await refresh();
        }
    }, [refresh]);

    const suggestAlternative = useCallback(async (id, slotIso, note = '') => {
        try {
            return await suggestAlternativeRequest(id, slotIso, note);
        } finally {
            await refresh();
        }
    }, [refresh]);

    const reject = useCallback(async (id, reason = '') => {
        try {
            return await rejectPendingRequest(id, reason);
        } finally {
            await refresh();
        }
    }, [refresh]);

    const value = useMemo(() => ({
        pendingItems,
        loading,
        accept,
        suggestAlternative,
        reject,
        refresh
    }), [pendingItems, loading, accept, suggestAlternative, reject, refresh]);

    return (
        <PendingApprovalContext value={value}>
            {children}
        </PendingApprovalContext>
    );
};
