import AsyncStorage from '@react-native-async-storage/async-storage';

// Reemplazar IP_DE_TU_SERVIDOR por la IP local de tu servidor en desarrollo (ej. 192.168.1.X) o dominio productivo
export const API_BASE_URL = 'http://localhost:3000/api';

export const getAuthToken = async () => {
    try {
        return await AsyncStorage.getItem('user_token');
    } catch (e) {
        return null;
    }
};

export const apiFetch = async (endpoint, options = {}) => {
    const token = await getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        await AsyncStorage.removeItem('user_token');
        throw new Error('Sesión expirada');
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error || 'Error en la petición');
    }
    return data;
};
