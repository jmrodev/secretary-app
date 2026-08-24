import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
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
    const activeTab = searchParams.get('tab') || 'modules';

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
            showMessage(t('google_account_connected_success') || 'Cuenta de Google Conectada con Éxito', 'success');
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('status');
                return next;
            });
        } else if (status === 'error') {
            showMessage(t('google_connection_error') || 'Error al conectar con Google', 'error');
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('status');
                return next;
            });
        }
    }, [searchParams, setSearchParams, showMessage, t]);

    /**
     * Initiates Google OAuth flow via backend-provided URL
     */
    const handleGoogleAuth = useCallback(async () => {
        try {
            const { data } = await api.get('/google/auth-url');
            window.location.href = data.url;
        } catch {
            showMessage(t('google_auth_init_error') || 'Error al iniciar autenticación con Google', 'error');
        }
    }, [showMessage, t]);

    /**
     * Disconnects Google Calendar integration securely
     */
    const handleDisconnectGoogle = useCallback(async () => {
        if (!await confirm(t('confirm_google_disconnect') || '¿Estás seguro de desconectar Google Calendar? Se dejarán de sincronizar los turnos.')) return;
        try {
            await api.post('/google/disconnect');
            await refreshSettings();
            showMessage(t('google_account_disconnected') || 'Cuenta desconectada correctamente', 'success');
        } catch {
            showMessage(t('google_disconnect_error') || 'Error al desconectar cuenta', 'error');
        }
    }, [confirm, refreshSettings, showMessage, t]);

    /**
     * Manually triggers retry of failed Google Sync items
     */
    const handleRetryGoogleFailed = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.post('/google/retry-failed');
            showMessage(res.data.message || t('retry_initiated') || 'Reintento iniciado.', 'success');
        } catch (err) {
            showMessage(t('retry_init_error') || 'Error al iniciar reintento.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [showMessage, t]);

    /**
     * Sends a test message via Meta Cloud API logic
     */
    const handleTestMeta = useCallback(async () => {
        const phone = await prompt(t('enter_test_phone_number') || "Ingrese un número de teléfono de prueba (incluya código de país, ej: 549...):");
        if (!phone) return;

        try {
            setLoading(true);
            await api.post('/whatsapp/test', { to: phone });
            showMessage(t('test_message_sent_success') || '✅ Mensaje de prueba enviado. Verifique su WhatsApp.', 'success');
        } catch (error) {
            console.error(error);
            showMessage(error.response?.data?.error || t('test_message_send_error') || 'Error al enviar mensaje de prueba', 'error');
        } finally {
            setLoading(false);
        }
    }, [showMessage, t]);

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
        if (!await confirm(t('confirm_refresh_tunnel') || "¿Desea actualizar su IP en DuckDNS ahora?")) return;

        try {
            setLoading(true);
            await api.post('/settings/refresh-tunnel');
            showMessage(t('tunnel_refreshed_success') || "IP de DuckDNS actualizada correctamente.", 'info');
            setTimeout(refreshSettings, 2000);
        } catch {
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
