import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Patient } from '@/types/patients';
import { Colors } from '@/shared/theme/colors';

interface PatientItemCardProps {
    patient: Patient;
    onPress: (patient: Patient) => void;
}

export const PatientItemCard: React.FC<PatientItemCardProps> = ({
    patient,
    onPress,
}) => {
    const fullName =
        patient.name ||
        patient.full_name ||
        `${patient.first_name || ''} ${patient.last_name || ''}`.trim() ||
        'Paciente sin nombre';

    const initial = fullName.charAt(0).toUpperCase();
    const phone =
        patient.phone ||
        patient.phoneNumbers?.[0]?.phone_number ||
        '-';

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(patient)}
            activeOpacity={0.7}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {fullName}
                </Text>
                <View style={styles.detailsRow}>
                    <Text style={styles.detail}>
                        DNI: {patient.dni || 'Sin DNI'}
                    </Text>
                    {phone !== '-' ? (
                        <Text style={styles.detail}> • 📞 {phone}</Text>
                    ) : null}
                </View>
                {patient.city || patient.province ? (
                    <Text style={styles.subDetail} numberOfLines={1}>
                        📍 {[patient.city, patient.province].filter(Boolean).join(', ')}
                    </Text>
                ) : null}
            </View>

            <Text style={styles.arrow}>➔</Text>
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
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primaryDark,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textMain,
        marginBottom: 2,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    detail: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    subDetail: {
        fontSize: 11,
        color: Colors.textMuted,
        marginTop: 2,
    },
    arrow: {
        fontSize: 16,
        color: Colors.textMuted,
        marginLeft: 8,
    },
});
