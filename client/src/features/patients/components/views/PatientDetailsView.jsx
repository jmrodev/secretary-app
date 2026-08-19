/* eslint-disable max-lines -- Large patient detail view; splitting into sub-components tracked as follow-up. */
import React, { useState } from 'react';
import { usePatientDetailsController } from '@/features/patients/hooks/usePatientDetailsController';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';
import { api } from '@/api/axios';

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
        navigator.clipboard.writeText(link);
        alert(t('link_copied') || '¡Enlace de receta copiado al portapapeles!');
    };

    const handleSendRxWhatsapp = async (r) => {
        if (!details.phone) return;
        const link = await getOrGenerateRxLink(r);
        const text = encodeURIComponent(`Hola ${details.full_name}, te adjuntamos el enlace a tu receta médica: ${link}`);
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
            setUploadMsg({ type: 'success', text: t('file_uploaded') || 'Archivo subido correctamente' });
            setNewFile(null);
            setNewFileDesc('');
            refetchFiles();
        } catch (err) {
            console.error('[PatientDetailsView] Upload error:', err);
            setUploadMsg({ type: 'error', text: t('upload_failed') || 'Error al subir el archivo' });
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
                <section className={`${styles.PatientDetailsView__root} animate-fade-in no-print-section`}>
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
                            {t('print') || 'Imprimir'}
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
                        {t('general_info') || 'General'}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'history' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <Icon name="calendar_month" size="1.1rem" />
                        {t('medical_history') || 'Historia'}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'finances' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('finances')}
                    >
                        <Icon name="payments" size="1.1rem" />
                        {t('finances') || 'Finanzas'}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'medications' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('medications')}
                    >
                        <Icon name="description" size="1.1rem" />
                        {t('prescriptions') || 'Recetas'}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'documents' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('documents')}
                    >
                        <Icon name="folder_open" size="1.1rem" />
                        {t('documents') || 'Documentos'}
                    </button>
                    <button 
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === 'chat' ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        <Icon name="chat" size="1.1rem" />
                        {t('whatsapp_history') || 'Chat'}
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
                                <section className={`${styles.PatientDetailsView__block} ${styles.PatientDetailsView__blockMedications}`} style={{ marginBottom: '1.5rem' }}>
                                    <header className={`${styles.PatientDetailsView__blockHeader}`}>
                                        <h3 className={`${styles.PatientDetailsView__blockTitle}`}>
                                            <Icon name="medication" size="1.2rem" />
                                            {t('current_medication') || 'Medicación habitual / Crónica'}
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
                                            {t('add_medication') || 'Agregar Medicación'}
                                        </Button>
                                    </header>
                                    <div className={`${styles.PatientDetailsView__blockContent} ${styles.PatientDetailsView__blockContentPadded}`}>
                                        {chronicMeds.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                                {chronicMeds.map((m, i) => (
                                                    <div 
                                                        key={m.id || `med-${m.name}-${m.dose || ''}`} 
                                                        style={{ 
                                                            padding: '1rem', 
                                                            background: 'var(--gray-100, #f8f9fa)', 
                                                            borderRadius: '10px', 
                                                            border: '1px solid var(--gray-200, #e9ecef)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justify: 'space-between',
                                                            gap: '0.75rem',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                                <Icon name="medication" size="1.4rem" style={{ color: 'var(--primary-color, #1a73e8)' }} />
                                                                <div>
                                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>
                                                                        {m.medication_name || m.name || '—'}
                                                                    </div>
                                                                    {m.monodroga && (
                                                                        <small style={{ color: 'var(--gray-600)', display: 'block', fontSize: '0.8rem' }}>
                                                                            {m.monodroga} {m.presentation ? `(${m.presentation})` : ''}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm-compact" 
                                                                    title={t('edit') || 'Editar'}
                                                                    icon={<Icon name="edit" size="0.9rem" />} 
                                                                    onClick={() => {
                                                                        setEditingMedication(m);
                                                                        setIsMedModalOpen(true);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.825rem' }}>
                                                            {m.dose && (
                                                                <span style={{ background: '#e8f0fe', color: '#1a73e8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                                                                    💊 {m.dose}
                                                                </span>
                                                            )}
                                                            {m.frequency && (
                                                                <span style={{ background: '#e6f4ea', color: '#137333', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                                                                    ⏱️ {m.frequency}
                                                                </span>
                                                            )}
                                                            {m.boxes_count > 0 && (
                                                                <span style={{ background: '#fef7e0', color: '#b06000', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                                                                    📦 {m.boxes_count} {m.boxes_count === 1 ? 'caja' : 'cajas'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {m.notes && (
                                                            <div style={{ fontSize: '0.825rem', color: 'var(--gray-600)', fontStyle: 'italic', background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                                                                📝 {m.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--gray-600)' }}>
                                                <p style={{ margin: '0 0 1rem 0' }}>{t('no_current_medications') || 'Sin medicación habitual cargada para este paciente'}</p>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    icon={<Icon name="add" size="1rem" />} 
                                                    onClick={() => {
                                                        setEditingMedication(null);
                                                        setIsMedModalOpen(true);
                                                    }}
                                                >
                                                    {t('add_first_medication') || 'Cargar Primera Medicación'}
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
                                            {t('recent_prescriptions') || 'Historial de Recetas e Indicaciones'}
                                        </h3>
                                        <Button size="sm" variant="primary" icon={<Icon name="add" size="1rem" />} onClick={() => onGeneratePrescriptionLink(details.id)}>
                                            {t('new_prescription') || 'Nueva Receta'}
                                        </Button>
                                    </header>
                                    <div className={`${styles.PatientDetailsView__blockContent} ${styles.PatientDetailsView__blockContentPadded}`}>
                                        {allPrescriptions.length > 0 ? (
                                            <table className={`${styles.PatientDetailsView__infoTable}`} style={{ width: '100%' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                                                        <th style={{ padding: '0.75rem' }}>{t('appointment_date') || 'Fecha'}</th>
                                                        <th style={{ padding: '0.75rem' }}>{t('appointment_doctor') || 'Doctor'}</th>
                                                        <th style={{ padding: '0.75rem' }}>{t('medications') || 'Medicación'}</th>
                                                        <th style={{ padding: '0.75rem' }}>{t('status') || 'Tipo'}</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>{t('actions') || 'Acciones'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allPrescriptions.map((r, i) => {
                                                        const isOfficial = !!r.token || r.type === 'official';
                                                        const actualFileUrl = r.file_url || r.pdf_url;
                                                        const medText = r.request_note || r.medications || r.doctor_note || '—';
                                                        return (
                                                            <tr key={r.id || `req-${r.doctor_name || r.created_at || ''}`} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                                                <td style={{ padding: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                    {formatDate(r.created_at || r.appointment_date)}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{r.doctor_name || '—'}</td>
                                                                <td style={{ padding: '0.75rem', maxWidth: '350px' }}>
                                                                    <div style={{ fontWeight: 600, whiteSpace: 'pre-line', lineHeight: '1.4' }}>{medText}</div>
                                                                    {r.diagnosis && <small style={{ color: 'var(--gray-600)' }}>Dx: {r.diagnosis}</small>}
                                                                </td>
                                                                <td style={{ padding: '0.75rem' }}>
                                                                    <span style={{ 
                                                                        padding: '0.25rem 0.6rem', 
                                                                        borderRadius: '12px', 
                                                                        fontSize: '0.75rem', 
                                                                        fontWeight: 600,
                                                                        background: isOfficial ? '#e6f4ea' : '#e8f0fe',
                                                                        color: isOfficial ? '#137333' : '#1a73e8'
                                                                    }}>
                                                                        {isOfficial ? (t('official') || 'Oficial') : (t('request') || 'Solicitud')}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                                    <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            title={t('copy_link') || 'Copiar Enlace de Receta'}
                                                                            icon={<Icon name="content_copy" size="1rem" />}
                                                                            onClick={() => handleCopyRxLink(r)}
                                                                        />
                                                                        {details.phone && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                title={t('send_whatsapp') || 'Enviar por WhatsApp'}
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
                                                                            {t('view') || 'Ver'}
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : <p className="patient-details__text-empty">{t('no_history') || 'Sin historial de recetas'}</p>}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="patient-details__docs-tab">
                                {/* Upload Box */}
                                <section className={`${styles.PatientDetailsView__block}`} style={{ marginBottom: '1.5rem' }}>
                                    <header className={`${styles.PatientDetailsView__blockHeader}`}>
                                        <h3 className={`${styles.PatientDetailsView__blockTitle}`}>
                                            <Icon name="cloud_upload" size="1.2rem" />
                                            {t('upload_file_for_patient') || 'Adjuntar Documento al Paciente'}
                                        </h3>
                                    </header>
                                    <div className={`${styles.PatientDetailsView__blockContent} ${styles.PatientDetailsView__blockContentPadded}`}>
                                        {uploadMsg && (
                                            <div className={`message-banner message-banner--${uploadMsg.type}`} style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: uploadMsg.type === 'success' ? '#e6f4ea' : '#fce8e6', color: uploadMsg.type === 'success' ? '#137333' : '#c5221f' }}>
                                                {uploadMsg.text}
                                            </div>
                                        )}
                                        <form onSubmit={handleUploadSubmit} className="config-flex config-flex--column config-flex--gap-3">
                                            <div className="config-flex config-flex--gap-3 config-flex--align-center">
                                                <input 
                                                    type="file" 
                                                    onChange={e => setNewFile(e.target.files[0])}
                                                    required 
                                                    style={{ flex: 1 }}
                                                    aria-label={t('upload_file_for_patient') || 'Adjuntar Documento al Paciente'}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder={t('description') || 'Descripción (ej: Estudio de Sangre, Ecografía...)'} 
                                                    value={newFileDesc}
                                                    onChange={e => setNewFileDesc(e.target.value)}
                                                    style={{ flex: 2, padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--gray-300)' }}
                                                />
                                                <Button type="submit" size="sm" variant="primary" disabled={uploadingFile || !newFile} icon={<Icon name="upload" size="1rem" />}>
                                                    {uploadingFile ? t('loading') : (t('upload') || 'Subir')}
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
                                            {t('patient_files') || 'Documentos y Estudios Adjuntos'}
                                        </h3>
                                    </header>
                                    <div className={`${styles.PatientDetailsView__blockContent} ${styles.PatientDetailsView__blockContentPadded}`}>
                                        {loadingFiles ? (
                                            <p className="patient-details__text-empty">{t('loading')}</p>
                                        ) : patientFiles.length > 0 ? (
                                            <table className={`${styles.PatientDetailsView__infoTable}`} style={{ width: '100%' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                                                        <th style={{ padding: '0.75rem' }}>{t('file_name') || 'Archivo'}</th>
                                                        <th style={{ padding: '0.75rem' }}>{t('description') || 'Descripción'}</th>
                                                        <th style={{ padding: '0.75rem' }}>{t('upload_date') || 'Fecha'}</th>
                                                        <th style={{ padding: '0.75rem' }}>{t('uploaded_by') || 'Cargado por'}</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>{t('actions') || 'Acción'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {patientFiles.map(f => (
                                                        <tr key={f.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <Icon name={f.file_type?.includes('pdf') ? 'picture_as_pdf' : 'description'} size="1.1rem" />
                                                                    {f.file_name}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.75rem', color: 'var(--gray-600)' }}>{f.description || '—'}</td>
                                                            <td style={{ padding: '0.75rem' }}>{formatDate(f.created_at)}</td>
                                                            <td style={{ padding: '0.75rem' }}>{f.uploader_name || '—'}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    onClick={() => setSelectedViewerFile(f)}
                                                                    icon={<Icon name="visibility" size="1rem" />}
                                                                >
                                                                    {t('view') || 'Ver'}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="patient-details__text-empty">{t('no_documents_uploaded') || 'No hay documentos adjuntos para este paciente'}</p>
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
                        title={`${t('prescription_details') || 'Detalle de la Receta Médica'}`}
                        size="lg"
                    >
                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ padding: '1rem 1.25rem', background: 'var(--gray-100)', borderRadius: '10px', borderLeft: '5px solid var(--primary-color, #1a73e8)' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-900)' }}>👤 {details.full_name} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--gray-600)' }}>(DNI: {details.dni || '—'})</span></h3>
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.95rem', color: 'var(--gray-700)', marginTop: '0.5rem' }}>
                                    <div>📅 <strong>{t('appointment_date') || 'Fecha'}:</strong> {formatDate(selectedRxDetail.created_at || selectedRxDetail.appointment_date)}</div>
                                    <div>🩺 <strong>{t('appointment_doctor') || 'Doctor'}:</strong> {selectedRxDetail.doctor_name || '—'}</div>
                                    <div>🏷️ <strong>{t('status') || 'Estado'}:</strong> {selectedRxDetail.status || 'Completada'}</div>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    💊 {t('medications') || 'Medicamentos Prescritos'}:
                                </h4>
                                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                                    {(selectedRxDetail.request_note || selectedRxDetail.medications || selectedRxDetail.doctor_note || '—')
                                        .split('\n')
                                        .filter(line => line.trim())
                                        .map((line, idx) => (
                                            <div key={line.trim()} style={{ padding: '0.4rem 0', borderBottom: idx < (selectedRxDetail.request_note || selectedRxDetail.medications || '').split('\n').length - 1 ? '1px dashed var(--gray-300)' : 'none', fontWeight: 600, color: 'var(--gray-800)' }}>
                                                • {line.trim()}
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {selectedRxDetail.diagnosis && (
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-800)' }}>📝 {t('diagnosis') || 'Diagnóstico / Indicaciones'}:</h4>
                                    <div style={{ padding: '0.85rem 1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--gray-200)', color: 'var(--gray-700)' }}>
                                        {selectedRxDetail.diagnosis}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1rem' }}>
                                <Button variant="secondary" onClick={() => handleCopyRxLink(selectedRxDetail)} icon={<Icon name="content_copy" size="1rem" />}>
                                    {t('copy_link') || 'Copiar Enlace'}
                                </Button>
                                {details.phone && (
                                    <Button variant="primary" onClick={() => handleSendRxWhatsapp(selectedRxDetail)} icon={<Icon name="chat" size="1rem" />}>
                                        {t('send_whatsapp') || 'Enviar por WhatsApp'}
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

