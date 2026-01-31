import { useState, useEffect, useCallback } from 'react';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

export const usePatientSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchPatientId, setSearchPatientId] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [patientAppointments, setPatientAppointments] = useState([]);
    const [patientApptLoading, setPatientApptLoading] = useState(false);
    const { showMessage } = useMessage();
    const { t } = useLanguage();

    const fetchAppointments = useCallback(async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            const res = await api.get('/appointments', { params });
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        }
    }, [searchTerm]);

    const fetchPatientAppointments = async (pId) => {
        setPatientApptLoading(true);
        try {
            const res = await api.get('/appointments', { params: { patientId: pId } });
            setPatientAppointments(res.data);
        } catch (err) {
            console.error(err);
            showMessage(t('error') || 'Error fetching history', 'error');
        } finally {
            setPatientApptLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAppointments();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (searchPatientId) {
            fetchPatientAppointments(searchPatientId);
        } else {
            setPatientAppointments([]);
        }
    }, [searchPatientId]);

    return {
        searchTerm, setSearchTerm,
        searchPatientId, setSearchPatientId,
        appointments, setAppointments,
        patientAppointments,
        patientApptLoading,
        fetchAppointments
    };
};
