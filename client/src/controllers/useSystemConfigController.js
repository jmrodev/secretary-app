import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';
import { useModal } from '../context/ModalContext';
import { useConfig } from '../context/ConfigContext';
import api from '../api/axios';
import { useLocation } from 'react-router-dom';

/**
 * System Configuration Controller
 * 
 * Manages all state and business logic for the SystemConfig page
 * Follows single responsibility principle - each function has one clear purpose
 * 
 * @returns {Object} Controller state and handlers
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

    // State
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') || 'general';
    });

    // Sync URL when activeTab changes
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') !== activeTab) {
            params.set('tab', activeTab);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, '', newUrl);
        }
    }, [activeTab]);

    // QR Modal State
    const [qrModal, setQrModal] = useState({ open: false, url: '', expiry: null });

    // --- Google Auth Logic ---
    const googleUnlinked = !settings?.google_refresh_token;

    /**
     * Single Responsibility: Handle OAuth callback status from URL params
     */
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const tab = urlParams.get('tab');

        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }

        if (status === 'success') {
            showMessage('Cuenta de Google Conectada con Éxito', 'success');
            // Remove status but keep tab
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
    }, [showMessage]);

    /**
     * Single Responsibility: Initiate Google OAuth flow
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
     * Single Responsibility: Disconnect Google Calendar integration
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
     * Single Responsibility: Retry failed Google Calendar sync items
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
     * Single Responsibility: Test Meta WhatsApp connection
     */
    const handleTestMeta = useCallback(async () => {
        const phone = await prompt("Ingrese un número de teléfono de prueba (incluya código de país, ej: 549...):");
        if (!phone) return;

        try {
            setLoading(true);
            await api.post('/whatsapp/test', { to: phone });
            showMessage('✅ Mensaje de prueba enviado. Verifique su WhatsApp.', 'success');
        } catch (error) {
            console.error(error);
            showMessage(error.response?.data?.error || 'Error al enviar mensaje de prueba', 'error');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    /**
     * Single Responsibility: Insert variable into textarea at cursor position
     * 
     * @param {string} textareaId - ID of the textarea element
     * @param {string} variable - Variable to insert (e.g., '{patient_name}')
     * @param {string} settingKey - Setting key to update
     */
    const insertVariable = useCallback((textareaId, variable, settingKey) => {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + variable + text.substring(end);

        // Update state through context
        updateSetting(settingKey, newText);

        // Restore cursor (timeout for React re-render)
        setTimeout(() => {
            const newPos = start + variable.length;
            if (textarea) {
                textarea.setSelectionRange(newPos, newPos);
                textarea.focus();
            }
        }, 0);
    }, [updateSetting]);

    /**
     * Single Responsibility: Refresh Cloudflare tunnel or DuckDNS IP
     */
    const handleRefreshTunnel = useCallback(async () => {
        const isDuckDNS = settings.remote_access_method === 'duckdns';
        const confirmMsg = isDuckDNS
            ? "¿Desea actualizar su IP en DuckDNS ahora?"
            : "¿Solicitar nuevo enlace a Cloudflare? Esto reiniciará el túnel y tardará unos segundos.";

        if (!await confirm(confirmMsg)) return;

        try {
            setLoading(true);
            await api.post('/settings/refresh-tunnel');

            const successMsg = isDuckDNS
                ? "IP de DuckDNS actualizada correctamente."
                : "Renovación de túnel solicitada. Espere unos segundos y recargue.";

            showMessage(successMsg, 'info');

            // Optionally trigger a refresh of settings after a delay
            setTimeout(refreshSettings, isDuckDNS ? 2000 : 5000);
        } catch (err) {
            showMessage(t('error_saving'), 'error');
        } finally {
            setLoading(false);
        }
    }, [confirm, showMessage, refreshSettings, settings.remote_access_method, t]);

    return {
        // State
        user, t, settings, loading,
        activeTab, setActiveTab,
        qrModal, setQrModal,
        googleUnlinked,

        // Handlers
        updateSetting,
        handleGoogleAuth,
        handleDisconnectGoogle,
        handleRetryGoogleFailed,
        handleTestMeta,
        insertVariable,
        handleRefreshTunnel
    };
};
