import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';
import { useModal } from '../context/ModalContext';
import { useConfig } from '../context/ConfigContext';
import api from '../api/axios';

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
    const [activeTab, setActiveTab] = useState('general');

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
        if (status === 'success') {
            showMessage('Cuenta de Google Conectada con Éxito', 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (status === 'error') {
            showMessage('Error al conectar con Google', 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
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
     * Single Responsibility: Refresh Cloudflare tunnel
     */
    const handleRefreshTunnel = useCallback(async () => {
        if (!await confirm("¿Solicitar nuevo enlace a Cloudflare? Esto reiniciará el túnel y tardará unos segundos.")) return;
        try {
            setLoading(true);
            await api.post('/settings/refresh-tunnel');
            showMessage('Renovación de túnel solicitada. Espere unos segundos y recargue.', 'info');
            // Optionally trigger a refresh of settings after a delay
            setTimeout(refreshSettings, 5000);
        } catch (err) {
            showMessage('Error al refrescar túnel', 'error');
        } finally {
            setLoading(false);
        }
    }, [confirm, showMessage, refreshSettings]);

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
