import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MedicalProcedure } from '@/types/procedures';
import { Colors } from '@/shared/theme/colors';

interface ProcedureItemCardProps {
    procedure: MedicalProcedure;
    onPress: () => void;
    onViewPatient: (patientId: number | string) => void;
    onComplete?: (id: number | string) => void;
}

export const ProcedureItemCard: React.FC<ProcedureItemCardProps> = ({
    procedure,
    onPress,
    onViewPatient,
    onComplete,
}) => {
    const isPending = procedure.status === 'pending';
    const isCompleted = procedure.status === 'completed';

    // Type configuration
    const typeConfig = {
        prescription: {
            icon: '💊',
            label: 'Receta',
            color: Colors.primary,
            bg: 'rgba(0, 168, 132, 0.12)',
        },
        license: {
            icon: '🩺',
            label: 'Licencia',
            color: '#F59E0B',
            bg: 'rgba(245, 158, 11, 0.12)',
        },
        certificate: {
            icon: '📄',
            label: 'Certificado',
            color: '#3B82F6',
            bg: 'rgba(59, 130, 246, 0.12)',
        },
    }[procedure.type] || {
        icon: '📋',
        label: 'Trámite',
        color: Colors.textSecondary,
        bg: 'rgba(150, 150, 150, 0.12)',
    };

    // Format date
    let dateStr = '';
    if (procedure.created_at) {
        const d = new Date(procedure.created_at);
        if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        }
    }

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
                    <Text style={styles.typeIcon}>{typeConfig.icon}</Text>
                    <Text style={[styles.typeText, { color: typeConfig.color }]}>
                        {typeConfig.label}
                    </Text>
                </View>

                <View style={styles.statusAndDate}>
                    {dateStr ? <Text style={styles.dateText}>{dateStr}</Text> : null}
                    <View
                        style={[
                            styles.statusBadge,
                            isPending ? styles.statusBadgePending : isCompleted ? styles.statusBadgeCompleted : styles.statusBadgeOther,
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                isPending ? styles.statusTextPending : isCompleted ? styles.statusTextCompleted : styles.statusTextOther,
                            ]}
                        >
                            {isPending ? 'Pendiente' : isCompleted ? 'Completado' : procedure.status}
                        </Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => onViewPatient(procedure.patient_id)}
                activeOpacity={0.7}
                style={styles.patientNameWrap}
            >
                <Text style={styles.patientName}>
                    {procedure.patient_name || `Paciente #${procedure.patient_id}`}
                </Text>
                <Text style={styles.patientProfileLink}>Ver ficha ›</Text>
            </TouchableOpacity>

            {procedure.request_note ? (
                <Text style={styles.noteText} numberOfLines={2}>
                    {procedure.request_note}
                </Text>
            ) : null}

            {isPending && onComplete ? (
                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => onComplete(procedure.id)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.completeBtnIcon}>✓</Text>
                        <Text style={styles.completeBtnText}>Marcar Listo</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 5,
    },
    typeIcon: {
        fontSize: 13,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusAndDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
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
        fontSize: 11,
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
    patientNameWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    patientName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text,
        flex: 1,
    },
    patientProfileLink: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
        marginLeft: 8,
    },
    noteText: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        marginTop: 2,
    },
    footerActions: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    completeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    completeBtnIcon: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    completeBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
