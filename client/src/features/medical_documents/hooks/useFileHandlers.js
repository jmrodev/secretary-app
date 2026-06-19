import { useCallback } from 'react';
import api from '@/api/axios';

export const useFileHandlers = ({
    t,
    showMessage,
    selectedFile,
    filePatient,
    fileDesc,
    fileToDelete,
    setFileDesc,
    setFilePatient,
    setSelectedFile,
    setFileToDelete,
    fetchFiles,
}) => {
    const handleFileUpload = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (!selectedFile || !filePatient) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('patientId', filePatient);
        formData.append('description', fileDesc);

        try {
            await api.post('/medical/files', formData);
            showMessage(t('file_uploaded'), 'success');
            setFileDesc('');
            setSelectedFile(null);
            fetchFiles();
        } catch {
            showMessage(t('upload_failed'), 'error');
        }
    }, [selectedFile, filePatient, fileDesc, t, showMessage, fetchFiles, setFileDesc, setSelectedFile]);

    const confirmFileDelete = useCallback(async () => {
        if (!fileToDelete) return;
        try {
            await api.delete(`/medical/files/${fileToDelete.id}`);
            showMessage(t('file_deleted') || 'Archivo eliminado correctamente', 'success');
            fetchFiles();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setFileToDelete(null);
        }
    }, [fileToDelete, t, showMessage, fetchFiles, setFileToDelete]);

    const handleFileDescChange = useCallback((val) => setFileDesc(val), [setFileDesc]);
    const handleFilePatientChange = useCallback((val) => setFilePatient(val), [setFilePatient]);
    const handleFileUploadChange = useCallback((file) => setSelectedFile(file), [setSelectedFile]);
    const closeDeleteFileModal = useCallback(() => setFileToDelete(null), [setFileToDelete]);
    const openDeleteFileModal = useCallback((f) => setFileToDelete(f), [setFileToDelete]);

    return {
        handleFileUpload,
        confirmFileDelete,
        handleFileDescChange,
        handleFilePatientChange,
        handleFileUploadChange,
        closeDeleteFileModal,
        openDeleteFileModal
    };
};
