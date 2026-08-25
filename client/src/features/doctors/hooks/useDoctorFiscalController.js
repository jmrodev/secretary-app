
import { useState } from 'react';
import { api } from '@/api/axios';

/**
 * Controller Hook for Fiscal Settings Logic
 * Handles the interaction with the backend for AFIP CSR generation.
 */
export const useDoctorFiscalController = (doctorId) => {
    const [generatedCsr, setGeneratedCsr] = useState(null);
    const [generatingCsr, setGeneratingCsr] = useState(false);
    const [showCsrInfo, setShowCsrInfo] = useState(false);
    const [error, setError] = useState(null);

    const generateCsr = async () => {
        if (!doctorId) {
            setError("ID de médico no válido");
            return;
        }

        setGeneratingCsr(true);
        setError(null);

        try {
            const res = await api.post('/billing/csr', { doctor_id: doctorId });
            // Axios puts the body in res.data, and our API wraps payload in { data: ... }
            const payload = res.data.data || res.data; 
            setGeneratedCsr(payload.csr);
            setShowCsrInfo(true);

            // Auto-copiar al portapapeles
            try {
                navigator.clipboard.writeText(payload.csr);
            } catch (e) {
                console.warn("Clipboard auto-copy failed", e);
            }

            // Abrir AFIP en nueva pestaña
            window.open('https://auth.afip.gob.ar/contribuyente_/login.xhtml', '_blank');

        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            setError(msg);
            // Optionally we could throw or return status, but state usually suffices for UI
        } finally {
            setGeneratingCsr(false);
        }
    };

    const [uploading, setUploading] = useState(false);

    const uploadCert = async (file) => {
        if (!doctorId) {
            setError("ID de médico no válido");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('cert', file);
            formData.append('doctor_id', doctorId);

            await api.post('/billing/upload-cert', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Certificado subido correctamente");
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            setError(msg);
            alert("Error subiendo certificado: " + msg);
        } finally {
            setUploading(false);
        }
    };

    const [connectionStatus, setConnectionStatus] = useState(null); // 'checking', 'ok', 'error'
    const [statusDetails, setStatusDetails] = useState(null);

    const testConnection = async () => {
        if (!doctorId) return;
        setConnectionStatus('checking');
        setStatusDetails(null);
        try {
            const res = await api.get(`/billing/status?doctor_id=${doctorId}`);
            setConnectionStatus('ok');
            setStatusDetails(res.data);
        } catch (err) {
            setConnectionStatus('error');
            setStatusDetails(err.response?.data?.error || err.message);
        }
    };

    const hideCsrInfo = () => setShowCsrInfo(false);

    return {
        // State
        generatedCsr,
        generatingCsr,
        showCsrInfo,
        uploading,
        connectionStatus,
        statusDetails,
        error,

        // Actions
        generateCsr,
        uploadCert,
        testConnection,
        hideCsrInfo
    };
};
