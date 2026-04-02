import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../features/auth';

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        enable_office_rentals: 'true', // Default to true until loaded
    });
    const [loading, setLoading] = useState(true);

    const { user } = useAuth(); // Import useAuth to check login status

    const fetchSettings = async () => {
        // If not logged in, don't fetch protected settings
        if (!user) return;

        try {
            const res = await api.get('/settings');
            setSettings(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            console.error("Failed to load settings", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSettings();
        } else {
            setLoading(false); // If no user, we are 'done' loading defaults
        }
    }, [user]);

    const updateSetting = async (key, value) => {
        try {
            // Optimistic update
            setSettings(prev => ({ ...prev, [key]: String(value) }));

            await api.post('/settings', { key, value });
        } catch (err) {
            console.error("Failed to update setting", err);
            // Revert on failure? For now just log.
            fetchSettings();
        }
    };

    return (
        <ConfigContext.Provider value={{ settings, loading, updateSetting, refreshSettings: fetchSettings }}>
            {children}
        </ConfigContext.Provider>
    );
};
