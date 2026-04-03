import React from 'react';
import Icon from '../../../components/atoms/Icon';
import Button from '../../../components/atoms/Button';
import Loading from '../../../components/atoms/Loading';
import AppointmentCard from './AppointmentCard';
import './PatientHistoryView.css';

/**
 * PatientHistoryView (Executor Component).
 * Renders the appointment history for a specific patient.
 */
const PatientHistoryView = ({ patientAppointments, loading, onClose, t, searchPatientId, handlers }) => {
    if (loading) return <Loading />;
    if (!patientAppointments || patientAppointments.length === 0) {
        return (
            <div className="patient-history-view__empty">
                <Icon name="history_off" size="3rem" className="patient-history-view__empty-icon" />
                <h3 className="patient-history-view__empty-title">{t('no_history_found')}</h3>
                <Button onClick={onClose} variant="ghost" style={{ marginTop: '1rem' }}>{t('back')}</Button>
            </div>
        );
    }

    const patientName = patientAppointments[0]?.patient_name || 'Paciente';

    return (
        <div className="patient-history-view animate-fadeIn">
            <header className="patient-history-view__header">
                <div>
                    <h2 className="patient-history-view__title">{t('history_of')}: {patientName}</h2>
                    <p className="patient-history-view__subtitle">{t('total_appointments')}: {patientAppointments.length}</p>
                </div>
                <Button onClick={onClose} variant="secondary" outline icon={<Icon name="arrow_back" size="1.1rem" />}>
                    {t('back')}
                </Button>
            </header>

            <div className="patient-history-view__grid">
                {patientAppointments.map(appt => (
                    <AppointmentCard
                        key={appt.id} appt={appt}
                        onClick={() => handlers.handleOpenAction(appt)}
                    />
                ))}
            </div>
        </div>
    );
};

export default PatientHistoryView;
