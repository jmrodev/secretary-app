import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/shared/theme/colors';

interface MonthNavigatorBarProps {
    selectedOffset: number;
    onSelectMonth: (monthIndex: number, year: number, offset: number) => void;
}

const MONTH_NAMES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const MonthNavigatorBar: React.FC<MonthNavigatorBarProps> = ({
    selectedOffset,
    onSelectMonth,
}) => {
    const months = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 6 }).map((_, offset) => {
            const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
            return {
                label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ''}`.trim(),
                monthIndex: d.getMonth(),
                year: d.getFullYear(),
                offset,
            };
        });
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {months.map((m) => {
                    const isSelected = selectedOffset === m.offset;
                    return (
                        <TouchableOpacity
                            key={m.offset}
                            style={[styles.pill, isSelected && styles.pillActive]}
                            onPress={() => onSelectMonth(m.monthIndex, m.year, m.offset)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                                {m.label}
                            </Text>
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
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    scroll: {
        flexDirection: 'row',
        gap: 8,
    },
    pill: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: Colors.borderLight,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    pillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primaryDark,
    },
    pillText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    pillTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
});
