import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { User } from '@/types/auth';

const getBaseHost = (): string => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        return window.location.hostname || 'localhost';
    }
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
        return debuggerHost.split(':')[0];
    }
    return '192.168.0.172';
};

export const API_BASE_URL = `http://${getBaseHost()}:5000/api`;

export const getAuthToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem('user_token');
    } catch {
        return null;
    }
};

export const getStoredUser = async (): Promise<User | null> => {
    try {
        const raw = await AsyncStorage.getItem('user_info');
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
};

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getAuthToken();
    const userInfo = await getStoredUser();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (userInfo?.doctor_id || userInfo?.profile_id) {
        headers['x-doctor-id'] = String(userInfo.doctor_id || userInfo.profile_id);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        await AsyncStorage.multiRemove(['user_token', 'user_info']);
        throw new Error('Sesión expirada o no autorizada');
    }

    const text = await response.text();
    let data: any;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text };
    }

    if (!response.ok) {
        let msg = data.message || data.error || (typeof data === 'string' ? data : `Error (${response.status})`);
        if (msg === 'Invalid Credentials') {
            msg = 'Usuario o contraseña incorrectos';
        }
        throw new Error(msg);
    }

    return data as T;
}
