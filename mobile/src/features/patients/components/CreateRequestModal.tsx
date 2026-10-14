import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Colors } from '@/shared/theme/colors';
import { apiFetch } from '@/shared/services/api';
import { showAlert } from '@/shared/utils/alert';

interface CreateRequestModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'prescription' | 'license' | 'certificate';
    patientId: string | number;
    patientName: string;
    onSuccess?: () => void;
}

const COMMON_LICENSE_DAYS = [
    { label: '24 hs (1 d)', days: 1 },
    { label: '48 hs (2 d)', days: 2 },
    { label: '72 hs (3 d)', days: 3 },
    { label: '5 días', days: 5 },
    { label: '7 días (1 sem)', days: 7 },
    { label: '15 días', days: 15 },
    { label: '21 días (3 sem)', days: 21 },
    { label: '30 días (1 mes)', days: 30 },
    { label: '45 días', days: 45 },
    { label: '60 días (2 meses)', days: 60 },
];

const COMMON_CERTIFICATES = [
    'Constancia de atención psiquiátrica especializada',
    'En tratamiento psicoterapéutico / psiquiátrico activo',
    'Aptitud psíquica para actividad laboral / académica',
    'Constancia de asistencia a consulta especializada',
    'Reintegro laboral con adecuación horaria / tareas',
    'Continuidad de tratamiento psicofarmacológico',
];

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
    visible,
    onClose,
    type,
    patientId,
    patientName,
    onSuccess,
}) => {
    const isLicense = type === 'license';
    const isPrescription = type === 'prescription';
    const [selectedDays, setSelectedDays] = useState(15);
    const [isCustomDays, setIsCustomDays] = useState(false);
    const [customDaysInput, setCustomDaysInput] = useState('');
    const [diagnosis, setDiagnosis] = useState('');

    // Prescription states
    const [medicationNote, setMedicationNote] = useState('');

    // Certificate states
    const [certificateType, setCertificateType] = useState(COMMON_CERTIFICATES[0]);
    const [isCustomCert, setIsCustomCert] = useState(false);
    const [customCertInput, setCustomCertInput] = useState('');
    const [withDiagnosisReserve, setWithDiagnosisReserve] = useState(true);

    const [additionalNote, setAdditionalNote] = useState('');
    const [isBonified, setIsBonified] = useState(false);
    const [loading, setLoading] = useState(false);

    // Doctor selector (with loading/error states so failures are visible + retryable)
    const [doctors, setDoctors] = useState<Array<{ id: number; full_name: string }>>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [doctorsError, setDoctorsError] = useState<string | null>(null);

    // Fetch doctors list; callable from the visible-effect and the retry button.
    const loadDoctors = () => {
        setDoctorsLoading(true);
        setDoctorsError(null);
        apiFetch<{ data: { doctors: Array<{ id: number; full_name: string }> } }>('/users/doctors')
            .then((res) => {
                const list: Array<{ id: number; full_name: string }> =
                    Array.isArray(res) ? res :
                    Array.isArray((res as any)?.data) ? (res as any).data :
                    (res as any)?.data?.doctors ?? [];
                setDoctors(list);
                if (list.length === 1) setSelectedDoctorId(list[0].id);
            })
            .catch((error) => {
                console.error('[CreateRequestModal] doctors load failed:', error);
                setDoctors([]);
                setDoctorsError(error?.message || 'No se pudo cargar la lista de doctores.');
            })
            .finally(() => setDoctorsLoading(false));
    };

    useEffect(() => {
        if (!visible) return;
        loadDoctors();
    }, [visible]);

    const handleSave = async () => {
        let note = '';
        if (isPrescription) {
            if (!medicationNote.trim()) {
                showAlert('Campo requerido', 'Ingresá el medicamento o indicación a recetar.');
                return;
            }
            note = medicationNote.trim();
            if (additionalNote.trim()) {
                note += ` - Obs: ${additionalNote.trim()}`;
            }
        } else if (isLicense) {
            let finalDays = selectedDays;
            if (isCustomDays) {
                const parsed = parseInt(customDaysInput.trim(), 10);
                if (isNaN(parsed) || parsed <= 0) {
                    showAlert('Días inválidos', 'Ingresá una cantidad de días válida mayor a 0.');
                    return;
                }
                finalDays = parsed;
            }

            if (!diagnosis.trim()) {
                showAlert('Campo requerido', 'Ingresá el diagnóstico o motivo del reposo.');
                return;
            }
            note = `Licencia médica por ${finalDays} día(s). Diagnóstico: ${diagnosis.trim()}`;
            if (additionalNote.trim()) {
                note += `. Obs: ${additionalNote.trim()}`;
            }
        } else {
            let baseCert = certificateType;
            if (isCustomCert) {
                if (!customCertInput.trim()) {
                    showAlert('Campo requerido', 'Ingresá el concepto del certificado personalizado.');
                    return;
                }
                baseCert = customCertInput.trim();
            }

            note = baseCert;
            if (withDiagnosisReserve) {
                note += ' (Con reserva de diagnóstico - Ley 26.529 / Secreto profesional)';
            }
            if (additionalNote.trim()) {
                note += ` - Obs: ${additionalNote.trim()}`;
            }
        }

        if (!selectedDoctorId) {
            showAlert('Doctor requerido', 'Seleccioná el doctor que emite el trámite.');
            return;
        }

        try {
            setLoading(true);
            await apiFetch('/medical/requests', {
                method: 'POST',
                body: JSON.stringify({
                    type,
                    patient_id: Number(patientId),
                    doctor_id: selectedDoctorId,
                    request_note: note,
                    bonified: isBonified,
                    status: 'pending',
                }),
            });

            const typeLabel = isLicense ? 'Licencia' : isPrescription ? 'Receta' : 'Certificado';
            showAlert(
                'Éxito',
                `${typeLabel} registrado como pendiente.`
            );
            setDiagnosis('');
            setMedicationNote('');
            setCustomCertInput('');
            setAdditionalNote('');
            setIsBonified(false);
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('[CreateRequestModal] Error:', error);
            showAlert('Error', error.message || 'No se pudo generar el trámite.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.overlay}
            >
                <View style={styles.modalCard}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleWrap}>
                            <Text style={styles.headerIcon}>
                                {isLicense ? '🩺' : isPrescription ? '💊' : '📄'}
                            </Text>
                            <View>
                                <Text style={styles.title}>
                                    {isLicense
                                        ? 'Emitir Licencia Médica'
                                        : isPrescription
                                        ? 'Emitir Receta Médica'
                                        : 'Emitir Certificado'}
                                </Text>
                                <Text style={styles.subtitle}>{patientName}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            style={styles.closeBtn}
                        >
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {isPrescription ? (
                            <>
                                <Text style={styles.sectionLabel}>Medicamento / Indicación *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Clonazepam 2mg (1 comp/noche x 60 días)"
                                    placeholderTextColor={Colors.textSecondary}
                                    value={medicationNote}
                                    onChangeText={setMedicationNote}
                                    autoFocus
                                />
                            </>
                        ) : isLicense ? (
                            <>
                                {/* Days Selector */}
                                <Text style={styles.sectionLabel}>Días de reposo indicados</Text>
                                <View style={styles.daysContainer}>
                                    {COMMON_LICENSE_DAYS.map((item) => (
                                        <TouchableOpacity
                                            key={item.days}
                                            style={[
                                                styles.dayChip,
                                                !isCustomDays && selectedDays === item.days && styles.dayChipActive,
                                            ]}
                                            onPress={() => {
                                                setIsCustomDays(false);
                                                setSelectedDays(item.days);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayChipText,
                                                    !isCustomDays && selectedDays === item.days && styles.dayChipTextActive,
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}

                                    <TouchableOpacity
                                        style={[
                                            styles.dayChip,
                                            isCustomDays && styles.dayChipActive,
                                        ]}
                                        onPress={() => setIsCustomDays(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.dayChipText,
                                                isCustomDays && styles.dayChipTextActive,
                                            ]}
                                        >
                                            ✏️ Personalizado
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {isCustomDays && (
                                    <View style={styles.customDaysWrap}>
                                        <Text style={styles.customDaysLabel}>Cantidad de días:</Text>
                                        <TextInput
                                            style={styles.customDaysInput}
                                            placeholder="Ej: 90"
                                            placeholderTextColor={Colors.textSecondary}
                                            value={customDaysInput}
                                            onChangeText={setCustomDaysInput}
                                            keyboardType="number-pad"
                                        />
                                        <Text style={styles.customDaysUnit}>días</Text>
                                    </View>
                                )}

                                {/* Diagnosis */}
                                <Text style={styles.sectionLabel}>Diagnóstico / Motivo *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Trastorno de ansiedad generalizada / Depresión mayor"
                                    placeholderTextColor={Colors.textSecondary}
                                    value={diagnosis}
                                    onChangeText={setDiagnosis}
                                />
                            </>
                        ) : (
                            <>
                                {/* Common Certificates */}
                                <Text style={styles.sectionLabel}>Tipo de Certificado</Text>
                                <View style={styles.certList}>
                                    {COMMON_CERTIFICATES.map((cert) => (
                                        <TouchableOpacity
                                            key={cert}
                                            style={[
                                                styles.certChip,
                                                !isCustomCert && certificateType === cert && styles.certChipActive,
                                            ]}
                                            onPress={() => {
                                                setIsCustomCert(false);
                                                setCertificateType(cert);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.certChipText,
                                                    !isCustomCert && certificateType === cert && styles.certChipTextActive,
                                                ]}
                                            >
                                                {cert}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}

                                    <TouchableOpacity
                                        style={[
                                            styles.certChip,
                                            isCustomCert && styles.certChipActive,
                                        ]}
                                        onPress={() => setIsCustomCert(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.certChipText,
                                                isCustomCert && styles.certChipTextActive,
                                            ]}
                                        >
                                            ✏️ Certificado Personalizado
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {isCustomCert && (
                                    <View style={{ marginTop: 10 }}>
                                        <Text style={styles.sectionLabel}>Concepto o Título Personalizado *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej: Certificado de acompañamiento terapéutico"
                                            placeholderTextColor={Colors.textSecondary}
                                            value={customCertInput}
                                            onChangeText={setCustomCertInput}
                                            autoFocus
                                        />
                                    </View>
                                )}

                                {/* Cláusula de Reserva de Diagnóstico */}
                                <TouchableOpacity
                                    style={styles.reserveToggle}
                                    onPress={() => setWithDiagnosisReserve(!withDiagnosisReserve)}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[
                                            styles.checkbox,
                                            withDiagnosisReserve && styles.checkboxActive,
                                        ]}
                                    >
                                        {withDiagnosisReserve && <Text style={styles.checkboxCheck}>✓</Text>}
                                    </View>
                                    <View style={styles.bonifiedTextWrap}>
                                        <Text style={styles.reserveTitle}>
                                            🔒 Con Reserva de Diagnóstico
                                        </Text>
                                        <Text style={styles.bonifiedSub}>
                                            Amparo en el secreto profesional y confidencialidad médica (Ley 26.529 / Art. 156 C.P.)
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Doctor selector */}
                        {doctorsLoading ? (
                            <>
                                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                                    Doctor que emite *
                                </Text>
                                <View style={styles.doctorsLoadingRow}>
                                    <ActivityIndicator size="small" />
                                    <Text style={styles.doctorsLoadingText}>Cargando doctores…</Text>
                                </View>
                            </>
                        ) : doctorsError && doctors.length === 0 ? (
                            <>
                                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                                    Doctor que emite *
                                </Text>
                                <Text style={styles.doctorsErrorText}>{doctorsError}</Text>
                                <TouchableOpacity
                                    style={styles.retryBtn}
                                    onPress={loadDoctors}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.retryBtnText}>Reintentar</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            doctors.length > 0 && (
                            <>
                                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                                    Doctor que emite *
                                </Text>
                                <View style={styles.doctorChipsRow}>
                                    {doctors.map((doc) => (
                                        <TouchableOpacity
                                            key={doc.id}
                                            style={[
                                                styles.doctorChip,
                                                selectedDoctorId === doc.id && styles.doctorChipActive,
                                            ]}
                                            onPress={() => setSelectedDoctorId(doc.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.doctorChipText,
                                                    selectedDoctorId === doc.id && styles.doctorChipTextActive,
                                                ]}
                                            >
                                                {doc.full_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                            )
                        )}

                        {/* Extra observations */}
                        <Text style={styles.sectionLabel}>Observaciones adicionales</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Aclaraciones o indicaciones complementarias..."
                            placeholderTextColor={Colors.textSecondary}
                            value={additionalNote}
                            onChangeText={setAdditionalNote}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Bonified toggle */}
                        <TouchableOpacity
                            style={styles.bonifiedToggle}
                            onPress={() => setIsBonified(!isBonified)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    isBonified && styles.checkboxActive,
                                ]}
                            >
                                {isBonified && <Text style={styles.checkboxCheck}>✓</Text>}
                            </View>
                            <View style={styles.bonifiedTextWrap}>
                                <Text style={styles.bonifiedTitle}>Bonificar trámite</Text>
                                <Text style={styles.bonifiedSub}>
                                    No generar cargo ni deuda financiera para el paciente
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                            onPress={handleSave}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.submitBtnText}>
                                    {isLicense ? 'Emitir Licencia' : isPrescription ? 'Emitir Receta' : 'Emitir Certificado'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        maxHeight: '90%',
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
    headerTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    headerIcon: {
        fontSize: 26,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 13,
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
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 12,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayChip: {
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    dayChipActive: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(0, 168, 132, 0.12)',
    },
    dayChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    dayChipTextActive: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
    customDaysWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginTop: 10,
        gap: 10,
    },
    customDaysLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    customDaysInput: {
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text,
        minWidth: 60,
        textAlign: 'center',
    },
    customDaysUnit: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.text,
    },
    certList: {
        gap: 8,
    },
    certChip: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    certChipActive: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(0, 168, 132, 0.12)',
    },
    certChipText: {
        fontSize: 13,
        color: Colors.text,
    },
    certChipTextActive: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.text,
    },
    textArea: {
        height: 70,
        textAlignVertical: 'top',
    },
    reserveToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: 12,
        marginBottom: 6,
        gap: 12,
    },
    reserveTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    bonifiedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: 16,
        marginBottom: 16,
        gap: 12,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    checkboxCheck: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    bonifiedTextWrap: {
        flex: 1,
    },
    bonifiedTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    bonifiedSub: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 12,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    submitBtn: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    doctorChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    // Doctors loading/error states
    doctorsLoadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    doctorsLoadingText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    doctorsErrorText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    retryBtn: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        marginBottom: 12,
    },
    retryBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    doctorChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    doctorChipActive: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(0, 168, 132, 0.12)',
    },
    doctorChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    doctorChipTextActive: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
});
