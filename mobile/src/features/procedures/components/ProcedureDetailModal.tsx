import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Platform,
} from 'react-native';
import { MedicalProcedure } from '@/types/procedures';
import { Colors } from '@/shared/theme/colors';

interface ProcedureDetailModalProps {
    visible: boolean;
    procedure: MedicalProcedure | null;
    onClose: () => void;
    onViewPatient: (patientId: number | string) => void;
    onUpdateStatus: (id: number | string, newStatus: 'completed' | 'rejected') => Promise<void>;
    actionLoading: boolean;
}

export const ProcedureDetailModal: React.FC<ProcedureDetailModalProps> = ({
    visible,
    procedure,
    onClose,
    onViewPatient,
    onUpdateStatus,
    actionLoading,
}) => {
    if (!procedure) return null;

    const isPending = procedure.status === 'pending';
    const isCompleted = procedure.status === 'completed';

    const typeLabels = {
        prescription: '💊 Receta Médica',
        license: '🩺 Licencia Médica',
        certificate: '📄 Certificado Médico',
    }[procedure.type] || '📋 Trámite Médico';

    let dateStr = '';
    if (procedure.created_at) {
        const d = new Date(procedure.created_at);
        if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.typeTitle}>{typeLabels}</Text>
                            {dateStr ? <Text style={styles.dateSub}>Solicitado el {dateStr}</Text> : null}
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {/* Estado */}
                        <View style={styles.statusRow}>
                            <Text style={styles.fieldLabel}>Estado:</Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    isPending
                                        ? styles.statusBadgePending
                                        : isCompleted
                                        ? styles.statusBadgeCompleted
                                        : styles.statusBadgeOther,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        isPending
                                            ? styles.statusTextPending
                                            : isCompleted
                                            ? styles.statusTextCompleted
                                            : styles.statusTextOther,
                                    ]}
                                >
                                    {isPending ? 'Pendiente' : isCompleted ? 'Completado' : procedure.status}
                                </Text>
                            </View>
                        </View>

                        {/* Paciente */}
                        <View style={styles.section}>
                            <Text style={styles.fieldLabel}>Paciente:</Text>
                            <TouchableOpacity
                                style={styles.patientRow}
                                onPress={() => {
                                    onClose();
                                    onViewPatient(procedure.patient_id);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.patientName}>
                                    {procedure.patient_name || `Paciente #${procedure.patient_id}`}
                                </Text>
                                <Text style={styles.patientLink}>Ver Bio / Ficha ›</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Profesional */}
                        {procedure.doctor_name ? (
                            <View style={styles.section}>
                                <Text style={styles.fieldLabel}>Profesional asignado:</Text>
                                <Text style={styles.fieldValue}>{procedure.doctor_name}</Text>
                            </View>
                        ) : null}

                        {/* Detalle del Trámite */}
                        <View style={styles.section}>
                            <Text style={styles.fieldLabel}>Detalle / Solicitud:</Text>
                            <View style={styles.noteBox}>
                                <Text style={styles.noteContent}>
                                    {procedure.request_note || 'Sin especificaciones detalladas.'}
                                </Text>
                            </View>
                        </View>

                        {/* Observaciones del Médico */}
                        {procedure.doctor_note ? (
                            <View style={styles.section}>
                                <Text style={styles.fieldLabel}>Observación Médica:</Text>
                                <View style={styles.noteBox}>
                                    <Text style={styles.noteContent}>{procedure.doctor_note}</Text>
                                </View>
                            </View>
                        ) : null}

                        {/* Estado de pago */}
                        {procedure.payment_status ? (
                            <View style={styles.section}>
                                <Text style={styles.fieldLabel}>Condición de pago:</Text>
                                <Text style={styles.fieldValue}>
                                    {procedure.payment_status === 'bonified'
                                        ? 'Bonificado (Sin cargo)'
                                        : procedure.payment_status === 'completed'
                                        ? 'Abonado'
                                        : 'Pendiente de cobro'}
                                </Text>
                            </View>
                        ) : null}
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        {isPending ? (
                            <>
                                <TouchableOpacity
                                    style={styles.rejectBtn}
                                    onPress={() => onUpdateStatus(procedure.id, 'rejected')}
                                    disabled={actionLoading}
                                >
                                    <Text style={styles.rejectBtnText}>Rechazar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.completeBtn}
                                    onPress={() => onUpdateStatus(procedure.id, 'completed')}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.completeBtnText}>Marcar Completado</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={styles.closeFooterBtn}
                                onPress={onClose}
                            >
                                <Text style={styles.closeFooterBtnText}>Cerrar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: Colors.cardBackground,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    typeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    dateSub: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    closeBtn: {
        padding: 6,
    },
    closeText: {
        fontSize: 18,
        color: Colors.textSecondary,
    },
    body: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgePending: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
    },
    statusBadgeCompleted: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    statusBadgeOther: {
        backgroundColor: 'rgba(156, 163, 175, 0.15)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusTextPending: {
        color: '#F59E0B',
    },
    statusTextCompleted: {
        color: '#22C55E',
    },
    statusTextOther: {
        color: Colors.textSecondary,
    },
    section: {
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: 14,
        color: Colors.text,
    },
    patientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    patientName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text,
        flex: 1,
    },
    patientLink: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '600',
        marginLeft: 8,
    },
    noteBox: {
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    noteContent: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 12,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    rejectBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.danger,
        alignItems: 'center',
    },
    rejectBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.danger,
    },
    completeBtn: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        alignItems: 'center',
    },
    completeBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeFooterBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    closeFooterBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
});
