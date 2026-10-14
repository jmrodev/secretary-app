import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Patient } from '@/types/patients';
import { Colors } from '@/shared/theme/colors';

interface PatientHeaderProps {
    patient: Patient;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ patient }) => {
    const router = useRouter();

    // Safe back: fall back to patients list when history is empty (deep link, reload).
    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(app)/(tabs)/patients');
        }
    };

    const mainPhone =
        patient.phoneNumbers?.[0]?.phone_number || patient.phone || '';
    const fullName =
        patient.name ||
        `${patient.first_name || ''} ${patient.last_name || ''}`.trim() ||
        'Paciente';

    const handleCall = () => {
        if (!mainPhone) {
            Alert.alert('Aviso', 'El paciente no posee número de teléfono registrado.');
            return;
        }
        Alert.alert('Llamar al Paciente', `¿Desea llamar al ${mainPhone}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Llamar', onPress: () => Linking.openURL(`tel:${mainPhone}`) },
        ]);
    };

    const handleWhatsApp = () => {
        if (!mainPhone) {
            Alert.alert('Aviso', 'El paciente no posee número de teléfono registrado.');
            return;
        }
        const cleanPhone = mainPhone.replace(/\D/g, '');
        Alert.alert('Abrir WhatsApp', `¿Iniciar chat de WhatsApp con el paciente?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Abrir Chat',
                onPress: () => Linking.openURL(`https://wa.me/${cleanPhone}`),
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Ficha Médica</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={styles.patientCard}>
                <View style={styles.infoRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {fullName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.details}>
                        <Text style={styles.patientName}>{fullName}</Text>
                        <Text style={styles.patientSub}>
                            DNI: {patient.dni || 'No registrado'}
                        </Text>
                        {mainPhone ? (
                            <Text style={styles.patientSub}>Tel: {mainPhone}</Text>
                        ) : null}
                    </View>
                </View>

                {mainPhone ? (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.callBtn]}
                            onPress={handleCall}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.actionBtnText}>📞 Llamar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.waBtn]}
                            onPress={handleWhatsApp}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.actionBtnText}>💬 WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    backButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: Colors.borderLight,
        borderRadius: 8,
    },
    backButtonText: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 13,
    },
    topBarTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    patientCard: {
        paddingHorizontal: 16,
        paddingBottom: 14,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primaryDark,
    },
    details: {
        flex: 1,
    },
    patientName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    patientSub: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    callBtn: {
        backgroundColor: Colors.borderLight,
    },
    waBtn: {
        backgroundColor: '#25D366',
    },
    actionBtnText: {
        fontWeight: '600',
        fontSize: 13,
        color: '#ffffff',
    },
});
