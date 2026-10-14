import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/shared/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/shared/theme/colors';

export default function AuthLayout() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/(app)/appointments" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
        </Stack>
    );
}
