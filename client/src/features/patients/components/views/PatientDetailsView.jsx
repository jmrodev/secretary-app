import React, { useState } from 'react';
import { usePatientDetailsController } from '@/features/patients/hooks/usePatientDetailsController';
import { Icon } from '@/components/atoms/Icon';
import { api } from '@/api/axios';
import { useMessage } from '@/context/MessageContext';

// Feature Components & Organisms
import { PatientDetailsHeader } from './PatientDetailsHeader';
import { PatientInfoBlock } from './PatientInfoBlock';
import { PatientHistoryTable } from './PatientHistoryTable';
import { PatientFinancialSidebar } from './PatientFinancialSidebar';
import { PatientPrintableView } from './PatientPrintableView';
import { WhatsappChatHistory } from './WhatsappChatHistory';
import { PatientMedicationsTab } from './tabs/PatientMedicationsTab';
import { PatientDocumentsTab } from './tabs/PatientDocumentsTab';

// Modals
import { DocumentViewerModal } from '@/components/molecules/DocumentViewerModal';
import { PrescriptionDetailModal } from '@/features/patients/components/modals/PrescriptionDetailModal';
import { PatientMedicationFormModal } from '@/features/patients/components/modals/PatientMedicationFormModal';

import styles from './PatientDetailsView.module.css';

/**
 * PatientDetailsView Coordinator.
 * Coordinates patient profile header, tab navigation, and active tab organisms.
 */
export const PatientDetailsView = ({
    details,
    t,
    user,
    canEditRating = false,
    onBack,
    onEdit,
    onDelete,
    onGenerateQR,
    onGeneratePrescriptionLink,
    onToggleNew,
    onPayDebt,
    onEditRating,
    children
}) => {
    const [activeTab, setActiveTab] = useState('general');
    const [isCleanView, setIsCleanView] = useState(false);
    const { chronicMeds, recentRequests, officialPrescriptions = [], patientFiles = [], loadingFiles, refetchMedications, refetchFiles } = usePatientDetailsController(details.id);
    const { showMessage } = useMessage();
    const allPrescriptions = [...officialPrescriptions, ...recentRequests];

    const [selectedViewerFile, setSelectedViewerFile] = useState(null);
    const [selectedRxDetail, setSelectedRxDetail] = useState(null);
    const [isMedModalOpen, setIsMedModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);

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

    const handleViewPrescription = (r) => {
        const actualFileUrl = r.file_url || r.pdf_url;
        if (actualFileUrl) {
            setSelectedViewerFile({
                file_name: `Receta_${r.created_at || r.appointment_date || ''}.pdf`,
                description: `Receta médica de ${r.medications || ''}`,
                file_url: actualFileUrl,
                file_type: 'pdf'
            });
        } else {
            setSelectedRxDetail(r);
        }
    };

    if (isCleanView) {
        return (
            <PatientPrintableView
                details={details}
                chronicMeds={chronicMeds}
                recentRequests={recentRequests}
                onClose={() => setIsCleanView(false)}
                t={t}
            />
        );
    }

    return (
        <section className={`${styles.PatientDetailsView__root} no-print-section`}>
            <PatientDetailsHeader
                details={details}
                t={t}
                user={user}
                canEditRating={canEditRating}
                onBack={onBack}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleNew={onToggleNew}
                onPrint={() => setIsCleanView(true)}
                onPayDebt={onPayDebt}
                onEditRating={onEditRating}
            />

            {/* Navigation Tabs */}
            <nav className={styles.PatientDetailsView__tabsNav} aria-label={t('patient_navigation')}>
                {[
                    { id: 'general', icon: 'person', label: t('general_info') },
                    { id: 'history', icon: 'calendar_month', label: t('medical_history') },
                    { id: 'finances', icon: 'payments', label: t('finances') },
                    { id: 'medications', icon: 'description', label: t('prescriptions') },
                    { id: 'documents', icon: 'folder_open', label: t('documents') },
                    { id: 'chat', icon: 'chat', label: t('whatsapp_history') }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`${styles.PatientDetailsView__tabLink} ${activeTab === tab.id ? styles.PatientDetailsView__tabLinkActive : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <Icon name={tab.icon} size="1.1rem" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>

            {/* Tab Body */}
            <main className={styles.PatientDetailsView__main}>
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
                    <PatientMedicationsTab
                        details={details}
                        chronicMeds={chronicMeds}
                        allPrescriptions={allPrescriptions}
                        t={t}
                        onAddMedication={() => {
                            setEditingMedication(null);
                            setIsMedModalOpen(true);
                        }}
                        onEditMedication={(m) => {
                            setEditingMedication(m);
                            setIsMedModalOpen(true);
                        }}
                        onNewPrescription={() => onGeneratePrescriptionLink(details.id)}
                        onCopyRxLink={handleCopyRxLink}
                        onSendRxWhatsapp={handleSendRxWhatsapp}
                        onViewPrescription={handleViewPrescription}
                    />
                )}

                {activeTab === 'documents' && (
                    <PatientDocumentsTab
                        patientId={details.id}
                        patientFiles={patientFiles}
                        loadingFiles={loadingFiles}
                        refetchFiles={refetchFiles}
                        onViewFile={(f) => setSelectedViewerFile(f)}
                        t={t}
                    />
                )}

                {activeTab === 'chat' && (
                    <WhatsappChatHistory
                        patientId={details.id}
                        t={t}
                    />
                )}
            </main>

            {/* Modals */}
            <DocumentViewerModal
                isOpen={Boolean(selectedViewerFile)}
                onClose={() => setSelectedViewerFile(null)}
                file={selectedViewerFile}
                filesList={patientFiles}
                onSelectFile={(f) => setSelectedViewerFile(f)}
            />

            <PrescriptionDetailModal
                isOpen={Boolean(selectedRxDetail)}
                onClose={() => setSelectedRxDetail(null)}
                prescription={selectedRxDetail}
                patient={details}
                t={t}
                onCopyLink={handleCopyRxLink}
                onSendWhatsapp={handleSendRxWhatsapp}
            />

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
    );
};
