import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Appointment } from '@/types/appointments';
import { Colors } from '@/shared/theme/colors';

interface AppointmentCardProps {
    appointment: Appointment;
    onPress: () => void;
}

const getCardStatusBadge = (status: string) => {
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

const getCardPaymentBadge = (appointment: Appointment) => {
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

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
    appointment,
    onPress,
}) => {
    const badge = getCardStatusBadge(appointment.status || 'pending');
    const paymentBadge = getCardPaymentBadge(appointment);

    let formattedTime = '09:00';
    if (appointment.slot_time) {
        formattedTime = appointment.slot_time.substring(0, 5);
    } else if (appointment.appointment_date) {
        const d = new Date(appointment.appointment_date);
        formattedTime = !isNaN(d.getTime())
            ? d.toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : '09:00';
    } else if (appointment.time || appointment.appointment_time) {
        formattedTime = (appointment.time || appointment.appointment_time || '').substring(0, 5);
    }

    const displayName = appointment.patient_name || appointment.patientName || 'Sin Nombre';
    const displayPhone = appointment.patient_phone || appointment.phone || '-';
    const cost = Number(appointment.cost || 0);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{formattedTime}</Text>
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.patientName} numberOfLines={1}>
                    {displayName}
                </Text>
                <Text style={styles.detailText}>Tel: {displayPhone}</Text>
                {cost > 0 ? (
                    <Text style={styles.costText}>
                        Arancel: ${cost.toLocaleString('es-AR')}
                    </Text>
                ) : null}
                {appointment.reason && appointment.reason !== '-' ? (
                    <Text style={styles.notesText} numberOfLines={2}>
                        Motivo: {appointment.reason}
                    </Text>
                ) : null}
            </View>

            <View style={styles.badgesCol}>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>
                        {badge.label}
                    </Text>
                </View>
                <View style={[styles.paymentBadge, { backgroundColor: paymentBadge.bg }]}>
                    <Text style={[styles.paymentBadgeText, { color: paymentBadge.text }]}>
                        {paymentBadge.label}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    timeBadge: {
        backgroundColor: Colors.borderLight,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primaryDark,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    patientName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textMain,
        marginBottom: 2,
    },
    detailText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    notesText: {
        fontSize: 11,
        color: Colors.textMuted,
        marginTop: 2,
    },
    costText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primaryDark,
        marginTop: 1,
    },
    badgesCol: {
        alignItems: 'flex-end',
        gap: 6,
        marginLeft: 8,
    },
    statusBadge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    paymentBadge: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    paymentBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
});
