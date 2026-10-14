import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/shared/context/AuthContext';
import { Colors } from '@/shared/theme/colors';

interface AppointmentsHeaderProps {
    selectedDate: Date;
    onChangeDate: (days: number) => void;
    onOpenFreeSlots?: () => void;
}

export const AppointmentsHeader: React.FC<AppointmentsHeaderProps> = ({
    selectedDate,
    onChangeDate,
    onOpenFreeSlots,
}) => {
    const { logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro/a de que querés salir de la aplicación?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    },
                },
            ]
        );
    };

    const isToday = selectedDate.toDateString() === new Date().toDateString();

    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.navButton}
                onPress={() => onChangeDate(-7)}
                activeOpacity={0.7}
            >
                <Text style={styles.navButtonText}>◀◀</Text>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>
                    {isToday ? 'Turnos de Hoy 📅' : 'Agenda Médica 📅'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {selectedDate.toLocaleDateString('es-AR', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.navButton}
                onPress={() => onChangeDate(7)}
                activeOpacity={0.7}
            >
                <Text style={styles.navButtonText}>▶▶</Text>
            </TouchableOpacity>

            {onOpenFreeSlots ? (
                <TouchableOpacity
                    style={styles.freeSlotsButton}
                    onPress={onOpenFreeSlots}
                    activeOpacity={0.7}
                >
                    <Text style={styles.freeSlotsText}>⚡ Libres</Text>
                </TouchableOpacity>
            ) : null}

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
            >
                <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitleContainer: {
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    headerSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'capitalize',
        marginTop: 2,
    },
    navButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: Colors.borderLight,
    },
    navButtonText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    freeSlotsButton: {
        marginLeft: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    freeSlotsText: {
        color: Colors.primaryDark,
        fontWeight: 'bold',
        fontSize: 12,
    },
    logoutButton: {
        marginLeft: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Colors.dangerLight,
    },
    logoutText: {
        color: Colors.danger,
        fontWeight: 'bold',
        fontSize: 12,
    },
});
