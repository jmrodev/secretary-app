import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import api from '@/api/axios';

const initialState = {
    settings: {
        enable_office_rentals: 'true', // Default to true until loaded
    },
    loading: true
};

const configReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SETTINGS':
            return {
                ...state,
                settings: { ...state.settings, ...action.payload },
                loading: false
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        case 'UPDATE_SETTING':
            return {
                ...state,
                settings: { ...state.settings, [action.payload.key]: String(action.payload.value) }
            };
        default:
            return state;
    }
};

export const useConfigLogic = (user) => {
    const [state, dispatch] = useReducer(configReducer, initialState);

    const fetchSettings = useCallback(async () => {
        // If not logged in, don't fetch protected settings
        if (!user) return;

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await api.get('/settings');
            dispatch({ type: 'SET_SETTINGS', payload: res.data });
        } catch (err) {
            console.error("Failed to load settings", err);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [user]);

    const onMountOrUserChange = React.useEffectEvent(() => {
        if (!user) {
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
        }
        fetchSettings();
    });

    useEffect(() => {
        onMountOrUserChange();
    }, [user]); // Now only depends on user change

    const updateSetting = useCallback(async (key, value) => {
        try {
            // Optimistic update
            dispatch({ type: 'UPDATE_SETTING', payload: { key, value } });

            await api.post('/settings', { key, value });
        } catch (err) {
            console.error("Failed to update setting", err);
            // Revert on failure by refetching
            fetchSettings();
        }
    }, [fetchSettings]);

    const value = useMemo(() => ({
        ...state,
        updateSetting,
        refreshSettings: fetchSettings
    }), [state, updateSetting, fetchSettings]);

    return value;
};
