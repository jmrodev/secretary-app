import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { FreeSlot, FreeSlotDay } from '@/types/freeSlots';
import { Colors } from '@/shared/theme/colors';

interface FreeSlotDayCardProps {
    day: FreeSlotDay;
    onSelectSlot: (day: FreeSlotDay, slot: FreeSlot) => void;
}

export const FreeSlotDayCard: React.FC<FreeSlotDayCardProps> = ({
    day,
    onSelectSlot,
}) => {
    const slots = Array.isArray(day.slots) ? day.slots : [];
    if (slots.length === 0) return null;

    // Capitalize day name
    const formattedDayName = day.dayName
        ? day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1)
        : day.date;

    return (
        <View style={styles.card}>
            {/* Header del día */}
            <View style={styles.header}>
                <View style={styles.titleWrap}>
                    <Text style={styles.dayIcon}>📅</Text>
                    <Text style={styles.dayTitle}>{formattedDayName}</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{slots.length} libres</Text>
                </View>
            </View>

            {/* Grilla de horarios */}
            <View style={styles.slotsGrid}>
                {slots.map((slot, idx) => {
                    const formattedTime = (slot.time || '').substring(0, 5);
                    const isOutOfHours = Boolean(slot.is_out_of_hours);

                    return (
                        <TouchableOpacity
                            key={`${day.date}-${slot.time}-${idx}`}
                            style={[
                                styles.slotPill,
                                isOutOfHours && styles.slotPillOutOfHours,
                            ]}
                            onPress={() => onSelectSlot(day, slot)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.slotTimeText,
                                    isOutOfHours && styles.slotTimeOutOfHoursText,
                                ]}
                            >
                                {formattedTime}
                            </Text>
                            {isOutOfHours ? (
                                <Text style={styles.outOfHoursLabel}>Sobreturno</Text>
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    titleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    dayIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    dayTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    countBadge: {
        backgroundColor: Colors.primaryLight,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
    },
    countText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.primaryDark,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    slotPill: {
        backgroundColor: Colors.borderLight,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        minWidth: 70,
    },
    slotPillOutOfHours: {
        backgroundColor: Colors.warningLight,
        borderColor: Colors.warning,
    },
    slotTimeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    slotTimeOutOfHoursText: {
        color: Colors.warning,
    },
    outOfHoursLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.warning,
        marginTop: 1,
    },
});
