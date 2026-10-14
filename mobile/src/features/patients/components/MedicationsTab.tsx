import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Prescription } from '@/types/patients';
import { Colors } from '@/shared/theme/colors';

interface MedicationsTabProps {
    prescriptions: Prescription[];
    onOpenAdd: () => void;
    onSelectPrescription: (prescription: Prescription) => void;
    onRepeatPrescription: (prescription: Prescription) => void;
}

export const MedicationsTab: React.FC<MedicationsTabProps> = ({
    prescriptions,
    onOpenAdd,
    onSelectPrescription,
    onRepeatPrescription,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.sectionTitle}>Medicación y Recetas</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={onOpenAdd}
                    activeOpacity={0.7}
                >
                    <Text style={styles.addBtnText}>+ Prescribir</Text>
                </TouchableOpacity>
            </View>

            {prescriptions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>💊</Text>
                    <Text style={styles.emptyText}>Sin medicaciones registradas</Text>
                </View>
            ) : (
                <FlatList
                    data={prescriptions}
                    keyExtractor={(item, idx) => String(item.id || idx)}
                    renderItem={({ item }) => {
                        const medName =
                            item.medication_name || item.name || 'Sin nombre';
                        const dosage = item.dosage || item.presentation || '-';

                        return (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => onSelectPrescription(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardInfo}>
                                    <Text style={styles.medName}>{medName}</Text>
                                    <Text style={styles.dosageText}>Dosis: {dosage}</Text>
                                    {item.duration_days ? (
                                        <Text style={styles.subText}>
                                            Duración: {item.duration_days} días
                                        </Text>
                                    ) : null}
                                    {item.notes ? (
                                        <Text style={styles.subText} numberOfLines={2}>
                                            Indicación: {item.notes}
                                        </Text>
                                    ) : null}
                                </View>

                                <TouchableOpacity
                                    style={styles.repeatBtn}
                                    onPress={() => onRepeatPrescription(item)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.repeatBtnText}>Repetir</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    addBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardInfo: {
        flex: 1,
    },
    medName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    dosageText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    subText: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    repeatBtn: {
        backgroundColor: Colors.primaryLight,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginLeft: 10,
    },
    repeatBtnText: {
        color: Colors.primaryDark,
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyIcon: {
        fontSize: 36,
        marginBottom: 10,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
});
