/* eslint-disable max-lines -- Large patient detail view; splitting into sub-components tracked as follow-up. */
import React, { useState } from 'react';
import { usePatientDetailsController } from '@/features/patients/hooks/usePatientDetailsController';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';
import { api } from '@/api/axios';
import { useMessage } from '@/context/MessageContext';

// Local Feature & Molecule Components
import { PatientInfoBlock } from '@/features/patients/components/views/PatientInfoBlock';
import { PatientHistoryTable } from '@/features/patients/components/views/PatientHistoryTable';
import { PatientFinancialSidebar } from '@/features/patients/components/views/PatientFinancialSidebar';
import { PatientPrintableView } from '@/features/patients/components/views/PatientPrintableView';
import { WhatsappChatHistory } from '@/features/patients/components/views/WhatsappChatHistory';
import { Modal } from '@/components/molecules/Modal';
import { DocumentViewerModal } from '@/components/molecules/DocumentViewerModal';
import { PatientMedicationFormModal } from '@/features/patients/components/modals/PatientMedicationFormModal';

import styles from './PatientDetailsView.module.css';

/**
 * PatientDetailsView (Executor/Sub-Orchestrator).
 * Renders the full patient profile including history, financial status, medications, and document history.
 */
export const PatientDetailsView = ({
    details,
    t,
    user,
    onBack,
    onEdit,
    onDelete,
    onGenerateQR,
    onGeneratePrescriptionLink,
    onToggleNew,
    onPayDebt,
    children
}) => {
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'history' | 'finances' | 'medications' | 'documents' | 'chat'
    const [isCleanView, setIsCleanView] = useState(false);
    const { chronicMeds, recentRequests, officialPrescriptions = [], patientFiles = [], loadingFiles, refetchMedications, refetchFiles } = usePatientDetailsController(details.id);
    const { showMessage } = useMessage();
    const allPrescriptions = [...officialPrescriptions, ...recentRequests];

    // File Viewer, Prescription Detail, Medication Form & Upload Local State
    const [selectedViewerFile, setSelectedViewerFile] = useState(null);
    const [selectedRxDetail, setSelectedRxDetail] = useState(null);
    const [isMedModalOpen, setIsMedModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [newFile, setNewFile] = useState(null);
    const [newFileDesc, setNewFileDesc] = useState('');
    const [uploadMsg, setUploadMsg] = useState(null);

    const getOrGenerateRxLink = async (r) => {
        if (r.token && typeof r.token === 'string' && r.token.length > 20) {
            return `${window.location.origin}/#/p/request-recipe/${r.token}`;
        }
        try {
            const res = await api.post('/medical/prescription-request/generate', { patientId: details.id });
            return `${window.location.origin}${res.data.url}`;
        } catch (err) {
            console.error('Error generating rx link:', err);
            return `${window.location.origin}/#/p/request-recipe/${details.id}`;
        }
    };

    const handleCopyRxLink = async (r) => {
        const link = await getOrGenerateRxLink(r);
        try {
            await navigator.clipboard.writeText(link);
            showMessage(t('link_copied'), 'success');
        } catch (err) {
            console.error('Clipboard copy failed:', err);
        }
    };

    const handleSendRxWhatsapp = async (r) => {
        if (!details.phone) return;
        const link = await getOrGenerateRxLink(r);
        const text = encodeURIComponent(t('rx_link_whatsapp_message', { name: details.full_name, link }));
        window.open(`https://wa.me/${details.phone.replace(/\D/g, '')}?text=${text}`, '_blank');
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!newFile) return;
        setUploadingFile(true);
        setUploadMsg(null);
        try {
            const formData = new FormData();
            formData.append('file', newFile);
            formData.append('patientId', details.id);
            formData.append('description', newFileDesc);

            await api.post('/medical/files', formData);
            setUploadMsg({ type: 'success', text: t('file_uploaded') });
            setNewFile(null);
            setNewFileDesc('');
            refetchFiles();
        } catch (err) {
            console.error('[PatientDetailsView] Upload error:', err);
            setUploadMsg({ type: 'error', text: t('upload_failed') });
        } finally {
            setUploadingFile(false);
        }
    };

    return (
        <>
            {isCleanView ? (
                <PatientPrintableView 
                    details={details} 
                    chronicMeds={chronicMeds} 
                    recentRequests={recentRequests} 
                    onClose={() => setIsCleanView(false)} 
                    t={t}
                />
            ) : (
                <section className={`${styles.PatientDetailsView__root} no-print-section`}>
                <header className={`${styles.PatientDetailsView__header}`}>
                    <Button variant="secondary" onClick={onBack}>
                        &larr; {t('back_to_list')}
                    </Button>
                    <div className="config-flex config-flex--gap-2">
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setIsCleanView(true)} 
                            icon={<Icon name="print" size="1rem" />}
                            className={`${styles.PatientDetailsView__noPrint}`}
                        >
                            {t('print')}
                        </Button>
                        {user?.role === 'secretary' && (
                            <Button
                                size="sm"
                                variant={details.is_new_patient ? 'primary' : 'secondary'}
                                onClick={() => onToggleNew(details.id)}
                                icon={details.is_new_patient ? <Icon name="NEW" size="1rem" /> : <Icon name="PROFILE" size="1rem" />}
                            >
                                {details.is_new_patient ? t('new_patient') : t('existing_patient')}
                            </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={onEdit} icon={<Icon name="EDIT" size="1rem" />}>
                            {t('edit_info')}
                        </Button>
                        {(user?.role === 'admin' || user?.role === 'secretary') && (
                            <Button size="sm" variant="ghost" className="patient-details__delete-header-btn" onClick={() => onDelete(details)} icon={<Icon name="delete" size="1rem" />}>
                                {t('delete')}
                            </Button>
                        )}
                    </div>

                </header>

                <h1 className={`${styles.PatientDetailsView__title}`}>{details.full_name}</h1>

                <div className={`${styles.PatientDetailsView__tabsNav}`}>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'general' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Icon name="person" size="1.1rem" />
                        {t('general_info')}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'history' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <Icon name="calendar_month" size="1.1rem" />
                        {t('medical_history')}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'finances' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('finances')}
                    >
                        <Icon name="payments" size="1.1rem" />
                        {t('finances')}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'medications' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('medications')}
                    >
                        <Icon name="description" size="1.1rem" />
                        {t('prescriptions')}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'documents' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('documents')}
                    >
                        <Icon name="folder_open" size="1.1rem" />
                        {t('documents')}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'chat' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        <Icon name="chat" size="1.1rem" />
                        {t('whatsapp_history')}
                    </button>
                </div>

                <div className={`${styles.PatientDetailsView__grid}`}>
                    {/* Main Content Area */}
                    <main className={`${styles.PatientDetailsView__main}`}>
                        {activeTab === 'general' && (
                            <>
                                <PatientInfoBlock
                                    details={details}
                                    t={t}
                                    onGeneratePrescriptionLink={onGeneratePrescriptionLink}
                                />
                                {children}
                            </>
                        )}

                        {activeTab === 'history' && (
                            <PatientHistoryTable
                                details={details}
                                t={t}
                                onPayDebt={onPayDebt}
                            />
                        )}

                        {activeTab === 'finances' && (
                            <PatientFinancialSidebar
                                details={details}
                                allPrescriptions={allPrescriptions}
                                t={t}
                                user={user}
                                onPayDebt={onPayDebt}
                                onGenerateQR={onGenerateQR}
                                onGeneratePrescriptionLink={onGeneratePrescriptionLink}
                                onDelete={onDelete}
                                isFullWidth
                            />
                        )}

                        {activeTab === 'medications' && (
                            <div className="patient-details__meds-tab">
                                {/* Current Medication Section */}
                                <section className={`${styles.PatientDetailsView__block} ${styles.PatientDetailsView__blockMedications} ${styles.PatientDetailsView__blockWithMargin}`}>
                                    <header className={`${styles.PatientDetailsView__blockHeader}`}>
                                        <h3 className={`${styles.PatientDetailsView__blockTitle}`}>
                                            <Icon name="medication" size="1.2rem" />
                                            {t('current_medication')}
                                        </h3>
                                        <Button 
                                            size="sm" 
                                            variant="primary" 
                                            icon={<Icon name="add" size="1rem" />} 
                                            onClick={() => {
                                                setEditingMedication(null);
                                                setIsMedModalOpen(true);
                                            }}
                                        >
                                            {t('add_medication')}
                                        </Button>
                                    </header>
                                    <div className={`${styles.PatientDetailsView__blockContent} ${styles.PatientDetailsView__blockContentPadded}`}>
                                        {chronicMeds.length > 0 ? (
                                            <div className={styles.PatientDetailsView__medsGrid}>
                                                {chronicMeds.map((m, i) => (
                                                    <div 
                                                        key={m.id || `med-${m.name}-${m.dose || ''}`} 
                                                        className={styles.PatientDetailsView__medCard}
                                                    >
                                                        <div className={styles.PatientDetailsView__medCardTop}>
                                                            <div className={styles.PatientDetailsView__medCardHeader}>
                                                                <span className={styles.PatientDetailsView__iconPrimary}><Icon name="medication" size="1.4rem" /></span>
                                                                <div>
                                                                    <div className={styles.PatientDetailsView__medName}>
                                                                        {m.medication_name || m.name || '—'}
                                                                    </div>
                                                                    {m.monodroga && (
                                                                        <small className={styles.PatientDetailsView__medMono}>
                                                                            {m.monodroga} {m.presentation ? `(${m.presentation})` : ''}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={styles.PatientDetailsView__medCardActions}>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm-compact" 
                                                                    title={t('edit')}
                                                                    icon={<Icon name="edit" size="0.9rem" />} 
                                                                    onClick={() => {
                                                                        setEditingMedication(m);
                                                                        setIsMedModalOpen(true);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={styles.PatientDetailsView__medTags}>
                                                            {m.dose && (
                                                                <span className={styles.PatientDetailsView__tagDose}>
                                                                    💊 {m.dose}
                                                                </span>
                                                            )}
                                                            {m.frequency && (
                                                                <span className={styles.PatientDetailsView__tagFreq}>
                                                                    ⏱️ {m.frequency}
                                                                </span>
                                                            )}
                                                            {m.boxes_count > 0 && (
                                                                <span className={styles.PatientDetailsView__tagBoxes}>
                                                                    📦 {m.boxes_count} {m.boxes_count === 1 ? t('box') : t('boxes_plural')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {m.notes && (
                                                            <div className={styles.PatientDetailsView__medNotes}>
                                                                📝 {m.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={styles.PatientDetailsView__emptyState}>
                                                <p className={styles.PatientDetailsView__emptyText}>{t('no_current_medications')}</p>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    icon={<Icon name="add" size="1rem" />} 
                                                    onClick={() => {
                                                        setEditingMedication(null);
                                                        setIsMedModalOpen(true);
                                                    }}
                                                >
                                                    {t('add_first_medication')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Prescriptions Repository Table */}
                                <section className={`${styles.PatientDetailsView__block} ${styles.PatientDetailsView__blockMedications}`}>
                                    <header className={`${styles.PatientDetailsView__blockHeader}`}>
                                        <h3 className={`${styles.PatientDetailsView__blockTitle}`}>
                                            <Icon name="folder_open" size="1.2rem" />
                                            {t('recent_prescriptions')}
                                        </h3>
                                        <Button size="sm" variant="primary" icon={<Icon name="add" size="1rem" />} onClick={() => onGeneratePrescriptionLink(details.id)}>
                                            {t('new_prescription')}
                                        </Button>
                                    </header>
                                    <div className={`${styles.PatientDetailsView__blockContent} ${styles.PatientDetailsView__blockContentPadded}`}>
                                        {allPrescriptions.length > 0 ? (
                                            <table className={`${styles.PatientDetailsView__infoTable}`}>
                                                <thead>
                                                    <tr className={styles.PatientDetailsView__rxTheadRow}>
                                                        <th className={styles.PatientDetailsView__rxTh}>{t('appointment_date')}</th>
                                                        <th className={styles.PatientDetailsView__rxTh}>{t('appointment_doctor')}</th>
                                                        <th className={styles.PatientDetailsView__rxTh}>{t('medications')}</th>
                                                        <th className={styles.PatientDetailsView__rxTh}>{t('status')}</th>
                                                        <th className={styles.PatientDetailsView__rxThRight}>{t('actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allPrescriptions.map((r, i) => {
                                                        const isOfficial = !!r.token || r.type === 'official';
                                                        const actualFileUrl = r.file_url || r.pdf_url;
                                                        const medText = r.request_note || r.medications || r.doctor_note || '—';
                                                        return (
                                                            <tr key={r.id || `req-${r.doctor_name || r.created_at || ''}`} className={styles.PatientDetailsView__rxRow}>
                                                                <td className={styles.PatientDetailsView__rxTdStrong}>
                                                                    {formatDate(r.created_at || r.appointment_date)}
                                                                </td>
                                                                <td className={styles.PatientDetailsView__rxTdNowrap}>{r.doctor_name || '—'}</td>
                                                                <td className={styles.PatientDetailsView__rxTd}>
                                                                    <div className={styles.PatientDetailsView__rxMedText}>{medText}</div>
                                                                    {r.diagnosis && <small className={styles.PatientDetailsView__rxDx}>{t('diagnosis')}: {r.diagnosis}</small>}
                                                                </td>
                                                                <td className={styles.PatientDetailsView__rxTdPlain}>
                                                                    <span className={`${styles.PatientDetailsView__rxStatus} ${isOfficial ? styles.PatientDetailsView__rxStatusOfficial : styles.PatientDetailsView__rxStatusRequest}`}>
                                                                        {isOfficial ? (t('official')) : (t('request'))}
                                                                    </span>
                                                                </td>
                                                                <td className={styles.PatientDetailsView__rxTdRight}>
                                                                    <div className={styles.PatientDetailsView__rxActions}>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            title={t('copy_link')}
                                                                            icon={<Icon name="content_copy" size="1rem" />}
                                                                            onClick={() => handleCopyRxLink(r)}
                                                                        />
                                                                        {details.phone && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                title={t('send_whatsapp')}
                                                                                icon={<Icon name="chat" size="1rem" />}
                                                                                onClick={() => handleSendRxWhatsapp(r)}
                                                                            />
                                                                        )}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            icon={<Icon name="visibility" size="1rem" />}
                                                                            onClick={() => {
                                                                                if (actualFileUrl) {
                                                                                    setSelectedViewerFile({
                                                                                        file_name: `Receta_${formatDate(r.created_at || r.appointment_date)}.pdf`,
                                                                                        description: `Receta médica de ${r.medications}`,
                                                                                        file_url: actualFileUrl,
                                                                                        file_type: 'pdf'
                                                                                    });
                                                                                } else {
                                                                                    setSelectedRxDetail(r);
                                                                                }
                                                                            }}
                                                                        >
                                                                            {t('view')}
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : <p className="patient-details__text-empty">{t('no_history')}</p>}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="patient-details__docs-tab">
                                {/* Upload Box */}
                                <section className={`${styles.PatientDetailsView__block} ${styles.PatientDetailsView__blockWithMargin}`}>
                                    <header className={`${styles.PatientDetailsView__blockHeader}`}>
                                        <h3 className={`${styles.PatientDetailsView__blockTitle}`}>
                                            <Icon name="cloud_upload" size="1.2rem" />
                                            {t('upload_file_for_patient')}
                                        </h3>
                                    </header>
                                    <div className={`${styles.PatientDetailsView__blockContent} ${styles.PatientDetailsView__blockContentPadded}`}>
                                        {uploadMsg && (
                                            <div className={`message-banner message-banner--${uploadMsg.type} ${styles.PatientDetailsView__uploadMsg} ${uploadMsg.type === 'success' ? styles.PatientDetailsView__uploadMsgSuccess : styles.PatientDetailsView__uploadMsgError}`}>
                                                {uploadMsg.text}
                                            </div>
                                        )}
                                        <form onSubmit={handleUploadSubmit} className="config-flex config-flex--column config-flex--gap-3">
                                            <div className="config-flex config-flex--gap-3 config-flex--align-center">
                                                <input 
                                                    type="file" 
                                                    onChange={e => setNewFile(e.target.files[0])}
                                                    required 
                                                    className={styles.PatientDetailsView__fileInput}
                                                    aria-label={t('upload_file_for_patient')}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder={t('description')} 
                                                    value={newFileDesc}
                                                    onChange={e => setNewFileDesc(e.target.value)}
                                                    className={styles.PatientDetailsView__textInput}
                                                />
                                                <Button type="submit" size="sm" variant="primary" disabled={uploadingFile || !newFile} icon={<Icon name="upload" size="1rem" />}>
                                                    {uploadingFile ? t('loading') : (t('upload'))}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </section>

                                {/* Files Repository List */}
                                <section className={`${styles.PatientDetailsView__block}`}>
                                    <header className={`${styles.PatientDetailsView__blockHeader}`}>
                                        <h3 className={`${styles.PatientDetailsView__blockTitle}`}>
                                            <Icon name="folder" size="1.2rem" />
                                            {t('patient_files')}
                                        </h3>
                                    </header>
                                    <div className={`${styles.PatientDetailsView__blockContent} ${styles.PatientDetailsView__blockContentPadded}`}>
                                        {loadingFiles ? (
                                            <p className="patient-details__text-empty">{t('loading')}</p>
                                        ) : patientFiles.length > 0 ? (
                                            <table className={`${styles.PatientDetailsView__infoTable}`}>
                                                <thead>
                                                    <tr className={styles.PatientDetailsView__rxTheadRow}>
                                                        <th className={styles.PatientDetailsView__rxTh}>{t('file_name')}</th>
                                                        <th className={styles.PatientDetailsView__rxTh}>{t('description')}</th>
                                                        <th className={styles.PatientDetailsView__rxTh}>{t('upload_date')}</th>
                                                        <th className={styles.PatientDetailsView__rxTh}>{t('uploaded_by')}</th>
                                                        <th className={styles.PatientDetailsView__rxThRight}>{t('actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {patientFiles.map(f => (
                                                        <tr key={f.id} className={styles.PatientDetailsView__rxRow}>
                                                            <td className={styles.PatientDetailsView__fileTdStrong}>
                                                                <span className={styles.PatientDetailsView__fileCell}>
                                                                    <Icon name={f.file_type?.includes('pdf') ? 'picture_as_pdf' : 'description'} size="1.1rem" />
                                                                    {f.file_name}
                                                                </span>
                                                            </td>
                                                            <td className={styles.PatientDetailsView__fileTdMuted}>{f.description || '—'}</td>
                                                            <td className={styles.PatientDetailsView__rxTdPlain}>{formatDate(f.created_at)}</td>
                                                            <td className={styles.PatientDetailsView__rxTdPlain}>{f.uploader_name || '—'}</td>
                                                            <td className={styles.PatientDetailsView__rxTdRight}>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    onClick={() => setSelectedViewerFile(f)}
                                                                    icon={<Icon name="visibility" size="1rem" />}
                                                                >
                                                                    {t('view')}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="patient-details__text-empty">{t('no_documents_uploaded')}</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <WhatsappChatHistory 
                                patientId={details.id} 
                                t={t} 
                            />
                        )}
                    </main>
                </div>

                <DocumentViewerModal
                    isOpen={!!selectedViewerFile}
                    onClose={() => setSelectedViewerFile(null)}
                    file={selectedViewerFile}
                    filesList={patientFiles}
                    onSelectFile={(f) => setSelectedViewerFile(f)}
                />

                {selectedRxDetail && (
                    <Modal
                        isOpen={!!selectedRxDetail}
                        onClose={() => setSelectedRxDetail(null)}
                        title={`${t('prescription_details')}`}
                        size="lg"
                    >
                        <div className={styles.PatientDetailsView__rxDetailBody}>
                            <div className={styles.PatientDetailsView__rxDetailHeader}>
                                <h3 className={styles.PatientDetailsView__rxDetailName}>👤 {details.full_name} <span className={styles.PatientDetailsView__rxDetailDni}>({t('dni')}: {details.dni || '—'})</span></h3>
                                <div className={styles.PatientDetailsView__rxDetailMeta}>
                                    <div>📅 <strong>{t('appointment_date')}:</strong> {formatDate(selectedRxDetail.created_at || selectedRxDetail.appointment_date)}</div>
                                    <div>🩺 <strong>{t('appointment_doctor')}:</strong> {selectedRxDetail.doctor_name || '—'}</div>
                                    <div>🏷️ <strong>{t('status')}:</strong> {selectedRxDetail.status || 'Completada'}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className={styles.PatientDetailsView__rxDetailSubtitle}>
                                    💊 {t('medications')}:
                                </h4>
                                <div className={styles.PatientDetailsView__rxDetailMeds}>
                                    {(selectedRxDetail.request_note || selectedRxDetail.medications || selectedRxDetail.doctor_note || '—')
                                        .split('\n')
                                        .filter(line => line.trim())
                                        .map((line, idx) => (
                                            <div key={line.trim()} className={`${styles.PatientDetailsView__rxDetailMedLine} ${idx < (selectedRxDetail.request_note || selectedRxDetail.medications || '').split('\n').length - 1 ? styles.PatientDetailsView__rxLineDashed : styles.PatientDetailsView__rxLineNone}`}>
                                                • {line.trim()}
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {selectedRxDetail.diagnosis && (
                                <div>
                                    <h4 className={styles.PatientDetailsView__rxDetailDiagTitle}>📝 {t('diagnosis')}:</h4>
                                    <div className={styles.PatientDetailsView__rxDetailDiag}>
                                        {selectedRxDetail.diagnosis}
                                    </div>
                                </div>
                            )}

                            <div className={styles.PatientDetailsView__rxDetailFooter}>
                                <Button variant="secondary" onClick={() => handleCopyRxLink(selectedRxDetail)} icon={<Icon name="content_copy" size="1rem" />}>
                                    {t('copy_link')}
                                </Button>
                                {details.phone && (
                                    <Button variant="primary" onClick={() => handleSendRxWhatsapp(selectedRxDetail)} icon={<Icon name="chat" size="1rem" />}>
                                        {t('send_whatsapp')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}

                <PatientMedicationFormModal
                    isOpen={isMedModalOpen}
                    onClose={() => {
                        setIsMedModalOpen(false);
                        setEditingMedication(null);
                    }}
                    patientId={details.id}
                    initialData={editingMedication}
                    onSuccess={refetchMedications}
                />
            </section>
            )}
        </>
    );
};

