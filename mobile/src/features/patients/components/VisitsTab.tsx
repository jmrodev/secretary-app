import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Appointment } from '@/types/appointments';
import { Colors } from '@/shared/theme/colors';

interface VisitsTabProps {
    appointments: Appointment[];
    onSelectAppointment?: (appointment: Appointment) => void;
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

const getStatusBadge = (status: string | undefined) => {
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

export const VisitsTab: React.FC<VisitsTabProps> = ({
    appointments,
    onSelectAppointment,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.sectionTitle}>Historial de Consultas</Text>
                <Text style={styles.sectionSubtitle}>
                    Tocá cualquier consulta para ver detalles y gestionarla
                </Text>
            </View>

            {appointments.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🩺</Text>
                    <Text style={styles.emptyText}>Sin consultas registradas</Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={(item, idx) => String(item.id || idx)}
                    renderItem={({ item }) => {
                        let dateStr = 'Fecha no registrada';
                        if (item.appointment_date) {
                            const d = new Date(item.appointment_date);
                            dateStr = !isNaN(d.getTime())
                                ? d.toLocaleDateString('es-AR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                  })
                                : item.appointment_date;
                        }

                        let timeStr = '';
                        if (item.slot_time) {
                            timeStr = item.slot_time.substring(0, 5);
                        } else if (item.appointment_time || item.time) {
                            timeStr = (item.appointment_time || item.time || '').substring(0, 5);
                        }

                        const statusBadge = getStatusBadge(item.status);
                        const payBadge = getPaymentBadge(item);
                        const cost = Number(item.cost || 0);

                        return (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => onSelectAppointment?.(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.dateText}>
                                            {dateStr} {timeStr ? `• ${timeStr} hs` : ''}
                                        </Text>
                                        {item.doctor_name ? (
                                            <Text style={styles.doctorText}>
                                                Dr(a). {item.doctor_name}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View style={styles.badgesRow}>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: statusBadge.bg },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    { color: statusBadge.text },
                                                ]}
                                            >
                                                {statusBadge.label}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: payBadge.bg },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    { color: payBadge.text },
                                                ]}
                                            >
                                                {payBadge.label}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {item.reason ? (
                                    <Text style={styles.reasonText}>
                                        Motivo: {item.reason}
                                    </Text>
                                ) : null}

                                {item.notes ? (
                                    <Text style={styles.notesText}>
                                        Evolución/Notas: {item.notes}
                                    </Text>
                                ) : null}

                                <View style={styles.cardFooter}>
                                    {cost > 0 ? (
                                        <Text style={styles.costText}>
                                            ${cost.toLocaleString('es-AR')}
                                        </Text>
                                    ) : (
                                        <View />
                                    )}
                                    <Text style={styles.actionHint}>
                                        Administrar consulta ›
                                    </Text>
                                </View>
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
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
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
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    dateText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    doctorText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 6,
    },
    statusBadge: {
        paddingVertical: 3,
        paddingHorizontal: 7,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    reasonText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    notesText: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 4,
        fontStyle: 'italic',
    },
    cardFooter: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    costText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMain,
    },
    actionHint: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
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
