
import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

// Local Feature Components
import PatientInfoBlock from '@/features/patients/components/PatientInfoBlock';
import PatientHistoryTable from '@/features/patients/components/PatientHistoryTable';
import PatientFinancialSidebar from '@/features/patients/components/PatientFinancialSidebar';
import PatientPrintableView from '@/features/patients/components/PatientPrintableView';
import WhatsappChatHistory from '@/features/patients/components/WhatsappChatHistory';

import './PatientDetailsView.css';

/**
 * PatientDetailsView (Executor/Sub-Orchestrator).
 * Renders the full patient profile including history, financial status, and medications.
 */
const PatientDetailsView = ({
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
    const [isCleanView, setIsCleanView] = useState(false);
    const [chronicMeds, setChronicMeds] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);

    useEffect(() => {
        if (!details.id) return;
        
        api.get(`/medical/patients/${details.id}/medications`)
            .then(res => setChronicMeds(res.data))
            .catch(err => console.error("Error fetching chronic meds:", err));

        api.get(`/medical/requests?patientId=${details.id}`)
            .then(res => {
                const prescriptions = res.data.filter(r => r.type === 'prescription');
                setRecentRequests(prescriptions);
            })
            .catch(err => console.error("Error fetching requests:", err));
    }, [details.id]);

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
        <>
            <section className="patient-details animate-fadeIn no-print-section">
                <header className="patient-details__header">
                    <Button variant="secondary" onClick={onBack}>
                        &larr; {t('back_to_list')}
                    </Button>
                    <div className="config-flex config-flex--gap-2">
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setIsCleanView(true)} 
                            icon={<Icon name="print" size="1rem" />}
                            className="no-print"
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
                    </div>
                </header>

                <h1 className="patient-details__title">{details.full_name}</h1>

                <div className="patient-details__grid">
                    {/* Main Content Area */}
                    <main className="patient-details__main">
                        <PatientInfoBlock
                            details={details}
                            t={t}
                            onGeneratePrescriptionLink={onGeneratePrescriptionLink}
                        />

                        <PatientHistoryTable
                            details={details}
                            t={t}
                            onPayDebt={onPayDebt}
                        />

                        {/* WhatsApp Live Chat History */}
                        <WhatsappChatHistory 
                            patientId={details.id} 
                            t={t} 
                        />

                        {children}
                    </main>

                    {/* Sidebar Info Area */}
                    <aside className="patient-details__sidebar">
                        <PatientFinancialSidebar
                            details={details}
                            t={t}
                            user={user}
                            onPayDebt={onPayDebt}
                            onGenerateQR={onGenerateQR}
                            onGeneratePrescriptionLink={onGeneratePrescriptionLink}
                            onDelete={onDelete}
                        />
                    </aside>
                </div>
            </section>
        </>
    );
};

export default PatientDetailsView;
