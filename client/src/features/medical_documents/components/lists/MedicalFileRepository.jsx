import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { DocumentViewerModal } from '@/components/molecules/DocumentViewerModal';
import styles from './MedicalFileRepository.module.css';

/**
 * MedicalFileRepository Organism (Feature-based).
 * Manages document uploads and listing for patient medical records.
 */
const MedicalFileRepository = ({
    t,
    user,
    files,
    filterItem,
    filePatient,
    fileDesc,
    handleFilePatientChange,
    handleFileDescChange,
    handleFileUploadChange,
    handleFileUpload,
    openDeleteFileModal,
    canDeleteFile,
    PatientSearchSelectComponent
}) => {
    const [selectedViewerFile, setSelectedViewerFile] = useState(null);

    return (
        <div className={`${styles.root}`}>
            <section className="medical-file-repository__upload">
                <div className="dashboard-card">
                    <h3 className="dashboard-card__title">{t('upload_document')}</h3>
                    <form className="config-flex--column config-flex--gap-4" onSubmit={handleFileUpload}>
                        <div className="input-group">
                            <label className="input-label">{t('patient_label')}</label>
                            <PatientSearchSelectComponent
                                value={filePatient}
                                onChange={handleFilePatientChange}
                                placeholder={t('select_patient')}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('file_description_label')}</label>
                            <input
                                type="text"
                                className="input-field"
                                value={fileDesc}
                                onChange={e => handleFileDescChange(e.target.value)}
                                placeholder={t('file_description_placeholder')}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('file_label')}</label>
                            <input
                                type="file"
                                className="input-field"
                                onChange={e => handleFileUploadChange(e.target.files[0])}
                                required
                            />
                        </div>
                        <Button type="submit" variant="primary" style={{ width: '100%' }}>
                            {t('upload_file')}
                        </Button>
                    </form>
                </div>
            </section>

            <section className="medical-file-repository__list">
                <div className="dashboard-card">
                    <h3 className="dashboard-card__title">{t('repository_title')}</h3>

                    <div className={`${styles.tableWrapper}`}>
                        {files.filter(filterItem).length === 0 ? (
                            <p className="medical-file-repository__text-empty">{t('no_files_uploaded')}</p>
                        ) : (
                            <table className={`${styles.table}`}>
                                <thead>
                                    <tr>
                                        <th className={`${styles.cellPl} ${styles.cellPy}`}>{t('file_column')}</th>
                                        <th>{t('patient_column')}</th>
                                        <th className={`${styles.cellPr} ${styles.cellRight}`}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.reduce((acc, f) => {
                                        if (filterItem(f)) {
                                            acc.push(
                                                <tr
                                                    key={f.id}
                                                    className={`${styles.rowInteractive}`}
                                                    onClick={() => setSelectedViewerFile(f)}
                                                >
                                                    <td className={`${styles.cellPl} ${styles.cellPy}`}>
                                                        <div className="config-flex">
                                                            <Icon name="folder_open" size="1.2rem" className={`${styles.fileIcon}`} />
                                                            <span className={`${styles.fileName}`}>{f.description || f.file_name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.patientName}`}>{f.patient_name}</span>
                                                    </td>
                                                    <td className={`${styles.cellPr} ${styles.cellRight}`}>
                                                        {(user?.role === 'admin' || canDeleteFile) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm-compact"
                                                                className={`${styles.btnDelete}`}
                                                                onClick={(e) => { e.stopPropagation(); openDeleteFileModal(f); }}
                                                                icon={<Icon name="delete" size="1rem" />}
                                                            />
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        return acc;
                                    }, [])}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </section>

            <DocumentViewerModal
                isOpen={!!selectedViewerFile}
                onClose={() => setSelectedViewerFile(null)}
                file={selectedViewerFile}
                filesList={files.filter(filterItem)}
                onSelectFile={(f) => setSelectedViewerFile(f)}
            />
        </div>
    );
};

export default MedicalFileRepository;
