import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { AuthProvider } from '@/shared/context/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="dark" />
            <Slot />
        </AuthProvider>
    );
}
