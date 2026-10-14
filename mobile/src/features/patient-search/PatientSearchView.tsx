import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePatientSearch } from './hooks/usePatientSearch';
import { PatientItemCard } from './components/PatientItemCard';
import { Patient } from '@/types/patients';
import { Colors } from '@/shared/theme/colors';

export const PatientSearchView: React.FC = () => {
    const router = useRouter();
    const {
        query,
        patients,
        loading,
        refreshing,
        totalCount,
        handleQueryChange,
        clearSearch,
        refresh,
    } = usePatientSearch();

    const handleSelectPatient = (patient: Patient) => {
        router.push({
            pathname: '/patient/[id]',
            params: { id: String(patient.id) },
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.title}>Pacientes 👥</Text>
                    <Text style={styles.subtitle}>
                        {totalCount > 0 ? `${totalCount} pacientes en registro` : 'Directorio de pacientes'}
                    </Text>
                </View>
            </View>

            {/* Buscador */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        value={query}
                        onChangeText={handleQueryChange}
                        placeholder="Buscar por nombre, apellido o DNI..."
                        placeholderTextColor={Colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 ? (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>✕</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Lista de Pacientes */}
            {loading && !refreshing && patients.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Buscando pacientes...</Text>
                </View>
            ) : patients.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyIcon}>👤</Text>
                    <Text style={styles.emptyTitle}>
                        {query.trim().length > 0
                            ? 'No se encontraron pacientes'
                            : 'Directorio vacío'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {query.trim().length > 0
                            ? `No hay coincidencias para "${query}". Verificá el DNI o apellido.`
                            : 'Ingresá un término en el buscador para encontrar pacientes.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={patients}
                    keyExtractor={(item, idx) => String(item.id || idx)}
                    renderItem={({ item }) => (
                        <PatientItemCard
                            patient={item}
                            onPress={handleSelectPatient}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.cardBackground,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitleWrap: {
        flexDirection: 'column',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.borderLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.textMain,
        padding: 0,
    },
    clearBtn: {
        padding: 4,
    },
    clearBtnText: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
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
        lineHeight: 18,
    },
});
