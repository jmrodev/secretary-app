import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/context/LanguageContext';
import { useMessage } from '@/context/MessageContext';
import { useModal } from '@/context/ModalContext';
import { useConfig } from '@/context/ConfigContext';
import api from '@/api/axios';

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
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') || 'general';
    });

    // Synchronize URL search params when activeTab changes
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') !== activeTab) {
            params.set('tab', activeTab);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, '', newUrl);
        }
    }, [activeTab]);

    // QR Modal State (Managed as a simple object)
    const [qrModal, setQrModal] = useState({ open: false, url: '', expiry: null });

    // --- Google Auth Logic ---
    const googleUnlinked = !settings?.google_refresh_token;

    /**
     * Handles side-effects of OAuth callbacks from URL params
     */
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const tab = urlParams.get('tab');

        if (tab && tab !== activeTab) {
            queueMicrotask(() => setActiveTab(tab));
        }

        if (status === 'success') {
            showMessage('Cuenta de Google Conectada con Éxito', 'success');
            urlParams.delete('status');
            const newSearch = urlParams.toString();
            const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        } else if (status === 'error') {
            showMessage('Error al conectar con Google', 'error');
            urlParams.delete('status');
            const newSearch = urlParams.toString();
            const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, [showMessage, activeTab]);

    /**
     * Initiates Google OAuth flow via backend-provided URL
     */
    const handleGoogleAuth = useCallback(async () => {
        try {
            const { data } = await api.get('/google/auth-url');
            window.location.href = data.url;
        } catch (error) {
            showMessage('Error al iniciar autenticación con Google', 'error');
        }
    }, [showMessage]);

    /**
     * Disconnects Google Calendar integration securely
     */
    const handleDisconnectGoogle = useCallback(async () => {
        if (!await confirm('¿Estás seguro de desconectar Google Calendar? Se dejarán de sincronizar los turnos.')) return;
        try {
            await api.post('/google/disconnect');
            await refreshSettings();
            showMessage('Cuenta desconectada correctamente', 'success');
        } catch (error) {
            showMessage('Error al desconectar cuenta', 'error');
        }
    }, [confirm, refreshSettings, showMessage]);

    /**
     * Manually triggers retry of failed Google Sync items
     */
    const handleRetryGoogleFailed = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.post('/google/retry-failed');
            showMessage(res.data.message || 'Reintento iniciado.', 'success');
        } catch (err) {
            showMessage('Error al iniciar reintento.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    /**
     * Sends a test message via Meta Cloud API logic
     */
    const handleTestMeta = useCallback(async () => {
        const phone = await prompt("Ingrese un número de teléfono de prueba (incluya código de país, ej: 549...):");
        if (!phone) return;

        try {
            setLoading(true);
            await api.post('/whatsapp/test', { to: phone });
            showMessage('Mensaje de prueba enviado. Verifique su WhatsApp.', 'success');
        } catch (error) {
            console.error(error);
            showMessage(error.response?.data?.error || 'Error al enviar mensaje de prueba', 'error');
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
        if (!await confirm("¿Desea actualizar su IP en DuckDNS ahora?")) return;

        try {
            setLoading(true);
            await api.post('/settings/refresh-tunnel');
            showMessage("IP de DuckDNS actualizada correctamente.", 'info');
            setTimeout(refreshSettings, 2000);
        } catch (err) {
            showMessage(t('error_saving'), 'error');
        } finally {
            setLoading(false);
        }
    }, [confirm, showMessage, refreshSettings, t]);

    const handlers = {
        setActiveTab,
        setQrModal,
        updateSetting,
        handleGoogleAuth,
        handleDisconnectGoogle,
        handleRetryGoogleFailed,
        handleTestMeta,
        insertVariable,
        handleRefreshTunnel
    };

    return {
        user, t, settings, loading,
        activeTab,
        qrModal,
        googleUnlinked,
        handlers
    };
};
