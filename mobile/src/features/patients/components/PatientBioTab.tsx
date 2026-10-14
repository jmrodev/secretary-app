import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Patient } from '@/types/patients';
import { Colors } from '@/shared/theme/colors';

interface PatientBioTabProps {
    patient: Patient;
    onGoToMedication: () => void;
    onOpenCreateLicense: () => void;
    onOpenCreateCertificate: () => void;
}

export const PatientBioTab: React.FC<PatientBioTabProps> = ({
    patient,
    onGoToMedication,
    onOpenCreateLicense,
    onOpenCreateCertificate,
}) => {
    const fullName =
        patient.name ||
        patient.full_name ||
        `${patient.first_name || ''} ${patient.last_name || ''}`.trim() ||
        'Paciente';

    const addressParts = [
        patient.street_name ? `${patient.street_name} ${patient.street_number || ''}`.trim() : null,
        patient.floor ? `Piso ${patient.floor}` : null,
        patient.apartment ? `Dpto ${patient.apartment}` : null,
        patient.city,
        patient.province,
    ].filter(Boolean);

    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'No registrada';

    // Calculate age from dob
    let ageStr = '';
    if (patient.dob) {
        const birthDate = new Date(patient.dob);
        if (!isNaN(birthDate.getTime())) {
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs);
            const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
            ageStr = `${calculatedAge} años`;
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* 1. Acciones Rápidas */}
            <Text style={styles.sectionHeader}>Acciones Rápidas</Text>
            <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                    style={[styles.actionCard, styles.actionMedication]}
                    onPress={onGoToMedication}
                    activeOpacity={0.7}
                >
                    <Text style={styles.actionIcon}>💊</Text>
                    <Text style={styles.actionTitle}>Receta</Text>
                    <Text style={styles.actionSub}>Ir a medicación</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, styles.actionLicense]}
                    onPress={onOpenCreateLicense}
                    activeOpacity={0.7}
                >
                    <Text style={styles.actionIcon}>🩺</Text>
                    <Text style={styles.actionTitle}>Licencia</Text>
                    <Text style={styles.actionSub}>Días de reposo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, styles.actionCertificate]}
                    onPress={onOpenCreateCertificate}
                    activeOpacity={0.7}
                >
                    <Text style={styles.actionIcon}>📄</Text>
                    <Text style={styles.actionTitle}>Certificado</Text>
                    <Text style={styles.actionSub}>Constancia médica</Text>
                </TouchableOpacity>
            </View>

            {/* 2. Datos Personales */}
            <Text style={styles.sectionHeader}>Datos Personales</Text>
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.label}>Nombre completo:</Text>
                    <Text style={styles.value}>{fullName}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>DNI / Documento:</Text>
                    <Text style={styles.value}>{patient.dni || 'No registrado'}</Text>
                </View>

                {patient.dob ? (
                    <View style={styles.row}>
                        <Text style={styles.label}>Nacimiento:</Text>
                        <Text style={styles.value}>
                            {patient.dob.substring(0, 10)} {ageStr ? `(${ageStr})` : ''}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.row}>
                    <Text style={styles.label}>Teléfono:</Text>
                    <Text style={styles.value}>{patient.phone || 'No registrado'}</Text>
                </View>

                {patient.email ? (
                    <View style={styles.row}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{patient.email}</Text>
                    </View>
                ) : null}

                <View style={styles.row}>
                    <Text style={styles.label}>Domicilio:</Text>
                    <Text style={styles.value}>{fullAddress}</Text>
                </View>
            </View>

            {/* 3. Cobertura Médica */}
            <Text style={styles.sectionHeader}>Cobertura Médica</Text>
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.label}>Obra Social / Prepaga:</Text>
                    <Text style={styles.value}>
                        {patient.insurance_name || patient.institution_name || 'Particular / Sin cobertura'}
                    </Text>
                </View>

                {patient.affiliate_number ? (
                    <View style={styles.row}>
                        <Text style={styles.label}>N° de Afiliado:</Text>
                        <Text style={styles.value}>{patient.affiliate_number}</Text>
                    </View>
                ) : null}
            </View>

            {/* 4. Antecedentes Clínicos */}
            <Text style={styles.sectionHeader}>Antecedentes Clínicos</Text>
            <View style={styles.card}>
                {patient.medical_history ? (
                    <Text style={styles.notesText}>{patient.medical_history}</Text>
                ) : (
                    <Text style={styles.emptyNotesText}>
                        Sin antecedentes clínicos registrados en la ficha.
                    </Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 30,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 6,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    actionCard: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
    },
    actionMedication: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    actionLicense: {
        backgroundColor: Colors.warningLight,
        borderColor: Colors.warning,
    },
    actionCertificate: {
        backgroundColor: '#f3e8ff',
        borderColor: '#9333ea',
    },
    actionIcon: {
        fontSize: 22,
        marginBottom: 4,
    },
    actionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    actionSub: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 2,
        textAlign: 'center',
    },
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    label: {
        fontSize: 13,
        color: Colors.textSecondary,
        flex: 1,
    },
    value: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textMain,
        flex: 1,
        textAlign: 'right',
    },
    notesText: {
        fontSize: 13,
        color: Colors.textMain,
        lineHeight: 18,
    },
    emptyNotesText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
});
