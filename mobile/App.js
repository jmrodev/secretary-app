import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from './src/screens/LoginScreen.jsx';
import { AppointmentsScreen } from './src/screens/AppointmentsScreen.jsx';

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AsyncStorage timeout')), 2000)
                );
                const token = await Promise.race([
                    AsyncStorage.getItem('user_token'),
                    timeoutPromise
                ]);
                setIsAuthenticated(!!token);
            } catch (e) {
                console.warn('Auth check error or timeout:', e);
                setIsAuthenticated(false);
            } finally {
                setCheckingAuth(false);
            }
        };

        checkToken();
    }, []);

    if (checkingAuth) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {isAuthenticated ? (
                <AppointmentsScreen onLogout={() => setIsAuthenticated(false)} />
            ) : (
                <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
});
