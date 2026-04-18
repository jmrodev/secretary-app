import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useModal } from '../context/ModalContext';

/**
 * Controller hook for the TempAccess page.
 * Handles token verification, insurance data fetching, and form submission.
 */
export const useTempAccessController = () => {
    const { token } = useParams();
    const { alert } = useModal();

    const [state, setState] = useState({
        loading: true,
        isValid: false,
        isNew: false,
        initialData: null,
        error: '',
        success: false,
        insurances: []
    });

    const verifyToken = useCallback(async () => {
        try {
            const [resVerify, resInsurances] = await Promise.all([
                api.get(`/temp-access/verify/${token}`),
                api.get('/insurances')
            ]);

            setState(prev => ({
                ...prev,
                isValid: resVerify.data.valid,
                isNew: resVerify.data.isNew,
                initialData: resVerify.data.patient || null,
                insurances: resInsurances.data,
                loading: false
            }));
        } catch (err) {
            console.error('[TempAccessController] Verification error:', err);
            setState(prev => ({
                ...prev,
                error: 'El enlace es inválido o ha expirado.',
                loading: false
            }));
        }
    }, [token]);

    useEffect(() => {
        queueMicrotask(verifyToken);
    }, [verifyToken]);

    const handleSubmit = async (formData) => {
        try {
            await api.post(`/temp-access/complete/${token}`, formData);
            setState(prev => ({ ...prev, success: true }));
        } catch (err) {
            console.error('[TempAccessController] Submit error:', err);
            alert(err.response?.data?.error || "Error al guardar los datos.");
        }
    };

    const handlers = {
        handleSubmit
    };

    return {
        ...state,
        handlers
    };
};
