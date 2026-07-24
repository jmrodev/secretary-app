import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Platform,
    Linking,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../services/api';

export const PatientDetailScreen = ({ patientId, appointmentId, onClose }) => {
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('medications'); // 'medications' | 'visits' | 'files'

    // Estado del Formulario de Agregar / Prescribir Medicación
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchingVademecum, setSearchingVademecum] = useState(false);
    const [selectedVademecum, setSelectedVademecum] = useState(null);
    const [medName, setMedName] = useState('');
    const [dosage, setDosage] = useState('');
    const [unitsPerBox, setUnitsPerBox] = useState('30');
    const [dailyUnits, setDailyUnits] = useState('1');
    const [durationDays, setDurationDays] = useState('30');
    const [notes, setNotes] = useState('');
    const [savingMed, setSavingMed] = useState(false);

    // Estado del Modal de Detalle / Repetir / Editar / Eliminar
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editMedName, setEditMedName] = useState('');
    const [editDosage, setEditDosage] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Estado de Confirmación de Contraseña para Borrado
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    const fetchDetails = async () => {
        if (!patientId) return;
        try {
            setLoading(true);
            const data = await apiFetch(`/users/patients/${patientId}`);
            setPatientData(data?.data || data);
        } catch (err) {
            console.error('Error al obtener ficha del paciente:', err);
            Alert.alert('Error', 'No se pudieron cargar los datos del paciente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [patientId]);

    // Búsqueda en Vademécum
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                setSearchingVademecum(true);
                const res = await apiFetch(`/medical/vademecum/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(Array.isArray(res) ? res : []);
            } catch (err) {
                console.warn('Error al buscar en Vademécum:', err);
                setSearchResults([]);
            } finally {
                setSearchingVademecum(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectVademecum = (item) => {
        setSelectedVademecum(item);
        setMedName(item.name || item.full_label);
        if (item.presentation) setDosage(item.presentation);
        
        let extractedUnits = item.units_per_box;
        if (!extractedUnits && item.presentation) {
            const match = item.presentation.match(/\bx\s*(\d+)\b/i);
            if (match) extractedUnits = parseInt(match[1]);
        }
        if (extractedUnits) setUnitsPerBox(String(extractedUnits));
        setSearchResults([]);
    };

    // Cálculo automático de cantidad y envases
    const parsedUnitsPerBox = parseInt(unitsPerBox) || 30;
    const computedQuantity = Math.round((parseFloat(dailyUnits) || 0) * (parseInt(durationDays) || 0));
    const computedBoxes = Math.ceil(computedQuantity / parsedUnitsPerBox) || 1;

    const handleSaveMedication = async () => {
        if (!medName.trim()) {
            Alert.alert('Atención', 'Por favor ingresá o seleccioná un medicamento.');
            return;
        }

        try {
            setSavingMed(true);
            // Registrar Receta Médica Oficial (Bonificada por defecto durante la consulta)
            await apiFetch('/medical/prescriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: appointmentId || null,
                    patient_id: patientId,
                    medications: medName,
                    instructions: notes || dosage || 'Sin instrucciones adicionales',
                    bonified: 1, // Receta emitida en la visita es bonificada por defecto
                    items: [{
                        vademecum_id: selectedVademecum?.id || null,
                        medication_name: medName,
                        dose: dosage || 'Según indicación',
                        frequency: `${dailyUnits} toma(s) por día`,
                        quantity: computedQuantity,
                        daily_units: parseFloat(dailyUnits) || 1,
                        units_per_box: parsedUnitsPerBox
                    }]
                })
            });

            Alert.alert('¡Receta Creada!', 'La receta oficial fue registrada exitosamente en la base de datos (Bonificada).');
            setShowAddModal(false);
            resetForm();
            fetchDetails(); // Refrescar ficha
        } catch (err) {
            console.warn('Fallback a guardado de medicación directa:', err);
            try {
                await apiFetch('/medical/patients/medications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patient_id: patientId,
                        vademecum_id: selectedVademecum?.id || null,
                        medication_name: medName,
                        dosage: dosage || 'Según indicación',
                        frequency: `${dailyUnits} toma(s) por día`,
                        duration_days: parseInt(durationDays) || 30,
                        quantity: computedQuantity,
                        notes: notes
                    })
                });
                Alert.alert('Éxito', 'Medicación registrada en la ficha del paciente.');
                setShowAddModal(false);
                resetForm();
                fetchDetails();
            } catch (fallbackErr) {
                console.error('Error al guardar medicación/receta:', fallbackErr);
                Alert.alert('Error', 'No se pudo registrar la receta.');
            }
        } finally {
            setSavingMed(false);
        }
    };

    const resetForm = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedVademecum(null);
        setMedName('');
        setDosage('');
        setUnitsPerBox('30');
        setDailyUnits('1');
        setDurationDays('30');
        setNotes('');
    };

    // Abrir Modal de Detalle / Acciones de Receta
    const handleOpenDetailModal = (item) => {
        setSelectedPrescription(item);
        setEditMedName(item.medication_name || item.title || '');
        setEditDosage(item.dosage || '');
        setEditNotes(item.notes || item.instructions || '');
        setIsEditing(false);
        setShowDetailModal(true);
    };

    // 🔁 Accion: Repetir / Recrear Receta (Crear nueva receta con fecha de HOY)
    const handleRecreatePrescription = async () => {
        if (!selectedPrescription) return;

        Alert.alert(
            '🔁 Repetir Receta',
            `¿Querés emitir una nueva receta para "${selectedPrescription.medication_name || selectedPrescription.title}" con la fecha de HOY?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Emitir Receta',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            await apiFetch('/medical/prescriptions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    appointment_id: appointmentId || null,
                                    patient_id: patientId,
                                    medications: selectedPrescription.medication_name || selectedPrescription.title,
                                    instructions: selectedPrescription.notes || selectedPrescription.dosage || 'Receta Recreada',
                                    bonified: 1,
                                    items: [{
                                        vademecum_id: selectedPrescription.vademecum_id || null,
                                        medication_name: selectedPrescription.medication_name || selectedPrescription.title,
                                        dose: selectedPrescription.dosage || 'Según indicación',
                                        frequency: selectedPrescription.frequency || '1 toma al día',
                                        quantity: selectedPrescription.quantity || 30,
                                        units_per_box: selectedPrescription.units_per_box || 30
                                    }]
                                })
                            });

                            Alert.alert('¡Receta Emitida!', 'Se emitió una nueva receta para la fecha actual.');
                            setShowDetailModal(false);
                            fetchDetails();
                        } catch (err) {
                            console.error('Error al recrear receta:', err);
                            Alert.alert('Error', 'No se pudo recrear la receta.');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // ✏️ Accion: Guardar Edición de Receta
    const handleUpdatePrescription = async () => {
        if (!selectedPrescription) return;

        try {
            setActionLoading(true);
            const presId = selectedPrescription.id;
            
            if (selectedPrescription.type === 'patient_medication') {
                await apiFetch(`/medical/patients/medications/${presId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        medication_name: editMedName,
                        dosage: editDosage,
                        notes: editNotes
                    })
                });
            } else {
                await apiFetch(`/medical/prescriptions/${presId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        medications: editMedName,
                        instructions: editNotes || editDosage
                    })
                });
            }

            Alert.alert('Éxito', 'Los cambios en la receta fueron guardados.');
            setShowDetailModal(false);
            setIsEditing(false);
            fetchDetails();
        } catch (err) {
            console.error('Error al editar receta:', err);
            Alert.alert('Error', 'No se pudieron guardar los cambios.');
        } finally {
            setActionLoading(false);
        }
    };

    // 🗑️ Accion: Abrir Modal de Confirmación con Contraseña
    const handleDeletePrescription = () => {
        if (!selectedPrescription) return;
        setDeletePassword('');
        setShowPasswordModal(true);
    };

    const confirmDeleteWithPassword = async () => {
        if (!deletePassword.trim()) {
            Alert.alert('Atención', 'Por favor ingresá tu contraseña para confirmar.');
            return;
        }

        try {
            setActionLoading(true);
            const presId = selectedPrescription.id;
            const endpoint = selectedPrescription.type === 'patient_medication' 
                ? `/medical/patients/medications/${presId}` 
                : `/medical/prescriptions/${presId}`;

            await apiFetch(endpoint, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword })
            });

            Alert.alert('¡Eliminado!', 'La receta fue eliminada con éxito del historial.');
            setShowPasswordModal(false);
            setShowDetailModal(false);
            setDeletePassword('');
            fetchDetails();
        } catch (err) {
            console.error('Error al eliminar receta con contraseña:', err);
            const errStr = JSON.stringify(err || '');
            if (errStr.includes('invalid_password') || errStr.includes('Password') || err?.status === 401) {
                Alert.alert('Contraseña Incorrecta', 'La contraseña ingresada no es válida.');
            } else {
                Alert.alert('Error', 'No se pudo eliminar la receta.');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleCall = (phone) => {
        if (!phone) {
            Alert.alert('Aviso', 'El paciente no posee número de teléfono registrado.');
            return;
        }
        Alert.alert(
            'Llamar al Paciente',
            `¿Desea llamar al ${phone}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Llamar', onPress: () => Linking.openURL(`tel:${phone}`) }
            ]
        );
    };

    const handleWhatsApp = (phone) => {
        if (!phone) {
            Alert.alert('Aviso', 'El paciente no posee número de teléfono registrado.');
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        Alert.alert(
            'Abrir WhatsApp',
            `¿Iniciar chat de WhatsApp con el paciente?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir Chat', onPress: () => Linking.openURL(`https://wa.me/${cleanPhone}`) }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onClose}>
                        <Text style={styles.backButtonText}>← Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ficha Médica</Text>
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0284c7" />
                    <Text style={styles.loadingText}>Cargando historial del paciente...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!patientData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onClose}>
                        <Text style={styles.backButtonText}>← Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ficha Médica</Text>
                </View>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>No se encontraron datos para este paciente.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const mainPhone = patientData.phoneNumbers?.[0]?.phone_number || patientData.phone || '';
    const prescriptionsList = patientData.prescriptions || [];
    const appointmentsList = patientData.appointments || [];
    const filesList = patientData.files || [];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Superior */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onClose}>
                    <Text style={styles.backButtonText}>← Volver a Turnos</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ficha Clínica</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Tarjeta Resumen Paciente */}
                <View style={styles.patientCard}>
                    <Text style={styles.patientName}>{patientData.name || `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() || 'Paciente'}</Text>
                    <View style={styles.badgeRow}>
                        {patientData.dni ? (
                            <View style={styles.infoBadge}>
                                <Text style={styles.badgeText}>DNI: {patientData.dni}</Text>
                            </View>
                        ) : null}
                        {patientData.health_insurance || patientData.obra_social ? (
                            <View style={[styles.infoBadge, styles.insuranceBadge]}>
                                <Text style={styles.insuranceBadgeText}>{patientData.health_insurance || patientData.obra_social}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Acciones Rápidas de Contacto */}
                    <View style={styles.contactRow}>
                        <TouchableOpacity style={styles.callButton} onPress={() => handleCall(mainPhone)}>
                            <Text style={styles.actionButtonText}>📞 Llamar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.whatsappButton} onPress={() => handleWhatsApp(mainPhone)}>
                            <Text style={styles.actionButtonText}>💬 WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Pestañas de Navegación */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'medications' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('medications')}
                    >
                        <Text style={[styles.tabText, activeTab === 'medications' && styles.tabTextActive]}>
                            💊 Medicación ({prescriptionsList.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'visits' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('visits')}
                    >
                        <Text style={[styles.tabText, activeTab === 'visits' && styles.tabTextActive]}>
                            📅 Visitas ({appointmentsList.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'files' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('files')}
                    >
                        <Text style={[styles.tabText, activeTab === 'files' && styles.tabTextActive]}>
                            📋 Archivos ({filesList.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Contenido de la Pestaña Activa */}
                <View style={styles.tabContentArea}>
                    {activeTab === 'medications' && (
                        <View>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Medicación y Prescripciones</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                                    <Text style={styles.addButtonText}>+ Prescribir</Text>
                                </TouchableOpacity>
                            </View>

                            {prescriptionsList.length === 0 ? (
                                <Text style={styles.emptyText}>Sin registros de medicación o recetas anteriores.</Text>
                            ) : (
                                prescriptionsList.map((item, idx) => (
                                    <TouchableOpacity
                                        key={item.id || idx}
                                        style={styles.cardItem}
                                        onPress={() => handleOpenDetailModal(item)}
                                    >
                                        <View style={styles.cardItemHeader}>
                                            <Text style={styles.cardTitle}>💊 {item.medication_name || item.title || 'Medicamento Registrado'}</Text>
                                            <Text style={styles.viewDetailLink}>Ver / Gestionar ›</Text>
                                        </View>
                                        <Text style={styles.cardDetail}>📅 Emitida el: {item.date || item.created_at ? new Date(item.date || item.created_at).toLocaleDateString('es-AR') : '-'}</Text>
                                        {item.dosage ? <Text style={styles.cardDetail}>📐 Dosis: {item.dosage}</Text> : null}
                                        <Text style={styles.cardDetail}>
                                            📦 Envases: {Math.ceil((parseInt(item.quantity) || 30) / (parseInt(item.units_per_box) || 30))} caja(s) ({parseInt(item.quantity) || 30} u. totales)
                                        </Text>
                                        {item.notes ? <Text style={styles.cardNotes}>📝 Notas: {item.notes}</Text> : null}
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'visits' && (
                        <View>
                            <Text style={styles.sectionTitle}>Historial de Visitas y Consultas</Text>
                            {appointmentsList.length === 0 ? (
                                <Text style={styles.emptyText}>No hay consultas registradas para este paciente.</Text>
                            ) : (
                                appointmentsList.map((item, idx) => (
                                    <View key={item.id || idx} style={styles.cardItem}>
                                        <View style={styles.visitHeader}>
                                            <Text style={styles.cardTitle}>
                                                {item.appointment_date ? new Date(item.appointment_date).toLocaleDateString('es-AR') : 'Fecha no especificada'}
                                            </Text>
                                            <View style={[styles.statusTag, item.status === 'attended' || item.status === 'completado' ? styles.statusAttended : styles.statusPending]}>
                                                <Text style={styles.statusTagText}>{item.status || 'Atendido'}</Text>
                                            </View>
                                        </View>
                                        {item.slot_time ? <Text style={styles.cardDetail}>Hora: {item.slot_time.substring(0, 5)} hs</Text> : null}
                                        {item.reason ? <Text style={styles.cardNotes}>Motivo: {item.reason}</Text> : null}
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'files' && (
                        <View>
                            <Text style={styles.sectionTitle}>Estudios y Documentos Adjuntos</Text>
                            {filesList.length === 0 ? (
                                <Text style={styles.emptyText}>No se adjuntaron estudios o archivos digitales.</Text>
                            ) : (
                                filesList.map((file, idx) => (
                                    <View key={file.id || idx} style={styles.cardItem}>
                                        <Text style={styles.cardTitle}>📄 {file.original_name || file.filename || 'Archivo adjunto'}</Text>
                                        <Text style={styles.cardDetail}>Cargado: {file.created_at ? new Date(file.created_at).toLocaleDateString('es-AR') : '-'}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modal para Agregar Medicamento con Vademécum & Calculadora */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Prescribir / Agregar Medicamento</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Text style={styles.closeModalText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                            <Text style={styles.inputLabel}>🔍 Buscar en Vademécum BBDD</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Escribí nombre del fármaco o monodroga..."
                                placeholderTextColor="#64748b"
                                value={searchQuery}
                                onChangeText={(text) => {
                                    setSearchQuery(text);
                                    setMedName(text);
                                }}
                            />

                            {searchingVademecum ? (
                                <ActivityIndicator size="small" color="#0284c7" style={{ marginVertical: 8 }} />
                            ) : searchResults.length > 0 ? (
                                <ScrollView style={styles.suggestionBox} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                    {searchResults.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={styles.suggestionItem}
                                            onPress={() => handleSelectVademecum(item)}
                                        >
                                            <Text style={styles.suggestionName}>{item.name}</Text>
                                            <Text style={styles.suggestionSub}>{item.presentation} - {item.drug} [{item.lab}]</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : null}

                            <Text style={styles.inputLabel}>💊 Medicamento Seleccionado</Text>
                            <TextInput
                                style={styles.input}
                                value={medName}
                                onChangeText={setMedName}
                                placeholder="Nombre comercial o genérico"
                                placeholderTextColor="#64748b"
                            />

                            <Text style={styles.inputLabel}>📐 Dosis / Presentación</Text>
                            <TextInput
                                style={styles.input}
                                value={dosage}
                                onChangeText={setDosage}
                                placeholder="Ej: 500 mg, 1 comprimido cada 8hs"
                                placeholderTextColor="#64748b"
                            />

                            <View style={styles.rowInputs}>
                                <View style={styles.flexInput}>
                                    <Text style={styles.inputLabel}>⚡ Tomas al Día</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={dailyUnits}
                                        onChangeText={setDailyUnits}
                                    />
                                </View>
                                <View style={styles.flexInput}>
                                    <Text style={styles.inputLabel}>🗓️ Días Tratamiento</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={durationDays}
                                        onChangeText={setDurationDays}
                                    />
                                </View>
                                <View style={styles.flexInput}>
                                    <Text style={styles.inputLabel}>📦 Unid. / Caja</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={unitsPerBox}
                                        onChangeText={setUnitsPerBox}
                                    />
                                </View>
                            </View>

                            {/* Tarjeta de Calculadora de Cantidad & Cajas */}
                            <View style={styles.calcCard}>
                                <Text style={styles.calcTitle}>📊 Cálculo de Dosis y Envases</Text>
                                <Text style={styles.calcResult}>
                                    {dailyUnits} toma(s)/día × {durationDays} días = <Text style={styles.calcHighlight}>{computedQuantity} unidades totales</Text>
                                </Text>
                                <Text style={[styles.calcResult, { marginTop: 4 }]}>
                                    📦 Receta recomendada: <Text style={styles.calcHighlight}>{computedBoxes} caja(s) / envase(s)</Text> ({parsedUnitsPerBox} u. c/u)
                                </Text>
                            </View>

                            <Text style={styles.inputLabel}>📝 Indicaciones / Notas</Text>
                            <TextInput
                                style={[styles.input, { height: 70 }]}
                                multiline
                                numberOfLines={3}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Notas adicionales o instrucciones para el paciente..."
                                placeholderTextColor="#64748b"
                            />

                            <TouchableOpacity
                                style={styles.saveMedButton}
                                onPress={handleSaveMedication}
                                disabled={savingMed}
                            >
                                {savingMed ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.saveMedButtonText}>💾 Guardar en Ficha del Paciente</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal de Detalle, Repetición, Edición y Eliminación de Receta */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Gestión de Receta Médica</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <Text style={styles.closeModalText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            {selectedPrescription && (
                                <View>
                                    {!isEditing ? (
                                        <View>
                                            <View style={styles.detailCard}>
                                                <Text style={styles.detailMedName}>{selectedPrescription.medication_name || selectedPrescription.title}</Text>
                                                <Text style={styles.detailSub}>
                                                    Emitida el: {selectedPrescription.date || selectedPrescription.created_at ? new Date(selectedPrescription.date || selectedPrescription.created_at).toLocaleDateString('es-AR') : '-'}
                                                </Text>

                                                {selectedPrescription.dosage ? (
                                                    <View style={styles.detailRow}>
                                                        <Text style={styles.detailLabel}>📐 Dosis / Presentación:</Text>
                                                        <Text style={styles.detailValue}>
                                                            {selectedPrescription.dosage}
                                                            {selectedPrescription.presentation ? ` (${selectedPrescription.presentation})` : ''}
                                                        </Text>
                                                    </View>
                                                ) : null}

                                                {selectedPrescription.frequency ? (
                                                    <View style={styles.detailRow}>
                                                        <Text style={styles.detailLabel}>⚡ Frecuencia de Toma:</Text>
                                                        <Text style={styles.detailValue}>{selectedPrescription.frequency}</Text>
                                                    </View>
                                                ) : null}

                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>📦 Cantidad & Envases:</Text>
                                                    <Text style={styles.detailValue}>
                                                        {selectedPrescription.quantity || 30} unidades totales ({Math.ceil((selectedPrescription.quantity || 30) / (selectedPrescription.units_per_box || 30))} caja(s) de {selectedPrescription.units_per_box || 30} u.)
                                                    </Text>
                                                </View>

                                                {selectedPrescription.notes || selectedPrescription.instructions ? (
                                                    <View style={styles.detailRow}>
                                                        <Text style={styles.detailLabel}>📝 Indicaciones / Notas:</Text>
                                                        <Text style={styles.detailValue}>{selectedPrescription.notes || selectedPrescription.instructions}</Text>
                                                    </View>
                                                ) : null}
                                            </View>

                                            {/* Botonera de Acciones */}
                                            <TouchableOpacity
                                                style={styles.recreateButton}
                                                onPress={handleRecreatePrescription}
                                                disabled={actionLoading}
                                            >
                                                <Text style={styles.recreateButtonText}>🔁 Repetir / Recrear Receta (Hoy)</Text>
                                            </TouchableOpacity>

                                            <View style={styles.actionsRow}>
                                                <TouchableOpacity
                                                    style={styles.editButton}
                                                    onPress={() => setIsEditing(true)}
                                                    disabled={actionLoading}
                                                >
                                                    <Text style={styles.actionBtnText}>✏️ Editar</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.deleteButton}
                                                    onPress={handleDeletePrescription}
                                                    disabled={actionLoading}
                                                >
                                                    <Text style={styles.actionBtnText}>🗑️ Eliminar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <View>
                                            <Text style={styles.inputLabel}>💊 Nombre de Medicamento</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={editMedName}
                                                onChangeText={setEditMedName}
                                            />

                                            <Text style={styles.inputLabel}>📐 Dosis / Presentación</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={editDosage}
                                                onChangeText={setEditDosage}
                                            />

                                            <Text style={styles.inputLabel}>📝 Indicaciones / Notas</Text>
                                            <TextInput
                                                style={[styles.input, { height: 70 }]}
                                                multiline
                                                numberOfLines={3}
                                                value={editNotes}
                                                onChangeText={setEditNotes}
                                            />

                                            <View style={styles.actionsRow}>
                                                <TouchableOpacity
                                                    style={styles.cancelEditBtn}
                                                    onPress={() => setIsEditing(false)}
                                                >
                                                    <Text style={styles.cancelEditBtnText}>Cancelar</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.saveEditBtn}
                                                    onPress={handleUpdatePrescription}
                                                    disabled={actionLoading}
                                                >
                                                    {actionLoading ? (
                                                        <ActivityIndicator size="small" color="#ffffff" />
                                                    ) : (
                                                        <Text style={styles.saveEditBtnText}>💾 Guardar</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal de Confirmación con Contraseña para Eliminar Receta */}
            <Modal
                visible={showPasswordModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { maxHeight: 320 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>🔒 Confirmar Eliminación</Text>
                            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                                <Text style={styles.closeModalText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ padding: 16 }}>
                            <Text style={{ color: '#cbd5e1', fontSize: 14, marginBottom: 12 }}>
                                Ingresá tu contraseña de usuario para confirmar la eliminación de la receta:
                            </Text>

                            <TextInput
                                style={[styles.input, { marginBottom: 16 }]}
                                secureTextEntry={true}
                                placeholder="Contraseña de usuario..."
                                placeholderTextColor="#64748b"
                                value={deletePassword}
                                onChangeText={setDeletePassword}
                            />

                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={styles.cancelEditBtn}
                                    onPress={() => setShowPasswordModal(false)}
                                >
                                    <Text style={styles.cancelEditBtnText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.deleteButton, { flex: 1 }]}
                                    onPress={confirmDeleteWithPassword}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.actionBtnText}>Confirmar Borrado</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 36) + 12 : 16,
        paddingBottom: 16,
        backgroundColor: '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#334155',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#38bdf8',
        fontWeight: 'bold',
        fontSize: 15,
    },
    headerTitle: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: 'bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: '#94a3b8',
        marginTop: 12,
        fontSize: 15,
    },
    errorText: {
        color: '#f87171',
        fontSize: 16,
    },
    scrollContent: {
        padding: 16,
    },
    patientCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    patientName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    infoBadge: {
        backgroundColor: '#334155',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#cbd5e1',
        fontSize: 13,
    },
    insuranceBadge: {
        backgroundColor: '#0284c7',
    },
    insuranceBadgeText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    contactRow: {
        flexDirection: 'row',
        gap: 12,
    },
    callButton: {
        flex: 1,
        backgroundColor: '#0284c7',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    whatsappButton: {
        flex: 1,
        backgroundColor: '#16a34a',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: '#0284c7',
    },
    tabText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    tabContentArea: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#38bdf8',
    },
    addButton: {
        backgroundColor: '#0284c7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    emptyText: {
        color: '#64748b',
        fontStyle: 'italic',
        fontSize: 14,
    },
    cardItem: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: {
        color: '#f8fafc',
        fontWeight: 'bold',
        fontSize: 15,
        flex: 1,
    },
    viewDetailLink: {
        color: '#38bdf8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardDetail: {
        color: '#cbd5e1',
        fontSize: 13,
        marginBottom: 2,
    },
    cardNotes: {
        color: '#94a3b8',
        fontSize: 13,
        marginTop: 4,
        fontStyle: 'italic',
    },
    visitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusAttended: {
        backgroundColor: '#166534',
    },
    statusPending: {
        backgroundColor: '#854d0e',
    },
    statusTagText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        justifyContent: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 14,
        maxHeight: '85%',
        borderWidth: 1,
        borderColor: '#334155',
        overflow: 'hidden',
        flexShrink: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    closeModalText: {
        color: '#94a3b8',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalForm: {
        padding: 16,
    },
    inputLabel: {
        color: '#cbd5e1',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#f8fafc',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    suggestionBox: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0284c7',
        marginTop: 6,
        marginBottom: 10,
        maxHeight: 180,
    },
    suggestionItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    suggestionName: {
        color: '#38bdf8',
        fontWeight: 'bold',
        fontSize: 14,
    },
    suggestionSub: {
        color: '#94a3b8',
        fontSize: 12,
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12,
    },
    flexInput: {
        flex: 1,
    },
    calcCard: {
        backgroundColor: '#0369a1',
        borderRadius: 8,
        padding: 12,
        marginVertical: 14,
    },
    calcTitle: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    calcResult: {
        color: '#e0f2fe',
        fontSize: 14,
    },
    calcHighlight: {
        fontWeight: 'bold',
        color: '#ffffff',
    },
    saveMedButton: {
        backgroundColor: '#16a34a',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    saveMedButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    detailCard: {
        backgroundColor: '#0f172a',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 16,
    },
    detailMedName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#38bdf8',
        marginBottom: 4,
    },
    detailSub: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 12,
    },
    detailRow: {
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: 'bold',
    },
    detailValue: {
        fontSize: 14,
        color: '#f8fafc',
        marginTop: 2,
    },
    recreateButton: {
        backgroundColor: '#16a34a',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    recreateButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
        marginBottom: 16,
    },
    editButton: {
        flex: 1,
        backgroundColor: '#0284c7',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#dc2626',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cancelEditBtn: {
        flex: 1,
        backgroundColor: '#334155',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelEditBtnText: {
        color: '#cbd5e1',
        fontWeight: 'bold',
        fontSize: 14,
    },
    saveEditBtn: {
        flex: 1,
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveEditBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
