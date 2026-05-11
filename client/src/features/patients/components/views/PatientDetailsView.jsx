
import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';


// Local Feature Components
import PatientInfoBlock from '@/features/patients/components/views/PatientInfoBlock';
import PatientHistoryTable from '@/features/patients/components/views/PatientHistoryTable';
import PatientFinancialSidebar from '@/features/patients/components/views/PatientFinancialSidebar';
import PatientPrintableView from '@/features/patients/components/views/PatientPrintableView';
import WhatsappChatHistory from '@/features/patients/components/views/WhatsappChatHistory';

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
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'history' | 'finances' | 'chat'
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
                const prescriptions = res.data.requests.filter(r => r.type === 'prescription');
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
            <section className="patient-details animate-fade-in no-print-section">
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
                        {(user?.role === 'admin' || user?.role === 'secretary') && (
                            <Button size="sm" variant="ghost" className="patient-details__delete-header-btn" onClick={() => onDelete(details)} icon={<Icon name="delete" size="1rem" />}>
                                {t('delete')}
                            </Button>
                        )}
                    </div>

                </header>

                <h1 className="patient-details__title">{details.full_name}</h1>

                <div className="patient-details__tabs-nav">
                    <button 
                        className={`patient-details__tab-link ${activeTab === 'general' ? 'patient-details__tab-link--active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Icon name="person" size="1.1rem" />
                        {t('general_info') || 'General'}
                    </button>
                    <button 
                        className={`patient-details__tab-link ${activeTab === 'history' ? 'patient-details__tab-link--active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <Icon name="history" size="1.1rem" />
                        {t('medical_history') || 'Historia'}
                    </button>
                    <button 
                        className={`patient-details__tab-link ${activeTab === 'finances' ? 'patient-details__tab-link--active' : ''}`}
                        onClick={() => setActiveTab('finances')}
                    >
                        <Icon name="payments" size="1.1rem" />
                        {t('finances') || 'Finanzas'}
                    </button>
                    <button 
                        className={`patient-details__tab-link ${activeTab === 'medications' ? 'patient-details__tab-link--active' : ''}`}
                        onClick={() => setActiveTab('medications')}
                    >
                        <Icon name="description" size="1.1rem" />
                        {t('prescriptions') || 'Recetas'}
                    </button>
                    <button 
                        className={`patient-details__tab-link ${activeTab === 'chat' ? 'patient-details__tab-link--active' : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >

                        <Icon name="chat" size="1.1rem" />
                        {t('whatsapp_history') || 'Chat'}
                    </button>
                </div>

                <div className="patient-details__grid">
                    {/* Main Content Area */}
                    <main className="patient-details__main">
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
                                <section className="patient-details__block patient-details__block--medications">
                                    <header className="patient-details__block-header">
                                        <h3 className="patient-details__block-title">
                                            <Icon name="medication" size="1.2rem" />
                                            {t('current_medication') || 'Medicación actual'}
                                        </h3>
                                        <Button variant="ghost" size="sm" icon={<Icon name="settings" size="1rem" />}>
                                            {t('configure')}
                                        </Button>
                                    </header>
                                    <div className="patient-details__block-content patient-details__block-content--padded">
                                        {chronicMeds.length > 0 ? (
                                            <ul className="patient-details__meds-list">
                                                {chronicMeds.map((m, i) => <li key={i}>{m.name || m}</li>)}
                                            </ul>
                                        ) : <p className="patient-details__text-empty">{t('no_current_medications')}</p>}
                                    </div>
                                </section>

                                <section className="patient-details__block patient-details__block--medications" style={{marginTop: '2rem'}}>
                                    <header className="patient-details__block-header">
                                        <h3 className="patient-details__block-title">
                                            <Icon name="folder_open" size="1.2rem" />
                                            {t('recent_prescriptions')}
                                        </h3>
                                        <Button size="sm" onClick={() => onGeneratePrescriptionLink(details.id)}>
                                            {t('new_prescription')}
                                        </Button>
                                    </header>
                                    <div className="patient-details__block-content patient-details__block-content--padded">
                                        {recentRequests.length > 0 ? (
                                            <ul className="patient-details__requests-list">
                                                {recentRequests.map((r, i) => (
                                                    <li key={i} className="patient-details__request-item">
                                                        <strong>{formatDate(r.created_at)}</strong> - {r.medications}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="patient-details__text-empty">{t('no_history')}</p>}
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

            </section>
        </>
    );
};

export default PatientDetailsView;
