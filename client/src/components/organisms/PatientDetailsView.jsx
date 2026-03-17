import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import PatientInfoBlock from '../molecules/PatientInfoBlock';
import PatientHistoryTable from '../molecules/PatientHistoryTable';
import PatientFinancialSidebar from '../molecules/PatientFinancialSidebar';
import './PatientDetailsView.css';

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

    const formatMedicationData = (dataStr) => {
        if (!dataStr) return '-';
        const cleanStr = dataStr.replace(/<[^>]*>/g, '').trim();
        
        // 1. Si es formato JSON (nuevo)
        if (cleanStr.startsWith('[') || cleanStr.startsWith('{')) {
            try {
                const parsed = JSON.parse(cleanStr);
                if (Array.isArray(parsed)) {
                    return (
                        <ul className="printable-sublist">
                            {parsed.map((m, i) => <li key={i}>{m.name}</li>)}
                        </ul>
                    );
                }
            } catch (e) { /* fallback */ }
        }
        
        // 2. Si es texto plano, separamos por Saltos de Línea (\n)
        const lines = cleanStr.split(/[\r\n]+/).filter(l => l.trim().length > 0);
        if (lines.length > 1) {
            return (
                <ul className="printable-sublist">
                    {lines.map((line, i) => <li key={i}>{line.trim()}</li>)}
                </ul>
            );
        }

        return <p className="printable-text" style={{ whiteSpace: 'pre-line' }}>{cleanStr}</p>;
    };

    if (isCleanView) {
        return (
            <div className="printable-patient-sheet printable-patient-sheet--fullscreen animate-fadeIn">
                <header className="printable-patient-sheet__header no-print">
                    <Button variant="secondary" onClick={() => setIsCleanView(false)}>
                        &larr; Volver
                    </Button>
                    <Button variant="primary" onClick={() => window.print()} icon={<Icon name="print" size="1.2rem" />}>
                        {t('print') || 'Imprimir'}
                    </Button>
                </header>

                <h1 className="printable-title">FICHA DEL PACIENTE: {details.full_name.toUpperCase()}</h1>
                <hr className="printable-divider" />
                
                <h3 className="printable-subtitle">DATOS PERSONALES</h3>
                <ul className="printable-list">
                    <li><strong>DNI:</strong> {details.dni || '-'}</li>
                    <li><strong>Teléfono:</strong> {details.phone || '-'}</li>
                    <li><strong>Email:</strong> {details.email || '-'}</li>
                    <li><strong>Ubicación:</strong> {details.street_name || ''} {details.street_number || ''}, {details.city || ''}</li>
                    <li><strong>OS / Prepaga:</strong> {details.insurance_name || '-'}</li>
                </ul>

                <h3 className="printable-subtitle">ESTADO FINANCIERO</h3>
                <ul className="printable-list">
                    <li><strong>Deuda Actual:</strong> ${details.total_debt || '0'}</li>
                </ul>

                <h3 className="printable-subtitle">HISTORIAL DE TURNOS</h3>
                {details.appointments && details.appointments.length > 0 ? (
                    <ul className="printable-list">
                        {details.appointments.map(app => (
                            <li key={app.id}>
                                <strong>{new Date(app.appointment_date).toLocaleDateString('es-AR')} {new Date(app.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong> 
                                | Dr/a: {app.doctor_name || '-'} 
                                | Estado: {t(app.status) || app.status} 
                                | Motivo: {app.reason || '-'} 
                                {app.cancellation_reason ? ` (Cancelación: ${app.cancellation_reason})` : ''}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="printable-text">No hay turnos registrados.</p>
                )}

                <h3 className="printable-subtitle">MEDICACIÓN CRÓNICA / HABITUAL</h3>
                {chronicMeds && chronicMeds.length > 0 ? (
                    <ul className="printable-list">
                        {chronicMeds.map((m, idx) => (
                            <li key={idx}>
                                <strong>{m.medication_name}</strong> {m.dose ? `- Dosis: ${m.dose}` : ''} {m.frequency ? `(${m.frequency})` : ''} {m.notes ? `| Obs: ${m.notes}` : ''}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="printable-text">No hay registros de medicación crónica.</p>
                )}

                <h3 className="printable-subtitle">HISTORIAL DE RECETAS EMITIDAS</h3>
                {recentRequests && recentRequests.length > 0 ? (
                    <ul className="printable-list">
                        {recentRequests.map((p, idx) => (
                            <li key={idx} className="printable-list-item--grouped">
                                <div className="printable-item-header">
                                    <strong>{new Date(p.created_at || p.action_date).toLocaleDateString('es-AR')}</strong> 
                                    {p.doctor_name ? ` | Dr/a: ${p.doctor_name}` : ''}
                                </div>
                                <div className="printable-item-content">
                                    {formatMedicationData(p.raw_medication_data || p.request_note)}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="printable-text">No hay historial de recetas emitidas.</p>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="patient-details animate-fadeIn no-print-section">
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
                        {user.role === 'secretary' && (
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
                    <div className="patient-details__main">
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

                        {children}
                    </div>

                    {/* Sidebar Info Area */}
                    <PatientFinancialSidebar
                        details={details}
                        t={t}
                        user={user}
                        onPayDebt={onPayDebt}
                        onGenerateQR={onGenerateQR}
                        onGeneratePrescriptionLink={onGeneratePrescriptionLink}
                        onDelete={onDelete}
                    />
                </div>
            </div>

            {/* --- PLANILLA PURE TEXT LISTS EXCLUSIVA PARA IMPRESORA --- */}
            <div className="printable-patient-sheet only-print">
                 <h1 className="printable-title">FICHA DEL PACIENTE: {details.full_name.toUpperCase()}</h1>
                 <hr className="printable-divider" />
                 
                 <h3 className="printable-subtitle">DATOS PERSONALES</h3>
                 <ul className="printable-list">
                     <li><strong>DNI:</strong> {details.dni || '-'}</li>
                     <li><strong>Teléfono:</strong> {details.phone || '-'}</li>
                     <li><strong>Email:</strong> {details.email || '-'}</li>
                     <li><strong>Ubicación:</strong> {details.street_name || ''} {details.street_number || ''}, {details.city || ''}</li>
                     <li><strong>OS / Prepaga:</strong> {details.insurance_name || '-'}</li>
                 </ul>

                 <h3 className="printable-subtitle">ESTADO FINANCIERO</h3>
                 <ul className="printable-list">
                     <li><strong>Deuda Actual:</strong> ${details.total_debt || '0'}</li>
                 </ul>

                 <h3 className="printable-subtitle">HISTORIAL DE TURNOS</h3>
                 {details.appointments && details.appointments.length > 0 ? (
                     <ul className="printable-list">
                         {details.appointments.map(app => (
                             <li key={app.id}>
                                 <strong>{new Date(app.appointment_date).toLocaleDateString('es-AR')} {new Date(app.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong> 
                                 | Dr/a: {app.doctor_name || '-'} 
                                 | Estado: {t(app.status) || app.status} 
                                 | Motivo: {app.reason || '-'} 
                                 {app.cancellation_reason ? ` (Cancelación: ${app.cancellation_reason})` : ''}
                             </li>
                         ))}
                     </ul>
                 ) : (
                     <p className="printable-text">No hay turnos registrados.</p>
                 )}

                 <h3 className="printable-subtitle">MEDICACIÓN / HISTORIAL</h3>
                 {details.prescriptions && details.prescriptions.length > 0 ? (
                     <ul className="printable-list">
                         {details.prescriptions.map((p, idx) => (
                             <li key={idx}>
                                 {p.medications ? p.medications.replace(/<[^>]*>/g, '') : '-'}
                             </li>
                         ))}
                     </ul>
                 ) : (
                     <p className="printable-text">No hay registros de medicación.</p>
                 )}
            </div>
        </>
    );
};

export default PatientDetailsView;

