
import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
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
                            <label className="input-label">{t('description')}</label>
                            <input
                                className="input-field"
                                value={fileDesc}
                                onChange={e => handleFileDescChange(e.target.value)}
                                placeholder="e.g. Lab Results PDF"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('file')}</label>
                            <input
                                type="file"
                                className="input-field"
                                onChange={e => handleFileUploadChange(e.target.files[0])}
                                required
                            />
                        </div>
                        <Button type="submit" className={`${styles.btnSubmit}`}>{t('upload_file')}</Button>
                    </form>
                </div>
            </section>

            <section className="medical-file-repository__list">
                <div className="dashboard-card no-padding">
                    <div className={`${styles.tableContainer}`}>
                        {files.filter(filterItem).length === 0 ? (
                            <div className={`${styles.empty}`}>
                                <Icon name="folder_open" size="3rem" className={`${styles.emptyIcon}`} />
                                {t('no_files')}
                            </div>
                        ) : (
                            <table className={`${styles.table}`}>
                                <thead>
                                    <tr>
                                        <th className={`${styles.cellPl}`}>{t('file')}</th>
                                        <th>{t('patient')}</th>
                                        <th className={`${styles.cellPr} ${styles.cellRight}`}>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.reduce((acc, f) => {
                                        if (filterItem(f)) {
                                            acc.push(
                                                <tr
                                                    key={f.id}
                                                    className={`${styles.rowInteractive}`}
                                                    onClick={() => window.open(f.file_url, '_blank')}
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
        </div>
    );
};

export default MedicalFileRepository;
