import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../services/api';

export const AppointmentsScreen = ({ onLogout }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ total: 0, attended: 0, pending: 0 });

    const fetchDailyAppointments = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await apiFetch(`/appointments?date=${today}`);

            const list = Array.isArray(data) ? data : (data.appointments || []);
            setAppointments(list);

            const attended = list.filter(a => a.status === 'attended' || a.status === 'completado').length;
            setStats({
                total: list.length,
                attended,
                pending: list.length - attended,
            });
        } catch (error) {
            console.error('Error al cargar turnos:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDailyAppointments();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDailyAppointments();
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('user_token');
        await AsyncStorage.removeItem('user_info');
        onLogout();
    };

    const renderAppointmentItem = ({ item }) => {
        const isAttended = item.status === 'attended' || item.status === 'completado';

        return (
            <View style={styles.card}>
                <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{item.time || item.appointment_time || '09:00'}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.patientName}>{item.patient_name || item.patientName || 'Paciente'}</Text>
                    <Text style={styles.detailText}>
                        Obra Social: {item.health_insurance || item.healthInsurance || 'Particular'}
                    </Text>
                    {item.notes ? (
                        <Text style={styles.notesText} numberOfLines={2}>
                            Nota: {item.notes}
                        </Text>
                    ) : null}
                </View>

                <View style={[styles.statusBadge, isAttended ? styles.statusAttended : styles.statusPending]}>
                    <Text style={[styles.statusText, isAttended ? styles.statusAttendedText : styles.statusPendingText]}>
                        {isAttended ? 'Atendido' : 'Pendiente'}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Turnos de Hoy 📅</Text>
                    <Text style={styles.headerSubtitle}>
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Salir</Text>
                </TouchableOpacity>
            </View>

            {/* Resumen de estadísticas */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxSuccess]}>
                    <Text style={[styles.statNumber, { color: '#16a34a' }]}>{stats.attended}</Text>
                    <Text style={styles.statLabel}>Atendidos</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxWarning]}>
                    <Text style={[styles.statNumber, { color: '#ea580c' }]}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pendientes</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Cargando turnos...</Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    renderItem={renderAppointmentItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>Sin turnos registrados</Text>
                            <Text style={styles.emptySub}>No tenés turnos asignados para el día de hoy.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748b',
        textTransform: 'capitalize',
        marginTop: 2,
    },
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fee2e2',
        borderRadius: 6,
    },
    logoutText: {
        color: '#dc2626',
        fontWeight: '600',
        fontSize: 13,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        elevation: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statBoxSuccess: {
        borderColor: '#bbf7d0',
    },
    statBoxWarning: {
        borderColor: '#fed7aa',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statLabel: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    timeBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 12,
    },
    timeText: {
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: 14,
    },
    infoContainer: {
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    detailText: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    notesText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusAttended: {
        backgroundColor: '#dcfce7',
    },
    statusPending: {
        backgroundColor: '#ffedd5',
    },
    statusAttendedText: {
        color: '#15803d',
        fontWeight: '600',
        fontSize: 11,
    },
    statusPendingText: {
        color: '#c2410c',
        fontWeight: '600',
        fontSize: 11,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#64748b',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#475569',
    },
    emptySub: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4,
    },
});
