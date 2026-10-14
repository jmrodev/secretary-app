import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/shared/theme/colors';

interface FreeSlotsHeaderProps {
    doctorName?: string;
}

export const FreeSlotsHeader: React.FC<FreeSlotsHeaderProps> = ({
    doctorName,
}) => {
    const router = useRouter();

    // Safe back: fall back to home when history is empty (deep link, reload).
    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(app)');
        }
    };

    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
            >
                <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>Turnos Libres ⚡</Text>
                {doctorName ? (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {doctorName}
                    </Text>
                ) : null}
            </View>

            <View style={styles.headerRightSpacer} />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: Colors.borderLight,
    },
    backButtonText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.primaryDark,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    headerRightSpacer: {
        width: 65,
    },
});
