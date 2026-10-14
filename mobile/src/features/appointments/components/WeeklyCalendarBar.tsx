import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/shared/theme/colors';

interface WeeklyCalendarBarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export const WeeklyCalendarBar: React.FC<WeeklyCalendarBarProps> = ({
    selectedDate,
    onSelectDate,
}) => {
    const getWeekDays = () => {
        const startOfWeek = new Date(selectedDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays();

    return (
        <View style={styles.calendarBar}>
            {weekDays.map((d, idx) => {
                const isSelected = d.toDateString() === selectedDate.toDateString();
                const isToday = d.toDateString() === new Date().toDateString();
                const dayName = d.toLocaleDateString('es-AR', { weekday: 'narrow' });
                const dayNum = d.getDate();

                return (
                    <TouchableOpacity
                        key={idx}
                        style={[
                            styles.calendarDayBox,
                            isToday && styles.calendarDayBoxToday,
                            isSelected && styles.calendarDayBoxSelected,
                        ]}
                        onPress={() => onSelectDate(d)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.calendarDayName,
                                isToday && styles.calendarDayNameToday,
                                isSelected && styles.calendarDayNameSelected,
                            ]}
                        >
                            {dayName.toUpperCase()}
                        </Text>
                        <Text
                            style={[
                                styles.calendarDayNum,
                                isToday && styles.calendarDayNumToday,
                                isSelected && styles.calendarDayNumSelected,
                            ]}
                        >
                            {dayNum}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    calendarBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    calendarDayBox: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        minWidth: 42,
    },
    calendarDayBoxToday: {
        backgroundColor: Colors.primaryLight,
    },
    calendarDayBoxSelected: {
        backgroundColor: Colors.primary,
    },
    calendarDayName: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    calendarDayNameToday: {
        color: Colors.primary,
    },
    calendarDayNameSelected: {
        color: '#ffffff',
    },
    calendarDayNum: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    calendarDayNumToday: {
        color: Colors.primary,
    },
    calendarDayNumSelected: {
        color: '#ffffff',
    },
});
