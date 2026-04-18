import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/api/axios';

export const usePublicPrescriptionRequestController = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [patientInfo, setPatientInfo] = useState(null);
    const [selectedMeds, setSelectedMeds] = useState([]);
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/medical/public/prescription-request/${token}`);
                setPatientInfo(res.data);
            } catch (err) {
                setError(err.response?.data?.error || "El enlace es inválido o ha expirado.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    useEffect(() => {
        if (searchTerm.length < 3) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setSearching(true);
            try {
                // Use public search endpoint
                const res = await api.get(`/medical/public/vademecum/search?q=${searchTerm}`);
                setSearchResults(res.data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleToggleMedSelection = (medName) => {
        setSelectedMeds(prev =>
            prev.includes(medName)
                ? prev.filter(m => m !== medName)
                : [...prev, medName]
        );
    };

    const handleAddManualMed = () => {
        if (!searchTerm.trim()) return;
        if (!selectedMeds.includes(searchTerm.trim())) {
            setSelectedMeds(prev => [...prev, searchTerm.trim()]);
        }
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleSubmit = async () => {
        if (selectedMeds.length === 0) return;

        setLoading(true);
        setError(null); // Clear previous errors
        try {
            await api.post(`/medical/public/prescription-request/${token}`, {
                medications: selectedMeds,
                notes,
                doctorId: patientInfo?.doctorId
            });
            setSuccess(true);
        } catch (err) {
            console.error("Submission failed", err);
            setError(err.response?.data?.error || "Hubo un error al enviar la solicitud. Por favor intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handlers = {
        setNotes,
        setSearchTerm,
        handleToggleMedSelection,
        handleAddManualMed,
        handleSubmit
    };

    return {
        loading,
        error,
        success,
        patientInfo,
        selectedMeds,
        notes,
        searchTerm,
        searchResults,
        searching,
        handlers
    };
};
