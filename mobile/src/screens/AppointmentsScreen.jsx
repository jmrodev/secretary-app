import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Platform,
    Modal,
    ScrollView,
    Linking,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../services/api';
import { PatientDetailScreen } from './PatientDetailScreen';

export const AppointmentsScreen = ({ onLogout }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ total: 0, attended: 0, pending: 0 });
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
    const [viewingPatientId, setViewingPatientId] = useState(null);
    const [viewingAppointmentId, setViewingAppointmentId] = useState(null);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            if (!selectedAppointment?.patient_id) {
                setPatientDetails(null);
                return;
            }
            setLoadingPatientDetails(true);
            try {
                const data = await apiFetch(`/users/patients/${selectedAppointment.patient_id}`);
                setPatientDetails(data?.data || data);
            } catch (err) {
                console.warn('Error fetching patient details:', err);
                setPatientDetails(null);
            } finally {
                setLoadingPatientDetails(false);
            }
        };

        fetchPatientDetails();
    }, [selectedAppointment]);

    const changeDate = (days) => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + days);
        setSelectedDate(next);
    };

    const fetchDailyAppointments = async (dateObj = selectedDate) => {
        try {
            setLoading(true);
            const userInfoRaw = await AsyncStorage.getItem('user_info');
            const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
            const doctorId = userInfo?.doctor_id || userInfo?.profile_id || 10;

            const formattedDate = dateObj.toISOString().split('T')[0];
            const data = await apiFetch(`/appointments/daily-schedule?date=${formattedDate}&doctorId=${doctorId}`);

            const rawList = data?.data || data?.schedule || data || [];
            const list = Array.isArray(rawList)
                ? rawList.filter(item => item.patient_name && item.patient_name !== 'Desconocido' && !item.patient_name.includes('(Sin Paciente)'))
                : [];
            setAppointments(list);

            const attended = list.filter(a => a.status === 'attended' || a.status === 'completado' || a.status === 'completed').length;
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
        fetchDailyAppointments(selectedDate);
    }, [selectedDate]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDailyAppointments(selectedDate);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro/a de que querés salir de la aplicación?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('user_token');
                        await AsyncStorage.removeItem('user_info');
                        onLogout();
                    }
                }
            ]
        );
    };

    const handleConfirmCall = (phone, patientName) => {
        Alert.alert(
            'Confirmar Llamada',
            `¿Querés llamar por teléfono a ${patientName || 'este paciente'} (${phone})?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Llamar',
                    onPress: () => Linking.openURL(`tel:${phone}`)
                }
            ]
        );
    };

    const handleConfirmWhatsApp = (phone, patientName) => {
        Alert.alert(
            'Confirmar WhatsApp',
            `¿Querés abrir un chat de WhatsApp con ${patientName || 'este paciente'}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Abrir WhatsApp',
                    onPress: () => {
                        const cleanPhone = phone.replace(/\D/g, '');
                        Linking.openURL(`https://wa.me/${cleanPhone}`);
                    }
                }
            ]
        );
    };

    // Gestos de swipe (deslizar a izquierda / derecha)
    let touchStartX = 0;

    const handleTouchStart = (e) => {
        touchStartX = e.nativeEvent.pageX;
    };

    const handleTouchEnd = (e) => {
        const touchEndX = e.nativeEvent.pageX;
        const diffX = touchEndX - touchStartX;

        // Sensibilidad del swipe: más de 50px
        if (diffX < -50) {
            changeDate(1); // Deslizar a la izquierda -> Día Siguiente
        } else if (diffX > 50) {
            changeDate(-1); // Deslizar a la derecha -> Día Anterior
        }
    };

    const renderAppointmentItem = ({ item }) => {
        const isAttended = item.status === 'attended' || item.status === 'completado' || item.status === 'completed';

        // Extraer hora formateada (HH:mm)
        let formattedTime = '09:00';
        if (item.slot_time) {
            formattedTime = item.slot_time.substring(0, 5);
        } else if (item.appointment_date) {
            const d = new Date(item.appointment_date);
            formattedTime = !isNaN(d) ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:00';
        } else if (item.time || item.appointment_time) {
            formattedTime = (item.time || item.appointment_time).substring(0, 5);
        }

        const displayName = item.patient_name || item.patientName;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    const pId = item.patient_id || item.patientId;
                    if (pId) {
                        setViewingPatientId(pId);
                        setViewingAppointmentId(item.id || null);
                    } else {
                        Alert.alert('Aviso', 'Este turno no está vinculado a una ficha de paciente registrada.');
                    }
                }}
            >
                <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{formattedTime}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.patientName}>{displayName}</Text>
                    <Text style={styles.detailText}>
                        Teléfono: {item.patient_phone || item.phone || '-'}
                    </Text>
                    {item.reason && item.reason !== '-' ? (
                        <Text style={styles.notesText} numberOfLines={2}>
                            Motivo: {item.reason}
                        </Text>
                    ) : null}
                </View>

                <View style={[styles.statusBadge, isAttended ? styles.statusAttended : styles.statusPending]}>
                    <Text style={[styles.statusText, isAttended ? styles.statusAttendedText : styles.statusPendingText]}>
                        {isAttended ? 'Atendido' : 'Pendiente'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Generar días de la semana actual
    const getWeekDays = () => {
        const startOfWeek = new Date(selectedDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día
        startOfWeek.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays();

    if (viewingPatientId) {
        return (
            <PatientDetailScreen
                patientId={viewingPatientId}
                appointmentId={viewingAppointmentId}
                onClose={() => {
                    setViewingPatientId(null);
                    setViewingAppointmentId(null);
                }}
            />
        );
    }

    return (
        <SafeAreaView
            style={styles.safeArea}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.navButton} onPress={() => changeDate(-7)}>
                    <Text style={styles.navButtonText}>◀◀</Text>
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>
                        {selectedDate.toDateString() === new Date().toDateString() ? 'Turnos de Hoy 📅' : 'Agenda Médica 📅'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {selectedDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                    </Text>
                </View>

                <TouchableOpacity style={styles.navButton} onPress={() => changeDate(7)}>
                    <Text style={styles.navButtonText}>▶▶</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Salir</Text>
                </TouchableOpacity>
            </View>

            {/* Barra Interactiva de Calendario Semanal */}
            <View style={styles.calendarBar}>
                {weekDays.map((d, idx) => {
                    const isSelected = d.toDateString() === selectedDate.toDateString();
                    const isToday = d.toDateString() === new Date().toDateString();
                    const dayName = d.toLocaleDateString('es-AR', { weekday: 'narrow' });
                    const dayNum = d.getDate();

                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.calendarDayBox,
                                isToday && styles.calendarDayBoxToday,
                                isSelected && styles.calendarDayBoxSelected
                            ]}
                            onPress={() => setSelectedDate(d)}
                        >
                            <Text style={[
                                styles.calendarDayName,
                                isToday && !isSelected && styles.calendarTextToday,
                                isSelected && styles.calendarTextSelected
                            ]}>
                                {dayName}
                            </Text>
                            <Text style={[
                                styles.calendarDayNum,
                                isToday && !isSelected && styles.calendarTextToday,
                                isSelected && styles.calendarTextSelected
                            ]}>
                                {dayNum}
                            </Text>
                            {isToday ? (
                                <View style={[styles.todayIndicatorDot, isSelected && styles.todayIndicatorDotSelected]} />
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 36) + 12 : 16,
        paddingBottom: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitleContainer: {
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748b',
        textTransform: 'capitalize',
        marginTop: 2,
    },
    navButton: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    navButtonText: {
        fontSize: 16,
        color: '#2563eb',
        fontWeight: 'bold',
    },
    calendarBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    calendarDayBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        minWidth: 42,
    },
    calendarDayBoxSelected: {
        backgroundColor: '#2563eb',
    },
    calendarDayBoxToday: {
        backgroundColor: '#dbeafe',
        borderWidth: 2,
        borderColor: '#2563eb',
    },
    calendarTextToday: {
        color: '#1e40af',
        fontWeight: 'bold',
    },
    todayIndicatorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2563eb',
        marginTop: 4,
    },
    todayIndicatorDotSelected: {
        backgroundColor: '#ffffff',
    },
    calendarDayName: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    calendarDayNum: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 2,
    },
    calendarTextSelected: {
        color: '#ffffff',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 14,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    modalCloseText: {
        fontSize: 20,
        color: '#64748b',
        fontWeight: 'bold',
        padding: 4,
    },
    modalBody: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        color: '#1e293b',
    },
    detailValueBold: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    detailBlock: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailBlockText: {
        fontSize: 14,
        color: '#334155',
        marginTop: 4,
        fontStyle: 'italic',
    },
    sectionHeader: {
        marginTop: 16,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    debtHighlightRow: {
        backgroundColor: '#fef2f2',
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    medicationList: {
        marginVertical: 6,
        gap: 6,
    },
    medicationCard: {
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#2563eb',
    },
    medicationName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    medicationDetail: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    emptySubText: {
        fontSize: 13,
        color: '#94a3b8',
        fontStyle: 'italic',
        marginVertical: 6,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 18,
    },
    fullDetailButton: {
        backgroundColor: '#0284c7',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 16,
    },
    fullDetailButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    callButton: {
        flex: 1,
        backgroundColor: '#2563eb',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    wsButton: {
        flex: 1,
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalCloseButton: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#475569',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
