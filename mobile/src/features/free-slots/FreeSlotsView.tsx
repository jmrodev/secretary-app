import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNextFreeSlots } from './hooks/useNextFreeSlots';
import { FreeSlotsHeader } from './components/FreeSlotsHeader';
import { MonthNavigatorBar } from './components/MonthNavigatorBar';
import { FreeSlotDayCard } from './components/FreeSlotDayCard';
import { FreeSlotActionModal } from './components/FreeSlotActionModal';
import { DoctorSelectorBar } from '@/features/appointments/components/DoctorSelectorBar';
import { FreeSlot, FreeSlotDay } from '@/types/freeSlots';
import { Colors } from '@/shared/theme/colors';

interface FreeSlotsViewProps {
    initialDoctorId?: number;
}

export const FreeSlotsView: React.FC<FreeSlotsViewProps> = ({
    initialDoctorId,
}) => {
    const {
        doctors,
        selectedDoctorId,
        setSelectedDoctorId,
        selectedDoctor,
        isStaff,
        includeOutOfHours,
        toggleOutOfHours,
        loading,
        refreshing,
        days,
        nextStartDate,
        selectedMonthOffset,
        refresh,
        loadMore,
        jumpToMonth,
    } = useNextFreeSlots(initialDoctorId);

    const [selectedSlot, setSelectedSlot] = useState<FreeSlot | null>(null);
    const [selectedDay, setSelectedDay] = useState<FreeSlotDay | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);

    const handleSelectSlot = (day: FreeSlotDay, slot: FreeSlot) => {
        setSelectedDay(day);
        setSelectedSlot(slot);
        setShowModal(true);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <FreeSlotsHeader doctorName={selectedDoctor?.full_name} />

            {isStaff ? (
                <DoctorSelectorBar
                    doctors={doctors}
                    selectedDoctorId={selectedDoctorId}
                    onSelectDoctor={setSelectedDoctorId}
                />
            ) : null}

            <MonthNavigatorBar
                selectedOffset={selectedMonthOffset}
                onSelectMonth={jumpToMonth}
            />

            {/* Habilitar fuera de hora / sobreturno */}
            <View style={styles.overtimeBar}>
                <View style={styles.overtimeInfo}>
                    <Text style={styles.overtimeTitle}>
                        Habilitar fuera de hora / sobreturno
                    </Text>
                    <Text style={styles.overtimeSubtitle}>
                        {includeOutOfHours
                            ? 'Mostrando turnos habituales y sobreturnos'
                            : 'Solo horarios regulares del profesional'}
                    </Text>
                </View>
                <Switch
                    value={includeOutOfHours}
                    onValueChange={toggleOutOfHours}
                    trackColor={{ false: Colors.border, true: '#f59e0b' }}
                    thumbColor={includeOutOfHours ? '#ffffff' : '#f8fafc'}
                />
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Buscando turnos disponibles...</Text>
                </View>
            ) : days.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>Sin turnos libres</Text>
                    <Text style={styles.emptySubtitle}>
                        No se encontraron horarios disponibles en este período.
                    </Text>
                    {nextStartDate ? (
                        <TouchableOpacity
                            style={styles.btnSearchMore}
                            onPress={loadMore}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.btnSearchMoreText}>
                                Buscar en las próximas semanas
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : (
                <FlatList
                    data={days}
                    keyExtractor={(item) => item.date}
                    renderItem={({ item }) => (
                        <FreeSlotDayCard
                            day={item}
                            onSelectSlot={handleSelectSlot}
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
                    ListFooterComponent={
                        nextStartDate ? (
                            <TouchableOpacity
                                style={styles.loadMoreButton}
                                onPress={loadMore}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.loadMoreText}>
                                    ➕ Cargar más turnos disponibles
                                </Text>
                            </TouchableOpacity>
                        ) : null
                    }
                />
            )}

            <FreeSlotActionModal
                visible={showModal}
                slot={selectedSlot}
                day={selectedDay}
                doctor={selectedDoctor}
                onClose={() => {
                    setShowModal(false);
                    setSelectedSlot(null);
                    setSelectedDay(null);
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    overtimeBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.cardBackground,
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
    },
    overtimeInfo: {
        flex: 1,
        marginRight: 12,
    },
    overtimeTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    overtimeSubtitle: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 30,
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
        marginBottom: 16,
    },
    btnSearchMore: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    btnSearchMoreText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    loadMoreButton: {
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 16,
    },
    loadMoreText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.primary,
    },
});
