import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Doctor } from '@/types/appointments';
import { Colors } from '@/shared/theme/colors';

interface DoctorSelectorBarProps {
    doctors: Doctor[];
    selectedDoctorId: number;
    onSelectDoctor: (doctorId: number) => void;
}

export const DoctorSelectorBar: React.FC<DoctorSelectorBarProps> = ({
    doctors,
    selectedDoctorId,
    onSelectDoctor,
}) => {
    const list = Array.isArray(doctors) ? doctors : [];
    if (list.length <= 1) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Agenda del Profesional:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {list.map((doc) => {
                    const isSelected = doc.id === selectedDoctorId;
                    return (
                        <TouchableOpacity
                            key={doc.id}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => onSelectDoctor(doc.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                🩺 {doc.full_name}
                            </Text>
                            {doc.specialty ? (
                                <Text
                                    style={[styles.chipSpecialty, isSelected && styles.chipSpecialtyActive]}
                                    numberOfLines={1}
                                >
                                    {doc.specialty}
                                </Text>
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.cardBackground,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    scroll: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 2,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: Colors.borderLight,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textMain,
    },
    chipTextActive: {
        color: Colors.primaryDark,
        fontWeight: 'bold',
    },
    chipSpecialty: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    chipSpecialtyActive: {
        color: Colors.primary,
    },
});
