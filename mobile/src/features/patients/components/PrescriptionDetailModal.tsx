import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Prescription } from '@/types/patients';
import { Colors } from '@/shared/theme/colors';

interface PrescriptionDetailModalProps {
    visible: boolean;
    prescription: Prescription | null;
    onClose: () => void;
    onRepeat: () => void;
    onUpdate: (data: { medName: string; dosage: string; notes: string }) => Promise<void>;
    onRequestDelete: () => void;
    actionLoading: boolean;
}

export const PrescriptionDetailModal: React.FC<PrescriptionDetailModalProps> = ({
    visible,
    prescription,
    onClose,
    onRepeat,
    onUpdate,
    onRequestDelete,
    actionLoading,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editMedName, setEditMedName] = useState('');
    const [editDosage, setEditDosage] = useState('');
    const [editNotes, setEditNotes] = useState('');

    useEffect(() => {
        if (prescription) {
            setEditMedName(prescription.medication_name || prescription.name || '');
            setEditDosage(prescription.dosage || prescription.presentation || '');
            setEditNotes(prescription.notes || '');
            setIsEditing(false);
        }
    }, [prescription]);

    if (!prescription) return null;

    const medName = prescription.medication_name || prescription.name || 'Sin nombre';

    const handleSaveEdit = async () => {
        await onUpdate({
            medName: editMedName,
            dosage: editDosage,
            notes: editNotes,
        });
        setIsEditing(false);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {isEditing ? 'Editar Receta' : 'Detalle de Medicación'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {isEditing ? (
                            <>
                                <Text style={styles.label}>Medicamento</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editMedName}
                                    onChangeText={setEditMedName}
                                />

                                <Text style={styles.label}>Dosis / Presentación</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editDosage}
                                    onChangeText={setEditDosage}
                                />

                                <Text style={styles.label}>Indicaciones</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    multiline
                                    value={editNotes}
                                    onChangeText={setEditNotes}
                                />

                                <View style={styles.editActions}>
                                    <TouchableOpacity
                                        style={[styles.btn, styles.cancelBtn]}
                                        onPress={() => setIsEditing(false)}
                                    >
                                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.btn, styles.saveBtn]}
                                        onPress={handleSaveEdit}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator color="#ffffff" />
                                        ) : (
                                            <Text style={styles.saveBtnText}>Guardar</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.medTitle}>{medName}</Text>
                                <Text style={styles.detailRow}>
                                    Dosis: {prescription.dosage || prescription.presentation || '-'}
                                </Text>
                                {prescription.duration_days ? (
                                    <Text style={styles.detailRow}>
                                        Duración: {prescription.duration_days} días
                                    </Text>
                                ) : null}
                                {prescription.notes ? (
                                    <Text style={styles.detailRow}>
                                        Indicaciones: {prescription.notes}
                                    </Text>
                                ) : null}

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.repeatBtn]}
                                        onPress={onRepeat}
                                        disabled={actionLoading}
                                    >
                                        <Text style={styles.repeatBtnText}>🔄 Repetir Receta</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.editBtn]}
                                        onPress={() => setIsEditing(true)}
                                    >
                                        <Text style={styles.editBtnText}>✏️ Editar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.deleteBtn]}
                                        onPress={onRequestDelete}
                                    >
                                        <Text style={styles.deleteBtnText}>🗑️ Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: Colors.cardBackground,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    closeBtn: {
        padding: 4,
    },
    closeBtnText: {
        fontSize: 18,
        color: Colors.textSecondary,
    },
    modalBody: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    medTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textMain,
        marginBottom: 8,
    },
    detailRow: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    actionButtons: {
        marginTop: 20,
        gap: 10,
        paddingBottom: 20,
    },
    actionBtn: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    repeatBtn: {
        backgroundColor: Colors.primaryLight,
    },
    repeatBtnText: {
        color: Colors.primaryDark,
        fontWeight: 'bold',
        fontSize: 14,
    },
    editBtn: {
        backgroundColor: Colors.borderLight,
    },
    editBtnText: {
        color: Colors.textMain,
        fontWeight: '600',
        fontSize: 14,
    },
    deleteBtn: {
        backgroundColor: Colors.dangerLight,
    },
    deleteBtnText: {
        color: Colors.danger,
        fontWeight: '600',
        fontSize: 14,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.textMain,
        backgroundColor: Colors.background,
    },
    textArea: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    editActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 20,
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: Colors.borderLight,
    },
    cancelBtnText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: Colors.primary,
    },
    saveBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
});
