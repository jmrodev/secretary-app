import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/hooks/useLanguage';
import { useMessage } from '@/context/MessageContext';
import { useModal } from '@/context/ModalContext';
import { useConfig } from '@/context/ConfigContext';
import { api } from '@/api/axios';

/**
 * System Configuration Controller (Feature Hook).
 * Manages state and business logic for administrative and system-wide settings.
 */
export const useSystemConfigController = () => {
    // Contexts
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { settings, updateSetting, refreshSettings } = useConfig();

    // Local State
    const [loading, setLoading] = useState(false);

    // Active tab is derived from the URL (?tab=...) via the router so deep
    // links and browser back/forward work natively. No manual replaceState.
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab');

    const setActiveTab = useCallback((tab) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    }, [setSearchParams]);

    // QR Modal State (Managed as a simple object)
    const [qrModal, setQrModal] = useState({ open: false, url: '', expiry: null });

    // --- Google Auth Logic ---
    const googleUnlinked = !settings?.google_refresh_token;

    /**
     * Handles side-effects of OAuth callbacks from URL params
     */
    useEffect(() => {
        const status = searchParams.get('status');

        if (status === 'success') {
            showMessage(t('config_google_connected_success'), 'success');
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('status');
                return next;
            });
        } else if (status === 'error') {
            showMessage(t('config_google_connect_error'), 'error');
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('status');
                return next;
            });
        }
    }, [searchParams, setSearchParams, showMessage]);

    /**
     * Initiates Google OAuth flow via backend-provided URL
     */
    const handleGoogleAuth = useCallback(async () => {
        try {
            const { data } = await api.get('/google/auth-url');
            window.location.href = data.url;
        } catch (err) {
            console.error('Google auth start failed:', err);
            showMessage(t('config_google_auth_start_error'), 'error');
        }
    }, [showMessage]);

    /**
     * Disconnects Google Calendar integration securely
     */
    const handleDisconnectGoogle = useCallback(async () => {
        if (!await confirm(t('config_disconnect_google_confirm'))) return;
        try {
            await api.post('/google/disconnect');
            await refreshSettings();
            showMessage(t('config_google_disconnected'), 'success');
        } catch (err) {
            console.error('Google disconnect failed:', err);
            showMessage(t('config_google_disconnect_error'), 'error');
        }
    }, [confirm, refreshSettings, showMessage]);

    /**
     * Manually triggers retry of failed Google Sync items
     */
    const handleRetryGoogleFailed = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.post('/google/retry-failed');
            showMessage(res.data.message || t('config_retry_started'), 'success');
        } catch (err) {
            showMessage(t('config_retry_start_error'), 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    /**
     * Sends a test message via Meta Cloud API logic
     */
    const handleTestMeta = useCallback(async () => {
        const phone = await prompt(t('config_test_phone_prompt'));
        if (!phone) return;

        try {
            setLoading(true);
            await api.post('/whatsapp/test', { to: phone });
            showMessage(t('config_test_message_sent'), 'success');
        } catch (error) {
            console.error(error);
            showMessage(error.response?.data?.error || t('config_test_message_error'), 'error');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    /**
     * Utility to insert template variables at cursor position in textareas
     */
    const insertVariable = useCallback((textareaId, variable, settingKey) => {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + variable + text.substring(end);

        updateSetting(settingKey, newText);

        setTimeout(() => {
            const newPos = start + variable.length;
            if (textarea) {
                textarea.setSelectionRange(newPos, newPos);
                textarea.focus();
            }
        }, 0);
    }, [updateSetting]);

    /**
     * Forces a DuckDNS IP refresh/update
     */
    const handleRefreshTunnel = useCallback(async () => {
        if (!await confirm(t('config_duckdns_update_confirm'))) return;

        try {
            setLoading(true);
            await api.post('/settings/refresh-tunnel');
            showMessage(t('config_duckdns_updated'), 'info');
            setTimeout(refreshSettings, 2000);
        } catch (err) {
            console.error('DuckDNS IP update failed:', err);
            showMessage(t('error_saving'), 'error');
        } finally {
            setLoading(false);
        }
    }, [confirm, showMessage, refreshSettings, t]);

    return {
        user, t, settings, loading,
        activeTab,
        qrModal,
        googleUnlinked,
        handlers: {
            setActiveTab,
            setQrModal,
            updateSetting,
            handleGoogleAuth,
            handleDisconnectGoogle,
            handleRetryGoogleFailed,
            handleTestMeta,
            insertVariable,
            handleRefreshTunnel
        }
    };
};
