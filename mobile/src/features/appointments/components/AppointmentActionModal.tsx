import React, { useState } from 'react';
import {
    StyleSheet,
    Modal,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Linking,
    Platform,
} from 'react-native';
import { Appointment, AppointmentStatus } from '@/types/appointments';
import { Colors } from '@/shared/theme/colors';

interface AppointmentActionModalProps {
    visible: boolean;
    appointment: Appointment | null;
    onClose: () => void;
    onUpdateStatus: (id: number, status: string, reason?: string) => Promise<boolean>;
    onViewPatientProfile: (patientId: number, appointmentId: number) => void;
    onOpenPayment: () => void;
}

const getPaymentBadge = (appointment: Appointment) => {
    const isPaid = appointment.is_paid === 1 || appointment.payment_status === 'paid';
    if (isPaid) {
        return { label: 'Pagado', bg: Colors.successLight, text: Colors.success };
    }
    if (appointment.payment_status === 'bonified' || appointment.bonified) {
        return { label: 'Bonificado', bg: '#f3e8ff', text: '#7e22ce' };
    }
    if (appointment.payment_status === 'debt') {
        return { label: 'Deuda', bg: Colors.dangerLight, text: Colors.danger };
    }
    if (
        appointment.payment_status === 'partial' ||
        appointment.payment_status === 'partially_paid'
    ) {
        return { label: 'Parcial', bg: Colors.warningLight, text: Colors.warning };
    }
    return { label: 'Impago', bg: '#f1f5f9', text: '#64748b' };
};

const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
        case 'completed':
        case 'attended':
            return { label: 'Atendido', bg: Colors.successLight, text: Colors.success };
        case 'arrived':
            return { label: 'En Sala', bg: Colors.primaryLight, text: Colors.primaryDark };
        case 'confirmed':
            return { label: 'Confirmado', bg: '#ccfbf1', text: '#0f766e' };
        case 'absent':
            return { label: 'Ausente', bg: '#f1f5f9', text: '#475569' };
        case 'cancelled':
            return { label: 'Cancelado', bg: Colors.dangerLight, text: Colors.danger };
        case 'pending':
        default:
            return { label: 'Pendiente', bg: Colors.warningLight, text: Colors.warning };
    }
};

export const AppointmentActionModal: React.FC<AppointmentActionModalProps> = ({
    visible,
    appointment,
    onClose,
    onUpdateStatus,
    onViewPatientProfile,
    onOpenPayment,
}) => {
    const [updating, setUpdating] = useState(false);

    if (!appointment) return null;

    const patientId = appointment.patient_id || appointment.patientId;
    const displayName = appointment.patient_name || appointment.patientName || 'Sin Nombre';
    const displayPhone = appointment.patient_phone || appointment.phone || '';
    const cleanPhone = displayPhone.replace(/\D/g, '');
    const cost = Number(appointment.cost || 0);
    const paidAmount = Number(appointment.paid_amount || 0);
    const isPaid = appointment.is_paid === 1 || appointment.payment_status === 'paid';
    const payBadge = getPaymentBadge(appointment);

    let formattedTime = '09:00';
    if (appointment.slot_time) {
        formattedTime = appointment.slot_time.substring(0, 5);
    } else if (appointment.appointment_date) {
        const d = new Date(appointment.appointment_date);
        formattedTime = !isNaN(d.getTime())
            ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
            : '09:00';
    } else if (appointment.time || appointment.appointment_time) {
        formattedTime = (appointment.time || appointment.appointment_time || '').substring(0, 5);
    }

    const status = appointment.status || 'pending';
    const badge = getStatusBadge(status);

    const canConfirm = ['pending', 'cancelled', 'suspended', 'absent', 'rescheduled'].includes(status);
    const canArrive = status === 'confirmed';
    const canAttend = status === 'arrived' || (appointment.type === 'virtual' && status === 'confirmed');
    const canMarkAbsent = ['pending', 'confirmed', 'rescheduled'].includes(status);
    const canCancel = status !== 'cancelled' && status !== 'completed' && status !== 'attended';

    const handleAction = async (newStatus: string, reason?: string) => {
        try {
            setUpdating(true);
            const success = await onUpdateStatus(appointment.id, newStatus, reason);
            if (success) {
                onClose();
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleOpenWhatsApp = () => {
        if (!cleanPhone) return;
        const url = `https://wa.me/${cleanPhone}`;
        Linking.openURL(url).catch(() => {});
    };

    const handleCallPhone = () => {
        if (!cleanPhone) return;
        Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.sheetContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleWrap}>
                            <Text style={styles.headerTitle}>Gestión del Turno</Text>
                            <Text style={styles.headerSubtitle}>
                                {formattedTime} hs • {displayName}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={updating}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                        {/* Summary Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryTop}>
                                <TouchableOpacity
                                    style={styles.patientNameTouchable}
                                    onPress={() => {
                                        if (patientId) {
                                            onClose();
                                            onViewPatientProfile(Number(patientId), appointment.id);
                                        }
                                    }}
                                    activeOpacity={0.7}
                                    disabled={!patientId}
                                >
                                    <Text style={styles.patientName} numberOfLines={1}>
                                        {displayName} <Text style={styles.patientLinkHint}>↗</Text>
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.headerBadgesRow}>
                                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                                        <Text style={[styles.statusText, { color: badge.text }]}>
                                            {badge.label}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: payBadge.bg }]}>
                                        <Text style={[styles.statusText, { color: payBadge.text }]}>
                                            {payBadge.label}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {displayPhone ? (
                                <Text style={styles.summaryDetail}>📞 {displayPhone}</Text>
                            ) : null}

                            {cost > 0 ? (
                                <Text style={styles.summaryDetail}>
                                    💰 Arancel: ${cost.toLocaleString('es-AR')}
                                    {paidAmount > 0 ? ` (Pagado: $${paidAmount.toLocaleString('es-AR')})` : ''}
                                </Text>
                            ) : null}

                            {appointment.reason ? (
                                <Text style={styles.summaryReason}>
                                    Motivo: {appointment.reason}
                                </Text>
                            ) : null}
                        </View>

                        {/* Gestión de Pago */}
                        <Text style={styles.sectionTitle}>Gestión de Pago</Text>
                        <TouchableOpacity
                            style={[
                                styles.btnAction,
                                isPaid ? styles.btnPaymentPaid : styles.btnPayment,
                            ]}
                            onPress={onOpenPayment}
                            activeOpacity={0.7}
                            disabled={updating}
                        >
                            <Text style={styles.btnActionText}>
                                {isPaid
                                    ? `💳 Turno Pagado ($${paidAmount || cost}) - Ver / Modificar`
                                    : '💰 Registrar Cobro'}
                            </Text>
                        </TouchableOpacity>

                        {/* Asistencia / Status Actions */}
                        <Text style={styles.sectionTitle}>Acciones de Asistencia</Text>

                        {updating ? (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                                <Text style={styles.loadingText}>Actualizando estado del turno...</Text>
                            </View>
                        ) : (
                            <View style={styles.actionsGrid}>
                                {canConfirm ? (
                                    <TouchableOpacity
                                        style={[styles.btnAction, styles.btnConfirm]}
                                        onPress={() => handleAction('confirmed')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.btnActionText}>✅ Confirmar Turno</Text>
                                    </TouchableOpacity>
                                ) : null}

                                {canArrive ? (
                                    <TouchableOpacity
                                        style={[styles.btnAction, styles.btnArrived]}
                                        onPress={() => handleAction('arrived')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.btnActionText}>📍 Llegó (En Sala)</Text>
                                    </TouchableOpacity>
                                ) : null}

                                {canAttend ? (
                                    <TouchableOpacity
                                        style={[styles.btnAction, styles.btnAttend]}
                                        onPress={() => handleAction('completed')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.btnActionText}>🩺 Atender / Completar</Text>
                                    </TouchableOpacity>
                                ) : null}

                                {canMarkAbsent ? (
                                    <TouchableOpacity
                                        style={[styles.btnAction, styles.btnAbsent]}
                                        onPress={() => handleAction('absent')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.btnActionText}>⚠️ Marcar Ausente</Text>
                                    </TouchableOpacity>
                                ) : null}

                                {canCancel ? (
                                    <TouchableOpacity
                                        style={[styles.btnAction, styles.btnCancel]}
                                        onPress={() => handleAction('cancelled', 'Cancelado desde app')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.btnActionText}>🚫 Cancelar Turno</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        backgroundColor: Colors.cardBackground,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitleWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    closeBtn: {
        padding: 6,
    },
    closeBtnText: {
        fontSize: 18,
        color: Colors.textSecondary,
    },
    body: {
        paddingHorizontal: 20,
    },
    bodyContent: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    summaryCard: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
    },
    summaryTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textMain,
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    summaryDetail: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    summaryReason: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 4,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginTop: 6,
    },
    loadingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    loadingText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    actionsGrid: {
        gap: 10,
        marginBottom: 18,
    },
    btnAction: {
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnActionText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    headerBadgesRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    btnConfirm: {
        backgroundColor: '#0d9488', // Teal
    },
    btnPayment: {
        backgroundColor: Colors.success,
        marginBottom: 16,
    },
    btnPaymentPaid: {
        backgroundColor: '#0d9488',
        marginBottom: 16,
    },
    btnArrived: {
        backgroundColor: Colors.primary, // Blue / Primary
    },
    btnAttend: {
        backgroundColor: Colors.success, // Green
    },
    patientNameTouchable: {
        flex: 1,
        marginRight: 8,
    },
    patientLinkHint: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    btnAbsent: {
        backgroundColor: Colors.warning, // Amber
    },
    btnCancel: {
        backgroundColor: Colors.danger, // Red
    },
});
