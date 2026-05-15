import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/api/axios';

const initialState = {
    loading: true,
    error: null,
    success: false,
    patientInfo: null,
    selectedMeds: [],
    notes: '',
    searchTerm: '',
    searchResults: [],
    searching: false,
};

function reducer(state, action) {
    switch (action.type) {
        case 'START_FETCH': return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS': return { ...state, loading: false, patientInfo: action.payload };
        case 'FETCH_ERROR': return { ...state, loading: false, error: action.payload };
        case 'SET_SEARCH_TERM': return { ...state, searchTerm: action.payload };
        case 'SET_SEARCH_RESULTS': return { ...state, searchResults: action.payload, searching: false };
        case 'START_SEARCH': return { ...state, searching: true };
        case 'SET_NOTES': return { ...state, notes: action.payload };
        case 'TOGGLE_MED': {
            const medName = action.payload;
            const selectedMeds = state.selectedMeds.includes(medName)
                ? state.selectedMeds.filter(m => m !== medName)
                : [...state.selectedMeds, medName];
            return { ...state, selectedMeds };
        }
        case 'ADD_MANUAL_MED': {
            const med = state.searchTerm.trim();
            if (!med || state.selectedMeds.includes(med)) return { ...state, searchTerm: '', searchResults: [] };
            return { ...state, selectedMeds: [...state.selectedMeds, med], searchTerm: '', searchResults: [] };
        }
        case 'SUBMIT_START': return { ...state, loading: true, error: null };
        case 'SUBMIT_SUCCESS': return { ...state, loading: false, success: true };
        case 'SUBMIT_ERROR': return { ...state, loading: false, error: action.payload };
        default: return state;
    }
}

export const usePublicPrescriptionRequestController = () => {
    const { token } = useParams();
    const [realState, realDispatch] = React.useReducer(reducer, initialState);
    const { loading, error, success, patientInfo, selectedMeds, notes, searchTerm, searchResults, searching } = realState;

    useEffect(() => {
        const fetchData = async () => {
            realDispatch({ type: 'START_FETCH' });
            try {
                const res = await api.get(`/medical/public/prescription-request/${token}`);
                realDispatch({ type: 'FETCH_SUCCESS', payload: res.data });
            } catch (err) {
                realDispatch({ type: 'FETCH_ERROR', payload: err.response?.data?.error || "El enlace es inválido o ha expirado." });
            }
        };
        fetchData();
    }, [token]);

    useEffect(() => {
        if (searchTerm.length < 3) {
            realDispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            realDispatch({ type: 'START_SEARCH' });
            try {
                const res = await api.get(`/medical/public/vademecum/search?q=${searchTerm}`);
                realDispatch({ type: 'SET_SEARCH_RESULTS', payload: res.data });
            } catch (err) {
                console.error("Search failed", err);
                realDispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleToggleMedSelection = (medName) => realDispatch({ type: 'TOGGLE_MED', payload: medName });
    const handleAddManualMed = () => realDispatch({ type: 'ADD_MANUAL_MED' });

    const handleSubmit = async () => {
        if (selectedMeds.length === 0) return;
        realDispatch({ type: 'SUBMIT_START' });
        try {
            await api.post(`/medical/public/prescription-request/${token}`, {
                medications: selectedMeds,
                notes,
                doctorId: patientInfo?.doctorId
            });
            realDispatch({ type: 'SUBMIT_SUCCESS' });
        } catch (err) {
            realDispatch({ type: 'SUBMIT_ERROR', payload: err.response?.data?.error || "Hubo un error al enviar la solicitud." });
        }
    };

    const handlers = {
        setNotes: (val) => realDispatch({ type: 'SET_NOTES', payload: val }),
        setSearchTerm: (val) => realDispatch({ type: 'SET_SEARCH_TERM', payload: val }),
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
