import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from './src/screens/LoginScreen';
import { AppointmentsScreen } from './src/screens/AppointmentsScreen';

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem('user_token');
                setIsAuthenticated(!!token);
            } catch (e) {
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
