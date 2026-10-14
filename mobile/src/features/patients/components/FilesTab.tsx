import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { MedicalFile } from '@/types/patients';
import { Colors } from '@/shared/theme/colors';

interface FilesTabProps {
    files: MedicalFile[];
}

export const FilesTab: React.FC<FilesTabProps> = ({ files }) => {
    const handleOpenFile = (file: MedicalFile) => {
        if (!file.file_url) {
            Alert.alert('Aviso', 'El archivo no tiene una URL asociada.');
            return;
        }
        Linking.openURL(file.file_url).catch(() => {
            Alert.alert('Error', 'No se pudo abrir el archivo.');
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.sectionTitle}>Archivos y Estudios</Text>
            </View>

            {files.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📁</Text>
                    <Text style={styles.emptyText}>Sin archivos adjuntos</Text>
                </View>
            ) : (
                <FlatList
                    data={files}
                    keyExtractor={(item, idx) => String(item.id || idx)}
                    renderItem={({ item }) => {
                        const dateStr = item.upload_date || item.created_at || '';
                        return (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => handleOpenFile(item)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.fileIcon}>📄</Text>
                                <View style={styles.fileInfo}>
                                    <Text style={styles.fileName} numberOfLines={1}>
                                        {item.file_name}
                                    </Text>
                                    <Text style={styles.fileCategory}>
                                        {item.category || item.file_type || 'Documento'}
                                        {dateStr ? ` • ${dateStr}` : ''}
                                    </Text>
                                </View>
                                <Text style={styles.viewText}>Ver</Text>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    fileIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textMain,
    },
    fileCategory: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    viewText: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 13,
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyIcon: {
        fontSize: 36,
        marginBottom: 10,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
});
