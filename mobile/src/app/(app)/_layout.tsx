import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/shared/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/shared/theme/colors';

export default function AppLayout() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
                name="patient/[id]"
                options={{
                    animation: 'slide_from_right',
                }}
            />
            <Stack.Screen
                name="free-slots"
                options={{
                    animation: 'slide_from_right',
                }}
            />
        </Stack>
    );
}
