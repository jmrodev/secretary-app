import React, { useState } from 'react';
import {
    StyleSheet,
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { VademecumItem } from '@/types/patients';
import { Colors } from '@/shared/theme/colors';

interface AddMedicationModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        medName: string;
        dosage: string;
        boxesCount: string;
        unitsPerBox: string;
        dailyUnits: string;
        durationDays: string;
        notes: string;
        selectedVademecum: VademecumItem | null;
    }) => Promise<boolean>;
    saving: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    searchResults: VademecumItem[];
    searchingVademecum: boolean;
}

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
    visible,
    onClose,
    onSave,
    saving,
    searchQuery,
    onSearchChange,
    searchResults,
    searchingVademecum,
}) => {
    const [selectedVademecum, setSelectedVademecum] = useState<VademecumItem | null>(null);
    const [medName, setMedName] = useState('');
    const [dosage, setDosage] = useState('');
    const [boxesCount, setBoxesCount] = useState('1');
    const [unitsPerBox, setUnitsPerBox] = useState('30');
    const [dailyUnits, setDailyUnits] = useState('1');
    const [durationDays, setDurationDays] = useState('30');
    const [notes, setNotes] = useState('');
    const [formError, setFormError] = useState('');

    const recalculateDuration = (boxes: string, units: string, daily: string) => {
        const b = parseInt(boxes, 10);
        const u = parseInt(units, 10);
        const d = parseFloat(daily);
        if (b > 0 && u > 0 && d > 0) {
            setDurationDays(String(Math.floor((b * u) / d)));
        }
    };

    const handleBoxesChange = (val: string) => {
        setBoxesCount(val);
        recalculateDuration(val, unitsPerBox, dailyUnits);
    };

    const handleUnitsChange = (val: string) => {
        setUnitsPerBox(val);
        recalculateDuration(boxesCount, val, dailyUnits);
    };

    const handleDailyChange = (val: string) => {
        setDailyUnits(val);
        recalculateDuration(boxesCount, unitsPerBox, val);
    };

    const handleSelectVademecum = (item: VademecumItem) => {
        setSelectedVademecum(item);
        setMedName(item.name || item.full_label || '');
        setFormError('');
        if (item.presentation) setDosage(item.presentation);

        let extractedUnits = item.units_per_box;
        if (!extractedUnits && item.presentation) {
            const match = item.presentation.match(/\bx\s*(\d+)\b/i);
            if (match) extractedUnits = parseInt(match[1], 10);
        }
        if (extractedUnits) {
            setUnitsPerBox(String(extractedUnits));
            recalculateDuration(boxesCount, String(extractedUnits), dailyUnits);
        }
        onSearchChange('');
    };

    const handleSubmit = async () => {
        const targetMedName = medName.trim() || searchQuery.trim();
        if (!targetMedName) {
            setFormError('Por favor indicá el nombre del medicamento.');
            return;
        }
        setFormError('');

        const success = await onSave({
            medName: targetMedName,
            dosage,
            boxesCount,
            unitsPerBox,
            dailyUnits,
            durationDays,
            notes,
            selectedVademecum,
        });
        if (success) {
            setSelectedVademecum(null);
            setMedName('');
            setDosage('');
            setBoxesCount('1');
            setUnitsPerBox('30');
            setDailyUnits('1');
            setDurationDays('30');
            setNotes('');
            setFormError('');
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Nueva Prescripción Médica</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.modalBody}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.inputLabel}>Buscar en Vademécum</Text>
                        <View style={styles.searchInputWrapper}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Ej. Paracetamol, Ibuprofeno..."
                                value={searchQuery}
                                onChangeText={onSearchChange}
                                placeholderTextColor={Colors.textMuted}
                                autoCapitalize="none"
                            />
                            {searchingVademecum ? (
                                <ActivityIndicator
                                    size="small"
                                    color={Colors.primary}
                                    style={{ marginLeft: 8 }}
                                />
                            ) : searchQuery.length > 0 ? (
                                <TouchableOpacity
                                    onPress={() => onSearchChange('')}
                                    style={styles.clearSearchBtn}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Text style={styles.clearSearchText}>✕</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {searchQuery.trim().length >= 2 && !searchingVademecum && searchResults.length === 0 ? (
                            <View style={styles.noResultsBox}>
                                <Text style={styles.noResultsText}>
                                    Sin coincidencias en vademécum. Podés ingresar los datos manualmente.
                                </Text>
                            </View>
                        ) : null}

                        {searchResults.length > 0 ? (
                            <View style={styles.resultsContainer}>
                                <View style={styles.resultsHeader}>
                                    <Text style={styles.resultsHeaderText}>
                                        Sugerencias Vademécum ({searchResults.length})
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => onSearchChange('')}
                                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                    >
                                        <Text style={styles.resultsCloseText}>Ocultar</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView
                                    style={styles.resultsScrollView}
                                    nestedScrollEnabled
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {searchResults.map((item, idx) => (
                                        <TouchableOpacity
                                            key={item.id ?? idx}
                                            style={styles.resultItem}
                                            onPress={() => handleSelectVademecum(item)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.resultIconWrap}>
                                                <Text style={styles.resultIcon}>💊</Text>
                                            </View>
                                            <View style={styles.resultContent}>
                                                <Text style={styles.resultName}>
                                                    {item.name || item.full_label}
                                                </Text>
                                                {item.presentation ? (
                                                    <Text style={styles.resultSub}>
                                                        {item.presentation}
                                                        {item.drug ? ` • ${item.drug}` : ''}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : null}

                        {selectedVademecum ? (
                            <View style={styles.selectedBadge}>
                                <Text style={styles.selectedBadgeText}>
                                    ✓ Vinculado con vademécum
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedVademecum(null)}>
                                    <Text style={styles.selectedBadgeRemove}>Desvincular</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <Text style={styles.inputLabel}>Nombre del Medicamento *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre comercial o genérico"
                            value={medName}
                            onChangeText={setMedName}
                            placeholderTextColor={Colors.textMuted}
                        />

                        <Text style={styles.inputLabel}>Dosis / Presentación</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. 500mg comp, 1 gota/día"
                            value={dosage}
                            onChangeText={setDosage}
                            placeholderTextColor={Colors.textMuted}
                        />

                        <View style={styles.rowInputs}>
                            <View style={styles.halfInput}>
                                <Text style={styles.inputLabel}>Cantidad de Cajas</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={boxesCount}
                                    onChangeText={handleBoxesChange}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={styles.inputLabel}>Unidades x Caja</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={unitsPerBox}
                                    onChangeText={handleUnitsChange}
                                />
                            </View>
                        </View>

                        <View style={styles.rowInputs}>
                            <View style={styles.halfInput}>
                                <Text style={styles.inputLabel}>Tomas Diarias</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={dailyUnits}
                                    onChangeText={handleDailyChange}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={styles.inputLabel}>Duración (días)</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={durationDays}
                                    onChangeText={setDurationDays}
                                />
                            </View>
                        </View>

                        <Text style={styles.inputLabel}>Indicaciones / Posología</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Tomar cada 8 horas después de las comidas..."
                            multiline
                            numberOfLines={3}
                            value={notes}
                            onChangeText={setNotes}
                            placeholderTextColor={Colors.textMuted}
                        />

                        {formError ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>⚠️ {formError}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={saving}
                            activeOpacity={0.8}
                        >
                            {saving ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Guardar Receta</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: Colors.cardBackground,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    closeBtn: {
        padding: 4,
    },
    closeBtnText: {
        fontSize: 18,
        color: Colors.textSecondary,
    },
    modalBody: {
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.textMain,
        backgroundColor: Colors.background,
    },
    textArea: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        backgroundColor: Colors.background,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.textMain,
    },
    clearSearchBtn: {
        padding: 4,
    },
    clearSearchText: {
        fontSize: 14,
        color: Colors.textMuted,
        fontWeight: 'bold',
    },
    noResultsBox: {
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    noResultsText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
    resultsContainer: {
        borderWidth: 1,
        borderColor: Colors.primaryLight,
        borderRadius: 10,
        backgroundColor: Colors.cardBackground,
        marginTop: 6,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    resultsHeaderText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.primaryDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    resultsCloseText: {
        fontSize: 12,
        color: Colors.primaryDark,
        fontWeight: '600',
    },
    resultsScrollView: {
        maxHeight: 180,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        backgroundColor: Colors.cardBackground,
    },
    resultIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    resultIcon: {
        fontSize: 16,
    },
    resultContent: {
        flex: 1,
    },
    resultName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.textMain,
        marginBottom: 2,
    },
    resultSub: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    selectedBadge: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.successLight,
        borderColor: Colors.success,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 6,
        marginBottom: 4,
    },
    selectedBadgeText: {
        fontSize: 12,
        color: Colors.success,
        fontWeight: '600',
    },
    selectedBadgeRemove: {
        fontSize: 12,
        color: Colors.danger,
        fontWeight: '600',
    },
    errorContainer: {
        backgroundColor: Colors.dangerLight,
        borderColor: Colors.danger,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 14,
    },
    errorText: {
        color: Colors.danger,
        fontSize: 13,
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
