import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProcedures, FilterType, FilterStatus } from './hooks/useProcedures';
import { ProcedureItemCard } from './components/ProcedureItemCard';
import { ProcedureDetailModal } from './components/ProcedureDetailModal';
import { MedicalProcedure } from '@/types/procedures';
import { Colors } from '@/shared/theme/colors';

const TYPE_FILTERS: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'Todos', icon: '📋' },
    { key: 'prescription', label: 'Recetas', icon: '💊' },
    { key: 'license', label: 'Licencias', icon: '🩺' },
    { key: 'certificate', label: 'Certificados', icon: '📄' },
];

const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
    { key: 'pending', label: 'Pendientes' },
    { key: 'completed', label: 'Completados' },
    { key: 'all', label: 'Histórico' },
];

export const ProceduresView: React.FC = () => {
    const router = useRouter();
    const {
        procedures,
        loading,
        refreshing,
        typeFilter,
        setTypeFilter,
        statusFilter,
        setStatusFilter,
        doctorFilter,
        setDoctorFilter,
        doctors,
        searchQuery,
        setSearchQuery,
        actionLoading,
        refresh,
        updateProcedureStatus,
    } = useProcedures();

    const [selectedProcedure, setSelectedProcedure] = useState<MedicalProcedure | null>(null);

    const handleViewPatient = (patientId: number | string) => {
        router.push(`/(app)/patient/${patientId}`);
    };

    const handleQuickComplete = async (id: number | string) => {
        await updateProcedureStatus(id, 'completed');
    };

    const handleModalUpdateStatus = async (
        id: number | string,
        newStatus: 'completed' | 'rejected'
    ) => {
        const success = await updateProcedureStatus(id, newStatus);
        if (success) {
            setSelectedProcedure(null);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Trámites Médicos</Text>
                <Text style={styles.subtitle}>
                    Recetas, licencias y certificados
                </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar paciente en trámites..."
                    placeholderTextColor={Colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.clearSearchBtn}
                    >
                        <Text style={styles.clearSearchText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Type Filters (Pills) */}
            <View style={styles.typeFilterRow}>
                {TYPE_FILTERS.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={[
                            styles.typeFilterPill,
                            typeFilter === item.key && styles.typeFilterPillActive,
                        ]}
                        onPress={() => setTypeFilter(item.key)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.typeFilterIcon}>{item.icon}</Text>
                        <Text
                            style={[
                                styles.typeFilterText,
                                typeFilter === item.key && styles.typeFilterTextActive,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Doctor Scope Selector */}
            {doctors.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.doctorFilterRow}
                    contentContainerStyle={styles.doctorFilterContent}
                >
                    <TouchableOpacity
                        style={[
                            styles.doctorFilterPill,
                            doctorFilter === 'all' && styles.doctorFilterPillActive,
                        ]}
                        onPress={() => setDoctorFilter('all')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.doctorFilterText,
                                doctorFilter === 'all' && styles.doctorFilterTextActive,
                            ]}
                        >
                            Todos
                        </Text>
                    </TouchableOpacity>
                    {doctors.map((doc) => (
                        <TouchableOpacity
                            key={doc.id}
                            style={[
                                styles.doctorFilterPill,
                                doctorFilter === doc.id && styles.doctorFilterPillActive,
                            ]}
                            onPress={() => setDoctorFilter(doc.id)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.doctorFilterText,
                                    doctorFilter === doc.id && styles.doctorFilterTextActive,
                                ]}
                            >
                                {doc.full_name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Status Segmented Bar */}
            <View style={styles.statusSegmentBar}>
                {STATUS_FILTERS.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={[
                            styles.statusSegmentItem,
                            statusFilter === item.key && styles.statusSegmentItemActive,
                        ]}
                        onPress={() => setStatusFilter(item.key)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.statusSegmentText,
                                statusFilter === item.key && styles.statusSegmentTextActive,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {loading && !refreshing ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Cargando trámites...</Text>
                </View>
            ) : (
                <FlatList
                    data={procedures}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                        <ProcedureItemCard
                            procedure={item}
                            onPress={() => setSelectedProcedure(item)}
                            onViewPatient={handleViewPatient}
                            onComplete={handleQuickComplete}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                            tintColor={Colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={styles.emptyTitle}>Sin trámites encontrados</Text>
                            <Text style={styles.emptySubtitle}>
                                {statusFilter === 'pending'
                                    ? 'No hay trámites pendientes de resolución en este momento.'
                                    : 'No se encontraron solicitudes con los filtros aplicados.'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Detail Modal */}
            <ProcedureDetailModal
                visible={!!selectedProcedure}
                procedure={selectedProcedure}
                onClose={() => setSelectedProcedure(null)}
                onViewPatient={handleViewPatient}
                onUpdateStatus={handleModalUpdateStatus}
                actionLoading={actionLoading}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 14,
        color: Colors.text,
    },
    clearSearchBtn: {
        padding: 4,
    },
    clearSearchText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    typeFilterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 10,
    },
    typeFilterPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 4,
    },
    typeFilterPillActive: {
        backgroundColor: 'rgba(0, 168, 132, 0.12)',
        borderColor: Colors.primary,
    },
    typeFilterIcon: {
        fontSize: 12,
    },
    typeFilterText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    typeFilterTextActive: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
    statusSegmentBar: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: Colors.cardBackground,
        borderRadius: 10,
        padding: 3,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statusSegmentItem: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        borderRadius: 8,
    },
    statusSegmentItemActive: {
        backgroundColor: Colors.surface,
    },
    statusSegmentText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    statusSegmentTextActive: {
        color: Colors.text,
        fontWeight: 'bold',
    },
    doctorFilterRow: {
        marginBottom: 10,
    },
    doctorFilterContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    doctorFilterPill: {
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    doctorFilterPillActive: {
        backgroundColor: 'rgba(0, 168, 132, 0.12)',
        borderColor: Colors.primary,
    },
    doctorFilterText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    doctorFilterTextActive: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
});
