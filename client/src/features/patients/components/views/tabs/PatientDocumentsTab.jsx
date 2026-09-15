import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';
import { api } from '@/api/axios';
import styles from './PatientDocumentsTab.module.css';

/**
 * PatientDocumentsTab Organism Component.
 * Encapsulates the patient file upload form and files list repository table.
 */
export const PatientDocumentsTab = ({
    patientId,
    patientFiles = [],
    loadingFiles = false,
    refetchFiles,
    onViewFile,
    t
}) => {
    const [uploadingFile, setUploadingFile] = useState(false);
    const [newFile, setNewFile] = useState(null);
    const [newFileDesc, setNewFileDesc] = useState('');
    const [uploadMsg, setUploadMsg] = useState(null);

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!newFile || !patientId) return;
        setUploadingFile(true);
        setUploadMsg(null);
        try {
            const formData = new FormData();
            formData.append('file', newFile);
            formData.append('patientId', patientId);
            formData.append('description', newFileDesc);

            await api.post('/medical/files', formData);
            setUploadMsg({ type: 'success', text: t('file_uploaded') });
            setNewFile(null);
            setNewFileDesc('');
            if (refetchFiles) refetchFiles();
        } catch (err) {
            console.error('[PatientDocumentsTab] Upload error:', err);
            setUploadMsg({ type: 'error', text: t('upload_failed') });
        } finally {
            setUploadingFile(false);
        }
    };

    return (
        <div className={styles.PatientDocumentsTab__root}>
            {/* Upload Box */}
            <section className={styles.PatientDocumentsTab__block}>
                <header className={styles.PatientDocumentsTab__blockHeader}>
                    <h3 className={styles.PatientDocumentsTab__blockTitle}>
                        <Icon name="cloud_upload" size="1.2rem" />
                        <span>{t('upload_file_for_patient')}</span>
                    </h3>
                </header>
                <div className={styles.PatientDocumentsTab__blockContent}>
                    {uploadMsg && (
                        <div className={`${styles.PatientDocumentsTab__uploadMsg} ${uploadMsg.type === 'success' ? styles.PatientDocumentsTab__uploadMsgSuccess : styles.PatientDocumentsTab__uploadMsgError}`}>
                            {uploadMsg.text}
                        </div>
                    )}
                    <form onSubmit={handleUploadSubmit} className={styles.PatientDocumentsTab__uploadForm}>
                        <input
                            type="file"
                            onChange={e => setNewFile(e.target.files[0])}
                            required
                            className={styles.PatientDocumentsTab__fileInput}
                            aria-label={t('upload_file_for_patient')}
                        />
                        <input
                            type="text"
                            placeholder={t('description')}
                            value={newFileDesc}
                            onChange={e => setNewFileDesc(e.target.value)}
                            className={styles.PatientDocumentsTab__textInput}
                        />
                        <Button
                            type="submit"
                            size="sm"
                            variant="primary"
                            disabled={uploadingFile || !newFile}
                            icon={<Icon name="upload" size="1rem" />}
                        >
                            {uploadingFile ? t('loading') : t('upload')}
                        </Button>
                    </form>
                </div>
            </section>

            {/* Files Repository List */}
            <section className={styles.PatientDocumentsTab__block}>
                <header className={styles.PatientDocumentsTab__blockHeader}>
                    <h3 className={styles.PatientDocumentsTab__blockTitle}>
                        <Icon name="folder" size="1.2rem" />
                        <span>{t('patient_files')}</span>
                    </h3>
                </header>
                <div className={styles.PatientDocumentsTab__blockContent}>
                    {loadingFiles ? (
                        <p className={styles.PatientDocumentsTab__emptyText}>{t('loading')}</p>
                    ) : patientFiles.length > 0 ? (
                        <div className={styles.PatientDocumentsTab__tableResponsive}>
                            <table className={styles.PatientDocumentsTab__table}>
                                <thead>
                                    <tr>
                                        <th>{t('file_name')}</th>
                                        <th>{t('description')}</th>
                                        <th>{t('upload_date')}</th>
                                        <th>{t('uploaded_by')}</th>
                                        <th className={styles.PatientDocumentsTab__thRight}>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patientFiles.map(f => (
                                        <tr key={f.id}>
                                            <td className={styles.PatientDocumentsTab__tdFileName}>
                                                <span className={styles.PatientDocumentsTab__fileCell}>
                                                    <Icon
                                                        name={f.file_type?.includes('pdf') ? 'picture_as_pdf' : 'description'}
                                                        size="1.1rem"
                                                    />
                                                    <span>{f.file_name}</span>
                                                </span>
                                            </td>
                                            <td className={styles.PatientDocumentsTab__tdDesc}>
                                                {f.description || '—'}
                                            </td>
                                            <td className={styles.PatientDocumentsTab__tdDate}>
                                                {formatDate(f.created_at)}
                                            </td>
                                            <td className={styles.PatientDocumentsTab__tdUploader}>
                                                {f.uploader_name || '—'}
                                            </td>
                                            <td className={styles.PatientDocumentsTab__thRight}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onViewFile && onViewFile(f)}
                                                    icon={<Icon name="visibility" size="1rem" />}
                                                >
                                                    {t('view')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className={styles.PatientDocumentsTab__emptyText}>{t('no_documents_uploaded')}</p>
                    )}
                </div>
            </section>
        </div>
    );
};
