import React, { useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDailyAppointments } from './hooks/useDailyAppointments';
import { AppointmentsHeader } from './components/AppointmentsHeader';
import { DoctorSelectorBar } from './components/DoctorSelectorBar';
import { WeeklyCalendarBar } from './components/WeeklyCalendarBar';
import { AppointmentCard } from './components/AppointmentCard';
import { AppointmentActionModal } from './components/AppointmentActionModal';
import { AppointmentPaymentModal } from './components/AppointmentPaymentModal';
import { Appointment } from '@/types/appointments';
import { Colors } from '@/shared/theme/colors';

export const AppointmentsView: React.FC = () => {
    const router = useRouter();
    const {
        selectedDate,
        setSelectedDate,
        appointments,
        loading,
        refreshing,
        stats,
        changeDate,
        refresh,
        doctors,
        selectedDoctorId,
        setSelectedDoctorId,
        isStaff,
        updateAppointmentStatus,
        registerPayment,
        updatePaymentStatus,
    } = useDailyAppointments();

    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showActionModal, setShowActionModal] = useState<boolean>(false);
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

    const touchStartX = useRef<number>(0);

    const handleTouchStart = (e: GestureResponderEvent) => {
        touchStartX.current = e.nativeEvent.pageX;
    };

    const handleTouchEnd = (e: GestureResponderEvent) => {
        const touchEndX = e.nativeEvent.pageX;
        const diffX = touchEndX - touchStartX.current;

        if (diffX < -50) {
            changeDate(1);
        } else if (diffX > 50) {
            changeDate(-1);
        }
    };

    const handleSelectAppointment = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setShowActionModal(true);
    };

    const handleNavigateToPatient = (patientId: number, appointmentId: number) => {
        router.push({
            pathname: '/patient/[id]',
            params: {
                id: String(patientId),
                appointmentId: appointmentId ? String(appointmentId) : '',
            },
        });
    };

    return (
        <SafeAreaView
            style={styles.safeArea}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <AppointmentsHeader
                selectedDate={selectedDate}
                onChangeDate={changeDate}
                onOpenFreeSlots={() => {
                    router.push({
                        pathname: '/(app)/free-slots',
                        params: { doctorId: String(selectedDoctorId) },
                    });
                }}
            />

            {isStaff ? (
                <DoctorSelectorBar
                    doctors={doctors}
                    selectedDoctorId={selectedDoctorId}
                    onSelectDoctor={setSelectedDoctorId}
                />
            ) : null}

            <WeeklyCalendarBar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            {/* Resumen de Estado */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: Colors.success }]}>
                        {stats.attended}
                    </Text>
                    <Text style={styles.statLabel}>Atendidos</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: Colors.warning }]}>
                        {stats.pending}
                    </Text>
                    <Text style={styles.statLabel}>Pendientes</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Cargando agenda del día...</Text>
                </View>
            ) : appointments.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyIcon}>📅</Text>
                    <Text style={styles.emptyTitle}>Sin turnos programados</Text>
                    <Text style={styles.emptySubtitle}>
                        No hay pacientes citados para esta fecha
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={(item, idx) => String(item.id || idx)}
                    renderItem={({ item }) => (
                        <AppointmentCard
                            appointment={item}
                            onPress={() => handleSelectAppointment(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                            colors={[Colors.primary]}
                        />
                    }
                />
            )}

            <AppointmentActionModal
                visible={showActionModal}
                appointment={selectedAppointment}
                onClose={() => {
                    setShowActionModal(false);
                    setSelectedAppointment(null);
                }}
                onUpdateStatus={updateAppointmentStatus}
                onViewPatientProfile={handleNavigateToPatient}
                onOpenPayment={() => {
                    setShowActionModal(false);
                    setShowPaymentModal(true);
                }}
            />

            <AppointmentPaymentModal
                visible={showPaymentModal}
                appointment={selectedAppointment}
                onClose={() => {
                    setShowPaymentModal(false);
                    setSelectedAppointment(null);
                }}
                onRegisterPayment={registerPayment}
                onUpdatePaymentStatus={updatePaymentStatus}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.cardBackground,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 12,
        padding: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textMain,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
