
import React from 'react';
import { PatientSearchSelect } from '../../patients';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './MedicalFileRepository.css';

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
    canDeleteFile
}) => {
    return (
        <div className="medical-file-repository">
            <section className="medical-file-repository__upload">
                <div className="dashboard-card">
                    <h3 className="dashboard-card__title">{t('upload_document')}</h3>
                    <form className="config-flex--column config-flex--gap-4" onSubmit={handleFileUpload}>
                        <div className="input-group">
                            <label className="input-label">{t('patient_label')}</label>
                            <PatientSearchSelect
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
                        <Button type="submit" className="w-full">{t('upload_file')}</Button>
                    </form>
                </div>
            </section>

            <section className="medical-file-repository__list">
                <div className="dashboard-card no-padding">
                    <div className="medical-file-repository__table-container">
                        {files.filter(filterItem).length === 0 ? (
                            <div className="medical-file-repository__empty">
                                <Icon name="folder_open" size="3rem" className="medical-file-repository__empty-icon" />
                                {t('no_files')}
                            </div>
                        ) : (
                            <table className="table-base w-full">
                                <thead>
                                    <tr>
                                        <th className="pl-6">{t('file')}</th>
                                        <th>{t('patient')}</th>
                                        <th className="pr-6 text-right">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.filter(filterItem).map(f => (
                                        <tr
                                            key={f.id}
                                            className="hover:bg-slate-50 cursor-pointer"
                                            onClick={() => window.open(f.file_url, '_blank')}
                                        >
                                            <td className="pl-6 py-4">
                                                <div className="config-flex">
                                                    <Icon name="folder_open" size="1.2rem" className="medical-file-repository__file-icon" />
                                                    <span className="medical-file-repository__file-name">{f.description || f.file_name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="medical-file-repository__patient-name">{f.patient_name}</span>
                                            </td>
                                            <td className="pr-6 text-right">
                                                {(user?.role === 'admin' || canDeleteFile) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm-compact"
                                                        className="text-danger"
                                                        onClick={(e) => { e.stopPropagation(); openDeleteFileModal(f); }}
                                                        icon={<Icon name="delete" size="1rem" />}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
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
