import React, { useState } from 'react';
import {
    StyleSheet,
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Colors } from '@/shared/theme/colors';

interface DeleteConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<boolean>;
    actionLoading: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    visible,
    onClose,
    onConfirm,
    actionLoading,
}) => {
    const [password, setPassword] = useState('');

    const handleConfirm = async () => {
        const success = await onConfirm(password);
        if (success) {
            setPassword('');
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.title}>Confirmar Eliminación</Text>
                    <Text style={styles.subtitle}>
                        Esta acción no se puede deshacer. Ingresá tu contraseña de usuario para confirmar:
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        placeholderTextColor={Colors.textMuted}
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.btn, styles.cancelBtn]}
                            onPress={() => {
                                setPassword('');
                                onClose();
                            }}
                        >
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, styles.deleteBtn]}
                            onPress={handleConfirm}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.deleteText}>Eliminar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 340,
        elevation: 6,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.danger,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 16,
        lineHeight: 18,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 16,
        backgroundColor: Colors.background,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: Colors.borderLight,
    },
    cancelText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    deleteBtn: {
        backgroundColor: Colors.danger,
    },
    deleteText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
});
