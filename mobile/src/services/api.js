import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Obtener la IP del host donde corre Expo Metro o fallback a la IP local de desarrollo
const debuggerHost = Constants.expoConfig?.hostUri;
const localhostIp = debuggerHost ? debuggerHost.split(':')[0] : '192.168.1.47';

export const API_BASE_URL = `http://${localhostIp}:5000/api`;

export const getAuthToken = async () => {
    try {
        return await AsyncStorage.getItem('user_token');
    } catch (e) {
        return null;
    }
};

export const apiFetch = async (endpoint, options = {}) => {
    const token = await getAuthToken();
    const userInfoRaw = await AsyncStorage.getItem('user_info');
    const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (userInfo?.doctor_id || userInfo?.profile_id) {
        headers['x-doctor-id'] = (userInfo.doctor_id || userInfo.profile_id).toString();
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        await AsyncStorage.removeItem('user_token');
        throw new Error('Sesión expirada o no autorizada');
    }

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error(`Respuesta inválida del servidor (${response.status}): ${text.slice(0, 100)}`);
    }

    if (!response.ok) {
        throw new Error(data.message || data.error || `Error en la petición (${response.status})`);
    }
    return data;
};
