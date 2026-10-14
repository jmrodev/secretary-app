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
    Platform,
} from 'react-native';
import { Appointment } from '@/types/appointments';
import { Colors } from '@/shared/theme/colors';

interface AppointmentPaymentModalProps {
    visible: boolean;
    appointment: Appointment | null;
    onClose: () => void;
    onRegisterPayment: (
        appointmentId: number,
        data: {
            amount: number;
            method: string;
            doctorId: number;
            patientId?: number | null;
            notes?: string;
        }
    ) => Promise<boolean>;
    onUpdatePaymentStatus: (appointmentId: number, status: string) => Promise<boolean>;
}

const PAYMENT_METHODS = [
    { id: 'cash', label: '💵 Efectivo' },
    { id: 'transfer', label: '📲 Transferencia' },
    { id: 'debit', label: '💳 Débito' },
    { id: 'credit', label: '💳 Crédito' },
    { id: 'mercadopago', label: '📱 Mercado Pago' },
];

export const AppointmentPaymentModal: React.FC<AppointmentPaymentModalProps> = ({
    visible,
    appointment,
    onClose,
    onRegisterPayment,
    onUpdatePaymentStatus,
}) => {
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<string>('cash');
    const [notes, setNotes] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        if (appointment) {
            const initialAmount =
                appointment.pending_amount !== undefined && appointment.pending_amount !== null
                    ? String(appointment.pending_amount)
                    : appointment.cost !== undefined && appointment.cost !== null
                    ? String(appointment.cost)
                    : '';
            setAmount(initialAmount && initialAmount !== '0' ? initialAmount : '');
            setMethod(appointment.payment_method || 'cash');
            setNotes('');
        }
    }, [appointment, visible]);

    if (!appointment) return null;

    const displayName = appointment.patient_name || appointment.patientName || 'Sin Nombre';
    const patientId = appointment.patient_id || appointment.patientId || null;
    const doctorId = appointment.doctor_id || 10;
    const cost = Number(appointment.cost || 0);
    const paidAmount = Number(appointment.paid_amount || 0);

    const handleSubmitPayment = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return;
        }

        try {
            setSaving(true);
            const success = await onRegisterPayment(appointment.id, {
                amount: numericAmount,
                method,
                doctorId,
                patientId,
                notes: notes.trim() || undefined,
            });
            if (success) {
                onClose();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleMarkBonified = async () => {
        try {
            setSaving(true);
            const success = await onUpdatePaymentStatus(appointment.id, 'bonified');
            if (success) {
                onClose();
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.sheetContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleWrap}>
                            <Text style={styles.headerTitle}>Registrar Cobro</Text>
                            <Text style={styles.headerSubtitle}>{displayName}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={saving}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                        {/* Resumen arancel */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Arancel Turno:</Text>
                                <Text style={styles.summaryValue}>
                                    ${cost > 0 ? cost.toLocaleString('es-AR') : 'A definir'}
                                </Text>
                            </View>
                            {paidAmount > 0 ? (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Ya Pagado:</Text>
                                    <Text style={[styles.summaryValue, { color: Colors.success }]}>
                                        ${paidAmount.toLocaleString('es-AR')}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Input Monto */}
                        <Text style={styles.fieldLabel}>Monto a Cobrar ($)</Text>
                        <TextInput
                            style={styles.inputAmount}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                            editable={!saving}
                        />

                        {/* Selector Método de Pago */}
                        <Text style={styles.fieldLabel}>Método de Pago</Text>
                        <View style={styles.methodsGrid}>
                            {PAYMENT_METHODS.map((m) => {
                                const isSelected = method === m.id;
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[
                                            styles.methodPill,
                                            isSelected && styles.methodPillActive,
                                        ]}
                                        onPress={() => setMethod(m.id)}
                                        activeOpacity={0.7}
                                        disabled={saving}
                                    >
                                        <Text
                                            style={[
                                                styles.methodPillText,
                                                isSelected && styles.methodPillTextActive,
                                            ]}
                                        >
                                            {m.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Nota u Observación */}
                        <Text style={styles.fieldLabel}>Nota / Concepto (opcional)</Text>
                        <TextInput
                            style={styles.inputNotes}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Ej. Consulta médica, recibo N°..."
                            placeholderTextColor={Colors.textMuted}
                            editable={!saving}
                        />

                        {/* Botones de Acción */}
                        <View style={styles.actionsContainer}>
                            {saving ? (
                                <View style={styles.savingBox}>
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                    <Text style={styles.savingText}>Registrando cobro...</Text>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={styles.btnSubmit}
                                        onPress={handleSubmitPayment}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.btnSubmitText}>💰 Confirmar Cobro</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.btnBonify}
                                        onPress={handleMarkBonified}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.btnBonifyText}>🎁 Marcar como Bonificado</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
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
        maxHeight: '90%',
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
        paddingBottom: 20,
    },
    summaryCard: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 3,
    },
    summaryLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textMain,
        marginBottom: 8,
        marginTop: 4,
    },
    inputAmount: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textMain,
        marginBottom: 14,
    },
    inputNotes: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.textMain,
        marginBottom: 18,
    },
    methodsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    methodPill: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    methodPillActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    methodPillText: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    methodPillTextActive: {
        color: Colors.primaryDark,
        fontWeight: 'bold',
    },
    actionsContainer: {
        marginTop: 8,
        gap: 10,
    },
    savingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    savingText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    btnSubmit: {
        backgroundColor: Colors.success,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSubmitText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    btnBonify: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnBonifyText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
});
