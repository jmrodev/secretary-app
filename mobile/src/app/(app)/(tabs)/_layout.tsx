import React from 'react';
import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { Colors } from '@/shared/theme/colors';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: Colors.cardBackground,
                    borderTopColor: Colors.border,
                    height: Platform.OS === 'ios' ? 86 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="appointments"
                options={{
                    title: 'Turnos',
                    tabBarIcon: () => <Text style={{ fontSize: 20 }}>📅</Text>,
                }}
            />
            <Tabs.Screen
                name="patients"
                options={{
                    title: 'Pacientes',
                    tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text>,
                }}
            />
            <Tabs.Screen
                name="procedures"
                options={{
                    title: 'Trámites',
                    tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>,
                }}
            />
        </Tabs>
    );
}
