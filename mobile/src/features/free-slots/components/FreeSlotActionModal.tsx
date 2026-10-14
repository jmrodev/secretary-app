import React from 'react';
import {
    StyleSheet,
    Modal,
    View,
    Text,
    TouchableOpacity,
    Share,
    Platform,
} from 'react-native';
import { Doctor } from '@/types/appointments';
import { FreeSlot, FreeSlotDay } from '@/types/freeSlots';
import { Colors } from '@/shared/theme/colors';
import { showAlert } from '@/shared/utils/alert';

interface FreeSlotActionModalProps {
    visible: boolean;
    slot: FreeSlot | null;
    day: FreeSlotDay | null;
    doctor: Doctor | null | undefined;
    onClose: () => void;
}

export const FreeSlotActionModal: React.FC<FreeSlotActionModalProps> = ({
    visible,
    slot,
    day,
    doctor,
    onClose,
}) => {
    if (!slot || !day) return null;

    const formattedTime = (slot.time || '').substring(0, 5);
    const doctorName = doctor?.full_name || 'Médico';
    const dayLabel = day.dayName
        ? day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1)
        : day.date;

    const messageText = `¡Hola! Tenemos un turno disponible con ${doctorName} para el ${dayLabel} a las ${formattedTime} hs. ¿Te gustaría reservarlo?`;

    const handleShareWhatsApp = async () => {
        try {
            await Share.share({
                message: messageText,
            });
        } catch (e: any) {
            showAlert('Error', 'No se pudo compartir el turno.');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.sheetContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleWrap}>
                            <Text style={styles.headerTitle}>Turno Disponible</Text>
                            <Text style={styles.headerSubtitle}>{doctorName}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Summary Box */}
                        <View style={styles.slotDetailBox}>
                            <Text style={styles.timeHighlight}>{formattedTime} hs</Text>
                            <Text style={styles.dateHighlight}>📅 {dayLabel}</Text>
                            {slot.is_out_of_hours ? (
                                <View style={styles.outOfHoursBadge}>
                                    <Text style={styles.outOfHoursBadgeText}>
                                        ⚠️ Horario de Sobreturno
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Mensaje sugerido */}
                        <Text style={styles.sectionTitle}>Mensaje para el Paciente:</Text>
                        <View style={styles.messagePreviewBox}>
                            <Text style={styles.messageText}>{messageText}</Text>
                        </View>

                        {/* Acciones */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.btnShare}
                                onPress={handleShareWhatsApp}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.btnShareText}>
                                    💬 Compartir por WhatsApp
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.btnClose}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.btnCloseText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        backgroundColor: Colors.cardBackground,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitleWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    closeBtn: {
        padding: 6,
    },
    closeBtnText: {
        fontSize: 18,
        color: Colors.textSecondary,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    slotDetailBox: {
        backgroundColor: Colors.primaryLight,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    timeHighlight: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.primaryDark,
        marginBottom: 4,
    },
    dateHighlight: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textMain,
    },
    outOfHoursBadge: {
        backgroundColor: Colors.warningLight,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginTop: 8,
    },
    outOfHoursBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.warning,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    messagePreviewBox: {
        backgroundColor: Colors.background,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 20,
    },
    messageText: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    actions: {
        gap: 10,
    },
    btnShare: {
        backgroundColor: '#25D366', // WhatsApp green
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnShareText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    btnClose: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnCloseText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
});
